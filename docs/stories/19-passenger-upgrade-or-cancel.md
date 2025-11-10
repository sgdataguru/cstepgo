# User Story: 19 - Passenger Upgrade to Private or Cancel Before Departure

**As a** passenger who booked a shared trip that hasn't filled up,
**I want** the option to upgrade to a private booking or cancel my reservation,
**so that** I can still travel even if not enough people join, or get a refund if I change my mind.

## Acceptance Criteria

### Pre-Departure Decision Point
* **Trigger**: 24-48 hours before departure time (configurable per trip)
* **Condition**: Shared trip has < 50% seats filled
* System sends notification to all booked passengers:
  ```
  Your trip to Issyk-Kul Lake needs more passengers 🚗
  
  Currently: 3 of 12 seats booked
  Departure: Nov 7, 2025, 10:00 AM (in 36 hours)
  
  Your options:
  1. Wait for more passengers (keep current booking)
  2. Upgrade to private trip (pay difference)
  3. Cancel and get full refund
  
  Please decide by: Nov 6, 2025, 6:00 PM
  [Make Your Choice]
  ```

### Option 1: Wait for More Passengers
* User selects: "Keep my booking and wait"
* System:
  - No changes to booking
  - Price may go up if no one else joins (they pay current per-person rate)
  - If trip reaches minimum threshold by deadline → Trip proceeds
  - If trip doesn't reach minimum → Auto-cancel with full refund (see Option 3)

### Option 2: Upgrade to Private Booking
* User clicks: "Upgrade to Private Trip"
* Pricing calculation shown:
  ```
  Original Booking: 2 seats × $75 = $150 (based on 4 people total)
  
  Private Trip Cost: $300 (entire vehicle)
  You already paid: $150
  Remaining balance: $150
  
  Upgrade Options:
  a) Pay the difference now ($150) → Trip confirmed for your group only
  b) Invite friends to join (share $150 among your group)
  
  [Pay $150 Now] [Invite Friends]
  ```

* **If user pays difference**:
  - Booking type changed: `shared` → `private`
  - All seats locked for this user's group
  - Other passengers' bookings canceled → Full refund issued
  - Trip removed from public listing
  - Driver notified: "Trip upgraded to private by passenger"

* **If user invites friends**:
  - Generate shareable invite link: `https://steppergo.com/join-trip/abc123`
  - Friends can book remaining seats using link
  - Original passenger doesn't pay extra if friends join
  - Deadline extended by 12 hours for invite responses

### Option 3: Cancel and Get Full Refund
* User clicks: "Cancel My Booking"
* Confirmation modal:
  ```
  Cancel your booking?
  
  You will receive a full refund of $150
  Refund will be processed within 3-5 business days
  
  Note: This trip may still proceed if other passengers book
  
  [Confirm Cancellation] [Keep Booking]
  ```

* On confirmation:
  - Booking status: `paid` → `cancelled_by_passenger`
  - Stripe refund initiated automatically
  - Seats released back to pool
  - Trip remains in public listing (other passengers can still book)
  - User receives cancellation confirmation email

* **Refund Policy**:
  - Full refund if canceled >48 hours before departure
  - 50% refund if canceled 24-48 hours before departure
  - No refund if canceled <24 hours before departure
  - Exception: If driver cancels → Always full refund

### Deadline Management
* **If passenger doesn't respond**:
  - Default action: "Wait for more passengers" (Option 1)
  - No penalty, booking remains active
  - If minimum not met by departure time → Auto-cancel with full refund

* **If passenger misses deadline but wants to decide**:
  - Option 2 (Upgrade) remains available until 12 hours before departure
  - Option 3 (Cancel) follows standard refund policy

### Minimum Viable Trip Threshold
* **Platform Rule**: Shared trip needs minimum 25% capacity to proceed
  - Example: 12-seater van needs ≥ 3 passengers
  - 4-seater sedan needs ≥ 2 passengers

* **If threshold not met by deadline**:
  - System auto-cancels trip
  - All passengers refunded 100%
  - Driver compensated for preparation time (admin review)
  - Trip marked as `cancelled_low_participation`

## Technical Notes

### Database Schema Updates
* `bookings` table add columns:
  ```sql
  upgrade_offer_sent_at: TIMESTAMP NULL
  upgrade_offer_response: ENUM('waiting', 'upgraded', 'cancelled', 'no_response') DEFAULT 'no_response'
  upgrade_deadline: TIMESTAMP NULL
  original_booking_type: ENUM('private', 'shared') NULL
  ```

