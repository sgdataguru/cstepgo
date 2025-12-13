import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test passenger account...');

  const email = 'testpassenger@steppergo.com';
  const password = 'Passenger123!';
  const name = 'Test Passenger';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('⚠️ User already exists:', existingUser.email);
    console.log('\n📋 TEST PASSENGER CREDENTIALS:');
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${existingUser.id}`);
    await prisma.$disconnect();
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user with PASSENGER role
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'PASSENGER',
      emailVerified: true,
      phoneVerified: false,
      phone: '+1234567890',
      avatar: null,
      bio: 'Test passenger account for development'
    }
  });

  console.log('✅ Test passenger created successfully!');
  console.log('\n📋 TEST PASSENGER CREDENTIALS:');
  console.log('================================');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`User ID: ${user.id}`);
  console.log(`Role: ${user.role}`);
  console.log('\n🔗 Login URL: http://localhost:3000/auth/login');
  console.log('🔗 My Trips: http://localhost:3000/my-trips');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error creating test passenger:', e);
  prisma.$disconnect();
  process.exit(1);
});
