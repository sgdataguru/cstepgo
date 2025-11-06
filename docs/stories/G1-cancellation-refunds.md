# User Story: Epic G.1 - Cancellation Rules & Refunds

**Epic:** G — Policies (Cancellations, No-shows)

**As a** traveler or driver,
**I want** clear cancellation policies with automated refunds,
**so that** I understand the financial implications of cancelling.

## Acceptance Criteria

### Cancellation Policy Definition
* Policy displayed at booking time:
  - Before payment: Clear modal/section:
    ```
    Cancellation Policy:
    - More than 48 hours before departure: Full refund (100%)
    - 24-48 hours before departure: 50% refund
    - Less than 24 hours before departure: No refund (0%)
    ```
  - Checkbox required: "I agree to the cancellation policy"
  - Link to full terms: `/policies/cancellation`

### Traveler-Initiated Cancellation

**Cancellation Flow:**
* Traveler navigates to: `/bookings/[booking-id]`
* If trip not yet departed AND not completed:
  - Display "Cancel Booking" button
* Click "Cancel Booking":
  - Confirmation modal:
    - "Are you sure you want to cancel?"
    - Show refund amount based on policy:
      - Example: "You will receive a 50% refund ($50)"
    - Reason dropdown (optional):
      - "Plans changed"
      - "Found another option"
      - "Emergency"
      - "Other"
    - Buttons: "Confirm Cancellation" / "Keep Booking"

**Refund Processing:**
* Calculate refund based on cut-off windows:
  ```javascript
  const hoursUntilDeparture = (trip.departure_at - Date.now()) / (1000 * 60 * 60);
  let refundPercent;
  if (hoursUntilDeparture > 48) {
    refundPercent = 100;
  } else if (hoursUntilDeparture > 24) {
    refundPercent = 50;
  } else {
    refundPercent = 0;
  }
  const refundAmount = booking.total_paid * (refundPercent / 100);
  ```

* Stripe refund API call:
  ```javascript
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripe_payment_intent_id,
    amount: Math.round(refundAmount * 100), // cents
    reason: 'requested_by_customer'
  });
  ```

* Update booking:
  - `status: 'cancelled'`
  - `cancelled_at: NOW()`
  - `cancelled_by: user_id`
  - `refund_amount: refundAmount`
  - `refund_percent: refundPercent`

* Update payment:
  - `status: 'refunded'` (full) OR `status: 'partial_refund'`
  - `refund_amount: refundAmount`

* Notifications:
  - Email/SMS to traveler: "Your booking is cancelled. Refund of $[X] processing (3-5 business days)."
  - Email/SMS to driver: "Booking #[ID] was cancelled by traveler."

* Release seats:
  - For shared bookings: Add `booking.seats` back to available capacity
  - For private bookings: Trip returns to public list (if before driver accepted)

### Driver-Initiated Cancellation

**Driver Cancellation (Rare):**
* Driver portal: "Cancel Trip" button (emergency only)
* Confirmation modal:
  - "This will cancel ALL bookings for this trip."
  - Required: Reason (for audit)
  - Warning: "All travelers will receive full refunds."
* On confirm:
  - Cancel all bookings associated with trip
  - Issue 100% refunds to all travelers
  - Trip status: `live` → `cancelled`
  - Notifications to all affected travelers
  - Admin notified for review (potential driver penalty)

### Admin-Initiated Cancellation

**Admin Override:**
* Admin console: `/admin/trips/[trip-id]`
* "Cancel Trip" action (with reason)
* Use cases:
  - Driver unavailable
  - Vehicle breakdown
  - Safety concerns
  - Policy violation
* Full refunds issued automatically
* Audit log entry created

### No-Show Policy (Future - G3/4)

**Traveler No-Show:**
* Driver marks: "Traveler did not show up"
* Traveler forfeits payment (no refund)
* Admin review: Traveler account may be flagged

**Driver No-Show:**
* Traveler reports: "Driver did not show up"
* Admin investigates
* If confirmed: Full refund + driver penalty

## Technical Notes

### Database Schema
* `bookings` table additions:
  ```sql
  cancelled_at: TIMESTAMP
  cancelled_by: UUID (user_id who initiated)
  cancellation_reason: VARCHAR
  refund_amount: DECIMAL
  refund_percent: INT (0, 50, or 100)
  ```

* `payments` table additions:
  ```sql
  refund_amount: DECIMAL
  refund_status: 'none' | 'partial' | 'full'
  refunded_at: TIMESTAMP
  ```

### Stripe Refund Webhooks
* Listen for: `charge.refunded`
* Update payment status in DB
* Confirm refund to traveler

### Cancellation Cut-Off Logic
```typescript
// lib/cancellation-policy.ts
export const calculateRefund = (departureAt: Date, totalPaid: number) => {
  const hoursUntilDeparture = (departureAt.getTime() - Date.now()) / (1000 * 60 * 60);
  
  if (hoursUntilDeparture > 48) {
    return { percent: 100, amount: totalPaid };
  } else if (hoursUntilDeparture > 24) {
    return { percent: 50, amount: totalPaid * 0.5 };
  } else {
    return { percent: 0, amount: 0 };
  }
};
```

### Platform Fee Impact
* Platform keeps fee even on refunds (standard marketplace practice)
* Example:
  - Traveler paid: $100 (incl $15 platform fee)
  - 50% refund: $50 to traveler
  - Driver loses: $42.50 (50% of their $85 payout)
  - Platform keeps: $15 fee

### PostHog Events
* `booking_cancelled` (cancelled_by: 'traveler' | 'driver' | 'admin', refund_percent)
* `refund_processed` (amount, payment_intent_id)
* `no_show_reported` (reported_by: 'traveler' | 'driver')

### Edge Cases
* Multiple cancellations by same user → Track rate, flag abuse
* Cancellation during soft hold → Hold expired, no refund needed
* Trip cancelled after departure time → No refund (policy enforced)
* Partial group cancellation (shared trip) → Individual refunds, trip continues

## Success Metrics
* Cancellation rate: <10% (healthy)
* Refund processing time: <5 minutes (automated)
* Dispute rate: <2% (clear policies reduce disputes)

## Gate Assignment
**Gate 2** (Basic cancellation with Stripe refunds)
**Gate 3/4** (No-show handling, automated dispute resolution, flexible policies)
