# 21 Driver Trip Discovery - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to view all available customer trip requests in my area, so that I can choose which trips to accept and participate in the platform economy.

## Pre-conditions

- Driver authentication system is implemented
- Customer trip creation system exists
- Geolocation services are available
- Real-time communication infrastructure (WebSocket) is set up
- Driver profile with service area preferences is configured

## Business Requirements

- Display available trips within driver's configurable radius (5km, 10km, 15km)
- Show trip profitability information (fare, distance, estimated earnings)
- Real-time updates when new trips become available or are taken by other drivers
- Trip filtering and sorting capabilities
- Estimated trip duration and navigation integration
- Driver earnings estimation per trip

## Technical Specifications

### Integration Points
- **Maps/Places**: Google Places API for location display and distance calculations
- **Real-time**: WebSocket connections for live trip updates
- **Geolocation**: PostGIS for geographic queries and proximity matching
- **Navigation**: Integration with Google Maps/Apple Maps for route estimation
- **Notifications**: Push notifications for new trip alerts

### Security Requirements
- Driver location privacy protection
- Trip data access restricted to qualified drivers
- Rate limiting on trip discovery API calls
- Secure WebSocket connections with authentication
- GDPR compliance for location data handling

## Design Specifications

### Visual Layout & Components

**Driver Trip Discovery Dashboard**:
```
[Header - Driver Navigation]
├── Logo + Driver Status (Online/Offline)
├── Earnings Today
└── Settings/Profile

[Trip Discovery Main Area]
├── [Filter Bar]
│   ├── Distance Slider (5-15km)
│   ├── Min Fare Filter
│   ├── Trip Type (Private/Shared)
│   └── Sort By (Distance/Fare/Time)
│
├── [Available Trips List - Scrollable]
│   ├── [Trip Card 1]
│   │   ├── Pickup Location + Time
│   │   ├── Destination + Distance
│   │   ├── Fare Amount + Earnings
│   │   ├── Customer Rating
│   │   └── Accept/View Details Buttons
│   ├── [Trip Card 2]
│   └── [Trip Card N...]
│
└── [Map View Toggle]
    └── Interactive map with trip locations
```

**Trip Card Component Layout**:
```
[Trip Card - Material Design Elevation]
├── [Header Row]
│   ├── Pickup Time (e.g., "Now" or "15:30")
│   ├── Trip Type Badge (Private/Shared)
│   └── Urgency Indicator (High/Normal)
│
├── [Location Row]
│   ├── Pickup Icon + Address
│   ├── Arrow/Route Indicator
│   └── Destination Icon + Address
│
├── [Details Row]
│   ├── Distance (e.g., "12.5 km")
│   ├── Duration (e.g., "25 min")
│   ├── Passengers (e.g., "2 pax")
│   └── Customer Rating (4.8★)
│
├── [Earnings Row]
│   ├── Total Fare (e.g., "₸2,500")
│   ├── Platform Fee (-15%)
│   └── Your Earnings (e.g., "₸2,125")
│
└── [Action Row]
    ├── View Details Button
    └── Accept Trip Button (Primary CTA)
```

**Component Hierarchy**:
```tsx
<DriverTripDiscovery>
  <DriverHeader />
  <TripFilters>
    <DistanceFilter />
    <FareFilter />
    <TripTypeFilter />
    <SortOptions />
  </TripFilters>
  
  <TripDisplayMode>
    <ListView>
      {trips.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          onAccept={handleAcceptTrip}
          onViewDetails={handleViewDetails}
        />
      ))}
    </ListView>
    
    <MapView>
      <InteractiveMap>
        <TripMarkers />
        <DriverLocationMarker />
        <RoutePreview />
      </InteractiveMap>
    </MapView>
  </TripDisplayMode>
  
  <RealtimeUpdates />
</DriverTripDiscovery>
```

### Design System Compliance

