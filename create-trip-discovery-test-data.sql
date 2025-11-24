-- Comprehensive Trip Discovery and Trip Acceptance Test Data
-- This script creates realistic data for testing Stories 21 & 22

BEGIN;

-- Ensure test driver exists
INSERT INTO "User" (
  id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt"
) VALUES (
  'test-driver-123', 'test.driver@steppergo.com', 'Alex Johnson', '$2b$10$mock', 'DRIVER', true, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW();

INSERT INTO "Driver" (
  id, "userId", status, "vehicleType", "vehicleModel", "vehicleMake", "vehicleYear", "licensePlate",
  "licenseNumber", "licenseExpiry", "documentsUrl", "driverId", "appliedAt", availability,
  "fullName", "homeCity", rating, "completedTrips", "createdAt", "updatedAt"
) VALUES (
  'test-driver-123', 'test-driver-123', 'APPROVED', 'Sedan', 'Camry', 'Toyota', 2020, 'ABC123KZ',
  'DL12345678', '2026-12-31 23:59:59', '{"license": "url1"}', 'DRV-20241115-00123', NOW(),
  'AVAILABLE', 'Alex Johnson', 'Almaty', 4.8, 89, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET status = 'APPROVED', availability = 'AVAILABLE';

-- Create trip organizers (customers)
INSERT INTO "User" (id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES 
  ('customer-001', 'sarah.business@example.com', 'Sarah Business', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
  ('customer-002', 'mike.family@example.com', 'Mike Family', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
  ('customer-003', 'anna.tourist@example.com', 'Anna Tourist', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
  ('customer-004', 'david.urgent@example.com', 'David Urgent', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
  ('customer-005', 'lisa.corporate@example.com', 'Lisa Corporate', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create diverse trips for trip discovery testing
-- Each trip tests different aspects of the discovery and acceptance system

-- Trip 1: HIGH PRIORITY - Urgent business trip (for timeout testing)
INSERT INTO "Trip" (
  id, title, description, "organizerId", "departureTime", "returnTime", "originName", "originAddress",
  "originLat", "originLng", "destName", "destAddress", "destLat", "destLng", "totalSeats",
  "availableSeats", "basePrice", "platformFee", itinerary, status, "driver_discovery_radius",
  "estimated_earnings", "difficulty_level", "trip_urgency", "acceptanceDeadline", "createdAt", "updatedAt"
) VALUES (
  'trip-urgent-airport',
  'Urgent Airport Transfer - Flight in 2 Hours',
  'Emergency business trip to airport. Flight leaves in 2 hours, need immediate pickup.',
  'customer-004',
  NOW() + INTERVAL '15 minutes',
  NOW() + INTERVAL '2 hours',
  'Almaty City Center',
  'Dostyk Avenue 162, Almaty, Kazakhstan',
  43.2375, 76.9120,
  'Almaty International Airport',
  'Almaty Airport, Kazakhstan',
  43.3563, 77.0348,
  1, 1,
  450000.00, 67500.00,
  '[{"type":"pickup","location":"Dostyk Avenue","time":"now+15min","urgent":true},{"type":"destination","location":"Airport Terminal 1","time":"now+90min"}]',
  'PUBLISHED',
  15,
  382500.00,
  'challenging',
  'high',
  NOW() + INTERVAL '5 minutes',
  NOW() - INTERVAL '2 minutes',
  NOW()
),

-- Trip 2: NORMAL PRIORITY - Family weekend trip (good earnings)
(
  'trip-family-weekend',
  'Family Weekend Trip to Kok-Zhailau',
  'Pleasant family weekend getaway to mountain resort. 4 passengers with luggage.',
  'customer-002',
  NOW() + INTERVAL '3 hours',
  NOW() + INTERVAL '2 days',
  'Almaty Residential District',
  'Abai Avenue 150, Almaty, Kazakhstan',
  43.2500, 76.9000,
  'Kok-Zhailau Resort',
  'Kok-Zhailau, Almaty Region, Kazakhstan',
  43.1056, 76.9786,
  4, 4,
  380000.00, 57000.00,
  '[{"type":"pickup","location":"Abai Avenue","time":"3h","note":"Family with children"},{"type":"destination","location":"Kok-Zhailau Resort","time":"5h"}]',
  'PUBLISHED',
  20,
  323000.00,
  'normal',
  'normal',
  NOW() + INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour',
  NOW()
),

-- Trip 3: HIGH FARE - Corporate event (premium service)
(
  'trip-corporate-event',
  'Corporate Executive Transport',
  'VIP transport for corporate executives. Premium service required, multiple stops.',
  'customer-005',
  NOW() + INTERVAL '4 hours',
  NOW() + INTERVAL '8 hours',
  'Almaty Business District',
  'Al-Farabi Avenue 77/8, Almaty, Kazakhstan',
  43.2067, 76.8352,
  'Rixos Almaty Hotel',
  'Seifullin Avenue 506, Almaty, Kazakhstan',
  43.2380, 76.9745,
  3, 3,
  680000.00, 102000.00,
  '[{"type":"pickup","location":"Al-Farabi Business Center","time":"4h","note":"VIP service"},{"type":"stop","location":"Mega Center Almaty","time":"5h"},{"type":"destination","location":"Rixos Hotel","time":"7h"}]',
  'PUBLISHED',
  12,
  578000.00,
  'premium',
  'normal',
  NOW() + INTERVAL '3 hours',
  NOW() - INTERVAL '30 minutes',
  NOW()
),

-- Trip 4: DISTANT TRIP - Long distance (test geographic filtering)
(
  'trip-long-distance',
  'Almaty to Nur-Sultan Business Trip',
  'Long distance business trip to capital city. Professional driver required.',
  'customer-001',
  NOW() + INTERVAL '6 hours',
  NOW() + INTERVAL '2 days',
  'Almaty International Airport',
  'Almaty Airport, Kazakhstan',
  43.3563, 77.0348,
  'Nur-Sultan Nazarbayev International Airport',
  'Nur-Sultan Airport, Kazakhstan',
  51.0222, 71.4669,
  2, 2,
  950000.00, 142500.00,
  '[{"type":"pickup","location":"Almaty Airport","time":"6h"},{"type":"destination","location":"Nur-Sultan Airport","time":"12h","note":"650km journey"}]',
  'PUBLISHED',
  25,
  807500.00,
  'challenging',
  'normal',
  NOW() + INTERVAL '5 hours',
  NOW() - INTERVAL '15 minutes',
  NOW()
),

-- Trip 5: SHORT DISTANCE - City center trip (quick earnings)
(
  'trip-city-center',
  'Shopping Mall to Restaurant',
  'Short city trip from shopping to dinner. Easy pickup and drop-off.',
  'customer-003',
  NOW() + INTERVAL '1 hour',
  NOW() + INTERVAL '3 hours',
  'Mega Center Almaty',
  'Rozybakiev Street 247, Almaty, Kazakhstan',
  43.2315, 76.8570,
  'Daredzhani Restaurant',
  'Panfilov Street 123, Almaty, Kazakhstan',
  43.2567, 76.9286,
  2, 2,
  180000.00, 27000.00,
  '[{"type":"pickup","location":"Mega Center entrance","time":"1h"},{"type":"destination","location":"Daredzhani Restaurant","time":"1h30min"}]',
  'PUBLISHED',
  8,
  153000.00,
  'easy',
  'normal',
  NOW() + INTERVAL '45 minutes',
  NOW() - INTERVAL '10 minutes',
  NOW()
),

-- Trip 6: EXPIRED DEADLINE - Test timeout mechanism
(
  'trip-expired-offer',
  'Medical Appointment - Missed Window',
  'Trip to medical center, but acceptance deadline has passed.',
  'customer-001',
  NOW() + INTERVAL '30 minutes',
  NOW() + INTERVAL '2 hours',
  'Almaty Medical District',
  'Tole Bi Street 99, Almaty, Kazakhstan',
  43.2445, 76.9234,
  'National Scientific Medical Center',
  'Abay Avenue 91, Almaty, Kazakhstan',
  43.2612, 76.9123,
  1, 1,
  220000.00, 33000.00,
  '[{"type":"pickup","location":"Medical District","time":"30min"},{"type":"destination","location":"Medical Center","time":"1h"}]',
  'PUBLISHED',
  10,
  187000.00,
  'normal',
  'normal',
  NOW() - INTERVAL '5 minutes', -- Deadline already passed
  NOW() - INTERVAL '20 minutes',
  NOW()
);

-- Create driver location for geographic testing
INSERT INTO "DriverLocation" (
  id, "driverId", latitude, longitude, accuracy, "lastUpdated", "isActive"
) VALUES (
  'location-test-driver-123',
  'test-driver-123',
  43.2220, -- Central Almaty
  76.8512,
  15.0,
  NOW(),
  true
) ON CONFLICT ("driverId") DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  "lastUpdated" = NOW(),
  "isActive" = true;

-- Create trip offers for acceptance testing (Stories 22 features)
-- These simulate the system offering trips to drivers

-- Active offer - for immediate acceptance testing
INSERT INTO "TripOffer" (
  id, "tripId", "driverId", "offeredAt", "expiresAt", status, metadata
) VALUES (
  'offer-urgent-airport',
  'trip-urgent-airport',
  'test-driver-123',
  NOW() - INTERVAL '30 seconds',
  NOW() + INTERVAL '4 minutes 30 seconds', -- 5 minutes total, 30 seconds elapsed
  'PENDING',
  '{"urgency": "high", "timeoutSeconds": 300, "estimatedEarnings": 382500, "distance": 18.5}'
),

-- Offer about to expire - for timeout testing
(
  'offer-family-weekend',
  'trip-family-weekend',
  'test-driver-123',
  NOW() - INTERVAL '4 minutes',
  NOW() + INTERVAL '1 minute', -- About to expire
  'PENDING',
  '{"urgency": "normal", "timeoutSeconds": 300, "estimatedEarnings": 323000, "distance": 12.8}'
),

-- Fresh offer - for normal acceptance flow
(
  'offer-city-center',
  'trip-city-center',
  'test-driver-123',
  NOW() - INTERVAL '10 seconds',
  NOW() + INTERVAL '4 minutes 50 seconds',
  'PENDING',
  '{"urgency": "normal", "timeoutSeconds": 300, "estimatedEarnings": 153000, "distance": 6.2}'
);

-- Create trip acceptance logs (for testing history and analytics)
INSERT INTO "TripAcceptanceLog" (
  id, "tripId", "driverId", action, "responseTime", reason, metadata, "createdAt"
) VALUES (
  'log-001',
  'trip-corporate-event',
  'test-driver-123',
  'VIEWED',
  null,
  null,
  '{"viewedAt": "' || (NOW() - INTERVAL '2 minutes')::text || '", "offerDuration": 300}',
  NOW() - INTERVAL '2 minutes'
),
(
  'log-002',
  'trip-long-distance',
  'test-driver-123',
  'DECLINED',
  25,
  'Too far from current location',
  '{"declineReason": "distance", "distanceKm": 650}',
  NOW() - INTERVAL '5 minutes'
),
(
  'log-003',
  'trip-city-center',
  'test-driver-123',
  'VIEWED',
  null,
  null,
  '{"viewedAt": "' || (NOW() - INTERVAL '30 seconds')::text || '"}',
  NOW() - INTERVAL '30 seconds'
);

-- Update trip statistics based on location and driver radius
UPDATE "Trip" 
SET "driver_discovery_radius" = CASE
  WHEN ST_Distance(
    ST_MakePoint(76.8512, 43.2220)::geography, -- Driver location
    ST_MakePoint("originLng", "originLat")::geography
  ) / 1000 <= 10 THEN 10
  WHEN ST_Distance(
    ST_MakePoint(76.8512, 43.2220)::geography,
    ST_MakePoint("originLng", "originLat")::geography
  ) / 1000 <= 20 THEN 20
  ELSE 30
END
WHERE id IN (
  'trip-urgent-airport', 'trip-family-weekend', 'trip-corporate-event',
  'trip-long-distance', 'trip-city-center', 'trip-expired-offer'
);

COMMIT;

-- Verification queries
SELECT 
  'Trip Discovery Test Data Created Successfully!' as message,
  COUNT(*) as total_trips
FROM "Trip" 
WHERE status = 'PUBLISHED' 
  AND id LIKE 'trip-%';

SELECT 
  'Trip Offers Created for Acceptance Testing!' as message,
  COUNT(*) as active_offers
FROM "TripOffer" 
WHERE status = 'PENDING'
  AND "driverId" = 'test-driver-123';

-- Display test trip summary
SELECT 
  id,
  title,
  ROUND(("basePrice"::numeric / 1000), 0) as fare_kzt,
  ROUND(("estimated_earnings"::numeric / 1000), 0) as earnings_kzt,
  trip_urgency,
  difficulty_level,
  CASE 
    WHEN "acceptanceDeadline" > NOW() THEN 'Active'
    ELSE 'Expired'
  END as deadline_status,
  ROUND(
    ST_Distance(
      ST_MakePoint(76.8512, 43.2220)::geography,
      ST_MakePoint("originLng", "originLat")::geography
    ) / 1000, 1
  ) as distance_from_driver_km
FROM "Trip" 
WHERE id LIKE 'trip-%'
ORDER BY "createdAt";
