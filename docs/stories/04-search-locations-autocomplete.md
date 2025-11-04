# User Story: 4 - Search Locations with Autocomplete

**As a** driver creating a trip,
**I want** to search and select origin/destination using Google Places autocomplete,
**so that** I can quickly and accurately specify trip locations.

## Acceptance Criteria

* Google Places Autocomplete integrated in origin/destination fields
* Search restricted to Kazakhstan (with future Kyrgyzstan option)
* Autocomplete captures and stores:
  - place_id
  - coordinates (lat/lng)
  - full location name
* Selected locations display clearly in the form
* Works on both desktop and mobile devices

## Notes

* Country restrictions configurable in admin settings
* Critical for accurate pricing calculations