# User Story: 4 - Passenger Manage Upcoming Bookings

**As a** passenger,  
**I want** to view and manage my upcoming bookings (including cancellation),  
**so that** I stay in control of my travel plans and can adjust them when needed.

## Acceptance Criteria

* Passenger can access a **"My Trips" / "Upcoming Trips"** page after logging in.
* The page shows a list of upcoming bookings with:
  * Origin and destination,
  * Date and time,
  * Booking status,
  * Trip type (private/shared/activity, if applicable).
* Passenger can click into a booking to see:
  * Full trip details,
  * Driver details (when assigned),
  * Price and payment status,
  * Seat count (for shared rides).
* For eligible bookings (within policy rules):
  * A **Cancel Booking** action is available.
* When cancelling:
  * Passenger sees a confirmation dialog with:
    * Summary of cancellation policy,
    * Expected refund amount (if any).
  * On confirmation, booking status changes to `cancelled`.
  * Seats are released back into availability for that trip.
* If a refund is applicable:
  * The system triggers refund processing via the payment provider.
  * Passenger can see cancellation status and refund status in the booking detail.

## Notes

* Detailed refund calculations and policies are handled by a separate cancellation/refund story but must be surfaced in the UI in a clear, user-friendly way.
