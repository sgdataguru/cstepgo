# Passenger Track Driver API Documentation

## Overview
The Passenger Track Driver feature allows passengers with active bookings to track their assigned driver in real-time. This includes live location updates, ETA calculations, and trip status information.

## Features
- **Real-time Location Tracking**: Live driver location updates via WebSocket
- **ETA Calculation**: Dynamic ETA to pickup location based on current traffic
- **Driver Nearby Detection**: Alert when driver is within 1km of pickup
- **Trip Status Updates**: Real-time status changes (on the way, arrived, in progress, completed)
- **Secure Access**: Only authorized passengers can track their bookings
- **Multi-tenant Support**: Tenant-aware filtering and isolation

## API Endpoints

### 1. Get Tracking Information

**Endpoint**: `GET /api/passengers/bookings/:bookingId/track`

**Description**: Retrieve tracking information for an active booking including driver location, ETA, and trip details.

**Authentication**: Required (Bearer token)

**Authorization**: User must be the booking owner

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Response (200 OK)**:
```json
{
  "canTrack": true,
  "booking": {
    "id": "booking-id",
    "status": "CONFIRMED",
    "seatsBooked": 2,
    "confirmedAt": "2024-01-15T10:00:00Z"
  },
  "trip": {
    "id": "trip-id",
    "title": "Trip to Airport",
    "status": "IN_PROGRESS",
    "tripType": "PRIVATE",
    "departureTime": "2024-01-15T14:00:00Z",
    "returnTime": "2024-01-15T18:00:00Z",
    "origin": {
      "name": "Central Station",
      "address": "123 Main St, Almaty",
      "latitude": 43.2566,
      "longitude": 76.9286
    },
    "destination": {
      "name": "Almaty Airport",
      "address": "Airport Road, Almaty",
      "latitude": 43.3521,
      "longitude": 77.0405
    }
  },
  "driver": {
    "id": "driver-id",
    "name": "John Doe",
    "phone": "+77051234567",
    "avatar": "https://example.com/avatar.jpg",
    "vehicleType": "SEDAN",
    "vehicleModel": "Camry",
    "vehicleMake": "Toyota",
    "vehicleColor": "Silver",
    "licensePlate": "A123BC",
    "rating": 4.8,
    "reviewCount": 125
  },
  "driverLocation": {
    "latitude": 43.2580,
    "longitude": 76.9300,
    "heading": 45,
    "speed": 35,
    "accuracy": 10,
    "lastUpdated": "2024-01-15T13:55:00Z"
  },
  "eta": {
    "pickupMinutes": 8,
    "distance": 2.3,
    "isNearby": false
  },
  "tenantId": "org-123"
}
```

**Response (tracking not available)**:
```json
{
  "canTrack": false,
  "message": "Tracking will be available 2 hours before departure",
  "hoursUntilDeparture": 5.5
}
```

**Error Responses**:

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User is not the booking owner
- **404 Not Found**: Booking does not exist
- **400 Bad Request**: Booking is not in a trackable state (cancelled/completed)

## WebSocket Events

### Connection

Connect to the WebSocket server at `/socket.io/` with authentication:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-domain.com', {
  path: '/socket.io/',
  auth: {
    token: 'your-access-token'
  }
});
```

### Subscribe to Trip Updates

**Event**: `passenger:subscribe`

**Payload**:
```json
{
  "tripIds": ["trip-id-1", "trip-id-2"]
}
```

**Response**: `passenger:subscribed`
```json
{
  "message": "Successfully subscribed to trip updates",
  "tripIds": ["trip-id-1", "trip-id-2"]
}
```

### Driver Location Updates

**Event**: `driver.location.updated`

**Payload**:
```json
{
  "type": "driver.location.updated",
  "tripId": "trip-id",
  "driverId": "driver-id",
  "latitude": 43.2580,
  "longitude": 76.9300,
  "heading": 45,
  "speed": 35,
  "accuracy": 10,
  "eta": {
    "pickupMinutes": 8,
    "destinationMinutes": 45
  },
  "timestamp": "2024-01-15T13:55:00Z"
}
```

**Update Frequency**: Every 10 seconds during active trips

### Trip Status Updates

**Event**: `trip.status.updated`

**Payload**:
```json
{
  "type": "trip.status.updated",
  "tripId": "trip-id",
  "tripTitle": "Trip to Airport",
  "previousStatus": "CONFIRMED",
  "newStatus": "IN_PROGRESS",
  "driverName": "John Doe",
  "notes": "Driver has started the trip",
  "originName": "Central Station",
  "destName": "Almaty Airport",
  "timestamp": "2024-01-15T13:55:00Z"
}
```

**Status Values**:
- `CONFIRMED`: Trip confirmed, driver assigned
- `IN_PROGRESS`: Driver has started the trip
- `COMPLETED`: Trip finished
- `CANCELLED`: Trip cancelled

### Booking Events

**Event**: `booking.cancelled`

**Payload**:
```json
{
  "type": "booking.cancelled",
  "tripId": "trip-id",
  "tripType": "PRIVATE",
  "bookingId": "booking-id",
  "passengerId": "passenger-id",
  "passengerName": "Jane Smith",
  "seatsFreed": 2,
  "availableSeats": 2,
  "totalSeats": 4,
  "reason": "Passenger request",
  "tenantId": "org-123",
  "timestamp": "2024-01-15T13:50:00Z"
}
```

## Frontend Integration

### React Hook Usage

```typescript
import { usePassengerWebSocket } from '@/hooks/usePassengerWebSocket';

