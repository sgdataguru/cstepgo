# 37 - Passenger Track Driver in Real Time - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, WebSocket/Socket.IO  
**Infrastructure**: Vercel (hosting), Google Maps JavaScript API, WebSocket server (Pusher/Ably or self-hosted)

## User Story

**As a** passenger,  
**I want** to track my driver's live location and ETA on a map,  
**so that** I know when to be ready and feel confident about my ride.

## Pre-conditions

- User must have an active booking (status: CONFIRMED)
- Booking must have an assigned driver
- Driver must be actively sharing location (driver app running)
- Story 33/34/35/36 (Booking & payment system) completed
- Google Maps API key configured
- WebSocket infrastructure set up

## Business Requirements

- **BR-1**: Provide real-time visibility to reduce passenger anxiety and improve experience
  - Success Metric: >80% of passengers access tracking feature
  - Performance: Location updates within 5-10 seconds

- **BR-2**: Accurate ETA predictions to help passengers plan readiness
  - Success Metric: ETA accuracy within ±5 minutes for 90% of rides
  - Performance: ETA recalculated every location update

- **BR-3**: Proactive notifications when driver is nearby
  - Success Metric: >95% of "driver nearby" notifications delivered
  - Performance: Notification triggered within 500ms of proximity detection

- **BR-4**: Graceful fallback when location data is unavailable
  - Success Metric: <5% of tracking sessions show errors
  - Performance: Fallback state displayed within 3 seconds

## Technical Specifications

### Integration Points
- **Google Maps**: JavaScript API for map rendering, Directions API for ETA
- **WebSocket/SSE**: Real-time location streaming (Socket.IO, Pusher, or Ably)
- **Geolocation**: Driver app location tracking
- **Notifications**: In-app notifications for proximity alerts
- **Database**: Location history storage (optional for analytics)

### Security Requirements
- Only booking owner can access driver location
- Driver location only visible during active trips
- WebSocket authentication with JWT tokens
- Rate limiting: 1 location update per 5 seconds per driver
- Location data encrypted in transit (WSS/HTTPS)
- No location data stored beyond trip completion (privacy)

### API Endpoints

#### GET /api/bookings/:bookingId/tracking
Retrieves initial tracking information for active booking.

**Response:**
```typescript
interface TrackingInfoResponse {
  bookingId: string;
  canTrack: boolean;  // true if driver assigned and trip active
  
  driver: {
    id: string;
    name: string;
    phone: string;
    currentLocation?: {
      lat: number;
      lng: number;
      heading?: number;  // Direction in degrees
      speed?: number;    // Speed in km/h
      accuracy?: number; // Accuracy in meters
      timestamp: Date;
    };
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
  };
  
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  
  eta: {
    seconds: number;
    text: string;  // "15 minutes"
    lastUpdated: Date;
  };
  
  tripStatus: 'ASSIGNED' | 'EN_ROUTE_TO_PICKUP' | 'AT_PICKUP' | 'IN_PROGRESS' | 'COMPLETED';
  
  wsConfig: {
    url: string;  // WebSocket endpoint
    channel: string;  // Private channel name
    authToken: string;  // JWT for authentication
  };
}
```

#### WS /api/tracking/stream
WebSocket endpoint for real-time location updates.

**Connection:**
```typescript
const socket = io('wss://api.steppergo.com', {
  auth: {
    token: authToken,
    bookingId: bookingId,
  },
});

socket.on('connect', () => {
  socket.emit('subscribe', { bookingId });
});
```

**Message Types:**
```typescript
// Location Update (from driver)
interface LocationUpdate {
  type: 'location_update';
  data: {
    driverId: string;
    location: {
      lat: number;
      lng: number;
      heading: number;
      speed: number;
      accuracy: number;
      timestamp: Date;
    };
    eta: {
      seconds: number;
      text: string;
    };
  };
}

// Driver Status Update
interface StatusUpdate {
  type: 'status_update';
  data: {
    tripStatus: TripStatus;
    message: string;
  };
}

// Proximity Alert
interface ProximityAlert {
  type: 'proximity_alert';
  data: {
    distance: number;  // meters
    message: 'Driver is nearby';
  };
}

// Connection Status
interface ConnectionStatus {
  type: 'connection_status';
  data: {
    isOnline: boolean;
    lastSeen?: Date;
  };
}
```

