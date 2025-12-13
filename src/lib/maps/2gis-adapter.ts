/**
 * 2GIS Maps API Adapter
 * Provides integration with 2GIS Maps API for Kazakhstan and Central Asia
 * Documentation: https://docs.2gis.com/en/api/
 */

export interface TwoGISConfig {
  apiKey: string;
  region?: string; // e.g., 'kz', 'kg', 'uz'
}

export interface TwoGISCoordinates {
  lat: number;
  lon: number;
}

export interface TwoGISSuggestion {
  id: string;
  name: string;
  address: string;
  point: TwoGISCoordinates;
  type: string;
}

export interface TwoGISPlace {
  id: string;
  name: string;
  address: string;
  point: TwoGISCoordinates;
  type: string;
  building?: {
    id: string;
    name?: string;
  };
}

export interface TwoGISRoute {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline or array of coordinates
  type: string;
}

export interface TwoGISDirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: Array<[number, number]>; // [lon, lat] pairs
    type: string;
  }>;
}

/**
 * 2GIS Maps SDK Loader
 */
export class TwoGISLoader {
  private static instance: TwoGISLoader | null = null;
  private loadPromise: Promise<void> | null = null;
  private apiKey: string;
  private loaded: boolean = false;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(apiKey: string): TwoGISLoader {
    if (!TwoGISLoader.instance) {
      TwoGISLoader.instance = new TwoGISLoader(apiKey);
    }
    return TwoGISLoader.instance;
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Load 2GIS Maps API script
      const script = document.createElement('script');
      script.src = `https://maps.api.2gis.com/2.0/loader.js?pkg=full`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Initialize 2GIS with API key
        if (typeof window !== 'undefined' && (window as any).DG) {
          (window as any).DG.then(() => {
            this.loaded = true;
            resolve();
          });
        } else {
          reject(new Error('2GIS Maps API failed to load'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load 2GIS Maps API script'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

/**
 * 2GIS Geocoding Service
 */
export class TwoGISGeocoder {
  private apiKey: string;
  private baseUrl = 'https://catalog.api.2gis.com/3.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for places by query text
   */
  async search(query: string, options?: {
    region?: string;
    location?: TwoGISCoordinates;
    radius?: number; // in meters
    limit?: number;
  }): Promise<TwoGISSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      key: this.apiKey,
      fields: 'items.point,items.address,items.name',
      limit: (options?.limit || 10).toString(),
    });

    if (options?.region) {
      params.append('region_id', options.region);
    }

    if (options?.location) {
      params.append('location', `${options.location.lon},${options.location.lat}`);
    }

    if (options?.radius) {
      params.append('radius', options.radius.toString());
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/items?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`2GIS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result?.items) {
        return [];
      }

      return data.result.items.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        address: item.address_name || item.full_name || '',
        point: {
          lat: item.point?.lat || 0,
          lon: item.point?.lon || 0,
        },
        type: item.type || 'place',
      }));
    } catch (error) {
      console.error('2GIS search error:', error);
      throw error;
    }
  }

  /**
   * Get place details by ID
   */
  async getPlaceById(placeId: string): Promise<TwoGISPlace | null> {
    const params = new URLSearchParams({
      id: placeId,
      key: this.apiKey,
      fields: 'items.point,items.address,items.name,items.building',
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/items/byid?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`2GIS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result?.items || data.result.items.length === 0) {
        return null;
      }

      const item = data.result.items[0];
      return {
        id: item.id,
        name: item.name || '',
        address: item.address_name || item.full_name || '',
        point: {
          lat: item.point?.lat || 0,
          lon: item.point?.lon || 0,
        },
        type: item.type || 'place',
        building: item.building,
      };
    } catch (error) {
      console.error('2GIS place details error:', error);
      return null;
    }
  }

  /**
   * Reverse geocoding: get place from coordinates
   */
  async reverseGeocode(coordinates: TwoGISCoordinates): Promise<TwoGISPlace | null> {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lon: coordinates.lon.toString(),
      key: this.apiKey,
      fields: 'items.point,items.address,items.name',
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/items/geocode?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`2GIS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result?.items || data.result.items.length === 0) {
        return null;
      }

      const item = data.result.items[0];
      return {
        id: item.id,
        name: item.name || '',
        address: item.address_name || item.full_name || '',
        point: {
          lat: item.point?.lat || coordinates.lat,
          lon: item.point?.lon || coordinates.lon,
        },
        type: item.type || 'place',
      };
    } catch (error) {
      console.error('2GIS reverse geocode error:', error);
      return null;
    }
  }
}

/**
 * 2GIS Directions Service
 */
export class TwoGISDirections {
  private apiKey: string;
  private baseUrl = 'https://catalog.api.2gis.com/carrouting/6.0.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Calculate route between two points
   */
  async getRoute(
    origin: TwoGISCoordinates,
    destination: TwoGISCoordinates,
    options?: {
      waypoints?: TwoGISCoordinates[];
      type?: 'car' | 'taxi' | 'truck';
    }
  ): Promise<TwoGISDirectionsResponse | null> {
    const points = [
      origin,
      ...(options?.waypoints || []),
      destination,
    ];

    const params = new URLSearchParams({
      key: this.apiKey,
      type: options?.type || 'car',
    });

    // Add route points
    points.forEach((point, index) => {
      params.append('points', `${point.lon},${point.lat}`);
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/global?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`2GIS Directions API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        return null;
      }

      return {
        routes: data.result.map((route: any) => ({
          distance: route.total_distance || 0,
          duration: route.total_duration || 0,
          geometry: route.points || [],
          type: route.type || 'car',
        })),
      };
    } catch (error) {
      console.error('2GIS directions error:', error);
      return null;
    }
  }
}

/**
 * Main 2GIS Service - combines all functionality
 */
export class TwoGISService {
  private geocoder: TwoGISGeocoder;
  private directions: TwoGISDirections;
  private loader: TwoGISLoader;

  constructor(apiKey: string) {
    this.geocoder = new TwoGISGeocoder(apiKey);
    this.directions = new TwoGISDirections(apiKey);
    this.loader = TwoGISLoader.getInstance(apiKey);
  }

  async loadMaps(): Promise<void> {
    return this.loader.load();
  }

  isLoaded(): boolean {
    return this.loader.isLoaded();
  }

  getGeocoder(): TwoGISGeocoder {
    return this.geocoder;
  }

  getDirections(): TwoGISDirections {
    return this.directions;
  }
}
