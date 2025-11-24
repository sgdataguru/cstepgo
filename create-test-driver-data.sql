-- Create comprehensive test driver data for test-driver-123
-- This script sets up all necessary data for testing Driver Portal components

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
  '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', -- Mock hash
  'DRIVER',
  true,
  true,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'Professional driver with 5+ years experience in passenger transportation. Passionate about providing excellent customer service.',
  false,
  NOW() - INTERVAL '6 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "emailVerified" = EXCLUDED."emailVerified",
  "phoneVerified" = EXCLUDED."phoneVerified",
  avatar = EXCLUDED.avatar,
  bio = EXCLUDED.bio,
  "updatedAt" = NOW();

-- Create comprehensive driver profile
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
  "coverPhotoUrl",
  "yearsExperience",
  languages,
  "verificationBadges",
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
  "acceptsPrivateTrips",
  "acceptsSharedTrips",
  "acceptsLongDistance",
  "lastActivityAt",
  "autoOfflineMinutes",
  "appliedAt",
  "approvedAt",
  "driverId",
  "fullName",
  "nationalId",
  "homeCity",
  "serviceRadiusKm",
  "willingToTravel",
  "registeredBy",
  "lastLoginAt",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-driver-123',
  'test-driver-123',
  'APPROVED',
  'SEDAN',
  'Camry',
  'Toyota',
  2020,
  '555 ABC 01',
  'Silver',
  4,
  3,
  'KZ123456789',
  '2026-12-31',
  '{"license": "license_url.pdf", "insurance": "insurance_url.pdf", "registration": "registration_url.pdf"}',
  'Experienced driver specializing in comfortable long-distance trips. Fluent in multiple languages and passionate about showing travelers the beauty of Kazakhstan.',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
  5,
  '[{"code": "en", "name": "English", "proficiency": "native"}, {"code": "kz", "name": "Kazakh", "proficiency": "native"}, {"code": "ru", "name": "Russian", "proficiency": "fluent"}]',
  '[{"type": "identity_verified", "verifiedAt": "2024-01-15", "description": "Government ID verified"}, {"type": "vehicle_inspected", "verifiedAt": "2024-01-20", "description": "Vehicle safety inspection passed"}, {"type": "background_check", "verifiedAt": "2024-01-10", "description": "Background check cleared"}]',
  'PREMIUM',
  true,
  4.8,
  127,
  89,
  12450.5,
  8750.25,
  96.5,
  2.1,
  '< 15 minutes',
  'AVAILABLE',
  'Currently in Almaty city center',
  true,
  true,
  true,
  NOW() - INTERVAL '30 minutes',
  60,
  NOW() - INTERVAL '6 months',
  NOW() - INTERVAL '5 months',
  'DRV-20240115-00123',
  'Alexander Johnson',
  'KZ9876543210',
  'Almaty',
  50,
  '["domestic", "cross_border_kz"]',
  'admin-user-123',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '6 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  "reviewCount" = EXCLUDED."reviewCount",
  "completedTrips" = EXCLUDED."completedTrips",
  "totalDistance" = EXCLUDED."totalDistance",
  "totalEarnings" = EXCLUDED."totalEarnings",
  availability = EXCLUDED.availability,
  "lastActivityAt" = EXCLUDED."lastActivityAt",
  "lastLoginAt" = EXCLUDED."lastLoginAt",
  "updatedAt" = NOW();

-- Create driver location data
INSERT INTO "DriverLocation" (
  "driverId",
  latitude,
  longitude,
  heading,
  speed,
  accuracy,
  "lastUpdated",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-driver-123',
  43.2220,
  76.8512,
  45.50,
  0.00,
  5.5,
  NOW(),
  true,
  NOW(),
  NOW()
) ON CONFLICT ("driverId") DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  accuracy = EXCLUDED.accuracy,
  "lastUpdated" = EXCLUDED."lastUpdated",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Create test vehicles for the driver
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
  "insuranceExpiryDate",
  "registrationExpiryDate",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES 
