# User Story: 9 - Pay for Trip Booking

**As a** passenger,
**I want** to pay for my trip booking using international or local payment methods,
**so that** I can secure my seat on the trip.

## Acceptance Criteria

* Two payment gateway options:
  - Stripe for international cards (3D Secure compliant)
  - Kaspi Pay for local transactions
* Clear payment flow with pricing breakdown
* Secure payment processing
* Immediate booking confirmation upon payment
* Receipt sent via email/SMS
* Payment status tracked: unpaid → paid → completed/refunded

## Notes

* Payment security is critical
* Consider adding more local payment options