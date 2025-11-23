const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      take: 5,
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (drivers.length === 0) {
      console.log('❌ No drivers found in database');
      console.log('Run: npx tsx prisma/seed-driver.ts');
    } else {
      console.log('✅ Found drivers:\n');
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. Driver ID: ${driver.id}`);
        console.log(`   Name: ${driver.user.name}`);
        console.log(`   Email: ${driver.user.email}`);
        console.log(`   Test URL: http://localhost:3002/drivers/${driver.id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getDrivers();
