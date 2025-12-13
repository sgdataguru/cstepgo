-- Add missing columns to Trip table
DO $$ 
BEGIN
  -- Add trip_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'trip_type'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "trip_type" TEXT DEFAULT 'PRIVATE';
    
    -- Create TripType enum if it doesn't exist
    DO $enum$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TripType') THEN
        CREATE TYPE "TripType" AS ENUM ('PRIVATE', 'SHARED');
      END IF;
    END $enum$;
    
    -- Convert column to enum type
    ALTER TABLE "Trip" ALTER COLUMN "trip_type" TYPE "TripType" USING "trip_type"::"TripType";
    
    RAISE NOTICE 'Added trip_type column';
  END IF;

  -- Add zone column if it doesn't exist  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'zone'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "zone" TEXT;
    
    -- Create TripZone enum if it doesn't exist
    DO $enum$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TripZone') THEN
        CREATE TYPE "TripZone" AS ENUM ('ZONE_A', 'ZONE_B', 'ZONE_C');
      END IF;
    END $enum$;
    
    -- Convert column to enum type (nullable)
    ALTER TABLE "Trip" ALTER COLUMN "zone" TYPE "TripZone" USING "zone"::"TripZone";
    
    RAISE NOTICE 'Added zone column';
  END IF;

  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "tenant_id" TEXT;
    RAISE NOTICE 'Added tenant_id column';
  END IF;

  -- Add price_per_seat column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'price_per_seat'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "price_per_seat" DECIMAL(65,30);
    RAISE NOTICE 'Added price_per_seat column';
  END IF;

  -- Add estimated_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'estimated_days'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "estimated_days" INTEGER;
    RAISE NOTICE 'Added estimated_days column';
  END IF;

  -- Add distance column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Trip' AND column_name = 'distance'
  ) THEN
    ALTER TABLE "Trip" ADD COLUMN "distance" DOUBLE PRECISION;
    RAISE NOTICE 'Added distance column';
  END IF;
END $$;
