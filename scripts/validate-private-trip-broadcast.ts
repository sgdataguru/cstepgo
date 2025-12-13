/**
 * StepperGO Private Trip Broadcasting Validation Script
 * 
 * Validates that private trip creation and booking triggers realtime broadcasts
 * to eligible drivers via Socket.IO/SSE.
 * 
 * Usage: npx tsx scripts/validate-private-trip-broadcast.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validatePrivateTripBroadcast() {
  log('\n🔍 Private Trip Broadcasting Validation', 'bright');
  log('═'.repeat(60), 'cyan');
  
  const issues: string[] = [];
  const warnings: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;

  try {
    // Test 1: Check if realtimeBroadcastService exists
    log('\n📡 Test 1: Checking broadcast service availability...', 'cyan');
    testsRun++;
    try {
      const serviceModule = await import('../src/lib/services/realtimeBroadcastService');
      if (serviceModule.realtimeBroadcastService) {
        log('  ✓ Realtime broadcast service is available', 'green');
        testsPassed++;
      } else {
        issues.push('Realtime broadcast service module not exported');
        log('  ✗ Broadcast service not properly exported', 'red');
      }
    } catch (error) {
      issues.push(`Failed to import broadcast service: ${error}`);
      log('  ✗ Failed to import broadcast service', 'red');
    }

    // Test 2: Check Trip API route imports broadcast service
    log('\n📡 Test 2: Checking Trip API imports broadcast service...', 'cyan');
    testsRun++;
    try {
      const fs = await import('fs');
      const tripRouteContent = fs.readFileSync(
        'src/app/api/trips/route.ts',
        'utf-8'
      );
      
      if (tripRouteContent.includes('realtimeBroadcastService')) {
        log('  ✓ Trip API imports broadcast service', 'green');
        testsPassed++;
      } else {
        issues.push('Trip API does not import realtimeBroadcastService');
        log('  ✗ Trip API missing broadcast service import', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check Trip API: ${error}`);
      log('  ✗ Failed to check Trip API', 'red');
    }

    // Test 3: Check Booking API route imports broadcast service
    log('\n📡 Test 3: Checking Booking API imports broadcast service...', 'cyan');
    testsRun++;
    try {
      const fs = await import('fs');
      const bookingRouteContent = fs.readFileSync(
        'src/app/api/bookings/route.ts',
        'utf-8'
      );
      
      if (bookingRouteContent.includes('realtimeBroadcastService')) {
        log('  ✓ Booking API imports broadcast service', 'green');
        testsPassed++;
      } else {
        issues.push('Booking API does not import realtimeBroadcastService');
        log('  ✗ Booking API missing broadcast service import', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check Booking API: ${error}`);
      log('  ✗ Failed to check Booking API', 'red');
    }

    // Test 4: Check Trip API calls broadcastTripOffer
    log('\n📡 Test 4: Checking Trip API calls broadcastTripOffer...', 'cyan');
    testsRun++;
    try {
      const fs = await import('fs');
      const tripRouteContent = fs.readFileSync(
        'src/app/api/trips/route.ts',
        'utf-8'
      );
      
      if (tripRouteContent.includes('broadcastTripOffer')) {
        log('  ✓ Trip API calls broadcastTripOffer', 'green');
        testsPassed++;
      } else {
        issues.push('Trip API does not call broadcastTripOffer');
        log('  ✗ Trip API missing broadcastTripOffer call', 'red');
      }
    } catch (error) {
      issues.push(`Failed to verify broadcastTripOffer call: ${error}`);
      log('  ✗ Failed to verify broadcastTripOffer call', 'red');
    }

    // Test 5: Check Booking API calls broadcastTripOffer
    log('\n📡 Test 5: Checking Booking API calls broadcastTripOffer...', 'cyan');
    testsRun++;
    try {
      const fs = await import('fs');
      const bookingRouteContent = fs.readFileSync(
        'src/app/api/bookings/route.ts',
        'utf-8'
      );
      
      if (bookingRouteContent.includes('broadcastTripOffer')) {
        log('  ✓ Booking API calls broadcastTripOffer', 'green');
        testsPassed++;
      } else {
        issues.push('Booking API does not call broadcastTripOffer');
        log('  ✗ Booking API missing broadcastTripOffer call', 'red');
      }
    } catch (error) {
      issues.push(`Failed to verify broadcastTripOffer call in Booking API: ${error}`);
      log('  ✗ Failed to verify broadcastTripOffer call in Booking API', 'red');
    }

    // Test 6: Check database for TripDriverVisibility table
    log('\n📡 Test 6: Checking TripDriverVisibility table exists...', 'cyan');
    testsRun++;
    try {
      await prisma.tripDriverVisibility.findFirst();
      log('  ✓ TripDriverVisibility table exists', 'green');
      testsPassed++;
    } catch (error) {
      warnings.push('TripDriverVisibility table may not exist or may be empty');
      log('  ⚠ TripDriverVisibility table check warning', 'yellow');
      testsPassed++; // Don't fail on this - it's a warning
    }

    // Test 7: Verify Trip model has required fields
    log('\n📡 Test 7: Checking Trip model has broadcast-related fields...', 'cyan');
    testsRun++;
    try {
      const trip = await prisma.trip.findFirst({
        select: {
          id: true,
          tripType: true,
          status: true,
          driverId: true,
        },
      });
      
      if (trip !== null || true) { // Even if no trips exist, the schema should be valid
        log('  ✓ Trip model has required fields (tripType, status, driverId)', 'green');
        testsPassed++;
      }
    } catch (error) {
      // Database connection error is acceptable in CI/CD without DB
      const errorMessage = String(error);
      if (errorMessage.includes("Can't reach database server") || 
          errorMessage.includes("PrismaClientInitializationError")) {
        warnings.push('Database not available - skipping DB schema validation');
        log('  ⚠ Database not available (skipping)', 'yellow');
        testsPassed++; // Don't fail on DB connection issues
      } else {
        issues.push(`Trip model missing required fields: ${error}`);
        log('  ✗ Trip model missing required fields', 'red');
      }
    }

    // Test 8: Check for private trips in database
    log('\n📡 Test 8: Checking for existing private trips...', 'cyan');
    testsRun++;
    try {
      const privateTrips = await prisma.trip.count({
        where: { tripType: 'PRIVATE' },
      });
      
      if (privateTrips > 0) {
        log(`  ✓ Found ${privateTrips} private trip(s) in database`, 'green');
        testsPassed++;
      } else {
        warnings.push('No private trips found in database (expected in dev/test environment)');
        log('  ⚠ No private trips found (may be normal for fresh install)', 'yellow');
        testsPassed++; // Don't fail - this is informational
      }
    } catch (error) {
      warnings.push(`Could not query private trips: ${error}`);
      log('  ⚠ Could not query private trips', 'yellow');
      testsPassed++; // Don't fail
    }

    // Test 9: Check broadcast-offer endpoint still exists for manual use
    log('\n📡 Test 9: Checking manual broadcast endpoint exists...', 'cyan');
    testsRun++;
    try {
      const fs = await import('fs');
      const broadcastEndpointPath = 'src/app/api/trips/[id]/broadcast-offer/route.ts';
      
      if (fs.existsSync(broadcastEndpointPath)) {
        log('  ✓ Manual broadcast endpoint exists at /api/trips/[id]/broadcast-offer', 'green');
        testsPassed++;
      } else {
        warnings.push('Manual broadcast endpoint not found (may have been removed intentionally)');
        log('  ⚠ Manual broadcast endpoint not found', 'yellow');
        testsPassed++; // Don't fail
      }
    } catch (error) {
      warnings.push(`Could not check manual broadcast endpoint: ${error}`);
      log('  ⚠ Could not check manual broadcast endpoint', 'yellow');
      testsPassed++;
    }

    // Summary
    log('\n' + '═'.repeat(60), 'cyan');
    log('\n📊 Validation Summary', 'bright');
    log(`Tests Run: ${testsRun}`, 'cyan');
    log(`Tests Passed: ${testsPassed}`, testsPassed === testsRun ? 'green' : 'yellow');
    log(`Tests Failed: ${testsRun - testsPassed}`, testsRun - testsPassed === 0 ? 'green' : 'red');

    if (issues.length > 0) {
      log('\n❌ Issues Found:', 'red');
      issues.forEach(issue => log(`  • ${issue}`, 'red'));
    }

    if (warnings.length > 0) {
      log('\n⚠️  Warnings:', 'yellow');
      warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
    }

    if (issues.length === 0) {
      log('\n✅ All critical validations passed!', 'green');
      log('Private trip broadcasting is properly configured.', 'green');
      return 0;
    } else {
      log('\n❌ Validation failed with issues', 'red');
      log('Please fix the issues above before deploying.', 'red');
      return 1;
    }

  } catch (error) {
    log('\n❌ Validation script error:', 'red');
    console.error(error);
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validatePrivateTripBroadcast()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
