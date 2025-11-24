# User Story: 3 - Passenger Pay for Booking Online

**As a** passenger,  
**I want** to pay for my trip booking securely using an online payment method,  
**so that** my booking is confirmed and I can rely on the trip going ahead.

## Acceptance Criteria

* After creating a booking (private or shared), the passenger is redirected to a **checkout** screen showing:
  * Booking details,
  * Total price,
  * Any fees or taxes.
* The passenger can initiate payment using the integrated payment provider (e.g., Stripe Checkout/Elements).
* On payment initiation:
  * A payment intent is created with the correct booking reference and amount.
* On **successful payment**:
  * Payment status is updated to `paid`.
  * Booking status transitions from `pending` to `confirmed`.
  * Passenger sees a success page with:
    * Booking reference,
    * Trip details,
    * Payment summary.
  * A confirmation notification (SMS/WhatsApp/email) is sent if messaging is configured.
* On **failed or cancelled payment**:
  * Payment status is recorded as `failed` or `cancelled`.
  * Booking remains `pending` or transitions to a `payment_failed` state.
  * Passenger sees a clear error message and may retry payment.
* Webhooks from the payment provider:
  * Are verified using signature checks.
  * Can update payment and booking status even if the user closes the browser.

## Notes

* Actual payment methods (cards, wallets) are abstracted by the provider.
* This story focuses on end-to-end payment for a single booking; refunds are handled in a separate story.
