const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDriver() {
  try {
    console.log('Creating test driver data...');
    
    // Create user first
    const user = await prisma.user.upsert({
      where: { id: 'test-driver-123' },
      update: {
        name: 'Alex Johnson',
        role: 'DRIVER',
        emailVerified: true,
      },
      create: {
        id: 'test-driver-123',
        email: 'test.driver@steppergo.com',
        name: 'Alex Johnson',
        passwordHash: '$2b$10$mock',
        role: 'DRIVER',
        emailVerified: true,
      }
    });
    
    console.log('User created:', user.id, user.name);
    
    // Create driver
    const driver = await prisma.driver.upsert({
      where: { id: 'test-driver-123' },
      update: {
        status: 'APPROVED',
        rating: 4.8,
        completedTrips: 89,
      },
      create: {
        id: 'test-driver-123',
        userId: 'test-driver-123',
        status: 'APPROVED',
        vehicleType: 'Sedan',
        vehicleModel: 'Camry',
        vehicleMake: 'Toyota',
        vehicleYear: 2020,
        licensePlate: 'ABC123KZ',
        licenseNumber: 'DL12345678',
        licenseExpiry: new Date('2026-12-31'),
        documentsUrl: { license: 'url1' },
        driverId: 'DRV-20241115-00123',
        appliedAt: new Date(),
        bio: 'Professional driver with 5+ years experience.',
        rating: 4.8,
        completedTrips: 89,
        yearsExperience: 5,
        verificationLevel: 'PREMIUM',
        isVerified: true,
        availability: 'AVAILABLE',
        fullName: 'Alex Johnson',
        homeCity: 'Almaty',
      }
    });
    
    console.log('Driver created:', driver.id, driver.status);
    
    // Verify the data
    const verification = await prisma.driver.findUnique({
      where: { id: 'test-driver-123' },
      include: { user: true }
    });
    
    console.log('Verification:', verification ? {
      driverId: verification.id,
      userName: verification.user.name,
      status: verification.status
    } : 'NOT FOUND');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriver();