#### POST /api/tracking/driver-location (Driver App)
Endpoint for driver to update location.

**Request:**
```typescript
interface UpdateLocationRequest {
  bookingId: string;
  location: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy: number;
    timestamp: Date;
  };
}
```

**Response:**
```typescript
interface UpdateLocationResponse {
  success: boolean;
  broadcast: boolean;  // Whether update was broadcast to passenger
  eta?: {
    seconds: number;
    text: string;
  };
}
```

#### GET /api/tracking/:bookingId/eta
Calculates ETA using Google Maps Directions API.

**Response:**
```typescript
interface ETAResponse {
  eta: {
    seconds: number;
    minutes: number;
    text: string;  // "15 minutes"
  };
  distance: {
    meters: number;
    text: string;  // "5.2 km"
  };
  route?: {
    polyline: string;  // Encoded polyline for route display
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  traffic: 'light' | 'moderate' | 'heavy';
  calculatedAt: Date;
}
```

## Design Specifications

### Visual Layout & Components

**Tracking Page Layout:**
```
[Full-Screen Map View]
├── Map Container (Google Maps)
│   ├── Driver Marker (car icon, rotated by heading)
│   ├── Pickup Location Marker (pin icon)
│   ├── Destination Marker (flag icon)
│   ├── Route Polyline (if available)
│   └── User Location Marker (optional)
│
├── [Top Bar - Overlay on Map]
│   ├── Back Button (< Back)
│   ├── Trip Status Badge
│   └── Share Location Button
│
├── [Driver Info Card - Bottom Sheet]
│   ├── [Collapsed State - Swipeable Handle]
│   │   ├── Driver Photo + Name
│   │   ├── ETA Display (Large, prominent)
│   │   ├── Distance Remaining
│   │   └── Swipe Up Indicator
│   │
│   └── [Expanded State]
│       ├── Driver Details
│       │   ├── Photo, Name, Rating
│       │   ├── Phone Number with Call Button
│       │   └── Vehicle Details (Make, Model, Color, Plate)
│       ├── ETA Details
│       │   ├── Estimated Arrival Time
│       │   ├── Distance Remaining
│       │   ├── Current Speed (optional)
│       │   └── Last Updated Timestamp
│       ├── Trip Progress Timeline
│       │   ├── Booking Created ✓
│       │   ├── Driver Assigned ✓
│       │   ├── En Route to Pickup (active)
│       │   ├── Pickup Complete
│       │   └── Trip Complete
│       ├── Trip Details
│       │   ├── Pickup: Address
│       │   ├── Destination: Address
│       │   └── Booking Reference
│       └── Action Buttons
│           ├── Call Driver (primary)
│           ├── Message Driver (secondary)
│           └── Cancel Trip (destructive)
│
└── [Status Banners - Top Overlay]
    ├── "Driver is nearby" (green banner)
    ├── "Driver has arrived" (blue banner)
    ├── "Waiting for driver location..." (amber banner)
    └── "Connection lost. Reconnecting..." (red banner)
```

**Map Markers & Styles:**
```
Driver Marker:
├── Custom Car Icon (SVG)
├── Color: Blue (#3b82f6)
├── Size: 48x48px
├── Rotation: Based on heading
├── Shadow: Drop shadow for elevation
└── Animation: Smooth movement between updates

Pickup Marker:
├── Pin Icon with "P" label
├── Color: Green (#10b981)
├── Size: 40x40px
├── Pulse Animation: Breathing effect
└── Label: "Pickup Location"

Destination Marker:
├── Flag Icon with "D" label
├── Color: Red (#ef4444)
├── Size: 40x40px
└── Label: "Destination"

Route Polyline:
├── Color: Blue (#3b82f6)
├── Opacity: 0.6
├── Width: 5px
└── Dashed: false
```