**Color Palette (Trip Discovery)**:
```css
/* Trip Status Colors */
--trip-available: #10b981;        /* bg-emerald-500 */
--trip-urgent: #f59e0b;           /* bg-amber-500 */
--trip-high-fare: #8b5cf6;        /* bg-violet-500 */
--trip-new: #3b82f6;              /* bg-blue-500 */

/* Earnings Colors */
--earnings-positive: #10b981;      /* bg-emerald-500 */
--earnings-neutral: #6b7280;       /* bg-gray-500 */
--fare-highlight: #1f2937;         /* bg-gray-800 */
```

**Typography Scale**:
```css
--trip-fare-amount: 1.5rem;       /* text-2xl - Fare display */
--trip-location: 1rem;            /* text-base - Address text */
--trip-details: 0.875rem;         /* text-sm - Distance, time */
--trip-metadata: 0.75rem;         /* text-xs - Timestamps */
```

### Responsive Behavior

**Breakpoints**:
```css
/* Mobile (< 768px) */
.trip-discovery-mobile {
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

/* Tablet (768px - 1023px) */
.trip-discovery-tablet {
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
}

/* Desktop (1024px+) */
.trip-discovery-desktop {
  grid-template-columns: 350px 1fr 400px;
  gap: 2rem;
}
```

**Layout Adaptations**:
```tsx
// Mobile: Single column with cards, map overlay
// Tablet: Split view with filters sidebar
// Desktop: Three-column layout (filters, trips, map)
```

### Interaction Patterns

**Trip Card States**:
```typescript
interface TripCardStates {
  default: 'border border-gray-200 bg-white';
  hover: 'border border-emerald-300 shadow-lg scale-102';
  selected: 'border border-emerald-500 bg-emerald-50';
  accepting: 'border border-emerald-500 bg-emerald-50 opacity-75';
  unavailable: 'border border-gray-100 bg-gray-50 opacity-50';
}
```

**Filter Interactions**:
```typescript
interface FilterBehavior {
  distanceSlider: 'real-time filtering with debounce';
  fareFilter: 'input validation with currency formatting';
  sortOptions: 'immediate re-ordering with loading state';
  resetFilters: 'restore defaults with animation';
}
```

## Technical Architecture

### Database Schema Changes

```sql
-- Extend trips table for driver discovery
ALTER TABLE trips ADD COLUMN driver_discovery_radius INTEGER DEFAULT 10;
ALTER TABLE trips ADD COLUMN estimated_earnings DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'normal';
ALTER TABLE trips ADD COLUMN trip_urgency VARCHAR(20) DEFAULT 'normal';

-- Create trip_driver_visibility table for tracking
CREATE TABLE trip_driver_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shown_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  response_action VARCHAR(20), -- 'accepted', 'declined', 'expired'
  response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for geographic queries
CREATE INDEX idx_trips_location_gist ON trips USING GIST (
  ST_MakePoint(pickup_longitude, pickup_latitude)
);
CREATE INDEX idx_driver_location_gist ON driver_locations USING GIST (
  ST_MakePoint(longitude, latitude)
);

-- Create driver_locations table for real-time location tracking
CREATE TABLE driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Direction in degrees
  speed DECIMAL(5, 2), -- Speed in km/h
  accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  last_updated TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### API Endpoints

```typescript
// Trip Discovery APIs
GET /api/drivers/trips/available?radius=10&minFare=500&sortBy=distance
POST /api/drivers/trips/accept/:tripId
GET /api/drivers/trips/details/:tripId
PUT /api/drivers/location (for location updates)

// Real-time WebSocket Events
WS /ws/drivers/trips/updates
// Events: 'new-trip', 'trip-taken', 'trip-cancelled', 'trip-updated'

// Filter and Search APIs
GET /api/drivers/trips/filters (available filter options)
GET /api/drivers/earnings/estimate/:tripId
```

### Real-time Architecture

**WebSocket Implementation**:
```typescript
// Driver Trip Updates WebSocket Handler
class DriverTripUpdatesHandler {
  constructor(private driverId: string) {}
  
