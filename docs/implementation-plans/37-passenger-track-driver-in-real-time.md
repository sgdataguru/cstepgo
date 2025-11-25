# 37 - Passenger Track Driver in Real Time – Implementation Plan (2GIS Map Integration)

## Project Context

**Technical Stack**

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, WebSocket/Socket.IO (or equivalent)  
- **Maps / Routing**: **2GIS MapGL JavaScript API**  
- **Infrastructure**: Vercel (hosting), dedicated WebSocket server (Pusher/Ably/self-hosted)

> 2GIS API key: `dbd7eb45-5a3c-49de-a539-af4213db3a92`  
> Recommended: expose as `NEXT_PUBLIC_2GIS_API_KEY` instead of hard-coding in code.

---

## User Story

**As a** passenger,  
**I want** to track my driver’s live location and ETA on a map,  
**so that** I know when to be ready and feel confident about my ride.

---

## Preconditions

- Passenger has a **CONFIRMED** booking.
- Booking has an assigned driver (driver assignment already done by earlier stories).
- Driver app/portal is sending regular location updates.
- Booking/payment/management flows for:
  - `33 – Passenger Book Private Trip`
  - `34 – Passenger Book Shared Ride Seat`
  - `35 – Passenger Pay for Booking Online`
  - `36 – Passenger Manage Upcoming Bookings`
  are implemented and stable.
- **2GIS MapGL** is configured in the frontend with a valid API key.
- WebSocket/SSE infrastructure is available for streaming live location.

---

## Business Requirements

- **BR-1 – Real-time Visibility**  
  Passengers can see driver location in near real-time.
  - Location updates within **5–10 seconds**.
  - At least **80%** of passengers use tracking on active trips.

- **BR-2 – ETA Accuracy**  
  ETA shown on screen must be useful and updated frequently.
  - ETA recalculated on each meaningful location update.
  - ETA mostly within **±5 minutes** for 90% of rides.

- **BR-3 – Proximity Alerts**  
  Surface a “driver is nearby / driver has arrived” signal.
  - Proximity trigger when driver enters a configurable radius (e.g. 300–500m).
  - Alerts surfacing within ~500ms of detection.

- **BR-4 – Graceful Degradation**  
  Tracking must fail safely, not confusingly.
  - Clear fallback messages when location not available.
  - “Waiting for driver location…” state within 3s when data is missing.

---

## Technical Specifications

### Integration Points

- **2GIS MapGL JavaScript API**  
  - Rendering the map.
  - Displaying driver, pickup, and destination markers.
  - Optional: integration with 2GIS routing/directions APIs for ETA and route polyline.

- **WebSocket / SSE**  
  - Real-time channel for driver location & trip status.
  - Authenticated with JWT and booking context.

- **Driver Geolocation (Backend Feed)**  
  - Driver app / portal sends `lat/lng` + optional heading/speed to backend.
  - Backend validates and broadcasts updates to subscribed passenger(s).

- **Notifications (In-app)**  
  - UI banners or toast messages for:
    - Driver nearby.
    - Driver arrived.
    - Connection lost / reconnecting.

- **Database (Optional Analytics)**  
  - Persist location history per trip for analytics/debugging (optional, configurable for privacy).

### Security Requirements

- Only **the booking owner** (and authorized internal roles) can see driver location for that booking.
- Live tracking available only while trip is **active** (ASSIGNED → EN_ROUTE → AT_PICKUP → IN_PROGRESS).
- WebSocket connections must:
  - Be authenticated with a **JWT**.
  - Verify `bookingId` and user/driver pairing.
- Location updates:
  - Rate-limited (e.g. 1 update per 5 seconds per driver).
  - Transmitted over WSS/HTTPS.
- Location history, if stored, is:
  - Retained only for a defined window (or not at all in strict privacy mode).
  - Never exposed to other passengers or drivers unrelated to the trip.

---

## API Endpoints

### 1. `GET /api/bookings/:bookingId/tracking`

Fetch initial tracking snapshot and connection details.

**Response (example TypeScript type):**