**ETA Display States:**
```
Normal State:
├── "15 minutes away"
├── Font Size: 2xl (24px)
├── Color: Gray-900
└── Update Indicator: Subtle pulse

Nearby State (<5 min):
├── "3 minutes away"
├── Font Size: 3xl (30px)
├── Color: Emerald-600
├── Icon: Location pin
└── Animation: Pulsing

Arrived State:
├── "Driver has arrived"
├── Font Size: 2xl (24px)
├── Color: Blue-600
├── Icon: Checkmark
└── Background: Blue-50

Unknown State:
├── "Calculating..."
├── Font Size: xl (20px)
├── Color: Gray-500
└── Spinner: Loading animation
```

### Design System Compliance

**Color Palette:**
```css
/* Tracking Status Colors */
--status-en-route: #3b82f6;      /* bg-blue-500 */
--status-nearby: #10b981;        /* bg-emerald-500 */
--status-arrived: #6366f1;       /* bg-indigo-500 */
--status-delayed: #f59e0b;       /* bg-amber-500 */

/* Map Elements */
--driver-marker: #3b82f6;        /* bg-blue-500 */
--pickup-marker: #10b981;        /* bg-emerald-500 */
--destination-marker: #ef4444;   /* bg-red-500 */
--route-line: #3b82f6;           /* bg-blue-500 */

/* Connection States */
--connection-good: #10b981;      /* bg-emerald-500 */
--connection-poor: #f59e0b;      /* bg-amber-500 */
--connection-lost: #ef4444;      /* bg-red-500 */
```

**Typography:**
```css
/* ETA Display */
.eta-primary {
  @apply text-3xl font-bold text-gray-900;
}

.eta-secondary {
  @apply text-sm font-medium text-gray-600;
}

/* Driver Info */
.driver-name {
  @apply text-lg font-semibold text-gray-900;
}

.driver-details {
  @apply text-sm text-gray-600;
}

/* Status Messages */
.status-banner {
  @apply text-base font-medium;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.tracking-page-mobile {
  @apply h-screen w-screen overflow-hidden;
}

.map-container-mobile {
  @apply absolute inset-0;
}

.driver-card-mobile {
  @apply fixed bottom-0 left-0 right-0;
  @apply bg-white rounded-t-3xl shadow-2xl;
  @apply z-50;
  /* Swipeable bottom sheet */
  max-height: 80vh;
}

.driver-card-collapsed {
  @apply h-32;
  /* Shows ETA and driver name only */
}

.driver-card-expanded {
  @apply h-auto;
  /* Shows full details */
}

.status-banner-mobile {
  @apply fixed top-16 left-4 right-4;
  @apply rounded-lg px-4 py-3 shadow-lg;
  @apply z-40;
}
```

**Desktop Layout (1024px+)**:
```css
.tracking-page-desktop {
  @apply h-screen grid grid-cols-12 gap-0;
}

.map-container-desktop {
  @apply col-span-8 h-full;
}

.driver-info-sidebar {
  @apply col-span-4 h-full overflow-y-auto;
  @apply bg-white border-l border-gray-200;
  @apply p-6 space-y-6;
}

.status-banner-desktop {
  @apply fixed top-20 left-8 right-auto;
  @apply max-w-md rounded-lg px-6 py-4 shadow-xl;
  @apply z-40;
}
```

### Interaction Patterns

**Map Interactions:**
```typescript
interface MapInteractionStates {
  // Map Controls
  zoomIn: 'Pinch out or + button';
  zoomOut: 'Pinch in or - button';
  pan: 'Drag to move map';
  recenter: 'Tap "My Location" button';
  
  // Marker Interactions
  driverMarkerTap: 'Show driver info popup';
  pickupMarkerTap: 'Show pickup address';
  destinationMarkerTap: 'Show destination address';
}
```

**Bottom Sheet Swipe:**
```typescript
interface BottomSheetStates {
  collapsed: {
    height: '128px',
    gesture: 'Swipe up to expand',
  };
  halfExpanded: {
    height: '50vh',
    gesture: 'Swipe up/down',
  };
  fullyExpanded: {
    height: '80vh',
    gesture: 'Swipe down to collapse',
  };
}
```