  async handleConnection(socket: WebSocket) {
    // Subscribe driver to trip updates in their radius
    await this.subscribeToTripUpdates();
    
    // Send initial available trips
    const availableTrips = await this.getAvailableTrips();
    socket.send(JSON.stringify({
      type: 'initial-trips',
      trips: availableTrips
    }));
  }
  
  async onNewTrip(trip: Trip) {
    // Check if trip is in driver's radius
    if (await this.isTripInRadius(trip)) {
      this.broadcastToDriver({
        type: 'new-trip',
        trip: trip
      });
    }
  }
  
  async onTripTaken(tripId: string) {
    this.broadcastToDriver({
      type: 'trip-unavailable',
      tripId: tripId
    });
  }
}
```

**Geographic Queries**:
```typescript
// PostGIS query for finding trips within radius
const findTripsWithinRadius = async (
  driverLat: number,
  driverLng: number,
  radiusKm: number
): Promise<Trip[]> => {
  return await db.query(`
    SELECT t.*, 
           ST_Distance(
             ST_MakePoint($2, $1)::geography,
             ST_MakePoint(t.pickup_longitude, t.pickup_latitude)::geography
           ) / 1000 AS distance_km
    FROM trips t
    WHERE t.status = 'pending'
      AND ST_DWithin(
        ST_MakePoint($2, $1)::geography,
        ST_MakePoint(t.pickup_longitude, t.pickup_latitude)::geography,
        $3 * 1000
      )
    ORDER BY distance_km ASC
  `, [driverLat, driverLng, radiusKm]);
};
```

### Component Implementation

**TripDiscoveryProvider**:
```typescript
interface TripDiscoveryContext {
  trips: Trip[];
  filters: TripFilters;
  setFilters: (filters: TripFilters) => void;
  acceptTrip: (tripId: string) => Promise<void>;
  refreshTrips: () => void;
  isLoading: boolean;
}

const TripDiscoveryProvider = ({ children }: PropsWithChildren) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filters, setFilters] = useState<TripFilters>(defaultFilters);
  const { driver } = useDriverAuth();
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${process.env.WS_URL}/drivers/trips/updates`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleTripUpdate(data);
    };
    
    return () => ws.close();
  }, []);
  
  // Auto-refresh trips based on location and filters
  useEffect(() => {
    const refreshInterval = setInterval(refreshTrips, 30000); // 30 seconds
    return () => clearInterval(refreshInterval);
  }, [filters]);
  
  const handleTripUpdate = (update: TripUpdate) => {
    switch (update.type) {
      case 'new-trip':
        setTrips(prev => [update.trip, ...prev]);
        break;
      case 'trip-unavailable':
        setTrips(prev => prev.filter(t => t.id !== update.tripId));
        break;
    }
  };
  
  const acceptTrip = async (tripId: string) => {
    try {
      await apiClient.post(`/drivers/trips/accept/${tripId}`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      toast.success('Trip accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept trip');
    }
  };
  
  return (
    <TripDiscoveryContext.Provider value={{
      trips,
      filters,
      setFilters,
      acceptTrip,
      refreshTrips,
      isLoading
    }}>
      {children}
    </TripDiscoveryContext.Provider>
  );
};
```

**TripCard Component**:
```typescript
interface TripCardProps {
  trip: Trip;
  onAccept: (tripId: string) => void;
  onViewDetails: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onAccept, onViewDetails }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const estimatedEarnings = trip.fare * 0.85; // 15% platform commission
  
  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(trip.id);
    setIsAccepting(false);
  };
  
  return (
    <Card className="trip-card hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge variant={trip.urgency === 'high' ? 'destructive' : 'secondary'}>
            {trip.type}
          </Badge>
          <span className="text-sm text-gray-500">
            {formatRelativeTime(trip.pickup_time)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium truncate">
              {trip.pickup_address}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600 truncate">
              {trip.destination_address}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Distance</span>
            <p className="font-medium">{trip.distance_km} km</p>
          </div>
          <div>
            <span className="text-gray-500">Duration</span>
            <p className="font-medium">{trip.estimated_duration} min</p>
          </div>
          <div>
            <span className="text-gray-500">Passengers</span>
            <p className="font-medium">{trip.passengers} pax</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Total Fare</p>
            <p className="text-lg font-bold">₸{trip.fare}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Your Earnings</p>
            <p className="text-lg font-bold text-emerald-600">
              ₸{estimatedEarnings}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(trip.id)}
        >
          Details
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleAccept}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Accepting...
            </>
          ) : (
            'Accept Trip'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
```

