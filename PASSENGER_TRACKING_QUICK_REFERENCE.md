# Passenger Track Driver - Quick Reference

## For Frontend Developers

### Accessing the Track Driver Page

Add a tracking button to your booking UI:

```tsx
<Link href={`/my-trips/${bookingId}/track`}>
  🚗 Track Driver Live
</Link>
```

### Using the WebSocket Hook

```typescript
import { usePassengerWebSocket } from '@/hooks/usePassengerWebSocket';

const { 
  isConnected,
  isSubscribed,
  driverLocation 
} = usePassengerWebSocket({
  token: accessToken,
  tripIds: [tripId],
  enabled: true,
  onDriverLocation: (location) => {
    console.log('Driver at:', location.latitude, location.longitude);
    console.log('ETA:', location.eta?.pickupMinutes, 'minutes');
  },
  onTripStatusUpdate: (update) => {
    console.log('Trip status changed to:', update.newStatus);
  },
});
```

### Using the Live Map Component

```tsx
import LiveTrackingMap from '@/components/tracking/LiveTrackingMap';

<LiveTrackingMap
  driverLocation={{
    latitude: 43.2580,
    longitude: 76.9300,
    heading: 45,
    speed: 35,
  }}
  pickupLocation={{
    latitude: 43.2566,
    longitude: 76.9286,
    name: "Central Station",
  }}
  destinationLocation={{
    latitude: 43.3521,
    longitude: 77.0405,
    name: "Airport",
  }}
  showDestination={true}
/>
```

## For Backend Developers

### Fetching Tracking Data

```typescript
// GET /api/passengers/bookings/:bookingId/track
const response = await fetch(
  `/api/passengers/bookings/${bookingId}/track`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const trackingData = await response.json();
```

### Broadcasting Location Updates

```typescript
import { realtimeBroadcastService } from '@/lib/services/realtimeBroadcastService';

await realtimeBroadcastService.broadcastDriverLocation(
  tripId,
  driverId,
  {
    latitude: 43.2580,
    longitude: 76.9300,
    heading: 45,
    speed: 35,
    accuracy: 10,
  },
  {
    pickupMinutes: 8,
    destinationMinutes: 45,
  }
);
```

### WebSocket Event Handling

```typescript
// In socketHandlers.ts
socket.on('driver:location:update', async (data) => {
  const { tripId, latitude, longitude, heading, speed, accuracy } = data;
  
  // Update database
  await prisma.driverLocation.upsert({
    where: { driverId: userId },
    update: { latitude, longitude, heading, speed, accuracy },
    create: { driverId: userId, latitude, longitude },
  });
  
  // Broadcast to passengers
  await realtimeBroadcastService.broadcastDriverLocation(
    tripId,
    driverId,
    { latitude, longitude, heading, speed, accuracy },
    eta
  );
});
```

## Key Constants

### Tracking Availability
- **Time Window**: 2 hours before trip departure
- **Nearby Threshold**: 1 km (driver is nearby)
- **Update Frequency**: 10 seconds during active trip

### Trip Statuses
- `CONFIRMED` - Trip confirmed, tracking available
- `IN_PROGRESS` - Trip started, active tracking
- `COMPLETED` - Trip finished, tracking disabled
- `CANCELLED` - Trip cancelled, tracking disabled

### WebSocket Events
- `passenger:subscribe` - Subscribe to trip updates
- `driver.location.updated` - Driver location changed
- `trip.status.updated` - Trip status changed
- `booking.cancelled` - Booking was cancelled

## Testing

### Run Test Suite
```bash
chmod +x test-passenger-tracking.sh
./test-passenger-tracking.sh
```

### Manual Testing Checklist
- [ ] Login as passenger
- [ ] Create or find an active booking
- [ ] Navigate to track page
- [ ] Verify map loads correctly
- [ ] Check WebSocket connection status
- [ ] Simulate driver location updates
- [ ] Verify ETA calculations
- [ ] Test "driver nearby" alert
- [ ] Test offline/error states

## Common Issues

### Map Not Loading
**Problem**: Google Maps not displaying  
**Solution**: Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable

### WebSocket Not Connecting
**Problem**: Live updates not working  
**Solution**: Verify Socket.IO server is running and token is valid

### Tracking Not Available
**Problem**: "Tracking will be available..." message  
**Solution**: Trip must be within 2 hours of departure time

### Unauthorized Access
**Problem**: 403 Forbidden error  
**Solution**: User must be the booking owner

## Performance Tips

1. **Lazy Load Map**: Use `dynamic()` import for map component
2. **Throttle Updates**: Don't update UI on every WebSocket event
3. **Cache Location**: Store last known location client-side
4. **Optimize Markers**: Reuse marker instances, don't recreate
5. **Debounce ETA**: Calculate ETA every 30 seconds, not on every update

## Security Notes

- **Authorization**: Always verify booking ownership
- **Token Validation**: Check JWT expiry before API calls
- **Rate Limiting**: Respect API rate limits
- **Location Privacy**: Don't expose precise driver location to non-passengers
- **Tenant Isolation**: Filter all data by tenant context

## Environment Variables

```bash
# Required
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://...

# Optional
WEBSOCKET_HEARTBEAT_INTERVAL=30000
DRIVER_LOCATION_UPDATE_INTERVAL=10000
```

## API Endpoints

- `GET /api/passengers/bookings/:bookingId/track` - Get tracking data
- `GET /api/passengers/bookings` - List all bookings
- `POST /api/passengers/bookings/:bookingId/cancel` - Cancel booking
- `WebSocket /socket.io/` - Real-time connection

## Resources

- **Full Documentation**: See `PASSENGER_TRACKING_API_DOCS.md`
- **Test Script**: `test-passenger-tracking.sh`
- **Example Page**: `/my-trips/[id]/track/page.tsx`
- **Hook Implementation**: `/hooks/usePassengerWebSocket.ts`
- **Map Component**: `/components/tracking/LiveTrackingMap.tsx`

## Support

For questions or issues:
1. Check the full API documentation
2. Run the test script to diagnose issues
3. Review WebSocket console logs
4. Open a GitHub issue with details
