-- Create simplified test driver data for test-driver-123
-- Using only the basic fields that are required

BEGIN;

-- Create test user for the driver
INSERT INTO "User" (
  id, 
  email, 
  phone, 
  name, 
  "passwordHash", 
  role, 
  "emailVerified", 
  "phoneVerified", 
  avatar, 
  bio, 
  "isFirstLogin",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-driver-123',
  'test.driver@steppergo.com',
  '+77077123456',
  'Alex Johnson',
  '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
  'DRIVER',
  true,
  true,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'Professional driver with 5+ years experience in passenger transportation.',
  false,
  NOW() - INTERVAL '6 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

-- Create driver profile with essential fields only
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
  "yearsExperience",
  "verificationLevel",
  "isVerified",
  rating,
  "reviewCount",
  "completedTrips",
  "totalDistance",
  "totalEarnings",
  "onTimePercentage",
  "cancellationRate",
  "responseTime",
  availability,
  "currentLocation",
  "accepts_private_trips",
  "accepts_shared_trips", 
  "accepts_long_distance",
  "last_activity_at",
  "driverId",
  "fullName",
  "homeCity",
  "serviceRadiusKm",
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
  'Professional driver with 5+ years of experience.',
  5,
  'PREMIUM',
  true,
  4.8,
  127,
  89,
  15240.5,
  785000.00,
  96.5,
  2.1,
  '< 15 min',
  'AVAILABLE',
  'Currently in Almaty',
  true,
  true,
  true,
  NOW(),
  'DRV-20241115-00123',
  'Alex Johnson',
  'Almaty', 
  50,
  '2023-01-15 10:00:00',
  '2023-01-20 14:30:00',
  '2023-01-15 10:00:00',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  "completedTrips" = EXCLUDED."completedTrips",
  "updatedAt" = NOW();

-- Create basic vehicle using correct column names
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
  "isActive",
  "createdAt",
  "updatedAt"
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
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  "updatedAt" = NOW();

-- Create a simple trip for testing
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
  status,
  "createdAt",
  "updatedAt"
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
  'PUBLISHED',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  "updatedAt" = NOW();

-- Create user for trip organizer
INSERT INTO "User" (id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES ('user-organizer-002', 'family.trip@email.com', 'Mike Family', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

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

-- Verification query
SELECT 
  'Test driver created successfully!' as message,
  u.name as driver_name,
  d.status as driver_status,
  d.rating as driver_rating,
  d."completedTrips" as trips_completed
FROM "User" u 
JOIN "Driver" d ON u.id = d."userId"
WHERE u.id = 'test-driver-123';
