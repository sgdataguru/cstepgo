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

-- Create comprehensive driver profile with correct column names
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
  "accepts_private_trips",
  "accepts_shared_trips",
  "accepts_long_distance",
  "last_activity_at",
  "auto_offline_minutes",
  "appliedAt",
  "approvedAt",
  "driverId",
  "fullName",
  "nationalId",
  "homeCity",
  "serviceRadiusKm",
  "willingToTravel",
  "registeredBy",
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
  '{"license": "url1", "insurance": "url2", "registration": "url3"}',
  'Professional driver with 5+ years of experience. Specializing in airport transfers and long-distance trips. Fluent in English, Kazakh, and Russian.',
  'https://example.com/cover-photo.jpg',
  5,
  '[{"code": "en", "name": "English", "proficiency": "native"}, {"code": "kk", "name": "Kazakh", "proficiency": "fluent"}, {"code": "ru", "name": "Russian", "proficiency": "fluent"}]',
  '["verified_phone", "verified_email", "government_id", "background_check", "vehicle_inspection"]',
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
  'Currently in Almaty - Airport area',
  true,
  true,
  true,
  NOW(),
  30,
  '2023-01-15 10:00:00',
  '2023-01-20 14:30:00',
  'DRV-20241115-00123',
  'Alex Johnson',
  'ID1234567890',
  'Almaty',
  50,
  '["domestic", "cross_border_kz"]',
  'admin-001',
  '2023-01-15 10:00:00',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  "completedTrips" = EXCLUDED."completedTrips",
  "totalEarnings" = EXCLUDED."totalEarnings",
  "updatedAt" = NOW();

-- Create Vehicles for the driver
INSERT INTO "Vehicle" (
  id,
  "driverId", 
  "vehicleMake",
  "vehicleModel",
  "vehicleYear",
  "licensePlate",
  color,
  "seatingCapacity",
  "luggageCapacity",
  "vehicleType",
  amenities,
  "photoUrls",
  "insuranceExpiry",
  "registrationExpiry",
  status,
  "createdAt",
  "updatedAt"
) VALUES 
-- Vehicle 1: Primary Toyota Camry
(
  'vehicle-123-primary',
  'test-driver-123',
  'Toyota',
  'Camry',
  2020,
  'ABC123KZ',
  'Silver',
  4,
  2,
  'Sedan',
  '["air_conditioning", "bluetooth", "gps", "wifi", "usb_charging", "leather_seats"]',
  '["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d"]',
  '2025-12-31 23:59:59',
  '2025-12-31 23:59:59',
  'ACTIVE',
  NOW() - INTERVAL '6 months',
  NOW()
),
-- Vehicle 2: Luxury Mercedes
(
  'vehicle-123-luxury',
  'test-driver-123',
  'Mercedes-Benz',
  'E-Class',
  2021,
  'XYZ789KZ',
  'Black',
  4,
  3,
  'Sedan',
  '["air_conditioning", "bluetooth", "gps", "wifi", "usb_charging", "leather_seats", "premium_audio", "tinted_windows", "sunroof"]',
  '["https://images.unsplash.com/photo-1563720223185-11003d516935"]',
  '2025-12-31 23:59:59',
  '2025-12-31 23:59:59',
  'ACTIVE',
  NOW() - INTERVAL '3 months',
  NOW()
);

