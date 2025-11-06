# User Story: Epic D.3 - Mark Trip Complete

**Epic:** D — Driver Portal

**As a** driver,
**I want** to mark trips as completed after finishing them,
**so that** I can receive payment and trigger traveler reviews.

## Acceptance Criteria

### Completion Trigger
* "Mark Complete" button available on:
  - Driver dashboard: `/driver/dashboard`
  - Trip detail page: `/driver/trips/[trip-id]`
* Button state:
  - **Disabled** before departure time:
    - Tooltip: "Available after [departure date/time]"
  - **Enabled** after departure time:
    - Appearance: Green, prominent
    - Label: "Mark Trip as Complete"

### Completion Flow
* Driver clicks "Mark Complete"
* Confirmation modal:
  - "Confirm trip completion?"
  - Trip details recap:
    - Origin → Destination
    - Departure date
    - Traveler(s): List of names (shared trips show all)
    - Total payout: $[amount]
  - Checkbox (optional): "Everything went smoothly"
  - Buttons: "Confirm" / "Cancel"

### Status Updates
* On confirmation:
  - Booking status: `driver_accepted` → `completed`
  - Driver assignment: `status = 'completed'`, `completed_at = NOW()`
  - Trip status: `live` → `completed`
  - Toast: "Trip marked complete! Payment will be processed."
  - Redirect to dashboard with success banner

### Traveler Review Prompt
* After driver marks complete:
  - Send email/SMS to traveler(s):
    - "Your trip is complete! How was your experience?"
    - CTA: "Rate Your Trip" → `/review/[booking-id]`
  - Review form (G3):
    - Driver rating: 1-5 stars
    - Trip rating: 1-5 stars
    - Optional comment
  - Deadline: 7 days to submit review

### Payment Processing
* Completion triggers payout calculation:
  - Total payout = Sum of all bookings' `driver_payout_amount`
  - Update payment records: `status = 'completed'`
  - Admin sees payout pending: `/admin/drivers/[driver-id]/payouts`
  - Manual payout: Admin marks as "Paid" after bank transfer (Story C.2)

### Incomplete Trip Handling
* If trip not marked complete within 24 hours of departure:
  - Auto-complete after 48 hours (grace period)
  - OR Admin intervention: Manual completion (Story E.3)
  - Notification to driver: "Please mark trip [X] as complete"

## Technical Notes

### Database Updates
```sql
-- Transaction
BEGIN;

UPDATE bookings 
SET status = 'completed', completed_at = NOW()
WHERE trip_id = $trip_id AND status = 'driver_accepted';

UPDATE driver_assignments
SET status = 'completed', completed_at = NOW()
WHERE trip_id = $trip_id AND driver_id = $driver_id;

UPDATE trips
SET status = 'completed', completed_at = NOW()
WHERE id = $trip_id;

-- Log completion event
INSERT INTO events_analytics (event_name, props)
VALUES ('trip_completed', {trip_id, driver_id, traveler_count});

COMMIT;
```

### PostHog Events
* `driver_mark_complete_clicked` (trip_id)
* `trip_completed` (trip_id, driver_id, traveler_count, days_after_departure)
* `review_prompt_sent` (booking_id, traveler_id)

### Edge Cases
* Driver forgets to mark complete → Auto-complete after 48h + notification
* Dispute arises (e.g., no-show) → Admin can override status (Story E.3)
* Multiple bookings on same trip (shared) → All marked complete together
* Trip cancelled last-minute → Cannot mark complete (see Story G.1)

### Payout Timing
* Completion → Payout appears in admin ledger immediately
* Manual payout by admin: 1-3 business days
* Future (G3): Automated Stripe Connect payouts

## Driver Dashboard Updates

### Completed Trips Section
* Display:
  - Trip: Origin → Destination
  - Completion date
  - Payout amount
  - Payout status: "Pending" / "Paid"
* Filter: Last 30 days / All time
* Pagination: 10 trips per page

### Earnings Summary
* Widget on dashboard:
  - Total earnings this month: $[amount]
  - Pending payouts: $[amount]
  - Completed trips this month: [count]
  - Avg payout per trip: $[amount]

## Success Metrics
* On-time completion rate: >90% (within 24h of departure)
* Auto-completion rate: <10%
* Traveler review submission rate: >60%

## Gate Assignment
**Gate 2** (Core completion flow, review prompt)
**Gate 3** (Automated payouts, driver performance analytics)
