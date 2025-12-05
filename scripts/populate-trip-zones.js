/**
 * Script to populate zone classification for existing trips
 * 
 * Run with: node scripts/populate-trip-zones.js
 * or: npm run script:populate-zones (if added to package.json)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Zone thresholds (must match tripZoneClassifier.ts)
const ZONE_THRESHOLDS = {
  ZONE_A_MAX_HOURS: 8,
  ZONE_B_MAX_HOURS: 48,
  ZONE_A_MAX_DISTANCE: 200,
  ZONE_B_MAX_DISTANCE: 600,
};

/**
 * Calculate trip duration in hours
 */
function calculateTripDurationHours(departureTime, returnTime) {
  const durationMs = new Date(returnTime).getTime() - new Date(departureTime).getTime();
  return durationMs / (1000 * 60 * 60);
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Classify trip into zone
 */
function classifyTrip(departureTime, returnTime, originLat, originLng, destLat, destLng, existingDistance) {
  const durationHours = calculateTripDurationHours(departureTime, returnTime);
  const distance = existingDistance || calculateDistance(originLat, originLng, destLat, destLng);
  
  let zone;
  if (
    durationHours <= ZONE_THRESHOLDS.ZONE_A_MAX_HOURS &&
    distance <= ZONE_THRESHOLDS.ZONE_A_MAX_DISTANCE
  ) {
    zone = 'ZONE_A';
  } else if (
    durationHours <= ZONE_THRESHOLDS.ZONE_B_MAX_HOURS &&
    distance <= ZONE_THRESHOLDS.ZONE_B_MAX_DISTANCE
  ) {
    zone = 'ZONE_B';
  } else {
    zone = 'ZONE_C';
  }
  
  const estimatedDays = Math.max(1, Math.ceil(durationHours / 24));
  
  return { zone, estimatedDays, distance };
}

/**
 * Main function to populate zones
 */
async function populateTripZones() {
  console.log('🚀 Starting trip zone population...\n');
  
  try {
    // Find all trips without zone classification
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { zone: null },
          { estimatedDays: null },
          { distance: null },
        ],
      },
      select: {
        id: true,
        title: true,
        departureTime: true,
        returnTime: true,
        originLat: true,
        originLng: true,
        destLat: true,
        destLng: true,
        distance: true,
        originName: true,
        destName: true,
      },
    });

    if (trips.length === 0) {
      console.log('✨ No trips need zone classification. All trips are up to date!');
      return;
    }

    console.log(`📊 Found ${trips.length} trips to classify\n`);

    let successCount = 0;
    let errorCount = 0;
    const zoneStats = {
      ZONE_A: 0,
      ZONE_B: 0,
      ZONE_C: 0,
    };

    for (const trip of trips) {
      try {
        const classification = classifyTrip(
          trip.departureTime,
          trip.returnTime,
          trip.originLat,
          trip.originLng,
          trip.destLat,
          trip.destLng,
          trip.distance
        );

        await prisma.trip.update({
          where: { id: trip.id },
          data: {
            zone: classification.zone,
            estimatedDays: classification.estimatedDays,
            distance: classification.distance,
          },
        });

        zoneStats[classification.zone]++;
        successCount++;

        console.log(`✅ ${trip.title}`);
        console.log(`   ${trip.originName} → ${trip.destName}`);
        console.log(`   Zone: ${classification.zone} | ${classification.estimatedDays} day(s) | ${Math.round(classification.distance)} km\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error classifying trip ${trip.id} (${trip.title}):`, error.message, '\n');
      }
    }

    // Print summary
    console.log('━'.repeat(60));
    console.log('📈 SUMMARY');
    console.log('━'.repeat(60));
    console.log(`Total trips processed: ${trips.length}`);
    console.log(`✅ Successfully classified: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n📊 Zone Distribution:');
    console.log(`   Zone A (Day Trips):      ${zoneStats.ZONE_A} trips`);
    console.log(`   Zone B (Weekend Trips):  ${zoneStats.ZONE_B} trips`);
    console.log(`   Zone C (Multi-Day):      ${zoneStats.ZONE_C} trips`);
    console.log('━'.repeat(60));
    console.log('\n✨ Zone population complete!');
  } catch (error) {
    console.error('❌ Fatal error during zone population:', error);
    throw error;
  }
}

// Run the script
populateTripZones()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
