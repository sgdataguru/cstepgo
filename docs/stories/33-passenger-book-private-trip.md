# User Story: 1 - Passenger Book Private Trip

**As a** passenger,  
**I want** to book a private cab for a specific origin, destination, date/time, and number of passengers,  
**so that** I can secure a dedicated ride that fits my travel needs.

## Acceptance Criteria

* A passenger can start a booking from:
  * The landing page search widget, or
  * A specific trip detail page.
* The passenger can select:
  * Origin and destination (using location autocomplete),
  * Travel date and time,
  * Number of passengers.
* The system calculates and displays:
  * Total fare for a private trip,
  * Estimated travel time and distance.
* When the passenger confirms the booking:
  * A booking record is created and associated with the selected trip (or a new trip if created on the fly).
  * The system validates that the trip is bookable (status is open/available).
* The booking enters a **pending payment** or **reserved** state until payment is completed.
* The passenger sees a booking confirmation screen summarizing:
  * Trip details,
  * Price,
  * Pickup time and location.

## Notes

* Should work for both pre-scheduled and near-term trips as defined in the trip model.
* This story focuses on private (whole-vehicle) bookings; shared seats are handled separately.
