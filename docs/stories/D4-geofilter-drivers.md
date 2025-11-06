# User Story: Epic D.4 - Geofilter for Drivers (50km Default)

**Epic:** D — Driver Portal

**As a** driver,
**I want** to see only trips within my service area by default,
**so that** I'm not overwhelmed by irrelevant bookings.

## Acceptance Criteria

### Home Location Setup
* During driver onboarding (Story E.2):
  - Admin sets `drivers.home_location` (lat/lng)
  - Typically: Driver's city/town of residence
  - Stored as PostGIS GEOGRAPHY point

### Default Geofilter (50km Radius)
* Driver dashboard loads with geofilter active:
  - Only show trips where:
    ```sql
    ST_DWithin(
      trip.origin_location::geography,
      driver.home_location::geography,
      50000 -- 50km in meters
    )
    ```
  - Visual indicator: "Showing trips within 50km of [City Name]"
  - Trip count: "[N] trips available"

### Toggle to "Show All Trips"
* UI toggle on dashboard:
  - **Default state**: "Nearby Trips (50km)" (active)
  - **Expanded state**: "All Trips" (inactive)
* Click toggle:
  - Removes geofilter
  - Loads all trips nationwide
  - Visual indicator: "Showing all trips"
  - Trip count updates: "[N] trips available"
* Preference saved:
  - Store in `driver_settings` table OR local storage
  - Persists across sessions

### Distance Display
* Each trip card shows distance from driver:
  - Example: "📍 32km away"
  - Calculated from `driver.home_location` to `trip.origin_location`
  - Sorted by: Distance (ascending) when geofilter active

### Expandable Radius (Future - G3)
* UI: Radius slider (10km - 200km)
* Driver customizes preferred service area
* Saved preference applies to future logins

## Technical Notes

### Database Schema
* `drivers` table:
  ```sql
  home_location: GEOGRAPHY(POINT, 4326)
  -- Example: POINT(76.9286 43.2381) for Almaty
  ```

* `trips` table:
  ```sql
  origin_location: GEOGRAPHY(POINT, 4326)
  destination_location: GEOGRAPHY(POINT, 4326)
  ```

* `driver_settings` table (optional):
  ```sql
  driver_id: UUID FK
  geofilter_enabled: BOOLEAN (default true)
  geofilter_radius_km: INT (default 50)
  ```

### PostGIS Query
```sql
-- Get trips within 50km of driver
SELECT 
  t.*,
  ST_Distance(t.origin_location::geography, d.home_location::geography) / 1000 AS distance_km
FROM trips t
CROSS JOIN drivers d
WHERE d.id = $driver_id
  AND ST_DWithin(
    t.origin_location::geography,
    d.home_location::geography,
    50000 -- 50km in meters
  )
  AND t.status = 'live'
ORDER BY distance_km ASC;
```

### Location Data Sources
* Geocoding: Use Mapbox/Google Maps API to convert city names → lat/lng
* Admin enters city name → API returns coordinates
* Stored as GEOGRAPHY for efficient distance queries

### PostHog Events
* `driver_geofilter_toggled` (enabled: true/false, radius_km)
* `driver_trips_filtered` (total_trips, filtered_trips, radius_km)

### Edge Cases
* Driver home location not set → Show all trips (no filter) + warning toast
* No trips within 50km → Display: "No nearby trips. Expand to 'All Trips'?"
* Driver relocates → Admin updates home location (Story E.2)

### Performance Optimization
* Index on `trips.origin_location` (GIST index for PostGIS)
* Cache driver home location in session to avoid repeated DB lookups

## UI/UX Enhancements

### Map View (G3 - Future)
* Visual map showing:
  - Driver home location (blue pin)
  - Available trips (green pins)
  - 50km radius circle overlay
* Click pin → Trip details

### Filter Presets
* Quick filters:
  - "This Week" (trips departing in next 7 days)
  - "Urgent" (departing in <24h)
  - "High Payout" (>$100 driver payout)

## Success Metrics
* Geofilter usage: >70% of drivers keep it enabled
* Avg trips per driver view: Reduced from 50+ to 10-15 (focused)
* Driver acceptance rate: Increase by 15% (less overwhelm)

## Gate Assignment
**Gate 2** (50km default geofilter with toggle)
**Gate 3** (Customizable radius, map view, route optimization)