**Location Update Animation:**
```typescript
const driverMarkerAnimation = {
  // Smooth marker movement
  duration: 1000,  // 1 second
  easing: 'ease-out',
  
  // Rotation animation
  rotate: {
    duration: 500,
    easing: 'ease-in-out',
  },
};
```

## Technical Architecture

### Component Structure

```
src/app/
├── bookings/
│   └── [bookingId]/
│       └── track/
│           ├── page.tsx                      # Tracking page ⬜
│           ├── loading.tsx                   # Map loading state ⬜
│           └── components/
│               ├── TrackingMap.tsx           # Main map component ⬜
│               ├── DriverMarker.tsx          # Driver car marker ⬜
│               ├── RoutePolyline.tsx         # Route visualization ⬜
│               ├── MapControls.tsx           # Zoom, recenter controls ⬜
│               ├── DriverInfoCard.tsx        # Bottom sheet/sidebar ⬜
│               ├── ETADisplay.tsx            # ETA prominent display ⬜
│               ├── TripTimeline.tsx          # Progress timeline ⬜
│               ├── StatusBanner.tsx          # Proximity/status alerts ⬜
│               ├── DriverContactActions.tsx  # Call/message buttons ⬜
│               ├── ConnectionIndicator.tsx   # WS connection status ⬜
│               └── LocationFallback.tsx      # No location state ⬜
└── api/
    └── tracking/
        ├── [bookingId]/
        │   ├── route.ts                      # GET tracking info ⬜
        │   └── eta/
        │       └── route.ts                  # GET ETA calculation ⬜
        ├── stream/
        │   └── route.ts                      # WebSocket handler ⬜
        └── driver-location/
            └── route.ts                      # POST driver location ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface TrackingStore {
  // Current Tracking Session
  activeTracking: {
    bookingId: string | null;
    isTracking: boolean;
    
    driver: {
      id: string;
      name: string;
      phone: string;
      vehicle: VehicleInfo;
      currentLocation: LocationData | null;
      lastLocationUpdate: Date | null;
    } | null;
    
    locations: {
      pickup: LatLng;
      destination: LatLng;
      userLocation?: LatLng;
    } | null;
    
    eta: {
      seconds: number;
      text: string;
      lastCalculated: Date;
    } | null;
    
    tripStatus: TripStatus;
  };
  
  // WebSocket State
  websocket: {
    isConnected: boolean;
    connectionQuality: 'good' | 'poor' | 'disconnected';
    lastHeartbeat: Date | null;
    reconnectAttempts: number;
  };
  
  // UI State
  ui: {
    mapCenter: LatLng | null;
    mapZoom: number;
    isBottomSheetExpanded: boolean;
    showProximityAlert: boolean;
    activeStatusBanner: string | null;
  };
  
  // Actions
  initializeTracking: (bookingId: string) => Promise<void>;
  updateDriverLocation: (location: LocationData) => void;
  updateETA: (eta: ETAData) => void;
  updateTripStatus: (status: TripStatus) => void;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  toggleBottomSheet: () => void;
  recenterMap: () => void;
}
```

**Local Component State:**
```typescript
// TrackingMap.tsx
interface TrackingMapState {
  map: google.maps.Map | null;
  markers: {
    driver: google.maps.Marker | null;
    pickup: google.maps.Marker | null;
    destination: google.maps.Marker | null;
  };
  polyline: google.maps.Polyline | null;
  isMapLoaded: boolean;
  mapError: string | null;
}

// DriverInfoCard.tsx
interface DriverInfoCardState {
  sheetState: 'collapsed' | 'half' | 'expanded';
  isDragging: boolean;
  dragStartY: number;
}

// ETADisplay.tsx
interface ETADisplayState {
  formattedETA: string;
  isUpdating: boolean;
  lastUpdateText: string;  // "Updated 5 seconds ago"
}
```

### Database Schema Updates

