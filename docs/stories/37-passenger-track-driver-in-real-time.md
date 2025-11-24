# User Story: 5 - Passenger Track Driver in Real Time

**As a** passenger,  
**I want** to track my driver's live location and ETA on a map,  
**so that** I know when to be ready and feel confident about my ride.

## Acceptance Criteria

* For an **active booking** with an assigned driver:
  * Passenger can open a **"Track Driver"** view from booking details.
* The tracking view shows:
  * A map centered around the relevant area,
  * Driver's current location marker, updated in near real time (e.g., every 5–10 seconds),
  * Pickup location and (optionally) destination markers,
  * Estimated time of arrival (ETA) at pickup.
* Live location data is streamed from the driver app/portal using:
  * WebSockets or SSE, as implemented in the backend.
* When the driver is within a configurable radius of the pickup location:
  * Passenger sees a **"Driver is nearby"** or similar banner/notification.
* If the driver goes offline or location updates stop:
  * Passenger sees a fallback state (e.g., "Waiting for driver location…") instead of a broken map.
* Access to location data is restricted:
  * Only the passenger for that booking (and authorized roles) can see the driver's live location.

## Notes

* This story assumes driver location updates are already being captured by the backend.
* Mobile push notifications are handled in a separate notifications story; this story focuses on the in-app web experience.
