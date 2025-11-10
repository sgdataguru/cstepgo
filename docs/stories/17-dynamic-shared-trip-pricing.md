# User Story: 17 - Dynamic Shared Trip Pricing Based on Participants

**As a** traveler considering a shared trip,
**I want** to see how the price per person decreases as more people join,
**so that** I can decide whether to wait for others or book the whole vehicle privately.

## Acceptance Criteria

### Trip Card Display (Before Booking)
* On `/trips` listing page, each shared trip card shows:
  ```
  Almaty → Issyk-Kul Lake
  Departure: Nov 7, 2025, 10:00 AM
  
  Vehicle: Van (12 seats)
  Currently: 2 of 12 seats booked
  
  Price per person if you join now: $45
  Price if 6 join: $25/person 💰
  Price if full (12): $15/person 🎉
  
  [View Details] [Book Seats]
  ```

* Price indicator:
  - Current price: Bold, large font
  - Potential savings: Smaller font with emoji
  - Color-coded: Red (expensive, few joined) → Green (cheap, many joined)

### Trip Details Page
* URL: `/trips/[trip-id]`
* **Dynamic Pricing Calculator**:
  - Interactive slider: "How many seats do you want?"
  - Real-time calculations:
    ```
    Total Trip Cost: $300 (fixed)
    
    Currently booked: 2 seats → Each pays $150
    If you book 2 more seats:
      Total: 4 seats → Each pays $75 (You save $75!)
    If trip fills up (12 seats):
      Each pays $25 (Maximum savings!)
    ```

* **Visual Progress Bar**:
  ```
  Seats Filled: ████░░░░░░░░ 2 of 12
  
  Milestones:
  ✓ 2 seats: $150/person
  → 4 seats: $75/person  ← You are here
  → 6 seats: $50/person
  → 12 seats: $25/person (Best price!)
  ```

### Pricing Formula Display
* Transparent calculation shown:
  ```
  Base Trip Price: $300 (driver quote)
  Platform Fee (20%): $60
  Total: $360
  
  Divided by participants:
  - 2 people: $180 each
  - 4 people: $90 each
  - 6 people: $60 each
  - 12 people: $30 each
  ```

* Tooltip: "The more people join, the cheaper it gets for everyone!"

### Booking Confirmation with Price Lock
* When user books seats, show:
  ```
  You're booking 2 seats at $90/person = $180 total
  
  Note: This price is based on current participants (4 total).
  
  Good news! If more people join before departure:
  - Your price will DECREASE automatically
  - You'll be refunded the difference
  - No action needed from you
  
  [Proceed to Payment]
  ```

### Post-Booking Price Updates
* If new passengers join after user has booked:
  - **Scenario**: User paid $90/person (when 4 seats filled), then 4 more join (now 8 seats total)
  - **New price**: $360 ÷ 8 = $45/person
  - **Refund**: ($90 - $45) × 2 seats = $90 refund

* Notification sent:
  ```
  Great news! 4 more travelers joined your trip 🎉
  
  Your new price: $45/person (was $90)
  Refund: $90 will be credited back to your payment method
  
  [View Updated Trip]
  ```

* Refund processing:
  - Automatic Stripe refund
  - Processed within 24 hours
  - Confirmation email with receipt

### Minimum Departure Threshold
* If trip doesn't fill by X hours before departure:
  - **Option 1**: Driver cancels → Full refund to all passengers
  - **Option 2**: Passengers pay current per-person rate (higher price)
  - **Option 3**: One passenger upgrades to "Private" (pays difference)

* Warning shown 48 hours before departure:
  ```
  Only 3 seats booked for this trip
  
  Options:
  1. Wait for more passengers (current price: $120/person)
  2. Upgrade to private trip (pay $300 total for your group)
  3. Cancel your booking (full refund)
  
  Decision needed by: Nov 5, 2025, 10:00 AM
  ```

## Technical Notes