```ts
interface TrackingInfoResponse {
  bookingId: string;
  canTrack: boolean; // true if driver assigned & trip in a trackable status

  driver: {
    id: string;
    name: string;
    phone: string;
    currentLocation?: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp: string;
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

  eta?: {
    seconds: number;
    text: string;       // e.g. "15 minutes"
    lastUpdated: string;
  };

  tripStatus:
    | 'ASSIGNED'
    | 'EN_ROUTE_TO_PICKUP'
    | 'AT_PICKUP'
    | 'IN_PROGRESS'
    | 'COMPLETED';

  wsConfig: {
    url: string;        // WebSocket endpoint
    channel: string;    // Channel/room for this booking
    authToken: string;  // JWT for WS auth
  };
}
2. WS /api/tracking/stream
WebSocket endpoint for real-time updates.

Client connection example:

ts
Copy code
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
  auth: {
    token: wsAuthToken,
    bookingId: bookingId,
  },
});

socket.on('connect', () => {
  socket.emit('subscribe', { bookingId });
});
Message Types:

ts
Copy code
interface LocationUpdate {
  type: 'location_update';
  data: {
    driverId: string;
    location: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp: string;
    };
    eta?: {
      seconds: number;
      text: string;
    };
  };
}

interface StatusUpdate {
  type: 'status_update';
  data: {
    tripStatus: string;  // matches Booking/Trip status enum
    message: string;
  };
}

interface ProximityAlert {
  type: 'proximity_alert';
  data: {
    distance: number;     // meters
    message: string;      // e.g. "Driver is nearby"
  };
}

interface ConnectionStatus {
  type: 'connection_status';
  data: {
    isOnline: boolean;
    lastSeen?: string;
  };
}
3. POST /api/tracking/driver-location (Driver-facing)
Used by driver app or driver portal to push location updates.

Request:

ts
Copy code
interface UpdateLocationRequest {
  bookingId: string;
  location: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy: number;
    timestamp: string;
  };
}
Response:

ts
Copy code
interface UpdateLocationResponse {
  success: boolean;
  broadcast: boolean;  // true if forwarded to passenger
  eta?: {
    seconds: number;
    text: string;
  };
}
4. GET /api/tracking/:bookingId/eta
Optional endpoint to (re)calculate ETA using a 2GIS routing API integration (or server-side logic if implemented).

ts
Copy code
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
    polyline: string;  // Encoded polyline for route visualization
  };
  calculatedAt: string;
}
Design Specifications
Tracking Page – UX Layout
URL: /bookings/[bookingId]/track

High-level layout (mobile-first):

Full-screen 2GIS map as the background:

Driver marker (car icon, rotated with heading).

Pickup marker.

Destination marker.

Optional route polyline representing path.

Top bar overlay:

Back button.

Trip status pill (e.g., “On the way”, “Arrived”, “In progress”).

Bottom sheet / sidebar (depending on viewport):

Collapsed: Driver photo, name, ETA, distance.

Expanded: Full driver and trip details, contact options, trip timeline.

Status banners (top overlay):

“Driver is nearby”.

“Driver has arrived”.

“Waiting for driver location…”.

“Connection lost. Reconnecting…”.

Map visual styling remains aligned with existing StepperGO branding; only the provider changes (2GIS instead of Google).

2GIS Integration Examples
Basic 2GIS Map Initialization (Vanilla Example)
Reference example (adapted from your snippet):

html
Copy code
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>2GIS Map API Example</title>
    <script src="https://mapgl.2gis.com/api/js/v1"></script>
  </head>
  <body>
    <div id="container" style="width: 100%; height: 100vh;"></div>

    <script>
      const map = new mapgl.Map('container', {
        center: [55.187609, 25.141736],
        zoom: 16,
        pitch: 40,
        rotation: -45,
        key: 'dbd7eb45-5a3c-49de-a539-af4213db3a92', // Use env var in real app
      });

      // Example switching style
      // map.setStyleById('e05ac437-fcc2-4845-ad74-b1de9ce07555'); // dark
    </script>
  </body>
</html>
2GIS Map Integration in Next.js (Conceptual)
In the React/Next.js tracking page we’ll:

Load the 2GIS MapGL script (via <Script> or dynamic loader).

Initialize mapgl.Map in useEffect.

Store map instance in component state or ref.

Add markers for driver/pickup/destination.

Conceptual TS code:

ts
Copy code
// TrackingMap.tsx (simplified pseudo-code)
import { useEffect, useRef } from 'react';

declare const mapgl: any; // or create a proper type definition

export function TrackingMap({ driverLocation, pickup, destination }: {
  driverLocation?: { lat: number; lng: number };
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || typeof mapgl === 'undefined') return;

    if (!mapRef.current) {
      mapRef.current = new mapgl.Map(containerRef.current, {
        center: [pickup.lng, pickup.lat],
        zoom: 14,
        key: process.env.NEXT_PUBLIC_2GIS_API_KEY!,
      });

      // TODO: add pickup & destination markers
    }

    return () => {
      mapRef.current && mapRef.current.destroy && mapRef.current.destroy();
    };
  }, [pickup.lat, pickup.lng]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const coords: [number, number] = [driverLocation.lng, driverLocation.lat];

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapgl.Marker(mapRef.current, {
        coordinates: coords,
      });
    } else {
      driverMarkerRef.current.setCoordinates(coords);
    }

    // Optionally adjust center/zoom here
  }, [driverLocation?.lat, driverLocation?.lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}
Exact 2GIS routing/ETA utilities can be implemented as a backend service or external call where available.

Technical Architecture
Next.js Structure
txt
Copy code
src/app/
├── bookings/
│   └── [bookingId]/
│       └── track/
│           ├── page.tsx                      # Tracking page
│           ├── loading.tsx                   # Skeleton/loading
│           └── components/
│               ├── TrackingMap.tsx           # 2GIS map wrapper
│               ├── DriverInfoCard.tsx        # Bottom sheet/sidebar
│               ├── ETADisplay.tsx            # ETA display
│               ├── StatusBanner.tsx          # Status/proximity banners
│               ├── ConnectionIndicator.tsx   # WS connection status
│               └── LocationFallback.tsx      # No-location states
└── api/
    └── tracking/
        ├── [bookingId]/route.ts              # GET tracking info
        ├── [bookingId]/eta/route.ts          # Optional ETA endpoint
        ├── stream/route.ts                   # WS handler
        └── driver-location/route.ts          # Driver location ingestion
State Management (Concept)
Global useTrackingStore (Zustand or similar):

ts
Copy code
interface TrackingStore {
  activeTracking: {
    bookingId: string | null;
    driver: {
      id: string;
      name: string;
      vehicle: any;
      currentLocation: { lat: number; lng: number } | null;
      lastLocationUpdate: string | null;
    } | null;
    pickup: { lat: number; lng: number; address: string } | null;
    destination: { lat: number; lng: number; address: string } | null;
    eta: { seconds: number; text: string; lastCalculated: string } | null;
    tripStatus: string;
  };

  websocket: {
    isConnected: boolean;
    connectionQuality: 'good' | 'poor' | 'disconnected';
    lastHeartbeat: string | null;
  };

  ui: {
    isBottomSheetExpanded: boolean;
    showProximityAlert: boolean;
    activeStatusBanner: string | null;
  };

  initializeTracking(bookingId: string): Promise<void>;
  updateDriverLocation(location: { lat: number; lng: number }): void;
  updateETA(eta: { seconds: number; text: string }): void;
  updateTripStatus(status: string): void;
  connectWebSocket(authToken: string, bookingId: string): Promise<void>;
  disconnectWebSocket(): void;
  toggleBottomSheet(): void;
}
Database Schema (Additions)
prisma
Copy code
model Booking {
  id               String   @id @default(cuid())
  // ... existing fields

  trackingEnabled  Boolean   @default(true)
  trackingStartedAt DateTime?
  trackingEndedAt   DateTime?

  assignedDriverId String?
  assignedDriver   User?     @relation("AssignedDriver", fields: [assignedDriverId], references: [id])

  @@index([assignedDriverId])
}

model DriverLocation {
  id         String   @id @default(cuid())
  driverId   String
  driver     User     @relation(fields: [driverId], references: [id])
  bookingId  String?
  booking    Booking? @relation(fields: [bookingId], references: [id])

  latitude   Float
  longitude  Float
  heading    Float?
  speed      Float?
  accuracy   Float
  capturedAt DateTime @default(now())

  @@index([driverId, capturedAt])
  @@index([bookingId])
}
TrackingSession or deeper analytics models can remain optional.

Core Components & Hooks
Components
TrackingMap.tsx

Wraps 2GIS MapGL map.

Handles initializing mapgl.Map, adding/removing markers, and recentering.

DriverInfoCard.tsx

Shows driver details, ETA, and basic trip info.

Collapsible/expandable bottom sheet on mobile; sidebar on desktop.

ETADisplay.tsx

Prominent ETA + “distance remaining” text with state changes (nearby, arrived, unknown).

StatusBanner.tsx

Shows short-lived status banners for proximity, arrival, connection issues.

ConnectionIndicator.tsx

Visual indicator (dot/label) for WebSocket connectivity.

Hooks
useDriverTracking()

ts
Copy code
interface UseDriverTrackingReturn {
  isTracking: boolean;
  driverLocation: { lat: number; lng: number } | null;
  eta: { seconds: number; text: string } | null;
  tripStatus: string;
  error: string | null;

  startTracking: (bookingId: string) => Promise<void>;
  stopTracking: () => void;
  refreshETA: () => Promise<void>;
}
useWebSocketTracking()

ts
Copy code
interface UseWebSocketTrackingReturn {
  isConnected: boolean;
  lastUpdate: string | null;

  connect: (authToken: string, bookingId: string) => void;
  disconnect: () => void;

  onLocationUpdate: (cb: (data: LocationUpdate) => void) => void;
  onProximityAlert: (cb: (data: ProximityAlert) => void) => void;
  onStatusChange: (cb: (data: StatusUpdate) => void) => void;
}
use2GISMap() (optional helper)

ts
Copy code
interface Use2GISMapReturn {
  isLoaded: boolean;
  loadError: Error | null;
  initMap: (container: HTMLElement, center: [number, number]) => any; // mapgl.Map
}
Acceptance Criteria
Functional
Real-Time Location

Passenger sees driver marker moving on a 2GIS map for active trips.

Location updates at least every 5–10 seconds, with smooth marker transitions.

ETA

ETA displayed and refreshed on location changes.

ETA is human-readable (e.g. “12 minutes away”).

ETA reasonably accurate in typical city conditions (within ±5 mins for most trips).

Proximity & Arrival

“Driver is nearby” banner appears when driver within radius (e.g. < 500m).

“Driver has arrived” shown when driver at/very close to pickup coordinates.

Connection Handling

WebSocket auto-reconnects.

UI reflects “reconnecting” / “waiting for location” states.

Tracking gracefully stops when trip is completed or cancelled.

Non-Functional
Map renders in < 2 seconds over typical connections.

WebSocket connection / reconnection feels responsive.

All map & tracking actions stay responsive on mid-range mobile devices.

Security: Only the booking owner can access /bookings/[bookingId]/track and the associated WS channel.

Implementation Phases (High Level)
Foundation

Configure 2GIS MapGL in the project.

Add WebSocket tracking endpoint + auth.

Extend DB (if needed) with DriverLocation.

Map + UI

Implement TrackingMap with 2GIS.

Add markers and basic driver movement.

Implement DriverInfoCard, ETADisplay, and StatusBanner.

Real-Time Wiring

Hook up useWebSocketTracking().

Receive location updates and update map/ETA.

Implement proximity detection and banners.

Hardening

Add error states, loading states, and fallback modes.

Add tests (unit + basic E2E) for tracking flows.

Verify with both private and shared bookings from stories 33 and 34.

Status: Ready for development with 2GIS MapGL
Estimated Effort: ~3–4 weeks (1 dev) depending on routing/ETA depth.