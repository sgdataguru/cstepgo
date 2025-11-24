# User Story: 8 - Activity Owner Manage Activities

**As an** activity owner,  
**I want** to create and manage activities (tours, events, experiences),  
**so that** travellers can discover and book my offerings through StepperGO.

## Acceptance Criteria

* Activity owner can log in to an **Activity Owner Dashboard**.
* From the dashboard, the activity owner can:
  * Create a new activity with:
    * Title, description, location,
    * Category (e.g., tour, excursion, attraction),
    * Duration and schedule pattern (e.g., daily at 10am),
    * Capacity (max participants),
    * Pricing.
  * Upload photos for the activity (with validation and safe storage).
  * Edit existing activities (content, price, schedules).
  * Enable/disable activities (e.g., mark as active or inactive).
* The system validates:
  * Required fields,
  * Reasonable price and capacity values,
  * Proper schedule/availability formats.
* For each activity, the owner can view:
  * Upcoming bookings (count, dates),
  * Basic booking stats (e.g., total participants, revenue summary – if available).
* Only approved/verified activity owners can publish activities to the public catalogue.

## Notes

* Activity booking and payment flows from the passenger side are handled in a separate user story.
