# GPS Navigation Integration

## Overview

The GPS Navigation feature provides real-time navigation, turn-by-turn directions, and ETA updates for drivers and passengers during trips on the StepperGO platform.

## Features

- **Real-time Route Calculation**: Uses Google Maps Directions API to calculate optimal routes
- **Turn-by-Turn Navigation**: Step-by-step directions with distance and time estimates
- **ETA Updates**: Continuous updates of estimated arrival time based on current location
- **Live Location Tracking**: Driver location updates stored and broadcasted
- **Milestone Detection**: Automatic notifications when approaching pickup/destination
- **Traffic Layer**: Optional traffic visualization on the map
- **Route Optimization**: Supports waypoints and route preferences (avoid tolls, highways, ferries)

## Architecture

### Backend Components

#### API Endpoints

**1. Calculate Route**
```
POST /api/navigation/route
```
Calculates the optimal route between two points.

Request:
```json
{
  "origin": { "lat": 43.2381, "lng": 76.9451 },
  "destination": { "lat": 43.2567, "lng": 76.9286 },
  "waypoints": [{ "lat": 43.2400, "lng": 76.9300 }],
  "preferences": {
    "avoidTolls": false,
    "avoidHighways": false,
    "avoidFerries": false
  }
}
```

Response:
```json
{
  "success": true,
  "route": {
    "distance": 5200,
    "duration": 900,
    "polyline": "encoded_polyline_string",
    "steps": [...],
    "bounds": {...},
    "overview": "5.2 km via Main Street"
  },
  "alternatives": [...]
}
```

**2. Start Navigation**
```
POST /api/navigation/trips/[tripId]/start
```
Starts navigation for a specific trip.

Request:
```json
{
  "driverId": "driver_id",
  "currentLocation": {
    "lat": 43.2381,
    "lng": 76.9451,
    "heading": 45,
    "speed": 50,
    "accuracy": 10
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Navigation started",
  "trip": {
    "id": "trip_id",
    "status": "IN_PROGRESS",
    "origin": {...},
    "destination": {...}
  }
}
```

**3. Update/Get Location**
```
POST /api/navigation/trips/[tripId]/location
GET /api/navigation/trips/[tripId]/location
```

POST Request:
```json
{
  "driverId": "driver_id",
  "location": {
    "lat": 43.2400,
    "lng": 76.9300,
    "heading": 45,
    "speed": 50,
    "accuracy": 10
  }
}
```

Response:
```json
{
  "success": true,
  "location": {...},
  "eta": {
    "estimatedArrival": "2025-11-23T17:30:00Z",
    "remainingDistance": 3200,
    "remainingDuration": 480,
    "currentSpeed": 50
  },
  "distances": {
    "toOrigin": 500,
    "toDestination": 3200
  },
  "milestone": "approaching_destination"
}
```

Milestones:
- `approaching_pickup`: Within 500m of origin
- `approaching_destination`: Within 1km of destination
- `arrived`: Within 100m of destination

#### Utility Functions

Located in `/src/lib/navigation/utils.ts`:

- `calculateDistance(point1, point2)`: Haversine distance calculation
- `calculateBearing(from, to)`: Compass bearing between points
- `calculateETA(current, destination, speed)`: ETA calculation
- `formatDistance(meters)`: Human-readable distance
- `formatDuration(seconds)`: Human-readable duration
- `formatETA(date)`: Formatted time string
- `isWithinRadius(center, point, radius)`: Proximity check
- `getDirectionsApiUrl(...)`: Build Google Maps API URL
- `parseDirectionsResponse(response)`: Parse Google API response

### Frontend Components

#### NavigationMap

Interactive Google Maps component with route visualization.

```tsx
import { NavigationMap } from '@/components/navigation/NavigationMap';

<NavigationMap
  origin={{ lat: 43.2381, lng: 76.9451 }}
  destination={{ lat: 43.2567, lng: 76.9286 }}
  currentLocation={{ lat: 43.2400, lng: 76.9300 }}
  route={navigationRoute}
  showTraffic={true}
  className="w-full h-96"
/>
```

#### ETADisplay

Shows estimated arrival time, distance, and duration.

```tsx
import { ETADisplay } from '@/components/navigation/ETADisplay';

<ETADisplay
  eta={{
    estimatedArrival: new Date(),
    remainingDistance: 5200,
    remainingDuration: 900,
    currentSpeed: 50,
    trafficCondition: 'moderate'
  }}
/>
```

#### TurnByTurnDirections

Step-by-step navigation instructions.

```tsx
import { TurnByTurnDirections } from '@/components/navigation/TurnByTurnDirections';

<TurnByTurnDirections
  steps={route.steps}
  currentStepIndex={0}
/>
```

