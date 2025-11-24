# User Story: 9 - Passenger Browse and Book Activities

**As a** passenger,  
**I want** to browse and book activities and events (like tours and experiences),  
**so that** I can plan my trips and make the most of my time in a destination.

## Acceptance Criteria

* Passenger can access an **Activities** section from the main navigation or relevant landing page modules.
* The activities listing page allows:
  * Filtering by location, date, category, and price range,
  * Sorting by popularity, rating, or price (if available).
* Each activity card shows:
  * Title, thumbnail image,
  * Location,
  * Starting price,
  * Key highlights or tags.
* Passenger can click an activity to view a **detail page** with:
  * Full description,
  * Photo gallery,
  * Available dates/time slots,
  * Capacity or "spots left" (if provided),
  * Reviews/ratings (when implemented).
* From the detail page, the passenger can:
  * Select a date/time slot,
  * Specify number of participants,
  * See total price.
* On confirming, a booking is created and:
  * The passenger is taken through the standard payment flow.
  * Availability for that slot is updated to prevent overbooking.
* After successful payment:
  * The passenger sees an activity booking confirmation,
  * The booking appears in their trip/activity history.

## Notes

* This story assumes core activity models and owner-facing management are available.
