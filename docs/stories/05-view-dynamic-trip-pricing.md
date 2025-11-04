# User Story: 5 - View Dynamic Trip Pricing

**As a** potential passenger,
**I want** to see real-time pricing that decreases as more people join,
**so that** I understand the value of shared rides and am incentivized to book.

## Acceptance Criteria

* Trip cards display current price per person
* Price updates when new passengers join
* Pricing formula considers:
  - Total trip distance and duration
  - Vehicle costs and platform margin
  - Number of seats filled vs total seats
  - Minimum price floor
* Price changes are reflected immediately
* Pricing breakdown available on request

## Notes

* Dynamic pricing encourages ride sharing
* Never drops below minimum to protect drivers