#### useNavigation Hook

React hook for managing navigation state.

```tsx
import { useNavigation } from '@/hooks/useNavigation';

const {
  navigation,
  isLoading,
  error,
  isNavigating,
  startNavigation,
  updateLocation,
  stopNavigation,
  refreshRoute,
} = useNavigation({
  tripId: 'trip_123',
  driverId: 'driver_456',
  autoStart: false,
  updateInterval: 5000,
});

// Start navigation
await startNavigation({ lat: 43.2381, lng: 76.9451 });

// Update location (automatically done via geolocation)
await updateLocation({ lat: 43.2400, lng: 76.9300, speed: 50 });

// Stop navigation
stopNavigation();
```

## Database Schema

The `DriverLocation` model in Prisma tracks driver positions:

```prisma
model DriverLocation {
  driverId    String   @id
  latitude    Decimal  @db.Decimal(10, 8)
  longitude   Decimal  @db.Decimal(11, 8)
  heading     Decimal? @db.Decimal(5, 2)
  speed       Decimal? @db.Decimal(5, 2)
  accuracy    Decimal? @db.Decimal(8, 2)
  lastUpdated DateTime @default(now())
  isActive    Boolean  @default(true)
  
  driver      User     @relation(...)
  
  @@index([latitude, longitude])
  @@index([isActive, lastUpdated])
}
```

## Setup

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Google Maps API Requirements

Enable the following APIs in Google Cloud Console:
- Maps JavaScript API
- Directions API
- Geocoding API (optional)
- Places API (already enabled)

## Usage Examples

### Driver Navigation Flow

1. Driver accepts a trip
2. Driver clicks "Start Navigation"
3. App starts tracking driver location
4. App displays:
   - Interactive map with route
   - Turn-by-turn directions
   - Real-time ETA
5. App sends milestone notifications
6. Driver completes trip

### Passenger Tracking Flow

1. Passenger books a trip
2. Driver starts navigation
3. Passenger sees:
   - Driver's live location on map
   - Estimated arrival time
   - Distance to pickup/destination
4. Passenger receives milestone notifications

## Testing

### Demo Page

Visit `/navigation/demo` to test the navigation features:

```bash
npm run dev
# Navigate to http://localhost:3000/navigation/demo
```

The demo page includes:
- Interactive map
- Start/stop navigation controls
- Traffic layer toggle
- Sample route (Almaty, Kazakhstan)
- ETA display
- Turn-by-turn directions

### Manual Testing

1. Start navigation:
```bash
curl -X POST http://localhost:3000/api/navigation/trips/[tripId]/start \
  -H "Content-Type: application/json" \
  -d '{"driverId":"driver_id","currentLocation":{"lat":43.2381,"lng":76.9451}}'
```

2. Update location:
```bash
curl -X POST http://localhost:3000/api/navigation/trips/[tripId]/location \
  -H "Content-Type: application/json" \
  -d '{"driverId":"driver_id","location":{"lat":43.2400,"lng":76.9300,"speed":50}}'
```

3. Get location:
```bash
curl http://localhost:3000/api/navigation/trips/[tripId]/location
```

## Performance Considerations

### Location Update Frequency

- Recommended: Every 5-10 seconds while navigating
- Balance between accuracy and API costs
- Use geolocation watchPosition with high accuracy

### API Rate Limits

- Google Maps Directions API: Monitor usage
- Implement caching for frequently requested routes
- Use route alternatives sparingly

### Database Optimization

- Index on `latitude`, `longitude` for location queries
- Index on `isActive`, `lastUpdated` for filtering
- Consider geospatial queries for nearby drivers

## Privacy & Security

### Location Data

- Only collect location during active trips
- Clear location history after trip completion
- Provide user controls for location sharing
- Encrypt location data in transit

### API Keys

- Restrict Google Maps API key to specific domains
- Use environment variables (never commit keys)
- Implement rate limiting on navigation endpoints
- Add authentication middleware

## Troubleshooting

### Common Issues

**Maps not loading:**
- Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
- Verify API is enabled in Google Cloud Console
- Check browser console for errors

**Route calculation fails:**
- Verify coordinates are valid
- Check Google Maps API quota
- Ensure network connectivity

**Location updates not working:**
- Check geolocation permissions in browser
- Verify HTTPS (required for geolocation)
- Check error messages in console

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Offline map caching
- [ ] Voice navigation
- [ ] Multi-language support for directions
- [ ] Route sharing between passengers
- [ ] Historical route playback
- [ ] Driver performance analytics

## License

This feature is part of the StepperGO platform.
