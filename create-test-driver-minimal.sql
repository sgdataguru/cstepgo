-- Create basic test driver data for test-driver-123
-- Minimal setup for component testing

BEGIN;

-- Create users first (organizer and driver)
INSERT INTO "User" (id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES 
  ('user-organizer-002', 'family.trip@email.com', 'Mike Family', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
  ('test-driver-123', 'test.driver@steppergo.com', 'Alex Johnson', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'DRIVER', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW();

-- Create driver profile  
INSERT INTO "Driver" (
  id,
  "userId", 
  status,
  "vehicleType",
  "vehicleModel",
  "vehicleMake",
  "vehicleYear",
  "licensePlate",
  "vehicleColor",
  "passengerCapacity",
  "luggageCapacity",
  "licenseNumber",
  "licenseExpiry",
  "documentsUrl",
  bio,
  rating,
  "completedTrips",
  availability,
  "driverId",
  "fullName",
  "homeCity",
  "appliedAt",
  "approvedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-driver-123',
  'test-driver-123',
  'APPROVED',
  'Sedan',
  'Camry', 
  'Toyota',
  2020,
  'ABC123KZ',
  'Silver',
  4,
  2,
  'DL12345678',
  '2026-12-31 23:59:59',
  '{"license": "url1", "insurance": "url2"}',
  'Professional driver with 5+ years experience.',
  4.8,
  89,
  'AVAILABLE',
  'DRV-20241115-00123',
  'Alex Johnson',
  'Almaty',
  NOW() - INTERVAL '6 months',
  NOW() - INTERVAL '6 months',
  NOW() - INTERVAL '6 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  status = 'APPROVED',
  rating = 4.8,
  "updatedAt" = NOW();

-- Create vehicle
INSERT INTO "Vehicle" (
  id,
  "driverId",
  make,
  model,
  year,
  color,
  "licensePlate",
  type,
  "passengerCapacity",
  "luggageCapacity",
  amenities,
  photos,
  "isActive"
) VALUES (
  'vehicle-123-primary',
  'test-driver-123',
  'Toyota',
  'Camry',
  2020,
  'Silver',
  'ABC123KZ',
  'SEDAN', 
  4,
  2,
  '["air_conditioning", "bluetooth", "gps"]',
  '["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d"]',
  true
) ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW();

-- Create trip
INSERT INTO "Trip" (
  id,
  title,
  description,
  "organizerId",
  "departureTime", 
  "returnTime",
  "originName",
  "originAddress",
  "originLat",
  "originLng", 
  "destName",
  "destAddress",
  "destLat",
  "destLng",
  "totalSeats",
  "availableSeats",
  "basePrice",
  "platformFee",
  itinerary,
  status
) VALUES (
  'trip-available-456',
  'Weekend Trip to Kok-Zhailau',
  'Relaxing weekend getaway.',
  'user-organizer-002',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '3 days', 
  'Almaty City Center',
  'Republic Square, Almaty',
  43.2220,
  76.8512,
  'Kok-Zhailau Resort', 
  'Kok-Zhailau, Almaty Region',
  43.1056,
  76.9786,
  4,
  4,
  150000.00,
  15000.00,
  '[{"type":"pickup","location":"Republic Square"}]',
  'PUBLISHED'
) ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW();

-- Create driver location
INSERT INTO "DriverLocation" (
  id,
  "driverId",
  latitude,
  longitude,
  accuracy,
  "lastUpdated",
  "isActive"
) VALUES (
  'location-test-driver-123',
  'test-driver-123',
  43.2220,
  76.8512,
  10.0,
  NOW(),
  true
) ON CONFLICT ("driverId") DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  "lastUpdated" = NOW();

COMMIT;
