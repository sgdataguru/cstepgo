# User Story: 1 - View Trip Urgency Status

**As a** potential passenger,
**I want** to see a countdown timer with color-coded urgency indicators on trip cards,
**so that** I can quickly understand how much time is left to join a trip and make timely booking decisions.

## Acceptance Criteria

* Countdown timer displays directly under trip title
* Timer shows time remaining until departure in appropriate units (days/hours/minutes)
* Timer color changes based on departure time:
  - Teal: More than 72 hours remaining
  - Amber: 24-72 hours remaining  
  - Red: Less than 24 hours remaining
  - Gray: Trip has departed
* Timer updates in real-time without page refresh
* Timer calculation is server-side to avoid timezone issues

## Notes

* Visual urgency cues are critical for driving booking decisions
* Server-side calculation ensures consistency across different user timezones