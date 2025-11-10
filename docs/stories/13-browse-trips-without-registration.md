# User Story: 13 - Browse Trips Without Registration

**As a** visitor (unregistered user),
**I want** to browse all available trips without creating an account,
**so that** I can explore offerings before committing to sign up.

## Acceptance Criteria

### Public Trip Listing
* Landing page displays prominent "Browse All Trips" or "View Available Trips" button
* Clicking redirects to `/trips` page showing all live trips
* No authentication required to view trip listings
* Trip cards display:
  - Origin → Destination
  - Departure date/time
  - Vehicle type (Sedan, Van, Mini-bus)
  - Seat availability: "[X] of [Y] seats available"
  - Price per seat (for shared trips)
  - Base price (for private trips)
  - Trip organizer/driver name (if available)

### Trip Details View
* Users can click any trip to view full details:
  - Complete itinerary (if multi-day tour)
  - Zone-based attractions included
  - Vehicle specifications
  - Driver profile (rating, completed trips)
  - Departure/return times
  - All pricing information
* No login required to view details

### Registration Prompt on Booking Action
* Only when user attempts to **book** a trip:
  - Modal/page: "Sign up to continue booking"
  - Options: "Sign Up with Email/Phone" OR "Continue as Guest" (if supported)
  - Clear messaging: "Registration takes 30 seconds"
* User can close modal and continue browsing

### Search and Filter (Public)
* Visitors can use search/filter without login:
  - Search by destination city/attraction
  - Filter by date range
  - Filter by trip type (Private/Shared)
  - Filter by price range
  - Sort by: Price, Date, Popularity

### Performance Optimization
* Public trip list should load quickly (<2 seconds)
* No sensitive data exposed (driver phone numbers, passenger details)
* Pagination: Show 20 trips per page

## Technical Notes

### Database Query
* Fetch only `published` trips with `status = 'live'`
* Exclude trips that are:
  - Past departure date
  - Fully booked (shared trips)
  - Accepted as private bookings

### Security Considerations
* Mask driver contact information until after booking
* Do NOT expose:
  - Passenger names/details
  - Booking IDs
  - Payment information
  - Admin-only trip metadata

### PostHog Events
* `public_trip_list_viewed`
* `trip_details_viewed` (authenticated: false)
* `signup_prompt_shown` (trigger: booking_attempt)
* `signup_prompt_dismissed`
* `visitor_filtered_trips` (filters_applied: [...])

### SEO Optimization
* Public trip pages should be indexable by search engines
* Meta tags: Title, description, keywords
* Open Graph tags for social sharing
* Structured data: Schema.org Trip/Event markup

## Edge Cases
* User clicks "Book Now" → Redirect to signup/login with return URL
* User refreshes page after filtering → Maintain filter state in URL params
* New trips added while browsing → Show "New trips available" banner with refresh CTA

## Success Metrics
* % of visitors who browse trips: >60%
* Avg time on trip listing page: >2 minutes
* Conversion from browse → signup: >15%
* Bounce rate on trip listing: <40%

## Gate Assignment
**Gate 1** (Already implemented based on demo)
**Gate 2** (Add advanced filters and SEO optimization)

## Notes from Transcript
* Ming emphasized: "It should be open whatever you are registered or not you should be see all upcoming trips and the prices everything otherwise we cannot attract people"
* Business requirement: Low friction discovery to build trust before asking for registration
* Aligns with platforms like inDriver where public browsing increases user acquisition
