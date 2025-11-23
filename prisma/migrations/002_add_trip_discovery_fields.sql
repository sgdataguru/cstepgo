-- Migration for Driver Trip Discovery System
-- Adds geographic extensions and trip discovery fields

-- Enable PostGIS extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Extend trips table for driver discovery
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_discovery_radius INTEGER DEFAULT 10;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_earnings DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'normal';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_urgency VARCHAR(20) DEFAULT 'normal';

-- Add geographic coordinates for pickup and destination if not exists
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_latitude DECIMAL(10, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_longitude DECIMAL(11, 8);

-- Create trip_driver_visibility table for tracking
CREATE TABLE IF NOT EXISTS trip_driver_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shown_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  response_action VARCHAR(20), -- 'accepted', 'declined', 'expired'
  response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(trip_id, driver_id)
);

-- Create driver_locations table for real-time location tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Direction in degrees
  speed DECIMAL(5, 2), -- Speed in km/h
  accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  last_updated TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance (using standard B-tree indexes since PostGIS might not be available)
CREATE INDEX IF NOT EXISTS idx_trips_location_lat_lng ON trips (pickup_latitude, pickup_longitude);
CREATE INDEX IF NOT EXISTS idx_trips_status_discovery ON trips (status, driver_discovery_radius);
CREATE INDEX IF NOT EXISTS idx_driver_locations_lat_lng ON driver_locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_driver_locations_active ON driver_locations (is_active, last_updated);
CREATE INDEX IF NOT EXISTS idx_trip_driver_visibility_driver ON trip_driver_visibility (driver_id, shown_at);
CREATE INDEX IF NOT EXISTS idx_trip_driver_visibility_trip ON trip_driver_visibility (trip_id, response_action);

-- Add trip distance calculation function (using Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(8, 3) AS $$
BEGIN
  -- Haversine formula for calculating distance between two points
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;
