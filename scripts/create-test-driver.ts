import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Driver123!';

async function createTestDriver() {
  console.log('\n🚗 Creating Test Driver Account...\n');
  console.log('═'.repeat(50));

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    
    // Check if test driver user exists
    let testUser = await prisma.user.findFirst({
      where: { email: 'testdriver@steppergo.com' }
    });

    if (testUser) {
      console.log('⚠️  Test driver user already exists. Updating password...');
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { passwordHash }
      });
    } else {
      // Create test driver user
      testUser = await prisma.user.create({
        data: {
          email: 'testdriver@steppergo.com',
          name: 'Test Driver',
          phone: '+77001234567',
          passwordHash,
          role: 'DRIVER',
          emailVerified: true,
          phoneVerified: true,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        },
      });
      console.log('✅ Test driver user created');
    }

    // Check if driver profile exists
    let driver = await prisma.driver.findFirst({
      where: { userId: testUser.id }
    });

    const driverId = `DRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-TEST1`;

    if (driver) {
      console.log('✅ Driver profile already exists');
    } else {
      // Create driver profile
      driver = await prisma.driver.create({
        data: {
          userId: testUser.id,
          driverId,
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          
          // Vehicle info
          vehicleType: 'SEDAN',
          vehicleModel: 'Camry',
          vehicleMake: 'Toyota',
          vehicleYear: 2022,
          licensePlate: 'TEST123',
          vehicleColor: 'Black',
          passengerCapacity: 4,
          luggageCapacity: 3,
          
          // License
          licenseNumber: 'KZ7654321',
          licenseExpiry: new Date('2027-12-31'),
          documentsUrl: { documents: [] },
          
          // Profile
          bio: 'Professional test driver for StepperGO platform testing. Available for all trip types.',
          yearsExperience: 5,
          fullName: 'Test Driver',
          homeCity: 'Almaty',
          
          // Languages
          languages: [
            { code: 'en', name: 'English', proficiency: 'FLUENT' },
            { code: 'ru', name: 'Russian', proficiency: 'FLUENT' }
          ],
          
          // Verification
          verificationLevel: 'STANDARD',
          isVerified: true,
          verificationBadges: [
            { type: 'IDENTITY', status: 'VERIFIED', verifiedDate: new Date() },
            { type: 'LICENSE', status: 'VERIFIED', verifiedDate: new Date() }
          ],
          
          // Stats
          rating: 4.8,
          reviewCount: 25,
          completedTrips: 50,
          totalDistance: 5000,
          totalEarnings: 500000,
          onTimePercentage: 97.5,
          cancellationRate: 2.0,
          responseTime: '< 30 min',
          
          // Availability
          availability: 'AVAILABLE',
          currentLocation: 'Almaty',
          
          // Dates
          appliedAt: new Date(),
          approvedAt: new Date(),
        },
      });
      console.log('✅ Driver profile created');
    }

    console.log('\n' + '═'.repeat(50));
    console.log('\n🎉 TEST DRIVER CREDENTIALS:\n');
    console.log('   📧 Email:    testdriver@steppergo.com');
    console.log('   🔑 Password: ' + TEST_PASSWORD);
    console.log('   🆔 Driver ID: ' + (driver?.driverId || driverId));
    console.log('\n   �� Login URL: http://localhost:3000/driver/login');
    console.log('\n' + '═'.repeat(50));
    console.log('\n📋 DRIVER PORTAL URLS TO TEST:\n');
    console.log('   • Dashboard:     http://localhost:3000/driver/dashboard');
    console.log('   • Portal:        http://localhost:3000/driver/portal/dashboard');
    console.log('   • Profile:       http://localhost:3000/driver/portal/profile');
    console.log('   • Earnings:      http://localhost:3000/driver/portal/earnings');
    console.log('   • Ratings:       http://localhost:3000/driver/portal/ratings');
    console.log('   • Notifications: http://localhost:3000/driver/portal/notifications');
    console.log('   • Help:          http://localhost:3000/driver/portal/help');
    console.log('   • Public Profile: http://localhost:3000/drivers/' + testUser.id);
    console.log('\n' + '═'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error creating test driver:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriver();