## Implementation Steps

### Phase 1: Backend Infrastructure (Week 1)
1. **Database Setup**
   - Add geographic extensions to PostgreSQL
   - Create trip discovery tables
   - Set up spatial indexes

2. **API Development**
   - Trip discovery endpoint with geographic filtering
   - Real-time trip updates WebSocket
   - Location tracking APIs

3. **Geographic Services**
   - PostGIS integration for proximity queries
   - Distance and duration calculations
   - Location validation and normalization

### Phase 2: Real-time System (Week 2)
1. **WebSocket Infrastructure**
   - Driver subscription management
   - Trip update broadcasting
   - Connection state handling

2. **Location Services**
   - Driver location tracking
   - Geographic query optimization
   - Caching for performance

3. **Notification System**
   - Push notification integration
   - Trip alert customization
   - Batch notification handling

### Phase 3: Frontend Implementation (Week 3)
1. **Trip Discovery UI**
   - Trip card components
   - Filter and search interface
   - Map integration

2. **Real-time Updates**
   - WebSocket client implementation
   - State management for live data
   - Optimistic UI updates

3. **Mobile Optimization**
   - Touch-friendly interactions
   - Performance optimization
   - Offline state handling

## Testing Strategy

### Unit Tests
```typescript
describe('Trip Discovery', () => {
  test('should filter trips by distance');
  test('should calculate correct earnings');
  test('should handle real-time updates');
  test('should prevent duplicate trip acceptance');
});
```

### Integration Tests
```typescript
describe('Real-time Trip Updates', () => {
  test('WebSocket connection management');
  test('Geographic query performance');
  test('Trip acceptance workflow');
  test('Filter persistence and restoration');
});
```

### Performance Tests
- Geographic query optimization
- WebSocket connection limits
- Mobile network performance
- Battery usage optimization

## Rollout Strategy

### Deployment Phases
1. **Backend Services** (Week 1): API and WebSocket infrastructure
2. **Real-time System** (Week 2): Live trip updates and notifications
3. **Frontend Interface** (Week 3): Trip discovery dashboard
4. **Mobile Optimization** (Week 4): Performance and UX refinements

### Monitoring & Analytics
- Trip discovery engagement rates
- Average response time to new trips
- Geographic distribution of trip requests
- Driver location accuracy and updates

## Dependencies

### External Services
- Google Maps API (distance calculations, geocoding)
- WebSocket service (real-time infrastructure)
- Push notification service
- Geographic data services

### Internal Dependencies
- Driver authentication system
- Customer trip creation system
- Payment and fare calculation system
- Admin monitoring dashboard

## Risks & Mitigation

### Technical Risks
- **Geographic query performance**: Implement caching and indexing
- **WebSocket scalability**: Use Redis for message broadcasting
- **Location accuracy issues**: Implement validation and fallback

### Business Risks
- **Driver response time**: Optimize notification delivery
- **Trip distribution fairness**: Implement rotation algorithms
- **Battery drain on mobile**: Optimize location update frequency

## Success Metrics

### Performance KPIs
- Trip discovery page load time < 2 seconds
- Real-time update delivery < 500ms
- Geographic query response < 100ms
- 99.9% WebSocket connection uptime

### Business KPIs
- Driver trip acceptance rate > 70%
- Average time to trip acceptance < 60 seconds
- Driver engagement with discovery feature > 80%
- Fair distribution of trips among drivers > 90%
