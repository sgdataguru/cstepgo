# User Story: 2 - Passenger Book Shared Ride Seat

**As a** passenger,  
**I want** to book one or more seats on a shared ride,  
**so that** I can reduce my travel cost by sharing a cab with other passengers.

## Acceptance Criteria

* Passenger can filter or identify trips that are **shared rides** (per-seat pricing) in trip search results.
* On a shared trip detail page, the passenger can see:
  * Total seats available,
  * Seats already booked,
  * Per-seat price.
* Passenger can specify:
  * Number of seats they want to book (for themselves and accompanying passengers).
* The system validates:
  * Requested seats do not exceed available seats,
  * Trip status allows new bookings.
* On booking confirmation:
  * A booking is created with `seatsBooked` and `totalAmount = seatsBooked * seatPrice`.
  * Seat availability is updated to reflect the new booking.
* If two or more passengers attempt to book overlapping seats concurrently:
  * The system prevents overbooking (via optimistic locking or equivalent),
  * The user sees an error if seats are no longer available.
* Confirmation screen shows:
  * Number of seats booked,
  * Total price,
  * Trip details and pickup information.

## Notes

* Dynamic pricing or different seat types can be handled later; this story assumes a single per-seat price per trip.