-- Create sample trips for testing (3 trips with different statuses)
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
  "driver_discovery_radius",
  "estimated_earnings",
  "difficulty_level",
  "trip_urgency",
  "createdAt",
  "updatedAt"
) VALUES
-- Active Trip: Business trip to Nur-Sultan
(
  'trip-active-789',
  'Business Trip to Nur-Sultan',
  'Corporate trip for business meetings in the capital. Professional service required.',
  'user-organizer-001',
  'test-driver-123',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '1 day',
  'Asia/Almaty',
  'Almaty International Airport',
  'Almaty Airport, Kazakhstan',
  43.3563,
  77.0348,
  'Nur-Sultan Business District',
  'Nur-Sultan, Kazakhstan',
  51.1694,
  71.4491,
  3,
  0,
  350000.00,
  'KZT',
  35000.00,
  '[{"type":"pickup","location":"Almaty Airport","time":"2024-11-15T16:00:00Z","description":"Terminal 1 arrival"},{"type":"destination","location":"Rixos President Astana","time":"2024-11-16T02:00:00Z","description":"Hotel drop-off"}]',
  'CONFIRMED',
  '{"passenger_type": "business", "special_requirements": ["professional_attire", "punctuality"], "contact_method": "phone"}',
  25,
  280000.00,
  'challenging',
  'high',
  NOW() - INTERVAL '1 day',
  NOW()
),
-- Available Trip: Weekend getaway 
(
  'trip-available-456',
  'Weekend Getaway to Kok-Zhailau',
  'Relaxing weekend trip to the beautiful mountain resort. Family-friendly.',
  'user-organizer-002',
  null,
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '4 days',
  'Asia/Almaty',
  'Almaty City Center',
  'Republic Square, Almaty, Kazakhstan', 
  43.2220,
  76.8512,
  'Kok-Zhailau Resort',
  'Kok-Zhailau, Almaty Region, Kazakhstan',
  43.1056,
  76.9786,
  4,
  4,
  150000.00,
  'KZT',
  15000.00,
  '[{"type":"pickup","location":"Republic Square","time":"2024-11-18T08:00:00Z","description":"City center pickup"},{"type":"destination","location":"Kok-Zhailau Resort","time":"2024-11-18T10:30:00Z","description":"Resort entrance"}]',
  'PUBLISHED',
  '{"passenger_type": "family", "special_requirements": ["child_seats_available"], "contact_method": "whatsapp"}',
  15,
  120000.00,
  'normal',
  'normal',
  NOW() - INTERVAL '2 days',
  NOW()
),
-- Completed Trip: Corporate event
(
  'trip-completed-321',
  'Corporate Event Transportation',
  'Transport for corporate retreat attendees. Multiple stops required.',
  'user-organizer-003',
  'test-driver-123',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '6 days',
  'Asia/Almaty',
  'Almaty Hotels District',
  'Dostyk Avenue, Almaty, Kazakhstan',
  43.2375,
  76.9120,
  'Aport Resort',
  'Aport Resort, Almaty Region, Kazakhstan',
  43.3004,
  77.0100,
  3,
  0,
  200000.00,
  'KZT',
  20000.00,
  '[{"type":"pickup","location":"Rixos Almaty","time":"2024-11-08T07:00:00Z","description":"Hotel lobby"},{"type":"destination","location":"Aport Resort","time":"2024-11-08T09:00:00Z","description":"Main entrance"}]',
  'COMPLETED',
  '{"passenger_type": "business", "special_requirements": ["wifi"], "contact_method": "email", "rating": 5, "tip": 15000}',
  20,
  160000.00,
  'normal',
  'normal',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '6 days'
);

