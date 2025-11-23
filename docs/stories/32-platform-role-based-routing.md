# User Story: 32 - Platform Role-Based Routing

**As a** platform user (customer or driver),
**I want** to be automatically routed to the appropriate interface based on my role,
**so that** I see relevant features and functionality for my user type.

## Acceptance Criteria

* Customer users are directed to main platform (`/`) with booking features
* Driver users are directed to driver portal (`/drivers/`) with trip discovery
* Role-based navigation menus show only relevant sections
* Cross-role access is prevented through authentication middleware
* Clear visual distinction between customer and driver interfaces
* Seamless switching for users who are both customers and drivers

## Notes

* Implements the core platform segregation requirement from the transcript
* Ensures "driver space where only driver can go" as requested
* Foundation for maintaining separate user experiences
* Must handle edge cases where users have multiple roles
