# User Story: Epic D.2 - Accept/Decline Booking (Atomic Lock)

**Epic:** D — Driver Portal

**As a** driver,
**I want** to accept or decline booking requests,
**so that** I can confirm trips that fit my schedule.

## Acceptance Criteria

### Driver Dashboard View
* URL: `/driver/dashboard`
* Display sections:
  1. **Pending Bookings** (top priority):
     - List of bookings awaiting driver acceptance
     - Sorted by booking time (oldest first)
     - Each card shows:
       - Trip: Origin → Destination
       - Departure date/time
       - Booking type: "Private" OR "Shared - [N] seat(s)"
       - Traveler name + phone (masked: +7 XXX XXX 1234)
       - Price: Driver payout amount (after platform fee)
       - Time since booking: "Booked 2 minutes ago"
     - Action buttons: "Accept" (green) / "Decline" (red)
  
  2. **Accepted Trips** (upcoming):
     - Trips driver has accepted
     - Status: "Confirmed - [N] days until departure"
     - CTA: "Mark Complete" (enabled only after departure time)
  
  3. **Completed Trips** (history):
     - Past trips with completion date

### Geofilter (Default 50km Radius)
* Only show trips within driver's service area:
  - Default radius: 50km from `drivers.home_location`
  - Filter applied automatically
  - Toggle: "Show All Trips" → Expands to nationwide
* Geofilter preference saved per driver

### Accept Booking Flow
* Driver clicks "Accept" on pending booking
* Confirmation modal:
  - "Confirm acceptance of this booking?"
  - Booking details recap
  - Note: "You cannot accept overlapping trips"
  - Buttons: "Confirm" / "Cancel"
* On confirm:
  - **Atomic transaction** (see Technical Notes)
  - Check conflicts: No other bookings during same timeslot
  - If successful:
    - Booking status: `paid` → `driver_accepted`
    - Create `driver_assignments` record
    - Toast: "Booking accepted! Traveler notified."
    - Email/SMS to traveler: "Your trip is confirmed! Driver [Name] has accepted."
  - If conflict/race condition:
    - Toast: "This booking is no longer available" OR "You have a conflicting trip"
    - Remove from pending list

### Decline Booking Flow
* Driver clicks "Decline"
* Confirmation modal:
  - "Are you sure you want to decline?"
  - Optional: Reason dropdown (for analytics):
    - "Schedule conflict"
    - "Vehicle unavailable"
    - "Too far from my location"
    - "Other"
  - Buttons: "Decline" / "Cancel"
* On confirm:
  - Booking status: `paid` → `driver_declined`
  - Traveler notified: "Driver declined your booking. Full refund processing."
  - Refund initiated (Story G.1)
  - Toast: "Booking declined. Traveler will be refunded."
  - Offer to another driver? (G3 - driver marketplace)

### One Booking Per Timeslot Constraint
* Conflict detection:
  ```
  Timeslot = [trip.departure_at - 2 hours, trip.departure_at + trip.duration + 2 hours]
  ```
* Check: No existing `driver_accepted` bookings overlap this timeslot
* If conflict: Disable "Accept" button with tooltip: "Conflicts with existing trip"

### Acceptance Time Goal
* Success metric: <5 minutes avg acceptance time
* Dashboard displays: "Pending: [N] bookings"
* Push notifications for new bookings (G2 - mobile app)

## Technical Notes

### Atomic Transaction (Concurrency Protection)
```sql
BEGIN;

-- Lock the trip row
SELECT * FROM trips WHERE id = $trip_id FOR UPDATE;

-- Lock the driver's assignments
SELECT * FROM driver_assignments 
WHERE driver_id = $driver_id 
  AND status = 'accepted'
FOR UPDATE;

-- Check conditions:
-- 1. Trip is still live
-- 2. Booking is still 'paid' (not already accepted/declined)
-- 3. No driver assignment exists for this trip
-- 4. No timeslot conflict for driver

IF all_conditions_valid THEN
  -- Update booking
  UPDATE bookings SET status = 'driver_accepted', accepted_at = NOW()
  WHERE id = $booking_id;
  
  -- Create driver assignment
  INSERT INTO driver_assignments (trip_id, driver_id, status, accepted_at)
  VALUES ($trip_id, $driver_id, 'accepted', NOW());
  
  COMMIT;
ELSE
  ROLLBACK;
  RETURN error;
END IF;
```

### Database Schema
* `driver_assignments` table:
  ```sql
  id: UUID
  trip_id: UUID FK
  driver_id: UUID FK
  status: 'accepted' | 'completed' | 'cancelled'
  accepted_at: TIMESTAMP
  completed_at: TIMESTAMP
  ```

### PostHog Events
* `driver_booking_viewed` (trip_id, booking_id)
* `driver_booking_accepted` (trip_id, booking_id, time_to_accept_seconds)
* `driver_booking_declined` (trip_id, booking_id, decline_reason)
* `driver_booking_conflict` (trip_id, reason: 'already_accepted' / 'timeslot_overlap')

### Edge Cases
* Multiple drivers try to accept same trip → First transaction wins, others fail gracefully
* Driver accepts while traveler cancels → Conflict handled by booking status check
* Driver offline for >10 minutes → Send SMS reminder (G2)
* No drivers accept within 30 minutes → Escalate to admin (G2)

## Success Metrics (from Product Spec)
* <5 min avg driver accept time ⭐ GOAL
* <2% double-booking rate ⭐ GOAL
* Driver acceptance rate: >80%

## Gate Assignment
**Gate 2** (Core accept/decline with atomic locking)
**Gate 3** (Driver marketplace, auto-routing, push notifications)