```prisma
model Booking {
  // ... existing fields
  
  // Tracking Fields
  trackingEnabled  Boolean   @default(true)
  trackingStartedAt DateTime?
  trackingEndedAt   DateTime?
  
  // Driver Assignment
  assignedDriverId String?
  assignedDriver   User?     @relation("AssignedDriver", fields: [assignedDriverId], references: [id])
  driverAssignedAt DateTime?
  
  @@index([assignedDriverId])
}

model DriverLocation {
  id                String   @id @default(cuid())
  driverId          String
  driver            User     @relation(fields: [driverId], references: [id])
  bookingId         String?
  booking           Booking? @relation(fields: [bookingId], references: [id])
  
  // Location Data
  latitude          Float
  longitude         Float
  heading           Float?   // Direction in degrees (0-360)
  speed             Float?   // Speed in km/h
  accuracy          Float    // Accuracy in meters
  
  // Metadata
  capturedAt        DateTime
  createdAt         DateTime @default(now())
  
  @@index([driverId, capturedAt])
  @@index([bookingId])
}

model TrackingSession {
  id                String   @id @default(cuid())
  bookingId         String   @unique
  booking           Booking  @relation(fields: [bookingId], references: [id])
  
  passengerId       String
  passenger         User     @relation(fields: [passengerId], references: [id])
  
  driverId          String
  driver            User     @relation(fields: [driverId], references: [id])
  
  startedAt         DateTime @default(now())
  endedAt           DateTime?
  
  // Analytics
  locationUpdatesCount Int   @default(0)
  avgUpdateInterval Float?  // Average seconds between updates
  
  @@index([bookingId])
  @@index([passengerId])
}
```

### API Integration Schema

**Google Maps Integration:**
```typescript
// Load Google Maps API
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['places', 'geometry', 'directions'],
});

// Initialize Map
async function initializeMap(container: HTMLElement) {
  const { Map } = await loader.importLibrary('maps');
  
  const map = new Map(container, {
    center: { lat: 0, lng: 0 },
    zoom: 15,
    styles: customMapStyles,  // Custom styling
    disableDefaultUI: true,
    gestureHandling: 'greedy',
  });
  
  return map;
}

// Calculate ETA with Directions API
async function calculateETA(
  origin: LatLng,
  destination: LatLng
): Promise<ETAData> {
  const directionsService = new google.maps.DirectionsService();
  
  const result = await directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS,
    },
  });
  
  const route = result.routes[0];
  const leg = route.legs[0];
  
  return {
    seconds: leg.duration?.value || 0,
    minutes: Math.ceil((leg.duration?.value || 0) / 60),
    text: leg.duration?.text || '',
    distance: {
      meters: leg.distance?.value || 0,
      text: leg.distance?.text || '',
    },
    polyline: route.overview_polyline,
  };
}
```

**WebSocket Integration (Socket.IO):**
```typescript
// Client-side
import { io, Socket } from 'socket.io-client';

class TrackingWebSocket {
  private socket: Socket | null = null;
  
  connect(authToken: string, bookingId: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token: authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket?.emit('subscribe', { bookingId });
    });
    
    this.socket.on('location_update', (data: LocationUpdate) => {
      // Handle location update
    });
    
    this.socket.on('proximity_alert', (data: ProximityAlert) => {
      // Show notification
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
}
```

## Implementation Requirements

### Core Components

#### 1. TrackingMap.tsx ⬜
**Purpose**: Google Maps integration with markers

**Features**:
- Map initialization and rendering
- Driver marker with rotation
- Pickup/destination markers
- Route polyline display
- Auto-centering and bounds adjustment

#### 2. DriverInfoCard.tsx ⬜
**Purpose**: Swipeable bottom sheet with driver details

**Features**:
- Collapsible card (3 states)
- Swipe gesture handling
- Driver information display
- Contact action buttons
- Trip timeline

#### 3. ETADisplay.tsx ⬜
**Purpose**: Prominent ETA visualization

**Features**:
- Large, readable ETA text
- Real-time updates
- Proximity states (nearby, arrived)
- Update timestamp

#### 4. StatusBanner.tsx ⬜
**Purpose**: In-app notifications for status changes

**Features**:
- Proximity alerts
- Connection status
- Trip status updates
- Auto-dismiss after delay