(
  'vehicle-1-test-driver-123',
  'test-driver-123',
  'Toyota',
  'Camry',
  2020,
  'Silver',
  '555 ABC 01',
  'SEDAN',
  4,
  3,
  '["air_conditioning", "bluetooth", "usb_charging", "wifi", "water_bottles", "phone_charger"]',
  '["https://images.unsplash.com/photo-1549399511-70e8e6c9b3c7?w=400", "https://images.unsplash.com/photo-1549399511-70e8e6c9b3c7?w=400"]',
  '2025-08-15',
  '2025-12-31',
  true,
  NOW() - INTERVAL '6 months',
  NOW()
),
(
  'vehicle-2-test-driver-123',
  'test-driver-123',
  'Mercedes',
  'E-Class',
  2022,
  'Black',
  '777 XYZ 02',
  'SEDAN',
  4,
  4,
  '["air_conditioning", "leather_seats", "bluetooth", "premium_sound", "wifi", "water_bottles", "phone_charger", "newspapers"]',
  '["https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=400", "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=400"]',
  '2025-10-20',
  '2026-01-15',
  false,
  NOW() - INTERVAL '2 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Create test reviews for the driver
INSERT INTO "Review" (
  id,
  "driverId",
  "tripId",
  rating,
  comment,
  "reviewerId",
  "reviewerName",
  "reviewerPhotoUrl",
  response,
  "respondedAt",
  "createdAt",
  "updatedAt"
) VALUES 
(
  'review-1-test-driver-123',
  'test-driver-123',
  'trip-completed-1',
  5,
  'Excellent driver! Very professional and the car was spotless. Made the long journey from Almaty to Astana very comfortable.',
  'customer-1',
  'Sarah Williams',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
  'Thank you Sarah! It was my pleasure to provide a comfortable journey. Safe travels!',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '2 days'
),
(
  'review-2-test-driver-123',
  'test-driver-123',
  'trip-completed-2',
  5,
  'Perfect trip! Alex was on time, very friendly, and knew all the best routes. Would definitely book again.',
  'customer-2',
  'Mike Chen',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'Thank you Mike! Looking forward to our next trip.',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 weeks',
  NOW() - INTERVAL '5 days'
),
(
  'review-3-test-driver-123',
  'test-driver-123',
  'trip-completed-3',
  4,
  'Great service overall. Driver was professional and punctual. Vehicle was clean and comfortable.',
  'customer-3',
  'Emma Johnson',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  NULL,
  NULL,
  NOW() - INTERVAL '3 weeks',
  NOW() - INTERVAL '3 weeks'
),
(
  'review-4-test-driver-123',
  'test-driver-123',
  'trip-completed-4',
  5,
  'Outstanding experience! Alex went above and beyond to make sure we were comfortable and safe during our mountain trip.',
  'customer-4',
  'David Park',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'Thank you David! Mountain trips are my specialty. Glad you enjoyed the scenery!',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 month',
  NOW() - INTERVAL '1 day'
),
(
  'review-5-test-driver-123',
  'test-driver-123',
  'trip-completed-5',
  4,
  'Very reliable and safe driver. Good communication throughout the trip.',
  'customer-5',
  'Lisa Anderson',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'Thank you for choosing StepperGO! Safe travels always.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 month',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Create test trips for the driver
INSERT INTO "Trip" (
  id,
  title,
  description,
  "organizerId",
  "driverId",
  "departureTime",
  "returnTime",
  timezone,
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
  currency,
  "platformFee",
  itinerary,
  status,
  metadata,
  "driverDiscoveryRadius",
  "estimatedEarnings",
  "difficultyLevel",
  "tripUrgency",
  "acceptanceDeadline",
  "offeredToDriverId",
  "acceptanceResponseTime",
  "createdAt",
  "updatedAt",
  "publishedAt"
) VALUES 
-- Active trip - currently in progress
(
  'trip-active-123',
  'Business Trip to Astana',
  'Professional business trip with 2 passengers',
  'customer-business-1',
  'test-driver-123',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '8 hours',
  'Asia/Almaty',
  'Almaty International Airport',
  'Almaty Airport, Kazakhstan',
  43.3521,
  77.0405,
  'Nur-Sultan Nazarbayev International Airport',
  'Nur-Sultan Airport, Kazakhstan', 
  51.0222,
  71.4669,
  4,
  2,
  25000,
  'KZT',
  3750,
  '[{"type": "pickup", "location": "Almaty Airport", "time": "14:00"}, {"type": "rest_stop", "location": "Balkhash", "time": "18:00"}, {"type": "destination", "location": "Astana Airport", "time": "22:00"}]',
  'CONFIRMED',
  '{"priority": "high", "businessTrip": true, "airportPickup": true}',
  15,
  21250,
  'normal',
  'high',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '2 days'
),
-- Available trip - waiting for driver acceptance
(
  'trip-available-456',
  'Weekend Getaway to Issyk-Kul',
  'Leisure trip to beautiful Issyk-Kul lake with family',
  'customer-leisure-1', 
  NULL,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '3 days',
  'Asia/Almaty',
  'Almaty City Center',
  'Republic Square, Almaty',
  43.2220,
  76.8512,
  'Issyk-Kul Lake',
  'Cholpon-Ata, Kyrgyzstan',
  42.6417,
  77.0858,
  4,
  4,
  35000,
  'KZT',
  5250,
  '[{"type": "pickup", "location": "Almaty Center", "time": "08:00"}, {"type": "border_crossing", "location": "Kazakhstan-Kyrgyzstan Border", "time": "12:00"}, {"type": "destination", "location": "Issyk-Kul", "time": "16:00"}]',
  'PUBLISHED',
  '{"scenic": true, "borderCrossing": true, "familyTrip": true}',
  20,
  29750,
  'challenging',
  'normal',
  NOW() + INTERVAL '6 hours',
  'test-driver-123',
  NULL,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '3 hours'
),
-- Completed trip for history
(
  'trip-completed-789',
  'Corporate Event Transportation',
  'Transport for corporate team building event',
  'customer-corporate-1',
  'test-driver-123', 
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week' + INTERVAL '6 hours',
  'Asia/Almaty',
  'Kok-Tobe Hill',
  'Kok-Tobe, Almaty',
  43.2316,
  76.9536,
  'Medeu Skating Rink',
  'Medeu, Almaty',
  43.2603,
  77.0122,
  4,
  0,
  15000,
  'KZT',
  2250,
  '[{"type": "pickup", "location": "Kok-Tobe", "time": "09:00"}, {"type": "destination", "location": "Medeu", "time": "10:30"}]',
  'COMPLETED',
  '{"corporate": true, "shortDistance": true}',
  10,
  12750,
  'easy',
  'normal',
  NULL,
  NULL,
  45,
  NOW() - INTERVAL '1 week' - INTERVAL '1 hour',
  NOW() - INTERVAL '1 week' + INTERVAL '6 hours',
  NOW() - INTERVAL '1 week' - INTERVAL '1 hour'
) ON CONFLICT (id) DO UPDATE SET
  "driverId" = EXCLUDED."driverId",
  status = EXCLUDED.status,
  "updatedAt" = NOW();

-- Create trip visibility records for discovery testing
INSERT INTO "TripDriverVisibility" (
  "tripId",
  "driverId", 
  "shownAt",
  "viewedAt",
  "responseAction",
  "responseAt"
) VALUES 
(
  'trip-available-456',
  'test-driver-123',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours',
  NULL,
  NULL
),
(
  'trip-completed-789',
  'test-driver-123',
  NOW() - INTERVAL '1 week' - INTERVAL '2 hours',
  NOW() - INTERVAL '1 week' - INTERVAL '90 minutes',
  'accepted',
  NOW() - INTERVAL '1 week' - INTERVAL '85 minutes'
) ON CONFLICT ("tripId", "driverId") DO UPDATE SET
  "viewedAt" = EXCLUDED."viewedAt",
  "responseAction" = EXCLUDED."responseAction",
  "responseAt" = EXCLUDED."responseAt";

-- Create trip acceptance log for testing
INSERT INTO "TripAcceptanceLog" (
  "tripId",
  "driverId",
  action,
  "offeredAt",
  "respondedAt",
  "responseTimeSeconds",
  "ipAddress",
  "userAgent",
  "timeoutDuration"
) VALUES 
(
  'trip-completed-789',
  'test-driver-123',
  'ACCEPTED',
  NOW() - INTERVAL '1 week' - INTERVAL '90 minutes',
  NOW() - INTERVAL '1 week' - INTERVAL '85 minutes',
  45,
  '192.168.1.100',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  60
),
(
  'trip-available-456', 
  'test-driver-123',
  'OFFERED',
  NOW() - INTERVAL '3 hours',
  NULL,
  NULL,
  '192.168.1.100',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  30
) ON CONFLICT ("tripId", "driverId", action) DO UPDATE SET
  "offeredAt" = EXCLUDED."offeredAt",
  "responseTimeSeconds" = EXCLUDED."responseTimeSeconds";

-- Create driver availability schedule for testing
INSERT INTO "DriverAvailabilitySchedule" (
  "driverId",
  "startTime",
  "endTime",
  "scheduleType",
  reason,
  "isRecurring",
  "recurringPattern",
  "isActive"
) VALUES 
(
  'test-driver-123',
  NOW() + INTERVAL '12 hours',
  NOW() + INTERVAL '13 hours',
  'break',
  'Lunch break',
  true,
  '{"type": "daily", "time": "13:00-14:00"}',
  true
),
(
  'test-driver-123',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '8 hours',
  'unavailable',
  'Vehicle maintenance',
  false,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Create driver availability history for testing
INSERT INTO "DriverAvailabilityHistory" (
  "driverId",
  "previousStatus",
  "newStatus",
  "changeReason",
  "triggeredBy",
  "ipAddress",
  "userAgent",
  metadata,
  "changedAt"
) VALUES 
(
  'test-driver-123',
  'OFFLINE',
  'AVAILABLE',
  'Driver went online for the day',
  'driver',
  '192.168.1.100',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  '{"location": "Almaty city center"}',
  NOW() - INTERVAL '1 hour'
),
(
  'test-driver-123',
  'AVAILABLE',
  'BUSY',
  'Trip accepted and started',
  'system',
  NULL,
  NULL,
  '{"tripId": "trip-active-123"}',
  NOW() - INTERVAL '30 minutes'
) ON CONFLICT DO NOTHING;

COMMIT;

-- Verify the test data was created successfully
SELECT 
  u.name,
  u.role,
  d.status,
  d."completedTrips",
  d.rating,
  d.availability
FROM "User" u 
JOIN "Driver" d ON u.id = d."userId" 
WHERE u.id = 'test-driver-123';

SELECT COUNT(*) as vehicle_count FROM "Vehicle" WHERE "driverId" = 'test-driver-123';
SELECT COUNT(*) as review_count FROM "Review" WHERE "driverId" = 'test-driver-123';
SELECT COUNT(*) as trip_count FROM "Trip" WHERE "driverId" = 'test-driver-123' OR "offeredToDriverId" = 'test-driver-123';
