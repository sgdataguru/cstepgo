// Navigation types for GPS integration

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RoutePoint extends Coordinates {
  address?: string;
  name?: string;
}

export interface NavigationRoute {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string; // Encoded polyline
  steps: RouteStep[];
  bounds: RouteBounds;
  overview: string; // Human-readable overview
}

export interface RouteStep {
  distance: number; // in meters
  duration: number; // in seconds
  instruction: string;
  maneuver?: string; // turn-left, turn-right, etc.
  startLocation: Coordinates;
  endLocation: Coordinates;
  polyline: string;
}

export interface RouteBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface ETAInfo {
  estimatedArrival: Date;
  remainingDistance: number; // in meters
  remainingDuration: number; // in seconds
  currentSpeed?: number; // in km/h
  trafficCondition?: 'light' | 'moderate' | 'heavy';
}

export interface NavigationUpdate {
  currentLocation: Coordinates;
  heading?: number; // Direction in degrees
  speed?: number; // Speed in km/h
  accuracy?: number; // GPS accuracy in meters
  timestamp: Date;
  eta: ETAInfo;
  nextStep?: RouteStep;
}

export interface TripNavigation {
  tripId: string;
  origin: RoutePoint;
  destination: RoutePoint;
  waypoints?: RoutePoint[];
  route: NavigationRoute;
  currentLocation?: Coordinates;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
}

export interface NavigationPreferences {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  optimizeRoute?: boolean;
}
