# User Story: 10 - Admin Monitor Bookings and Revenue

**As an** admin,  
**I want** to monitor active trips, bookings, and high-level revenue metrics in a single dashboard,  
**so that** I can operate the platform effectively and respond quickly to issues.

## Acceptance Criteria

* Admin can access an **Admin Dashboard** from the admin console.
* The dashboard shows at a glance:
  * Number of active trips (in-progress),
  * Number of upcoming trips for the day,
  * Total bookings created today/this week,
  * High-level revenue metrics (e.g., gross bookings, net revenue).
* Admin can view:
  * A table of active trips with:
    * Trip ID, origin, destination,
    * Driver, passengers count,
    * Status and start time.
  * A table of recent bookings with:
    * Booking ID, user, trip type (private/shared/activity),
    * Amount, payment status, booking status.
* Admin can filter and search bookings by:
  * Status (pending, confirmed, cancelled, refunded),
  * Date range,
  * Trip type.
* Dashboard components update periodically or on demand (e.g., refresh button).
* Admin can click into a specific booking or trip to see:
  * Detailed information (participants, payments, cancellations),
  * Related driver and passenger profiles (read-only).

## Notes

* More advanced analytics (e.g., cohort analysis, funnels) can be handled in later stories; this is a baseline operational dashboard.
