import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreTrips() {
  console.log('🌟 Adding more sample trips...');

  try {
    // Get the first driver user
    const driver = await prisma.user.findFirst({
      where: { role: 'DRIVER' },
    });

    if (!driver) {
      throw new Error('No driver found. Please run the main seed script first.');
    }

    // Get driver profile
    const driverProfile = await prisma.driver.findUnique({
      where: { userId: driver.id },
    });

    // Create multiple trips
    const trips = [
      {
        title: 'Bishkek to Osh - Mountain Adventure',
        description: 'Scenic journey through the Kyrgyz mountains with stops at beautiful viewpoints',
        origin: { name: 'Bishkek', address: 'Bishkek, Kyrgyzstan', lat: 42.8746, lng: 74.5698 },
        destination: { name: 'Osh', address: 'Osh, Kyrgyzstan', lat: 40.5283, lng: 72.7985 },
        departureTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        returnTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 1,
        basePrice: 12000,
        platformFee: 1800,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Bishkek to Osh',
              activities: [
                {
                  id: '1',
                  startTime: '06:00',
                  endTime: '10:00',
                  location: { name: 'Bishkek Central' },
                  type: 'transport',
                  description: 'Depart from Bishkek',
                  order: 1,
                },
                {
                  id: '2',
                  startTime: '10:00',
                  endTime: '11:00',
                  location: { name: 'Toktogul Reservoir' },
                  type: 'activity',
                  description: 'Photo stop at beautiful reservoir',
                  order: 2,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['Mountain Route', 'Scenic'], 
          tags: ['adventure', 'nature'],
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        },
      },
      {
        title: 'Almaty to Shymkent Express',
        description: 'Direct route with comfortable SUV, perfect for business travelers',
        origin: { name: 'Almaty', address: 'Almaty, Kazakhstan', lat: 43.222, lng: 76.8512 },
        destination: { name: 'Shymkent', address: 'Shymkent, Kazakhstan', lat: 42.3417, lng: 69.5901 },
        departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        returnTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        totalSeats: 3,
        availableSeats: 3,
        basePrice: 18000,
        platformFee: 2700,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Fast Express Route',
              activities: [
                {
                  id: '1',
                  startTime: '08:00',
                  location: { name: 'Almaty Airport' },
                  type: 'transport',
                  description: 'Pick up from airport or city center',
                  order: 1,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['Express', 'Business'], 
          tags: ['fast', 'comfortable'],
          imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800'
        },
      },
      {
        title: 'Tashkent to Samarkand - Silk Road Journey',
        description: 'Experience the ancient Silk Road with cultural stops',
        origin: { name: 'Tashkent', address: 'Tashkent, Uzbekistan', lat: 41.2995, lng: 69.2401 },
        destination: { name: 'Samarkand', address: 'Samarkand, Uzbekistan', lat: 39.6270, lng: 66.9750 },
        departureTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        returnTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 2,
        basePrice: 8500,
        platformFee: 1275,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Silk Road Heritage',
              activities: [
                {
                  id: '1',
                  startTime: '07:00',
                  endTime: '11:00',
                  location: { name: 'Tashkent' },
                  type: 'transport',
                  description: 'Depart from Tashkent',
                  order: 1,
                },
                {
                  id: '2',
                  startTime: '11:00',
                  endTime: '12:00',
                  location: { name: 'Jizzakh' },
                  type: 'meal',
                  description: 'Traditional Uzbek lunch',
                  order: 2,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['Cultural', 'Historic'], 
          tags: ['culture', 'heritage'],
          imageUrl: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800'
        },
      },
      {
        title: 'Almaty City Tour & Transfer',
        description: 'City tour with transfer to airport or nearby cities',
        origin: { name: 'Almaty Downtown', address: 'Almaty Center, Kazakhstan', lat: 43.2380, lng: 76.9450 },
        destination: { name: 'Almaty Airport', address: 'Almaty International Airport', lat: 43.3521, lng: 77.0405 },
        departureTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        returnTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 4,
        basePrice: 3500,
        platformFee: 525,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'City Highlights',
              activities: [
                {
                  id: '1',
                  startTime: '09:00',
                  endTime: '10:00',
                  location: { name: 'Panfilov Park' },
                  type: 'activity',
                  description: 'Visit historic park',
                  order: 1,
                },
                {
                  id: '2',
                  startTime: '10:30',
                  endTime: '11:30',
                  location: { name: 'Kok Tobe' },
                  type: 'activity',
                  description: 'Mountain viewpoint',
                  order: 2,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['City Tour', 'Airport Transfer'], 
          tags: ['sightseeing', 'convenient'],
          imageUrl: 'https://images.unsplash.com/photo-1591848478625-de43268e6fb8?w=800'
        },
      },
      {
        title: 'Issyk-Kul Lake Weekend Getaway',
        description: 'Relax by the pearl of Central Asia - Issyk-Kul Lake',
        origin: { name: 'Bishkek', address: 'Bishkek, Kyrgyzstan', lat: 42.8746, lng: 74.5698 },
        destination: { name: 'Cholpon-Ata', address: 'Cholpon-Ata, Kyrgyzstan', lat: 42.6484, lng: 77.0822 },
        departureTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        returnTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 2,
        basePrice: 9500,
        platformFee: 1425,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Journey to Issyk-Kul',
              activities: [
                {
                  id: '1',
                  startTime: '08:00',
                  endTime: '12:00',
                  location: { name: 'Bishkek to Cholpon-Ata' },
                  type: 'transport',
                  description: 'Scenic drive to the lake',
                  order: 1,
                },
                {
                  id: '2',
                  startTime: '14:00',
                  endTime: '17:00',
                  location: { name: 'Beach Time' },
                  type: 'activity',
                  description: 'Relax at the beach',
                  order: 2,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['Weekend Trip', 'Beach'], 
          tags: ['relaxation', 'nature', 'weekend'],
          imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
        },
      },
      {
        title: 'Astana Business Express',
        description: 'Premium business class ride to the capital',
        origin: { name: 'Almaty', address: 'Almaty, Kazakhstan', lat: 43.222, lng: 76.8512 },
        destination: { name: 'Astana', address: 'Astana, Kazakhstan', lat: 51.1694, lng: 71.4491 },
        departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        returnTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        totalSeats: 3,
        availableSeats: 1,
        basePrice: 25000,
        platformFee: 3750,
        itinerary: {
          version: '1.0',
          days: [
            {
              dayNumber: 1,
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              title: 'Direct to Capital',
              activities: [
                {
                  id: '1',
                  startTime: '06:00',
                  endTime: '18:00',
                  location: { name: 'Almaty to Astana' },
                  type: 'transport',
                  description: 'Non-stop premium ride',
                  order: 1,
                },
              ],
            },
          ],
        },
        metadata: { 
          badges: ['Premium', 'Business'], 
          tags: ['business', 'premium', 'fast'],
          imageUrl: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800'
        },
      },
    ];

    console.log(`📝 Creating ${trips.length} new trips...`);

    for (const tripData of trips) {
      const trip = await prisma.trip.create({
        data: {
          title: tripData.title,
          description: tripData.description,
          organizerId: driver.id,
          driverId: driverProfile?.id,
          departureTime: tripData.departureTime,
          returnTime: tripData.returnTime,
          timezone: 'Asia/Almaty',
          originName: tripData.origin.name,
          originAddress: tripData.origin.address,
          originLat: tripData.origin.lat,
          originLng: tripData.origin.lng,
          destName: tripData.destination.name,
          destAddress: tripData.destination.address,
          destLat: tripData.destination.lat,
          destLng: tripData.destination.lng,
          totalSeats: tripData.totalSeats,
          availableSeats: tripData.availableSeats,
          basePrice: tripData.basePrice,
          currency: 'KZT',
          platformFee: tripData.platformFee,
          itinerary: JSON.stringify(tripData.itinerary),
          status: 'PUBLISHED',
          metadata: JSON.stringify(tripData.metadata),
          publishedAt: new Date(),
        },
      });

      console.log(`✅ Created: ${trip.title}`);
    }

    console.log('\n🎉 Successfully added more sample trips!');
    console.log(`📊 Total trips in database: ${trips.length + 2} (including original seed data)`);
  } catch (error) {
    console.error('❌ Error adding trips:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMoreTrips()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
