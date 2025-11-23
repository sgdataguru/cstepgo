const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDamir() {
  try {
    console.log('🌱 Creating Damir driver profile...\n');

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: 'damir@steppergo.com' }
    });

    if (!user) {
      console.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'damir@steppergo.com',
          phone: '+77001234567',
          name: 'Damir',
          passwordHash: '$2a$10$dummyHashForTestingPurposesOnly',
          role: 'DRIVER',
          emailVerified: true,
          phoneVerified: true,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          bio: 'Professional driver with 8 years of experience in Kazakhstan'
        }
      });
      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Test user already exists\n');
    }

    // Check if driver profile exists
    let driver = await prisma.driver.findFirst({
      where: { userId: user.id }
    });

    if (!driver) {
      console.log('Creating driver profile...');
      
      // Get current schema to know which fields exist
      const driverData = {
        userId: user.id,
        status: 'APPROVED',
        vehicleType: 'MINIBUS',
        vehicleModel: 'Sprinter',
        vehicleMake: 'Mercedes-Benz',
        vehicleYear: 2020,
        licensePlate: 'A123BC77',
        vehicleColor: 'White',
        licenseNumber: 'KZ1234567',
        licenseExpiry: new Date('2026-12-31'),
        documentsUrl: { documents: [] },
        rating: 4.9,
        completedTrips: 450,
        totalEarnings: 15000000,
        appliedAt: new Date('2024-01-01'),
        approvedAt: new Date('2024-01-15')
      };

      // Add new fields if they exist (after migration)
      try {
        driverData.bio = 'Experienced professional driver with 8 years of service in Kazakhstan. Specializing in comfortable long-distance trips across Central Asia. Fluent in multiple languages and committed to passenger safety and comfort.';
        driverData.coverPhotoUrl = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200';
        driverData.yearsExperience = 8;
        driverData.languages = [
          { code: 'en', name: 'English', proficiency: 'FLUENT' },
          { code: 'ru', name: 'Russian', proficiency: 'NATIVE' },
          { code: 'kk', name: 'Kazakh', proficiency: 'NATIVE' }
        ];
        driverData.verificationBadges = [
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
        ];
        driverData.verificationLevel = 'PREMIUM';
        driverData.isVerified = true;
        driverData.reviewCount = 120;
        driverData.totalDistance = 125000;
        driverData.onTimePercentage = 98.5;
        driverData.cancellationRate = 1.2;
        driverData.responseTime = '< 1 hour';
        driverData.availability = 'AVAILABLE';
        driverData.currentLocation = 'Currently in Almaty';
        driverData.passengerCapacity = 12;
        driverData.luggageCapacity = 10;
      } catch (e) {
        console.log('Note: Using basic driver data (extended fields not yet migrated)');
      }

      driver = await prisma.driver.create({
        data: driverData
      });

      console.log('✅ Driver profile created');
      console.log(`   Driver ID: ${driver.id}\n`);
    } else {
      console.log('✅ Driver profile already exists');
      console.log(`   Driver ID: ${driver.id}\n`);
    }

    // Try to create vehicle if the table exists
    try {
      const existingVehicle = await prisma.vehicle.findFirst({
        where: { driverId: driver.id }
      });

      if (!existingVehicle) {
        console.log('Creating vehicle...');
        await prisma.vehicle.create({
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
              'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
              'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'
            ],
            insuranceExpiryDate: new Date('2025-12-31'),
            registrationExpiryDate: new Date('2025-12-31'),
            isActive: true
          }
        });
        console.log('✅ Vehicle created\n');
      } else {
        console.log('✅ Vehicle already exists\n');
      }
    } catch (e) {
      console.log('⚠️  Vehicle table not yet created (migration pending)\n');
    }

    // Try to create reviews if the table exists
    try {
      const existingReviews = await prisma.review.count({
        where: { driverId: driver.id }
      });

      if (existingReviews === 0) {
        console.log('Creating sample reviews...');
        
        const reviews = [
          {
            rating: 5,
            comment: 'Excellent driver! Very professional and punctual. The Mercedes Sprinter was comfortable and clean. Damir made our trip to Charyn Canyon unforgettable.',
            reviewerId: 'user_001',
            reviewerName: 'Sarah Johnson',
            reviewerPhotoUrl: 'https://i.pravatar.cc/150?img=1',
            response: 'Thank you for your kind words! It was a pleasure driving your group.',
            respondedAt: new Date('2024-10-15')
          },
          {
            rating: 5,
            comment: 'Best driver experience we\'ve had in Kazakhstan. Spoke perfect English and knew all the best photo spots!',
            reviewerId: 'user_002',
            reviewerName: 'Michael Chen',
            reviewerPhotoUrl: 'https://i.pravatar.cc/150?img=2'
          },
          {
            rating: 4,
            comment: 'Great trip to Charyn Canyon. Vehicle was spacious and comfortable for our family of 6.',
            reviewerId: 'user_003',
            reviewerName: 'Emma Wilson',
            reviewerPhotoUrl: 'https://i.pravatar.cc/150?img=3'
          },
          {
            rating: 5,
            comment: 'Perfect for our multi-day trip. Damir was flexible with our schedule and very knowledgeable about the region.',
            reviewerId: 'user_004',
            reviewerName: 'David Martinez',
            reviewerPhotoUrl: 'https://i.pravatar.cc/150?img=4',
            response: 'I\'m glad I could help make your Central Asia trip special!',
            respondedAt: new Date('2024-09-20')
          },
          {
            rating: 5,
            comment: 'Highly professional service. The vehicle was immaculate and Damir went above and beyond to ensure our comfort.',
            reviewerId: 'user_005',
            reviewerName: 'Anna Petrova',
            reviewerPhotoUrl: 'https://i.pravatar.cc/150?img=5'
          }
        ];

        for (const reviewData of reviews) {
          await prisma.review.create({
            data: {
              ...reviewData,
              driverId: driver.id,
              tripId: 'dummy_trip_' + Math.random().toString(36).substring(7)
            }
          });
        }

        console.log('✅ Created 5 sample reviews\n');
      } else {
        console.log('✅ Reviews already exist\n');
      }
    } catch (e) {
      console.log('⚠️  Review table not yet created (migration pending)\n');
    }

    console.log('🎉 Seeding completed successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 TEST INFORMATION');
    console.log('═══════════════════════════════════════');
    console.log(`Driver ID: ${driver.id}`);
    console.log(`Driver Name: ${user.name}`);
    console.log(`Test URL: http://localhost:3002/drivers/${driver.id}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDamir();
