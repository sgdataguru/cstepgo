const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrivateCabBooking() {
  try {
    // Find test accounts
    const passenger = await prisma.user.findFirst({ 
      where: { email: { contains: 'passenger' }}
    });
    
    const driver = await prisma.driver.findFirst({ 
      where: { 
        user: { email: { contains: 'driver' }},
        status: 'APPROVED'
      },
      include: { user: true }
    });
    
    console.log('\n📋 TEST ACCOUNTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Passenger:', passenger?.email || 'Not found');
    console.log('Driver:', driver?.user?.email || 'Not found');
    console.log('Driver ID:', driver?.id || 'N/A');
    
    if (!passenger || !driver) {
      console.log('\n❌ Missing test accounts. Please create them first.');
      return;
    }
    
    // Create a PRIVATE trip
    const trip = await prisma.trip.create({
      data: {
        title: 'Private Cab to Mega Center',
        description: 'Need a private cab from Dostyk Plaza to Mega Center',
        passengerId: passenger.id,
        tripType: 'PRIVATE',
        status: 'PUBLISHED',
        originAddress: 'Almaty, Dostyk Plaza',
        originLat: 43.238949,
        originLng: 76.945465,
        destinationAddress: 'Almaty, Mega Center',
        destinationLat: 43.265200,
        destinationLng: 76.957300,
        departureTime: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
        estimatedPrice: 2500,
        currency: 'KZT',
        seatsNeeded: 1,
        notes: 'Test private cab booking',
      }
    });
    
    console.log('\n✅ PRIVATE TRIP CREATED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Trip ID:', trip.id);
    console.log('Type:', trip.tripType);
    console.log('Status:', trip.status);
    console.log('From:', trip.originAddress);
    console.log('To:', trip.destinationAddress);
    console.log('Price:', trip.estimatedPrice, trip.currency);
    
    // Check what trips the driver can see
    const availableTrips = await prisma.trip.findMany({
      where: {
        status: { in: ['PUBLISHED', 'OFFERED'] },
        tripType: 'PRIVATE',
        driverId: null,
        departureTime: { gt: new Date() }
      },
      include: {
        passenger: { select: { firstName: true, lastName: true }}
      },
      orderBy: { departureTime: 'asc' },
      take: 5
    });
    
    console.log('\n🚗 TRIPS AVAILABLE FOR DRIVER:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    availableTrips.forEach((t, i) => {
      console.log(`${i+1}. ${t.tripType} - ${t.originAddress} → ${t.destinationAddress}`);
      console.log(`   Passenger: ${t.passenger?.firstName} ${t.passenger?.lastName}`);
      console.log(`   Price: ${t.estimatedPrice} ${t.currency}`);
      console.log(`   ID: ${t.id}`);
      console.log('');
    });
    
    console.log('\n📱 TEST URLS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Passenger Login: http://localhost:3000/auth/login');
    console.log('Driver Portal:   http://localhost:3000/driver/portal');
    console.log('Driver Trips:    http://localhost:3000/driver/trips');
    console.log('Trip Discover:   http://localhost:3000/api/drivers/trips/discover?driverId=' + driver.id);
    
    console.log('\n🔑 TEST CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Passenger: testpassenger@steppergo.com / Passenger123!');
    console.log('Driver:    testdriver@steppergo.com / Driver123!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrivateCabBooking();
