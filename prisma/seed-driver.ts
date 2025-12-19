import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDriverData() {
  console.log('🌱 Seeding driver profile data...\n');

  try {
    // Check if we have any users first
    let testUser = await prisma.user.findFirst({
      where: { email: 'damir@steppergo.com' }
    });

    // Create test user if doesn't exist
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'damir@steppergo.com',
          name: 'Damir',
          phone: '+77001234567',
          passwordHash: 'hashed_password_here', // In real app, use proper hashing
          role: 'DRIVER',
          emailVerified: true,
          phoneVerified: true,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        },
      });
      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Test user already exists\n');
    }

    // Check if driver profile exists
    let driver = await prisma.driver.findFirst({
      where: { userId: testUser.id }
    });

    if (!driver) {
      console.log('Creating driver profile...');
      
      // Generate driver ID
      const driverId = `DRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      driver = await prisma.driver.create({
        data: {
          userId: testUser.id,
          driverId,
          status: 'APPROVED',
          
          // Vehicle info (legacy fields - still required)
          vehicleType: 'MINIBUS',
          vehicleModel: 'Sprinter',
          vehicleMake: 'Mercedes-Benz',
          vehicleYear: 2020,
          licensePlate: 'A123BC77',
          vehicleColor: 'White',
          passengerCapacity: 12,
          luggageCapacity: 10,
          
          // License
          licenseNumber: 'KZ1234567',
          licenseExpiry: new Date('2026-12-31'),
          documentsUrl: { documents: [] } as any,
          
          // Profile information
          bio: 'Experienced professional driver with 8 years of service in Kazakhstan. Specializing in comfortable long-distance trips across Central Asia. Fluent in multiple languages and committed to passenger safety and comfort.',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200',
          yearsExperience: 8,
          
          // Languages
          languages: [
            { code: 'en', name: 'English', proficiency: 'FLUENT' },
            { code: 'ru', name: 'Russian', proficiency: 'NATIVE' },
            { code: 'kk', name: 'Kazakh', proficiency: 'NATIVE' }
          ] as any,
          
          // Verification
          verificationBadges: [
            { 
              type: 'IDENTITY', 
              status: 'VERIFIED', 
              verifiedDate: new Date('2024-01-15'),
              verifiedBy: 'System Admin'
            },
            { 
              type: 'LICENSE', 
              status: 'VERIFIED', 
              verifiedDate: new Date('2024-01-15'),
              expiryDate: new Date('2026-12-31')
            },
            { 
              type: 'INSURANCE', 
              status: 'VERIFIED', 
              verifiedDate: new Date('2024-06-01'),
              expiryDate: new Date('2025-06-01')
            },
            { 
              type: 'BACKGROUND_CHECK', 
              status: 'VERIFIED', 
              verifiedDate: new Date('2024-01-10')
            }
          ] as any,
          verificationLevel: 'PREMIUM',
          isVerified: true,
          
          // Performance stats
          rating: 4.9,
          reviewCount: 120,
          completedTrips: 450,
          totalDistance: 125000, // 125,000 km
          totalEarnings: 15000000, // 15M KZT
          onTimePercentage: 98.5,
          cancellationRate: 1.2,
          responseTime: '< 1 hour',
          
          // Availability
          availability: 'AVAILABLE',
          currentLocation: 'Currently in Almaty',
          
          // Dates
          appliedAt: new Date('2024-01-01'),
          approvedAt: new Date('2024-01-15'),
        },
      });
      console.log('✅ Driver profile created');
      console.log(`   Driver ID: ${driver.id}\n`);
    } else {
      console.log('✅ Driver profile already exists');
      console.log(`   Driver ID: ${driver.id}\n`);
    }

    // Create vehicles
    const existingVehicles = await prisma.vehicle.findMany({
      where: { driverId: driver.id }
    });

    if (existingVehicles.length === 0) {
      console.log('Creating vehicle...');
      const vehicle = await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          make: 'Mercedes-Benz',
          model: 'Sprinter',
          year: 2020,
          color: 'White',
          licensePlate: 'A123BC77',
          type: 'MINIBUS',
          passengerCapacity: 12,
          luggageCapacity: 10,
          amenities: [
            'WiFi',
            'Air Conditioning',
            'USB Charging Ports',
            'Comfortable Seats',
            'Audio System',
            'Large Windows'
          ],
          photos: [
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
            'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800',
            'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800'
          ],
          insuranceExpiryDate: new Date('2025-12-31'),
          registrationExpiryDate: new Date('2025-12-31'),
          isActive: true,
        },
      });
      console.log('✅ Vehicle created\n');
    } else {
      console.log(`✅ ${existingVehicles.length} vehicle(s) already exist\n`);
    }

    // Create sample reviews
    const existingReviews = await prisma.review.findMany({
      where: { driverId: driver.id }
    });

    if (existingReviews.length === 0) {
      console.log('Creating sample reviews...');
      
      const reviews = [
        {
          driverId: driver.id,
          tripId: 'trip_sample_1',
          rating: 5,
          comment: 'Excellent driver! Very professional and punctual. The vehicle was clean and comfortable. Highly recommend!',
          reviewerId: 'user_1',
          reviewerName: 'Sarah Johnson',
          reviewerPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
          response: 'Thank you for your kind words! It was a pleasure driving you.',
          respondedAt: new Date('2024-10-15'),
          createdAt: new Date('2024-10-14'),
        },
        {
          driverId: driver.id,
          tripId: 'trip_sample_2',
          rating: 5,
          comment: 'Best driver experience I\'ve had in Kazakhstan! Damir was very knowledgeable about the area and made great recommendations.',
          reviewerId: 'user_2',
          reviewerName: 'Michael Chen',
          reviewerPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          createdAt: new Date('2024-10-10'),
        },
        {
          driverId: driver.id,
          tripId: 'trip_sample_3',
          rating: 4,
          comment: 'Great trip to Charyn Canyon. Driver was friendly and spoke good English. Vehicle was comfortable.',
          reviewerId: 'user_3',
          reviewerName: 'Emma Wilson',
          reviewerPhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
          response: 'Thank you! Hope to drive you again soon.',
          respondedAt: new Date('2024-09-22'),
          createdAt: new Date('2024-09-20'),
        },
        {
          driverId: driver.id,
          tripId: 'trip_sample_4',
          rating: 5,
          comment: 'Perfect driver for our family trip. Very patient with kids and helped us with luggage. The minibus had everything we needed!',
          reviewerId: 'user_4',
          reviewerName: 'David Martinez',
          reviewerPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
          createdAt: new Date('2024-09-05'),
        },
        {
          driverId: driver.id,
          tripId: 'trip_sample_5',
          rating: 5,
          comment: 'Highly professional service. On time, clean vehicle, safe driving. Would definitely book again!',
          reviewerId: 'user_5',
          reviewerName: 'Anna Petrova',
          reviewerPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          createdAt: new Date('2024-08-28'),
        },
      ];

      await prisma.review.createMany({
        data: reviews,
      });
      
      console.log(`✅ Created ${reviews.length} sample reviews\n`);
    } else {
      console.log(`✅ ${existingReviews.length} review(s) already exist\n`);
    }

    console.log('🎉 Seeding completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 TEST INFORMATION');
    console.log('═══════════════════════════════════════');
    console.log(`Driver ID: ${driver.id}`);
    console.log(`Driver Name: Damir`);
    console.log(`Test URL: http://localhost:3002/drivers/${driver.id}`);
    console.log('═══════════════════════════════════════\n');

    return driver;

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDriverData()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
