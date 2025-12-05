# Trip Zones & Bundle Booking - Setup Guide

This guide explains how to set up and use the new Trip Zones and Bundle Booking feature.

## Prerequisites

- Prisma installed and configured
- PostgreSQL database access
- Next.js application running

## Database Migration

### Option 1: Automatic Migration (Recommended)
```bash
# Generate and apply migration
npx prisma migrate dev --name add_trip_zones_and_bundle_support
```

### Option 2: Manual Migration
If automatic migration fails, manually apply the SQL from:
```
prisma/migrations/PENDING_add_trip_zones_and_bundle_support.sql
```

## Post-Migration Tasks

### 1. Populate Zone Data for Existing Trips

Run this script to classify existing trips into zones:

```javascript
// scripts/populate-trip-zones.js
const { PrismaClient } = require('@prisma/client');
const { classifyTrip } = require('../src/lib/utils/tripZoneClassifier');

const prisma = new PrismaClient();

async function populateTripZones() {
  const trips = await prisma.trip.findMany({
    where: {
      zone: null, // Only update trips without zones
    },
  });

  console.log(`Found ${trips.length} trips to classify`);

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
          distance: trip.distance || calculateDistance(
            trip.originLat,
            trip.originLng,
            trip.destLat,
            trip.destLng
          ),
        },
      });

      console.log(`✅ Updated trip ${trip.id}: ${classification.zone}`);
    } catch (error) {
      console.error(`❌ Error updating trip ${trip.id}:`, error.message);
    }
  }

  console.log('✨ Zone population complete!');
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
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

populateTripZones()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the script:
```bash
node scripts/populate-trip-zones.js
```

## Testing the Feature

### 1. Access Kazakhstan Trips Page
Navigate to: `http://localhost:3000/trips/kazakhstan`

Expected behavior:
- See zone filter chips (Zone A, B, C)
- View trips with zone badges
- Select multiple trips

### 2. Test Single Trip Booking
1. Select one trip
2. Click "Proceed to Booking"
3. Should redirect to trip details page

### 3. Test Bundle Booking
1. Select 2 or more trips
2. Click "Proceed to Booking"
3. Should redirect to bundle configuration page
4. Adjust days using +/- buttons
5. Choose Private or Shared ride type
6. View fare estimate
7. Click "Proceed to Booking"
8. Review bundle summary
9. Click "Confirm & Book"

### 4. Test Zone Filtering
1. Click Zone A chip - should show only Zone A trips
2. Click Zone B chip - should show Zone A and B trips
3. Click Zone C chip - should show all zones
4. Test Private/Shared filter
5. Click "Apply Filters"

## Monitoring

### Check Zone Distribution
```sql
SELECT 
  zone,
  COUNT(*) as trip_count,
  AVG(distance) as avg_distance,
  AVG(estimatedDays) as avg_days
FROM "Trip"
WHERE zone IS NOT NULL
GROUP BY zone
ORDER BY zone;
```

### Check Bundle Bookings
```sql
SELECT 
  rideType,
  COUNT(*) as bundle_count,
  AVG(totalDays) as avg_days,
  AVG(estimatedFare) as avg_fare
FROM "TripBundle"
GROUP BY rideType;
```

## Troubleshooting

### Issue: Trips not showing zones
**Solution**: Run the populate-trip-zones.js script to classify existing trips.

### Issue: Bundle booking fails
**Solution**: 
1. Check user is authenticated (JWT token valid)
2. Verify all tripIds exist in database
3. Check TripBundle table permissions

### Issue: Fare calculation incorrect
**Solution**:
1. Check zone classification is correct
2. Verify distance calculations
3. Review pricing config in `src/lib/utils/fareEstimator.ts`

### Issue: API returns 500 error
**Solution**:
1. Check server logs for detailed error
2. Verify Prisma client is generated: `npx prisma generate`
3. Check database connection

## Configuration

### Adjust Zone Thresholds
Edit `src/lib/utils/tripZoneClassifier.ts`:
```typescript
const ZONE_THRESHOLDS = {
  ZONE_A_MAX_HOURS: 8,      // Adjust hour threshold
  ZONE_B_MAX_HOURS: 48,
  ZONE_A_MAX_DISTANCE: 200,  // Adjust distance threshold (km)
  ZONE_B_MAX_DISTANCE: 600,
};
```

### Adjust Pricing
Edit `src/lib/utils/fareEstimator.ts`:
```typescript
const PRICING_CONFIG = {
  BASE_RATES: {
    ZONE_A: 5000,  // Base rate in KZT
    ZONE_B: 10000,
    ZONE_C: 20000,
  },
  RATE_PER_KM: 50,    // Rate per kilometer
  RATE_PER_HOUR: 1000, // Rate per hour
  // ... etc
};
```

### Adjust Bundle Discounts
In `calculateBundleFare` function:
```typescript
if (trips.length >= 3) {
  bundleDiscount = 0.10; // 10% off for 3+ trips
} else if (trips.length >= 2) {
  bundleDiscount = 0.05; // 5% off for 2+ trips
}
```

## Next Steps

1. **Payment Integration**: Connect bundle bookings to Stripe
2. **Driver Assignment**: Auto-assign drivers to bundles
3. **Email Notifications**: Send confirmation emails
4. **Bundle Management**: Allow editing/canceling bundles
5. **Analytics**: Track bundle conversion rates

## Support

For questions or issues:
1. Check the feature documentation: `TRIP_ZONES_AND_BUNDLE_BOOKING.md`
2. Review API endpoint docs in the same file
3. Check server logs for detailed errors
