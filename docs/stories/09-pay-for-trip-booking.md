# User Story: Epic C.1 - Card Checkout via Stripe

**Epic:** C — Payments (Stripe)

**As a** traveler,
**I want** to pay for my booking securely using my card,
**so that** I can confirm my seat(s) on the trip.

## Acceptance Criteria

### Payment Flow Entry
* After seat selection (B.2 or B.3):
  - Display payment summary:
    - Trip: Origin → Destination
    - Seats: [N] seat(s) OR "Private - entire vehicle"
    - Price breakdown:
      - Subtotal: $[amount]
      - Platform fee: $[fee] ([X]%)
      - **Total: $[total]** (bold)
  - Hold timer countdown (for shared bookings)
* CTA: "Proceed to Payment" → Opens Stripe Checkout

### Stripe Checkout Integration
* Stripe Checkout Session:
  - 3D Secure (SCA) compliant
  - Supports international cards
  - Line items:
    - "[Trip Name] - [N] seat(s)"
    - Amount: Total including platform fee
* Payment methods accepted:
  - Visa, Mastercard, Amex
  - Future: Local payment methods (Kaspi Pay - G3)

### Payment Success
* Stripe webhook: `checkout.session.completed`
* Update booking:
  - `status: 'held' → 'paid'`
  - Create `payments` record:
    - `stripe_payment_intent_id`
    - `platform_fee_pct: [X]%`
    - `platform_fee_amount: $[fee]`
    - `driver_payout_amount: $[subtotal]`
    - `total_amount: $[total]`
* Redirect to confirmation page: `/bookings/[booking-id]/confirmed`

### Confirmation Page
* Display:
  - ✅ "Booking Confirmed!"
  - Booking reference: `#[BOOKING-ID]`
  - Status: "Paid - Awaiting Driver Acceptance"
  - Estimated driver response: "<5 minutes"
  - Trip details recap
  - CTA: "Track Booking Status" → `/bookings/[booking-id]`
* Send email/SMS confirmation:
  - Booking reference
  - Trip details
  - Payment receipt
  - Next steps

### Payment Failure
* Stripe webhook: `checkout.session.expired` OR `payment_intent.payment_failed`
* Update booking:
  - `status: 'held' → 'payment_failed'`
  - Release seat hold immediately
* Display error:
  - "Payment failed. Please try again."
  - Reason (if available): "Card declined" / "Insufficient funds"
* Allow retry: "Try Another Payment Method"

### Driver Notification
* After successful payment:
  - Notify driver via SMS/email
  - Driver portal shows new booking (Story D.2)
  - Driver has [time window] to accept/decline

## Technical Notes

### Stripe Setup
* Stripe Checkout Session API:
  ```javascript
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: tripName },
        unit_amount: totalAmount * 100
      },
      quantity: 1
    }],
    success_url: `${domain}/bookings/{BOOKING_ID}/confirmed`,
    cancel_url: `${domain}/trips/{TRIP_ID}`,
    metadata: { booking_id: bookingId }
  });
  ```

* Webhook endpoints:
  - `/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `payment_intent.payment_failed`

### Platform Fee Calculation
* Fee: 15% of subtotal (configurable in admin - Story C.2)
* Driver payout: Subtotal - platform fee
* Fee stored in `payments` table for transparency

### PostHog Events
* `payment_initiated` (amount, payment_method: stripe)
* `payment_succeeded` (booking_id)
* `payment_failed` (reason)

### Edge Cases
* Hold expires during checkout → Graceful error: "Booking expired. Please rebook."
* Webhook delay → Polling mechanism checks payment status
* Duplicate webhook events → Idempotency key prevents double-processing
* Partial refunds → See Story G.1 (cancellations)

## Security Requirements
* PCI DSS compliance via Stripe (no card data stored locally)
* Webhook signature verification
* HTTPS required for all payment pages

## Success Metrics
* Payment success rate: >95%
* Avg time to payment completion: <2 minutes
* Webhook processing latency: <5 seconds

## Gate Assignment
**Gate 2** (Stripe Checkout integration)
**Gate 3** (Local payment methods: Kaspi Pay)