#### 5. ConnectionIndicator.tsx ⬜
**Purpose**: WebSocket connection health display

**Features**:
- Connection quality indicator
- Reconnection status
- Offline mode message

### Custom Hooks

#### useDriverTracking() ⬜
```typescript
interface UseDriverTrackingReturn {
  isTracking: boolean;
  driverLocation: LocationData | null;
  eta: ETAData | null;
  tripStatus: TripStatus;
  error: string | null;
  
  startTracking: (bookingId: string) => Promise<void>;
  stopTracking: () => void;
  refreshETA: () => Promise<void>;
}
```

#### useWebSocketTracking() ⬜
```typescript
interface UseWebSocketTrackingReturn {
  isConnected: boolean;
  connectionQuality: ConnectionQuality;
  lastUpdate: Date | null;
  
  connect: (authToken: string, bookingId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  
  onLocationUpdate: (callback: (data: LocationUpdate) => void) => void;
  onProximityAlert: (callback: (data: ProximityAlert) => void) => void;
  onStatusChange: (callback: (data: StatusUpdate) => void) => void;
}
```

#### useGoogleMaps() ⬜
```typescript
interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: Error | null;
  
  createMap: (container: HTMLElement, options: MapOptions) => google.maps.Map;
  createMarker: (options: MarkerOptions) => google.maps.Marker;
  createPolyline: (options: PolylineOptions) => google.maps.Polyline;
  calculateETA: (origin: LatLng, destination: LatLng) => Promise<ETAData>;
}
```

### Utility Functions

#### src/lib/tracking/location-utils.ts ⬜
```typescript
export function calculateDistance(
  point1: LatLng,
  point2: LatLng
): number;  // Returns meters

export function isNearby(
  driverLocation: LatLng,
  targetLocation: LatLng,
  radiusMeters: number = 500
): boolean;

export function interpolateLocation(
  from: LocationData,
  to: LocationData,
  progress: number  // 0 to 1
): LatLng;

export function smoothMarkerMovement(
  marker: google.maps.Marker,
  newPosition: LatLng,
  durationMs: number
): void;
```

#### src/lib/tracking/eta-calculator.ts ⬜
```typescript
export async function calculateETAWithTraffic(
  origin: LatLng,
  destination: LatLng
): Promise<ETAData>;

export function formatETAText(seconds: number): string;

export function getETAUpdateFrequency(
  distanceMeters: number
): number;  // Returns seconds between updates
```

## Acceptance Criteria

### Functional Requirements

#### 1. Real-Time Location Tracking ⬜
- [x] Driver location updates every 5-10 seconds
- [x] Marker animates smoothly between positions
- [x] Marker rotates based on heading
- [x] Map auto-centers when driver moves
- [x] Location accuracy displayed

#### 2. ETA Calculation ⬜
- [x] ETA calculated using Google Directions API
- [x] ETA updates with each location change
- [x] Traffic conditions considered
- [x] ETA formatted as human-readable text
- [x] ETA accuracy within ±5 minutes

#### 3. Proximity Notifications ⬜
- [x] Alert shown when driver <500m from pickup
- [x] "Driver arrived" notification at pickup
- [x] Notifications persist for 10 seconds
- [x] Audio notification (optional)
- [x] Vibration on mobile (optional)

#### 4. Connection Handling ⬜
- [x] WebSocket auto-reconnects on disconnect
- [x] Shows "Reconnecting..." during outage
- [x] Falls back to polling if WebSocket fails
- [x] Shows "Waiting for location..." if no updates
- [x] Recovers gracefully after network issues

#### 5. Map Features ⬜
- [x] Shows pickup and destination markers
- [x] Route displayed as polyline (optional)
- [x] Zoom in/out controls
- [x] Recenter to driver location
- [x] User location marker (if granted permission)

### Non-Functional Requirements

#### Performance ⬜
- [x] Map loads <2 seconds
- [x] Location updates render <200ms
- [x] ETA calculation <1 second
- [x] WebSocket connection <1 second
- [x] Smooth animations (60 FPS)