* `trip_cancellation_reasons` table:
  ```sql
  trip_id: UUID FK
  reason: ENUM('low_participation', 'driver_cancelled', 'admin_cancelled', 'force_majeure')
  cancelled_at: TIMESTAMP
  refund_status: ENUM('pending', 'completed')
  ```

### Notification Scheduling
* Cron job runs every hour:
  ```javascript
  async function checkUpcomingTrips() {
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    const lowParticipationTrips = await db.trips.findMany({
      where: {
        departure_at: { gte: new Date(), lte: deadline },
        status: 'live',
        // Calculate participation rate
      }
    });
    
    for (const trip of lowParticipationTrips) {
      const participationRate = trip.bookedSeats / trip.totalSeats;
      
      if (participationRate < 0.5) {
        // Send upgrade/cancel offer to all passengers
        await sendUpgradeOffer(trip);
      }
      
      if (participationRate < 0.25 && trip.departure_at < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        // Less than 25% filled and <24h away → Auto-cancel
        await autoCancelTrip(trip, 'low_participation');
      }
    }
  }
  ```

### Refund Processing
```javascript
async function processUpgradeToPrivate(bookingId, userId) {
  const booking = await db.bookings.findUnique({ where: { id: bookingId }, include: { trip: true } });
  
  // Calculate difference
  const privateCost = booking.trip.total_cost;
  const alreadyPaid = booking.amount_paid;
  const difference = privateCost - alreadyPaid;
  
  // Charge difference
  const paymentIntent = await stripe.paymentIntents.create({
    amount: difference * 100,
    currency: 'usd',
    customer: userId,
    description: `Upgrade to private: ${booking.trip.title}`
  });
  
  // Update booking
  await db.bookings.update({
    where: { id: bookingId },
    data: {
      type: 'private',
      seats: booking.trip.seat_capacity, // Lock all seats
      amount_paid: privateCost,
      upgrade_offer_response: 'upgraded'
    }
  });
  
  // Cancel other passengers' bookings
  const otherBookings = await db.bookings.findMany({
    where: { trip_id: booking.trip_id, id: { not: bookingId } }
  });
  
  for (const otherBooking of otherBookings) {
    await refundBooking(otherBooking.id);
  }
  
  // Update trip status
  await db.trips.update({
    where: { id: booking.trip_id },
    data: { status: 'private_booked' }
  });
}
```

### PostHog Events
* `upgrade_offer_sent` (trip_id, participation_rate, hours_until_departure)
* `passenger_chose_to_wait`
* `passenger_upgraded_to_private` (amount_paid_extra)
* `passenger_invited_friends` (invites_sent)
* `passenger_cancelled_booking` (hours_before_departure, refund_amount)
* `trip_auto_cancelled_low_participation` (participation_rate)

### Email/SMS Templates
* **Upgrade Offer**:
  - Subject: "Your trip needs more passengers - Options inside"
  - Personalized with current participation rate
  - Clear CTA buttons for each option

* **Cancellation Confirmation**:
  - Subject: "Booking cancelled - Refund processing"
  - Refund timeline and amount
  - Alternative trips suggestions

## Edge Cases
* **Multiple passengers upgrade simultaneously** → First to complete payment wins (others get refund)
* **Passenger upgrades, then more join** → No reversal, original passenger keeps private booking
* **Driver cancels after passenger upgraded** → Full refund including upgrade fee
* **Passenger cancels after deadline passed** → Standard refund policy applies (may be partial)

## Success Metrics
* % of low-participation trips salvaged via upgrade: Track revenue recovery
* Passenger upgrade rate: Target 10-15%
* Passenger cancellation rate: Monitor for platform health (<20%)
* Trip cancellation rate due to low participation: <10%

## Gate Assignment
**Gate 3** (Upgrade offers, auto-cancellation logic)
**Gate 4** (Friend invite system, dynamic deadline adjustments)

## Notes from Transcript
* Reese: "Only we are two percent. So there are also the platform offers. Okay. You continue pay the whole car, the more additional money for the two seats and take the tour or cancel your this ride like this."
* Business Requirement: Protect revenue by giving passengers flexibility while incentivizing trip completion
* Customer satisfaction: Avoid "stranded" bookings where trip gets canceled last minute without passenger control
