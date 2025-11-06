# User Story: Epic E.3 - Admin Create Trip with Itinerary

**Epic:** E — Admin Console

**As an** admin,
**I want** to create trips with detailed itineraries on behalf of drivers,
**so that** drivers can offer trips without technical barriers.

## Acceptance Criteria

### Trip Creation Entry
* Admin console page: `/admin/trips/new`
* Access control: Admin/operator role required
* Option to select driver:
  - Dropdown: List of active drivers
  - Displays: Driver name, vehicle type, home location
  - Pre-fills vehicle info based on selected driver

### Trip Information Form

**Step 1: Basic Details**
* Origin:
  - City/location autocomplete (Mapbox/Google)
  - Lat/lng auto-populated
  - Address validation
* Destination:
  - City/location autocomplete
  - Lat/lng auto-populated
* Departure date & time:
  - Date picker (must be future)
  - Time picker (24-hour format)
* Estimated arrival date & time:
  - Auto-calculated based on route OR manual override
* Trip duration estimate:
  - Display: "[X] days, [Y] hours"
* CTA: "Next"

**Step 2: Vehicle & Pricing**
* Vehicle type (pre-filled from driver):
  - Display: "[Vehicle Type] - [Capacity] seats"
  - Editable if needed
* Seat capacity:
  - Number input
  - Validates against vehicle type (Story E.2)
* Trip type:
  - Radio buttons:
    - ⭐ "Shared" (default) - Travelers book individual seats
    - "Private Available" - Travelers can request entire vehicle
* Pricing:
  - Price per seat: $ (required)
  - Private trip price (optional): $ (if "Private Available" selected)
  - Platform fee preview: "[X]% = $[Y]"
  - Driver payout preview: "$[Z] per booking"
* CTA: "Next"

**Step 3: Itinerary Builder**
* Block-based interface:
  - "Add Day" button → Creates new day block
  - Each day contains:
    - Day number (auto-incremented)
    - "Add Activity" button
  
* Activity fields:
  - Time (optional): HH:MM
  - Location: Text input OR autocomplete
  - Activity description: Textarea
  - "Delete Activity" button
  
* Reorder activities:
  - Drag-and-drop handles OR
  - Up/Down arrow buttons
  
* Preview pane:
  - Shows how itinerary will appear to travelers
  - Updates in real-time as activities added
  
* Itinerary templates (optional):
  - Dropdown: "Load template"
  - Pre-defined templates:
    - "City Tour" (1 day)
    - "Mountain Trek" (3 days)
    - "Silk Road Journey" (7 days)
  - Admin can customize after loading

* CTA: "Next"

**Step 4: Media & Additional Info**
* Trip photos:
  - Upload up to 5 images
  - Drag to reorder (first = cover photo)
  - Fallback: Unsplash integration (Story A.1)
* Trip description (optional):
  - Textarea: Additional notes/highlights
  - Max 500 characters
* Amenities/features (checkboxes):
  - Air conditioning
  - WiFi
  - Meals included
  - Tour guide
  - Photo stops
* CTA: "Review Trip"

**Step 5: Review & Submit**
* Full trip summary:
  - All details from previous steps
  - Itinerary preview
  - Pricing breakdown
* Edit buttons: Links back to each step
* Submit options:
  - "Save as Draft" → `status = 'draft'`
  - "Submit for Approval" → `status = 'pending'` (triggers Story E.1)
* On submit:
  - Validate all required fields
  - Create `trips` record
  - Create `trip_pricing` record
  - Store itinerary as JSON
  - Toast: "Trip created and submitted for approval"
  - Redirect to trip detail: `/admin/trips/[trip-id]`

### Draft Management
* Admin can save partial progress:
  - "Save Draft" button available on all steps
  - Drafts listed in `/admin/trips/drafts`
  - Resume editing anytime
  - Auto-save every 30 seconds (optional)

### Itinerary JSON Structure
```json
{
  "days": [
    {
      "day_number": 1,
      "activities": [
        {
          "time": "08:00",
          "location": "Almaty City Center",
          "description": "Departure from central meeting point"
        },
        {
          "time": "10:30",
          "location": "Big Almaty Lake",
          "description": "Scenic photo stop at mountain lake"
        }
      ]
    },
    {
      "day_number": 2,
      "activities": [...]
    }
  ]
}
```

## Technical Notes

### Database Schema
* `trips` table:
  ```sql
  id: UUID
  driver_id: UUID FK (nullable if admin creates before assignment)
  origin: VARCHAR
  origin_location: GEOGRAPHY(POINT, 4326)
  destination: VARCHAR
  destination_location: GEOGRAPHY(POINT, 4326)
  departure_at: TIMESTAMP
  arrival_at: TIMESTAMP
  duration_days: INT
  vehicle_type: VARCHAR
  seat_capacity: INT
  is_private: BOOLEAN (true if private available)
  itinerary: JSONB
  description: TEXT
  amenities: JSONB (array of strings)
  photos: JSONB (array of URLs)
  status: VARCHAR (draft/pending/approved/live/completed/cancelled)
  created_by: UUID (admin_id)
  created_at: TIMESTAMP
  ```

* `trip_pricing` table:
  ```sql
  id: UUID
  trip_id: UUID FK
  base_price_per_seat: DECIMAL
  private_trip_price: DECIMAL (nullable)
  pricing_mode: 'fixed' | 'dynamic' (default: fixed)
  min_price: DECIMAL (for dynamic - G3)
  max_price: DECIMAL (for dynamic - G3)
  ```

### Geocoding Integration
* API: Mapbox Geocoding OR Google Places
* Convert city name → coordinates
* Example response:
  ```json
  {
    "city": "Almaty",
    "lat": 43.2381,
    "lng": 76.9286,
    "formatted_address": "Almaty, Kazakhstan"
  }
  ```

### PostHog Events
* `admin_trip_created` (trip_id, created_by, driver_id)
* `admin_trip_draft_saved` (trip_id)
* `admin_trip_submitted` (trip_id, status: pending)

### Edge Cases
* Origin = Destination → Warning: "Origin and destination are the same"
* Departure date in past → Error: "Departure must be in future"
* No itinerary activities → Warning: "Consider adding itinerary for better bookings"
* Unsaved changes → "You have unsaved changes. Save draft?"

### Validation Rules
* Origin & destination: Required, must be valid locations
* Departure date: Must be ≥24 hours in future
* Seat capacity: Must match vehicle type (E.2)
* Price per seat: Must be >$0
* Itinerary: At least 1 day with 1 activity recommended (not required)

## Success Metrics
* Trip creation time: <15 minutes
* Trips with itineraries: >80%
* Approval rate: >80% (indicates quality)

## Gate Assignment
**Gate 1** (Basic trip creation with itinerary - COMPLETED)
**Gate 2** (Admin workflow, approval integration, pricing model)
**Gate 3** (Templates, bulk import, AI-assisted itinerary generation)
