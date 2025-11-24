-- Create ultra-minimal test driver data for test-driver-123

BEGIN;

-- Create just the driver user
INSERT INTO "User" (id, email, name, "passwordHash", role, "emailVerified", "createdAt", "updatedAt")
VALUES ('test-driver-123', 'test.driver@steppergo.com', 'Alex Johnson', '$2b$10$mock', 'DRIVER', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "updatedAt" = NOW();

-- Create minimal driver profile with just required fields
INSERT INTO "Driver" (
  id,
  "userId",
  status,
  "vehicleType", 
  "vehicleModel",
  "vehicleMake",
  "vehicleYear",
  "licensePlate",
  "licenseNumber",
  "licenseExpiry",
  "documentsUrl",
  "driverId",
  "appliedAt"
) VALUES (
  'test-driver-123',
  'test-driver-123',
  'APPROVED',
  'Sedan',
  'Camry',
  'Toyota', 
  2020,
  'ABC123KZ',
  'DL12345678',
  '2026-12-31 23:59:59',
  '{"license": "url1"}',
  'DRV-20241115-00123',
  NOW()
) ON CONFLICT (id) DO UPDATE SET status = 'APPROVED';

COMMIT;

SELECT 'Test driver created!' as result;