### Database Schema
* `bookings` table add columns:
  ```sql
  original_price_per_seat: DECIMAL (price when user booked)
  current_price_per_seat: DECIMAL (price after new joiners)
  price_adjustment: DECIMAL (refund amount if price decreased)
  price_locked_at: TIMESTAMP (when user completed payment)
  ```

* `price_history` table (audit trail):
  ```sql
  id: UUID
  trip_id: UUID FK
  seats_filled: INT
  price_per_seat: DECIMAL
  total_price: DECIMAL
  changed_at: TIMESTAMP
  triggered_by_booking_id: UUID FK
  ```

### Pricing Calculation Logic
```javascript
function calculateDynamicPrice(tripBaseCost, platformFee, currentSeats, vehicleCapacity) {
  const totalCost = tripBaseCost + platformFee;
  
  if (currentSeats === 0) {
    // No one booked yet, show estimates
    return {
      min: totalCost / vehicleCapacity,  // If full
      max: totalCost / 1,                // If only 1 person
      current: totalCost / 2             // Assume 2 as starting point
    };
  }
  
  const pricePerSeat = totalCost / currentSeats;
  return {
    current: pricePerSeat,
    ifOneMo re: totalCost / (currentSeats + 1),
    ifFull: totalCost / vehicleCapacity
  };
}
```

### Refund Processing
```javascript
async function processRefundOnNewJoiner(tripId) {
  const trip = await db.trips.findUnique({ where: { id: tripId } });
  const bookings = await db.bookings.findMany({ 
    where: { trip_id: tripId, status: 'paid' } 
  });
  
  const totalSeats = bookings.reduce((sum, b) => sum + b.seats, 0);
  const newPricePerSeat = trip.total_cost / totalSeats;
  
  for (const booking of bookings) {
    if (booking.original_price_per_seat > newPricePerSeat) {
      const refundPerSeat = booking.original_price_per_seat - newPricePerSeat;
      const totalRefund = refundPerSeat * booking.seats;
      
      // Issue refund via Stripe
      await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: totalRefund * 100, // Stripe uses cents
        reason: 'duplicate' // or 'fraudulent', 'requested_by_customer'
      });
      
      // Update booking
      await db.bookings.update({
        where: { id: booking.id },
        data: {
          current_price_per_seat: newPricePerSeat,
          price_adjustment: totalRefund
        }
      });
      
      // Send notification
      await sendPriceDropNotification(booking.user_id, trip, totalRefund);
    }
  }
}
```

### PostHog Events
* `shared_trip_price_viewed` (current_price, potential_savings)
* `price_calculator_used` (seats_selected, estimated_price)
* `booking_price_decreased` (original_price, new_price, refund_amount)
* `price_drop_notification_sent` (user_id, trip_id)
* `private_upgrade_offered` (triggered_by: low_participation)

### Edge Cases
* **Flash Bookings**: 10 people book within 5 seconds → Use DB transaction locking to calculate correct seat count
* **Last-Minute Cancellation**: If 3 people booked @ $120/person, one cancels → Remaining pay more? 
  - Solution: Price locked after payment, no increase for remaining passengers
* **Price Increases**: Never increase price after booking (only decrease/refund)
* **Partial Refunds**: If Stripe refund fails → Store as platform credit, notify user

## Success Metrics
* % of shared trips reaching 75% capacity: >60%
* Avg refund amount per price drop: Track for revenue impact
* User satisfaction with price transparency: >4.5/5 in surveys
* Conversion rate increase from showing dynamic pricing: +20%

## Gate Assignment
**Gate 2** (Basic dynamic pricing display)
**Gate 3** (Automated refunds on price drops, minimum departure threshold logic)

## Notes from Transcript
* Reese: "Imagine that the car is four-seater and the full seat is like $100. Okay, one person set up, the price should be like $75. And the car, whatever it shows, if in case one more person set up, register the price down 50, like this, you understand what I mean?"
* Ming: "It's like encouraging people and everything's open, no hidden things like that"
* Business Goal: Incentivize shared travel to maximize vehicle occupancy and reduce per-person costs, making platform competitive with private taxis
