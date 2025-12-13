const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to Trip table...');
    
    // First, check and add trip_type column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'trip_type'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "trip_type" "TripType" DEFAULT 'PRIVATE';
          RAISE NOTICE 'Added trip_type column';
        ELSE
          RAISE NOTICE 'trip_type column already exists';
        END IF;
      END $$;
    `);

    // Add zone column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'zone'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "zone" "TripZone";
          RAISE NOTICE 'Added zone column';
        ELSE
          RAISE NOTICE 'zone column already exists';
        END IF;
      END $$;
    `);

    // Add tenant_id column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "tenant_id" TEXT;
          RAISE NOTICE 'Added tenant_id column';
        ELSE
          RAISE NOTICE 'tenant_id column already exists';
        END IF;
      END $$;
    `);

    // Add price_per_seat column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'price_per_seat'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "price_per_seat" DECIMAL(65,30);
          RAISE NOTICE 'Added price_per_seat column';
        ELSE
          RAISE NOTICE 'price_per_seat column already exists';
        END IF;
      END $$;
    `);

    // Add estimated_days column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'estimated_days'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "estimated_days" INTEGER;
          RAISE NOTICE 'Added estimated_days column';
        ELSE
          RAISE NOTICE 'estimated_days column already exists';
        END IF;
      END $$;
    `);

    // Add distance column
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Trip' AND column_name = 'distance'
        ) THEN
          ALTER TABLE "Trip" ADD COLUMN "distance" DOUBLE PRECISION;
          RAISE NOTICE 'Added distance column';
        ELSE
          RAISE NOTICE 'distance column already exists';
        END IF;
      END $$;
    `);

    console.log('✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
