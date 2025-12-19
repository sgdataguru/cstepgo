import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  console.log('Creating users...');
  
  const passwordHash = await hash('password123', 10);

  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@test.com' },
    update: {},
    create: {
      email: 'passenger@test.com',
      phone: '+77012345678',
      name: 'Test Passenger',
      passwordHash,
      role: 'PASSENGER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      email: 'driver@test.com',
      phone: '+77012345679',
      name: 'Test Driver',
      passwordHash,
      role: 'DRIVER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      phone: '+77012345680',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create driver profile
  console.log('Creating driver profile...');

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      driverId: `DRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEMO1`,
      status: 'APPROVED',
      vehicleType: 'sedan',
      vehicleModel: 'Toyota Camry',
      vehicleMake: 'Toyota',
      vehicleYear: 2020,
      licensePlate: 'A123BC',
      vehicleColor: 'Silver',
      licenseNumber: 'KZ12345678',
      licenseExpiry: new Date('2026-12-31'),
      documentsUrl: JSON.stringify([
        '/documents/license.pdf',
        '/documents/vehicle-registration.pdf',
      ]) as any,
      rating: 4.8,
      completedTrips: 25,
      approvedAt: new Date(),
    },
  });

  console.log('✅ Driver profile created');

  // Create sample trips
  console.log('Creating sample trips...');

  const trip1 = await prisma.trip.create({
    data: {
      title: 'Almaty to Bishkek - Weekend Trip',
      description: 'Comfortable ride from Almaty to Bishkek with scenic stops',
      organizerId: driverUser.id,
      driverId: driver.id,
      departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      returnTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      timezone: 'Asia/Almaty',
      originName: 'Almaty',
      originAddress: 'Almaty, Kazakhstan',
      originLat: 43.2220,
      originLng: 76.8512,
      destName: 'Bishkek',
      destAddress: 'Bishkek, Kyrgyzstan',
      destLat: 42.8746,
      destLng: 74.5698,
      totalSeats: 4,
      availableSeats: 2,
      basePrice: 6500,
      currency: 'KZT',
      platformFee: 975, // 15%
      status: 'PUBLISHED',
      itinerary: JSON.stringify({
        version: '1.0',
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Almaty to Bishkek',
            activities: [
              {
                id: '1',
                startTime: '08:00',
                endTime: '09:00',
                location: { name: 'Almaty Central Bus Station' },
                type: 'transport',
                description: 'Departure from Almaty',
                order: 1,
              },
            ],
          },
        ],
      }),
      metadata: JSON.stringify({
        badges: ['Best Selling', 'Top Rated'],
        tags: ['scenic', 'comfortable'],
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      }),
      publishedAt: new Date(),
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      title: 'Astana to Shymkent Express',
      description: 'Fast and comfortable journey across Kazakhstan',
      organizerId: driverUser.id,
      driverId: driver.id,
      departureTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      returnTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      timezone: 'Asia/Almaty',
      originName: 'Astana',
      originAddress: 'Astana, Kazakhstan',
      originLat: 51.1694,
      originLng: 71.4491,
      destName: 'Shymkent',
      destAddress: 'Shymkent, Kazakhstan',
      destLat: 42.3417,
      destLng: 69.5901,
      totalSeats: 4,
      availableSeats: 4,
      basePrice: 15000,
      currency: 'KZT',
      platformFee: 2250,
      status: 'PUBLISHED',
      itinerary: JSON.stringify({
        version: '1.0',
        days: [
          {
            dayNumber: 1,
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Astana to Shymkent',
            activities: [],
          },
        ],
      }),
      metadata: JSON.stringify({
        badges: ['Express', 'Popular'],
        tags: ['fast', 'express'],
        imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
      }),
      publishedAt: new Date(),
    },
  });

  console.log('✅ Sample trips created');

  // Create a test booking
  console.log('Creating test booking...');

  const booking = await prisma.booking.create({
    data: {
      tripId: trip1.id,
      userId: passenger.id,
      status: 'CONFIRMED',
      seatsBooked: 2,
      totalAmount: 13000, // 6500 * 2
      currency: 'KZT',
      passengers: JSON.stringify([
        {
          name: 'John Doe',
          phone: '+77012345678',
          email: 'john@test.com',
        },
        {
          name: 'Jane Doe',
          phone: '+77012345679',
          email: 'jane@test.com',
        },
      ]),
      confirmedAt: new Date(),
    },
  });

  console.log('✅ Test booking created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 3 (1 passenger, 1 driver, 1 admin)`);
  console.log(`- Drivers: 1 (approved)`);
  console.log(`- Trips: 2 (both published)`);
  console.log(`- Bookings: 1 (confirmed)`);
  console.log('\n🔑 Test Credentials:');
  console.log('Passenger: passenger@test.com / password123');
  console.log('Driver: driver@test.com / password123');
  console.log('Admin: admin@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
