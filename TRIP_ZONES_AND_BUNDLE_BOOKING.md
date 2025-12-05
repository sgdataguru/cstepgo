# Trip Zones & Bundle Booking Feature

## Overview

This feature introduces zone-based trip classification and bundle booking capabilities for the StepperGo platform, allowing users to:
- Browse trips categorized by zones (A, B, C) based on distance and duration
- Select single or multiple trips to create bundles
- Choose between private and shared ride options
- View estimated fares with bundle discounts

## Zone Classification

Trips are automatically classified into three zones based on distance and duration:

### Zone A - Day Trips ☀️
- **Duration**: Under 8 hours
- **Distance**: Under 200 km
- **Typical Use**: Single-day adventures that can be completed within the same calendar day
- **Color**: Green (#10B981)

### Zone B - Weekend Trips 🌙
- **Duration**: 8-48 hours
- **Distance**: 200-600 km
- **Typical Use**: Weekend getaways requiring 1-2 days with overnight stay
- **Color**: Amber (#F59E0B)

### Zone C - Multi-Day Expeditions 🏔️
- **Duration**: Over 48 hours
- **Distance**: Over 600 km
- **Typical Use**: Longer journeys requiring 3+ days
- **Color**: Purple (#8B5CF6)

## Database Schema Changes

### Trip Model Updates
Added to the `Trip` model:
- `zone`: TripZone enum (ZONE_A, ZONE_B, ZONE_C)
- `estimatedDays`: Int - Estimated duration in days
- `distance`: Float - Distance in kilometers

### New TripBundle Model
Created to manage bundle bookings:
- `id`: Unique identifier
- `userId`: Reference to user creating the bundle
- `tripIds`: Array of trip IDs in the bundle
- `totalDays`: Total estimated days
- `adjustedDays`: User-adjusted days (optional)
- `rideType`: 'PRIVATE' or 'SHARED'
- `estimatedFare`: Total fare estimate
- `farePerSeat`: Per-seat fare for shared rides
- `status`: DRAFT, PENDING, CONFIRMED, CANCELLED
- `metadata`: Additional bundle details

## File Structure

### Frontend Pages
- `/src/app/trips/kazakhstan/page.tsx` - Main Kazakhstan trips page with zone filtering
- `/src/app/trips/bundle/page.tsx` - Bundle configuration page
- `/src/app/trips/bundle/confirm/page.tsx` - Bundle confirmation page

### API Endpoints
- `/src/app/api/trips/kazakhstan/route.ts` - GET endpoint for Kazakhstan trips with zone filtering
- `/src/app/api/trips/bundle/estimate/route.ts` - POST endpoint for fare estimation
- `/src/app/api/trips/bundle/book/route.ts` - POST endpoint for creating bundle bookings

### Utilities
- `/src/lib/utils/tripZoneClassifier.ts` - Zone classification logic
- `/src/lib/utils/fareEstimator.ts` - Fare calculation logic

## Zone Classification Algorithm

The classification uses both distance and duration metrics:

```typescript
// A trip is classified to a higher zone if EITHER metric exceeds the threshold
if (durationHours <= 8 && distance <= 200) {
  zone = ZONE_A;
} else if (durationHours <= 48 && distance <= 600) {
  zone = ZONE_B;
} else {
  zone = ZONE_C;
}
```

Distance is calculated using the Haversine formula:
```typescript
R = 6371; // Earth's radius in kilometers
distance = 2 * R * atan2(sqrt(a), sqrt(1-a))
```

## Fare Calculation

### Base Pricing
- **Zone A**: 5,000 KZT base
- **Zone B**: 10,000 KZT base
- **Zone C**: 20,000 KZT base

### Additional Fees
- **Distance fee**: 50 KZT per km
- **Duration fee**: 1,000 KZT per hour
- **Zone premium**: Multiplier based on zone (A: 1.0x, B: 1.2x, C: 1.5x)
- **Platform fee**: 15% of subtotal

### Bundle Discounts
- **2 trips**: 5% off total
- **3+ trips**: 10% off total

### Shared Ride Pricing
- Divide total fare by number of seats (default: 4)
- Show per-seat price with potential savings

## User Flow

### 1. Browse Trips
- User visits `/trips/kazakhstan`
- Filters by zone (A, B, C) and ride type (Private/Shared)
- Views trips with zone badges and basic information

### 2. Select Trips
- Click on trip cards to select (multi-select enabled)
- See running summary in sidebar or floating button
- View total trips, estimated days, and zones covered

### 3. Configure Bundle
- Proceed to `/trips/bundle`
- Review selected trips
- Adjust total days (+/- controls)
- Choose ride type (Private or Shared)
- View fare estimate with breakdown

### 4. Confirm Booking
- Proceed to `/trips/bundle/confirm`
- Review complete itinerary
- See final price summary
- Confirm and book

## API Usage Examples

### Fetch Kazakhstan Trips by Zone
```typescript
GET /api/trips/kazakhstan?zone=ZONE_A&zone=ZONE_B&tripType=SHARED

Response:
{
  "success": true,
  "data": [
    {
      "id": "trip_123",
      "title": "Almaty Day Tour",
      "zone": "ZONE_A",
      "estimatedDays": 1,
      "distance": 150,
      "tripType": "SHARED",
      ...
    }
  ],
  "count": 1
}
```

### Estimate Bundle Fare
```typescript
POST /api/trips/bundle/estimate
{
  "tripIds": ["trip_123", "trip_456"],
  "seats": 4
}

Response:
{
  "success": true,
  "data": {
    "tripCount": 2,
    "totalDays": 3,
    "totalDistance": 450,
    "fare": {
      "privateFare": 45000,
      "sharedFarePerSeat": 11250,
      "currency": "KZT",
      "breakdown": { ... }
    }
  }
}
```

### Create Bundle Booking
```typescript
POST /api/trips/bundle/book
{
  "tripIds": ["trip_123", "trip_456"],
  "totalDays": 3,
  "rideType": "SHARED",
  "estimatedFare": 45000,
  "farePerSeat": 11250
}

Response:
{
  "success": true,
  "bundleId": "bundle_789",
  "message": "Bundle booking created successfully"
}
```

## UI Components

### Zone Filter Chips
Interactive chips showing:
- Zone emoji and name
- Duration range
- Distance range
- Selection state
- Checkmark when selected

### Trip Zone Card
Enhanced trip card with:
- Zone badge in corner
- Selection checkbox
- Trip details (route, days, distance, type)
- Starting price
- Hover and selection states

### Bundle Summary Sidebar
Sticky sidebar showing:
- Total trips selected
- Estimated days
- Zones covered
- Selected trip list
- Proceed to booking button

### Ride Type Selection
Side-by-side cards for:
- Private ride (👑)
  - Full vehicle price
  - Privacy benefits
- Shared ride (👥)
  - Per-seat price
  - Savings percentage
  - Eco-friendly note

## Testing Checklist

- [ ] Zone classification works correctly for various trip distances/durations
- [ ] Filter by single zone shows correct trips
- [ ] Filter by multiple zones works
- [ ] Trip selection adds to bundle summary
- [ ] Day adjustment increases/decreases correctly
- [ ] Minimum days enforced (can't go below estimated)
- [ ] Private ride shows full vehicle price
- [ ] Shared ride shows per-seat price with savings
- [ ] Bundle discount applies for 2+ trips
- [ ] Single trip redirects to trip details page
- [ ] Multi-trip redirects to bundle page
- [ ] Mobile layout works (floating button, responsive filters)
- [ ] Dark mode styling correct

## Future Enhancements

1. **Payment Integration**: Connect bundle bookings to Stripe payment flow
2. **Driver Assignment**: Auto-assign or offer bundles to suitable drivers
3. **Itinerary Optimization**: Suggest optimal route ordering for bundles
4. **Custom Bundles**: Allow users to save and share bundle templates
5. **Multi-Stop Routes**: Support intermediate stops within a single trip
6. **Dynamic Pricing**: Adjust fares based on demand, season, or availability
7. **Bundle Management**: Edit, cancel, or modify existing bundles
8. **Notification System**: Alert users when bundle trips are confirmed

## Performance Considerations

- Zone calculation is memoized for frequently accessed trips
- Distance calculations use cached values when available
- API responses include all necessary data to minimize roundtrips
- Trip cards use lazy loading for images
- Bundle summary updates use React state (no API calls)

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation for zone filters and trip selection
- Screen reader announcements for bundle updates
- High contrast zone colors for visibility
- Touch targets meet minimum size (44px)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Mobile 90+
