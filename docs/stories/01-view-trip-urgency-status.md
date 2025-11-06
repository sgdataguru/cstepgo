# User Story: Epic A.1 - Browse Trips with Urgency Status

**Epic:** A — Trip Discovery & Details (Public, no login)

**As a** traveler (no login required),
**I want** to browse available trips with urgency indicators,
**so that** I can quickly find trips and understand booking deadlines.

## Acceptance Criteria

### Display Requirements
* Trip list shows ≥1 card if trips available
* Each card displays:
  - Origin → Destination
  - Departure date & time
  - Available seats (for shared trips)
  - Price per seat OR "Private trip available"
  - Countdown timer with color-coded urgency
* Trips sorted by soonest departure first

### Urgency Indicators
* Timer shows time remaining until departure (days/hours/minutes)
* Color coding:
  - Teal: >72 hours remaining
  - Amber: 24-72 hours remaining
  - Red: <24 hours remaining
  - Gray: Trip departed
* Timer updates in real-time without page refresh
* Server-side calculation prevents timezone issues

### Visibility Rules
* Public list shows:
  - Shared trips with available seats
  - Private trips awaiting first booking
* Public list DOES NOT show:
  - Private trips already accepted by driver
  - Shared trips at full capacity
  - Draft/pending approval trips

### Call-to-Action
* "Book This Trip" CTA visible on each card
* Clicking CTA navigates to trip detail page (Story A.2)

## Technical Notes

* Trip visibility: `status = 'live' AND (is_private = false OR (is_private = true AND driver_assignment = null))`
* Server-side timer calculation ensures consistency across user timezones
* PostHog event: `trip_list_viewed` (see Epic F)

## Gate Assignment
**Gate 1** (Core browsing - COMPLETED)
**Gate 2** (Private/shared visibility logic)