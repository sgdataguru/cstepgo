# User Story: Epic B.3 - Shared Booking (Per-Seat)

**Epic:** B — Booking (Private vs Shared)

**As a** traveler,
**I want** to book individual seats on a shared trip,
**so that** I can travel affordably while meeting other travelers.

## Acceptance Criteria

### Booking Type Selection
* After OTP verification (B.1), show booking options:
  - **"Shared Ride"** - "Book individual seats - meet other travelers"
  - **"Private Ride"** - See Story B.2
* Display for shared option:
  - Price per seat (clear, bold)
  - Available seats: "[X] of [Y] seats remaining"
  - Seat selector UI

### Seat Selection
* Interactive seat selector:
  - Dropdown or increment/decrement buttons
  - Min: 1 seat
  - Max: Lesser of (available seats, 4) - prevent single user hogging trip
  - Real-time price calculation: `seats × price_per_seat`
* Visual feedback:
  - "Booking [N] seat(s) for $[Total]"
  - Capacity validation displayed

### Soft Hold (Race Condition Protection)
* Upon seat selection confirmation:
  - Create booking record: `type = 'shared'`, `status = 'held'`
  - Set `hold_expires_at = NOW() + 10 minutes`
  - Temporarily reduce available capacity
* Display countdown timer:
  - "Your seats are held for [M:SS] - complete payment to confirm"
  - Timer visible throughout checkout (Story C.1)

### Capacity Enforcement
* Real-time capacity check before payment:
  ```sql
  available_seats = trip.seat_capacity - SUM(bookings.seats WHERE status IN ('held', 'paid', 'driver_accepted'))
  ```
* If insufficient seats (race condition):
  - Display: "Sorry, only [X] seats remaining. Please adjust your booking."
  - Allow user to modify seat count or cancel

### Hold Expiry Handling
* After 10 minutes:
  - If unpaid: Booking status → `expired`
  - Seats released back to pool
  - User sees: "Your hold expired. Please try booking again."
* Cron job: Check every 1 minute for expired holds

### Booking Confirmation
* After successful payment (Story C.1):
  - Status: `held` → `paid`
  - Email/SMS confirmation:
    - Booking reference
    - Seat count
    - Total paid
    - Trip details
    - Next step: "Driver will confirm within 5 minutes"

### Trip Capacity Updates
* After each booking:
  - Update trip card: "[X] of [Y] seats remaining"
  - When full: Trip shows "SOLD OUT" (no longer bookable)
  - Trip remains visible in public list (unlike private trips)

## Technical Notes

### Database Schema
* `bookings` table:
  ```sql
  type: 'shared'
  seats: INT (1-4)
  status: 'held' | 'paid' | 'expired' | 'driver_accepted' | 'completed' | 'cancelled'
  hold_expires_at: TIMESTAMP (NOW() + 10 min)
  ```

### Race Condition Handling
* Atomic transaction with row-level lock:
  ```sql
  BEGIN;
  SELECT * FROM trips WHERE id = $1 FOR UPDATE;
  -- Check capacity
  -- Create booking if valid
  COMMIT;
  ```

### PostHog Events
* `booking_started` (type: shared, seats: N)
* `shared_booking_held` (hold_duration: 10min)
* `shared_booking_expired` (reason: payment_timeout)
* `shared_booking_confirmed`

### Edge Cases
* User books last seat while another hold active → Capacity check prevents overbooking
* Multiple users checkout simultaneously → Database lock ensures atomic capacity updates
* User abandons checkout → Hold expires, seats auto-released
* Trip cancelled by driver → All bookings refunded (Story G.1)

## Success Metrics
* <2% double-booking rate (Goal from product spec)
* Avg checkout completion: >70%
* Hold expiry rate: <30%

## Gate Assignment
**Gate 2** (Core shared booking with soft hold)
**Gate 3** (Seat map visualization, group booking coordination)
