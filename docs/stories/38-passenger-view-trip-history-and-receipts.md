# User Story: 6 - Passenger View Trip History and Receipts

**As a** passenger,  
**I want** to view my past trips and download receipts,  
**so that** I can keep records for personal tracking, expense claims, or tax purposes.

## Acceptance Criteria

* After logging in, the passenger can navigate to a **"Trip History"** section.
* Trip history shows a paginated list of completed and cancelled bookings, including:
  * Origin and destination,
  * Trip date and time,
  * Total amount paid,
  * Trip status (completed/cancelled),
  * Trip type (private/shared/activity).
* Passenger can click a trip entry to view:
  * Detailed itinerary,
  * Driver information (where applicable),
  * Payment details (amount, method, last 4 digits if card),
  * Cancellation/refund status if the trip was cancelled.
* For completed, fully-paid trips:
  * Passenger can download a **receipt** (PDF or well-formatted HTML suitable for printing),
  * Receipt includes key details: passenger name, trip route, date/time, price breakdown, taxes, and reference IDs.
* If email receipts are supported:
  * Passenger can request the receipt to be re-sent to their email.
* Sensitive payment data is not exposed (no full card numbers, etc.).

## Notes

* This story can reuse existing analytics/payment data models where possible.
* Format of the receipt should be consistent with what finance/accounting may need in future phases.