function TrackDriver({ bookingId, tripId }) {
  const [driverLocation, setDriverLocation] = useState(null);
  
  const { isConnected, isSubscribed } = usePassengerWebSocket({
    token: accessToken,
    tripIds: [tripId],
    enabled: true,
    onDriverLocation: (location) => {
      setDriverLocation(location);
      console.log('Driver at:', location.latitude, location.longitude);
      console.log('ETA:', location.eta?.pickupMinutes, 'minutes');
    },
    onTripStatusUpdate: (update) => {
      console.log('Trip status:', update.newStatus);
    },
  });

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {driverLocation && (
        <div>
          <p>Driver Location: {driverLocation.latitude}, {driverLocation.longitude}</p>
          <p>ETA: {driverLocation.eta?.pickupMinutes} minutes</p>
        </div>
      )}
    </div>
  );
}
```

### Page Component

Navigate to `/my-trips/:bookingId/track` to view the live tracking interface.

## Security

### Authorization

- **Booking Ownership**: Users can only track their own bookings
- **Token Validation**: All API requests require valid JWT token
- **WebSocket Authentication**: Socket connections authenticated via token
- **Tenant Isolation**: Data filtered by tenant context

### Rate Limiting

- **Location Updates**: Maximum 1 update per 10 seconds
- **API Requests**: Standard rate limits apply
- **WebSocket Messages**: Throttled to prevent abuse

### Privacy

- **Location Precision**: Driver location accuracy limited to 10-100m
- **Data Retention**: Real-time data not permanently stored
- **Access Control**: Only passengers with active bookings see location

## Configuration

### Environment Variables

```bash
# Google Maps API Key (for map display)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# WebSocket Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Constants

Location in `/src/lib/constants/realtime.ts`:

```typescript
// Location update intervals
export const DRIVER_LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds
export const DRIVER_LOCATION_IDLE_INTERVAL = 60000; // 1 minute

// Distance thresholds
export const DISTANCE_THRESHOLDS = {
  VERY_CLOSE: 5,    // km
  CLOSE: 15,
  NEARBY: 30,
  FAR: 50,
};

// ETA thresholds
export const ETA_THRESHOLDS = {
  ARRIVING_SOON: 5,  // minutes
  ARRIVING: 15,
  EN_ROUTE: 30,
};
```

## Error Handling

### Frontend Error States

1. **No Tracking Available**: Trip not within 2 hours of departure
2. **Driver Not Assigned**: Booking confirmed but no driver yet
3. **Connection Lost**: WebSocket disconnected
4. **Location Unavailable**: Driver not sharing location
5. **Booking Cancelled**: Booking no longer active

### Fallback Behavior

- Graceful degradation when WebSocket fails
- Polling fallback for location updates
- Clear user messaging for all error states
- Retry mechanisms for failed connections

## Testing

Run the test suite:

```bash
./test-passenger-tracking.sh
```

Test cases covered:
- Authentication and authorization
- API endpoint responses
- WebSocket connectivity
- Real-time location streaming
- Tenant isolation
- Edge cases (offline, cancellation)

## Performance

### Optimization Strategies

- **Location Caching**: Driver location cached for 10 seconds
- **WebSocket Pooling**: Connection reuse across subscriptions
- **Map Rendering**: Lazy loading of map component
- **Data Compression**: Minimal payload for location updates

### Scalability

- Supports 1000+ concurrent tracking sessions
- Efficient room-based WebSocket broadcasting
- Horizontal scaling via Socket.IO adapter

## Best Practices

1. **Enable Tracking Window**: Only enable 2 hours before departure
2. **Battery Optimization**: Reduce update frequency when not in use
3. **Error Recovery**: Implement automatic reconnection
4. **User Feedback**: Show connection status clearly
5. **Accessibility**: Ensure screen reader compatibility

## Support

For issues or questions:
- GitHub Issues: https://github.com/sgdataguru/cstepgo/issues
- Documentation: See README.md