#### Security ⬜
- [x] Only booking owner can track
- [x] WebSocket authenticated with JWT
- [x] Location data encrypted (WSS)
- [x] No location stored after trip

#### Accessibility ⬜
- [x] Screen reader announces location updates
- [x] ETA updates announced
- [x] Map controls keyboard accessible
- [x] High contrast mode support

## Modified Files

```
src/app/
├── bookings/[bookingId]/track/
│   ├── page.tsx                                      ⬜
│   ├── loading.tsx                                   ⬜
│   └── components/
│       ├── TrackingMap.tsx                           ⬜
│       ├── DriverMarker.tsx                          ⬜
│       ├── RoutePolyline.tsx                         ⬜
│       ├── MapControls.tsx                           ⬜
│       ├── DriverInfoCard.tsx                        ⬜
│       ├── ETADisplay.tsx                            ⬜
│       ├── TripTimeline.tsx                          ⬜
│       ├── StatusBanner.tsx                          ⬜
│       ├── DriverContactActions.tsx                  ⬜
│       ├── ConnectionIndicator.tsx                   ⬜
│       └── LocationFallback.tsx                      ⬜
├── api/tracking/
│   ├── [bookingId]/
│   │   ├── route.ts                                  ⬜
│   │   └── eta/route.ts                              ⬜
│   ├── stream/route.ts                               ⬜
│   └── driver-location/route.ts                      ⬜
├── lib/
│   ├── tracking/
│   │   ├── location-utils.ts                         ⬜
│   │   ├── eta-calculator.ts                         ⬜
│   │   └── websocket-client.ts                       ⬜
│   └── hooks/
│       ├── useDriverTracking.ts                      ⬜
│       ├── useWebSocketTracking.ts                   ⬜
│       └── useGoogleMaps.ts                          ⬜
└── types/tracking.ts                                 ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Foundation (Week 1) ⬜
- [ ] Google Maps API setup
- [ ] WebSocket infrastructure setup
- [ ] Database schema for location tracking
- [ ] Type definitions

### Phase 2: Map & Markers (Week 1-2) ⬜
- [ ] TrackingMap component
- [ ] Driver marker with rotation
- [ ] Pickup/destination markers
- [ ] Map controls (zoom, recenter)

### Phase 3: Real-Time Updates (Week 2-3) ⬜
- [ ] WebSocket client integration
- [ ] Location update handling
- [ ] Smooth marker animations
- [ ] ETA calculation

### Phase 4: UI & Notifications (Week 3) ⬜
- [ ] Driver info card (bottom sheet)
- [ ] ETA display
- [ ] Proximity alerts
- [ ] Connection indicators

### Phase 5: Testing & Optimization (Week 3-4) ⬜
- [ ] Location update testing
- [ ] WebSocket reliability testing
- [ ] Performance optimization
- [ ] E2E tracking scenarios

## Dependencies

- **Google Maps API**: JavaScript API + Directions API
- **WebSocket Server**: Socket.IO or Pusher/Ably
- **Story 33-36**: Booking infrastructure
- **Driver App**: Location sharing enabled

## Risk Assessment

### Technical Risks

#### Risk 1: WebSocket Reliability
- **Impact**: Critical (no real-time updates)
- **Mitigation**: HTTP polling fallback
- **Contingency**: Manual refresh option

#### Risk 2: Battery Drain (Driver App)
- **Impact**: Medium (driver complaints)
- **Mitigation**: Configurable update intervals
- **Contingency**: Reduce update frequency

#### Risk 3: Location Accuracy
- **Impact**: Medium (poor UX)
- **Mitigation**: Filter low-accuracy updates
- **Contingency**: Show accuracy radius

## Testing Strategy

```typescript
describe('Driver Tracking', () => {
  it('displays driver location on map', async () => {
    // Test marker rendering
  });
  
  it('updates marker when location changes', async () => {
    // Test real-time updates
  });
  
  it('shows proximity alert when nearby', async () => {
    // Test notification
  });
  
  it('handles WebSocket disconnection gracefully', async () => {
    // Test fallback
  });
  
  it('calculates accurate ETA', async () => {
    // Test ETA accuracy
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 weeks (1 developer)
