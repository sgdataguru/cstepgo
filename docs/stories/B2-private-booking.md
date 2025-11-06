# User Story: Epic B.2 - Private Booking (Whole Vehicle)

**Epic:** B — Booking (Private vs Shared)

**As a** traveler,
**I want** to book an entire vehicle privately,
**so that** I can travel exclusively with my group.

## Acceptance Criteria

### Booking Type Selection
* After OTP verification (B.1), show booking options:
  - **"Private Ride"** - "Book the entire vehicle for your group"
  - **"Shared Ride"** - "Book individual seats" (Story B.3)
* Clear visual distinction between options
* Price display:
  - Private: "Contact driver for custom pricing" OR fixed private price
  - Shared: Price per seat shown

### Private Booking Flow
* User selects "Private Ride"
* Display:
  - Vehicle capacity: "Entire [Vehicle Type] - [X] seats"
  - Estimated price: TBD or fixed amount
  - Note: "This trip will be exclusively yours. Driver will confirm availability."

### Seat Locking Mechanism
* Upon private booking submission:
  - Create booking record: `type = 'private'`
  - Lock all seats: `seats = trip.seat_capacity`
  - Status: `pending` (awaiting driver acceptance)
* Database constraints:
  - Prevent shared bookings after private booking exists
  - Atomic transaction for seat locking

### Trip Visibility Update
* After driver accepts private booking:
  - Trip REMOVED from public list (Story A.1)
  - Trip NOT visible in search results
  - Direct link shows: "This trip is no longer available"
* Before driver accepts:
  - Trip remains visible to other users
  - Other users see: "Private booking pending - subject to driver confirmation"

### Booking Confirmation
* Status: "Booking Submitted - Awaiting Driver Confirmation"
* Email/SMS notification sent:
  - Booking reference number
  - Trip details
  - Estimated response time: "Driver typically responds within 5 minutes"
* Redirect to booking status page: `/bookings/[booking-id]`

### Driver Notification
* Driver receives notification:
  - New private booking request
  - Traveler name & contact
  - Trip details
  - Accept/Decline options (Story D.2)

## Technical Notes

### Database Changes
* `bookings` table:
  - `type: 'private'`
  - `seats: trip.seat_capacity`
  - `status: 'pending'`
  - `hold_expires_at: NULL` (no soft hold for private)

* Trip visibility query:
  ```sql
  SELECT * FROM trips 
  WHERE status = 'live' 
    AND (
      is_private = false 
      OR (is_private = true AND NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE trip_id = trips.id 
          AND type = 'private' 
          AND status IN ('paid', 'driver_accepted')
      ))
    )
  ```

### PostHog Events
* `booking_started` (type: private)
* `private_booking_submitted`
* `private_booking_driver_notified`

### Edge Cases
* Multiple private booking attempts → First submitted wins (race handled by DB constraint)
* Traveler cancels before driver accepts → Trip returns to public list
* Driver declines → Trip returns to public list, traveler notified

## Gate Assignment
**Gate 2** (Core private booking flow)
**Gate 3** (Custom pricing negotiation - future)