-- Create realistic reviews for the driver (5 detailed reviews)
INSERT INTO "Review" (
  id,
  "tripId",
  "reviewerId",
  "driverId",
  rating,
  comment,
  "reviewType",
  metadata,
  "createdAt",
  "updatedAt"
) VALUES
-- Review 1: Business trip review
(
  'review-001',
  'trip-completed-321',
  'user-organizer-003',
  'test-driver-123',
  5,
  'Excellent professional service! Alex was punctual, courteous, and the vehicle was immaculate. Made our corporate event transportation seamless. Highly recommended for business travel.',
  'TRIP',
  '{"verified": true, "helpful_count": 12}',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
-- Review 2: Family trip review
(
  'review-002', 
  null,
  'user-family-parent',
  'test-driver-123',
  5,
  'Amazing experience with our family trip! Alex was patient with our children and even helped with luggage. The car was clean and comfortable. Will definitely book again!',
  'GENERAL',
  '{"verified": true, "helpful_count": 8}',
  NOW() - INTERVAL '2 weeks',
  NOW() - INTERVAL '2 weeks'
),
-- Review 3: Airport transfer review
(
  'review-003',
  null,
  'user-business-traveler',
  'test-driver-123',
  4,
  'Great airport transfer service. Driver was waiting with a sign and helped with heavy bags. Only minor issue was slight delay due to traffic, but Alex communicated well.',
  'GENERAL',
  '{"verified": true, "helpful_count": 6}',
  NOW() - INTERVAL '3 weeks',
  NOW() - INTERVAL '3 weeks'
),
-- Review 4: Long distance trip
(
  'review-004',
  null,
  'user-long-distance',
  'test-driver-123',
  5,
  'Fantastic long-distance driver! Made the 6-hour journey comfortable and safe. Great conversation, smooth driving, and excellent knowledge of routes. Top-notch service!',
  'GENERAL',
  '{"verified": true, "helpful_count": 15}',
  NOW() - INTERVAL '1 month',
  NOW() - INTERVAL '1 month'
),
-- Review 5: Tourist review
(
  'review-005',
  null,
  'user-tourist-001',
  'test-driver-123',
  5,
  'Perfect tour guide and driver! Alex showed us hidden gems in Almaty and surrounding areas. Speaks excellent English and is very knowledgeable about local culture. Unforgettable experience!',
  'GENERAL',
  '{"verified": true, "helpful_count": 20}',
  NOW() - INTERVAL '6 weeks',
  NOW() - INTERVAL '6 weeks'
);

-- Create driver responses to reviews (professional engagement)
UPDATE "Review" SET 
  "driverResponse" = 'Thank you for the wonderful feedback! It was a pleasure working with your team. Looking forward to serving you again for future corporate events.',
  "responseAt" = NOW() - INTERVAL '4 days'
WHERE id = 'review-001';

UPDATE "Review" SET
  "driverResponse" = 'So glad your family enjoyed the trip! Children always make the journey more fun. Thank you for choosing our service and for the kind words.',
  "responseAt" = NOW() - INTERVAL '13 days'
WHERE id = 'review-002';

UPDATE "Review" SET
  "driverResponse" = 'Thank you for understanding about the traffic delay. I always try to communicate any issues promptly. Your patience was much appreciated!',
  "responseAt" = NOW() - INTERVAL '3 weeks'
WHERE id = 'review-003';

-- Create driver location data for real-time tracking
INSERT INTO "DriverLocation" (
  id,
  "driverId",
  latitude,
  longitude,
  accuracy,
  speed,
  heading,
  "lastUpdated",
  "isActive"
) VALUES (
  'location-test-driver-123',
  'test-driver-123',
  43.2220, -- Almaty coordinates
  76.8512,
  10.0,
  0.0,
  0.0,
  NOW(),
  true
) ON CONFLICT ("driverId") DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  "lastUpdated" = NOW(),
  "isActive" = true;

-- Create availability schedules (weekly schedule)
INSERT INTO "DriverAvailabilitySchedule" (
  id,
  "driverId",
  "dayOfWeek",
  "startTime",
  "endTime",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
-- Monday to Friday (Business days)
('schedule-123-monday', 'test-driver-123', 1, '07:00:00', '22:00:00', true, NOW(), NOW()),
('schedule-123-tuesday', 'test-driver-123', 2, '07:00:00', '22:00:00', true, NOW(), NOW()),
('schedule-123-wednesday', 'test-driver-123', 3, '07:00:00', '22:00:00', true, NOW(), NOW()),
('schedule-123-thursday', 'test-driver-123', 4, '07:00:00', '22:00:00', true, NOW(), NOW()),
('schedule-123-friday', 'test-driver-123', 5, '07:00:00', '23:00:00', true, NOW(), NOW()),
-- Weekend (Limited hours)
('schedule-123-saturday', 'test-driver-123', 6, '09:00:00', '20:00:00', true, NOW(), NOW()),
('schedule-123-sunday', 'test-driver-123', 0, '10:00:00', '18:00:00', true, NOW(), NOW());

-- Create availability history (track past availability changes)
INSERT INTO "DriverAvailabilityHistory" (
  id,
  "driverId",
  "previousStatus",
  "newStatus",
  reason,
  "changedAt"
) VALUES
-- Recent activity showing professional availability management
('history-123-001', 'test-driver-123', 'OFFLINE', 'AVAILABLE', 'Started shift - morning availability', NOW() - INTERVAL '3 hours'),
('history-123-002', 'test-driver-123', 'AVAILABLE', 'BUSY', 'Accepted trip to Nur-Sultan', NOW() - INTERVAL '2 hours'),
('history-123-003', 'test-driver-123', 'BUSY', 'AVAILABLE', 'Completed trip - back to available status', NOW() - INTERVAL '30 minutes');

-- Create trip acceptance logs (shows decision-making patterns)
INSERT INTO "TripAcceptanceLog" (
  id,
  "tripId",
  "driverId",
  action,
  "responseTime",
  reason,
  metadata,
  "createdAt"
) VALUES
-- Recent acceptance history
('acceptance-123-001', 'trip-active-789', 'test-driver-123', 'ACCEPTED', 12, 'Good earnings and convenient timing', '{"urgency": "high", "distance": 650}', NOW() - INTERVAL '1 day'),
('acceptance-123-002', 'trip-available-456', 'test-driver-123', 'VIEWED', null, null, '{"urgency": "normal", "distance": 35}', NOW() - INTERVAL '6 hours'),
('acceptance-123-003', 'trip-completed-321', 'test-driver-123', 'ACCEPTED', 8, 'Corporate client - good for reputation', '{"urgency": "normal", "distance": 45}', NOW() - INTERVAL '1 week');

-- Create sample users for trip organizers and reviewers
INSERT INTO "User" (id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES 
('user-organizer-001', 'business.client@company.com', 'Sarah Business', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-organizer-002', 'family.trip@email.com', 'Mike Family', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-organizer-003', 'corporate.events@company.com', 'Lisa Corporate', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-family-parent', 'parent@family.com', 'Emma Parent', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-business-traveler', 'traveler@business.com', 'John Traveler', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-long-distance', 'longtrip@email.com', 'David Distance', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW()),
('user-tourist-001', 'tourist@visitor.com', 'Anna Tourist', '$2b$10$mock', 'PASSENGER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set up some real-time trip offers for testing acceptance modal
INSERT INTO "TripOffer" (
  id,
  "tripId", 
  "driverId",
  "offeredAt",
  "expiresAt",
  status,
  "responseTime",
  metadata
) VALUES
-- Active offer for testing acceptance modal
(
  'offer-test-123',
  'trip-available-456',
  'test-driver-123', 
  NOW() - INTERVAL '30 seconds',
  NOW() + INTERVAL '60 seconds', 
  'PENDING',
  null,
  '{"urgency": "normal", "estimated_earnings": 120000, "distance": 35}'
) ON CONFLICT (id) DO UPDATE SET
  "expiresAt" = NOW() + INTERVAL '60 seconds',
  status = 'PENDING';

-- Update driver statistics based on the data we've created
UPDATE "Driver" 
SET 
  rating = 4.8,
  "reviewCount" = 5,
  "completedTrips" = 89,
  "totalDistance" = 15240.5,
  "totalEarnings" = 785000.00,
  "onTimePercentage" = 96.5,
  "cancellationRate" = 2.1,
  "last_activity_at" = NOW(),
  "updatedAt" = NOW()
WHERE id = 'test-driver-123';

COMMIT;

-- Success message
SELECT 
  'Test driver test-driver-123 created successfully!' as message,
  'Driver Profile: http://localhost:3002/drivers/test-driver-123' as profile_url,
  'Dashboard API: http://localhost:3002/api/drivers/test-driver-123/dashboard' as dashboard_api,
  'Available Trips: http://localhost:3002/api/drivers/trips/available' as trips_api;
