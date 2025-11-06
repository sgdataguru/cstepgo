# User Story: Epic A.2 - View Trip Detail & Itinerary

**Epic:** A — Trip Discovery & Details (Public, no login)

**As a** traveler (no login required),
**I want** to view complete trip details including itinerary, vehicle info, and driver rating,
**so that** I can make an informed booking decision.

## Acceptance Criteria

### Detail Page Access
* Clicking any trip card navigates to trip detail page
* URL format: `/trips/[trip-id]`
* Page accessible without login (public)

### Trip Information Display
* **Header Section:**
  - Origin → Destination
  - Departure date & time
  - Trip duration estimate
  - Urgency timer (same as list view)
  - Price: Per-seat price OR "Private trip - contact for pricing"

* **Vehicle & Capacity:**
  - Vehicle type (e.g., "Toyota Hiace - 12 seater")
  - Total seat capacity
  - Available seats remaining (for shared trips)
  - Optional: Seat map visualization (G2)

* **Itinerary Section:**
  - Full day-by-day itinerary
  - Each activity shows:
    - Day number
    - Time
    - Location
    - Activity description
  - Rendered from structured JSON data
  - Chronological order

* **Driver Information (Placeholder):**
  - Driver name
  - Rating placeholder: "⭐ New Driver" OR "⭐ 4.8 (12 trips)"
  - Note: Full driver ratings in G3

### Call-to-Action
* Prominent "Book This Trip" button
* Button states:
  - Shared trip: "Book Seats" → navigates to booking flow (Epic B)
  - Private trip: "Request Private Ride" → navigates to booking flow (Epic B)
  - Unavailable: "Trip Full" (disabled) OR "Trip Departed" (disabled)

### Responsive Design
* Mobile-optimized layout
* Itinerary scrollable on small screens
* CTA button fixed/sticky on scroll (mobile)

## Technical Notes

* Itinerary stored as JSON in `trips.itinerary` field
* Driver rating calculated from completed trips (future)
* PostHog event: `trip_detail_viewed` with trip_id (see Epic F)

## Gate Assignment
**Gate 1** (Basic detail page - COMPLETED)
**Gate 2** (Private/shared logic, driver rating placeholder)