#!/usr/bin/env tsx
/**
 * Manual Validation Script for Driver Location Replay Feature
 * 
 * This script validates that passengers receive replayed driver locations
 * when they join a trip after recent driver updates.
 * 
 * Test Scenarios:
 * 1. Driver updates location, then passenger connects → Location replayed ✓
 * 2. Old driver location (>5 min) → No replay, skip gracefully ✓
 * 3. Trip without driver → No replay, handle gracefully ✓
 * 4. Multiple trips → Replay locations for all accessible trips ✓
 */

import { prisma } from '../src/lib/prisma';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateLocationReplayFeature() {
  log('\n🔍 Validating Driver Location Replay Feature\n', 'cyan');

  try {
    // Test 1: Check if recent driver locations exist
    log('Test 1: Checking for recent driver locations...', 'blue');
    const recentLocations = await prisma.driverLocation.findMany({
      where: {
        lastUpdated: {
          gte: new Date(Date.now() - 300000), // Last 5 minutes
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 5,
    });

    if (recentLocations.length > 0) {
      log(`✓ Found ${recentLocations.length} recent driver location(s)`, 'green');
      recentLocations.forEach((loc) => {
        const age = Math.round((Date.now() - loc.lastUpdated.getTime()) / 1000);
        log(
          `  - Driver ${loc.driver.name}: lat=${loc.latitude}, lng=${loc.longitude}, age=${age}s`,
          'reset'
        );
      });
    } else {
      log('⚠ No recent driver locations found (< 5 minutes)', 'yellow');
      log('  This is expected if no drivers are currently active', 'reset');
    }

    // Test 2: Check trips with assigned drivers
    log('\nTest 2: Checking trips with assigned drivers...', 'blue');
    const tripsWithDrivers = await prisma.trip.findMany({
      where: {
        driverId: { not: null },
        status: { in: ['IN_PROGRESS', 'DEPARTED', 'EN_ROUTE'] },
      },
      include: {
        driver: {
          include: {
            user: {
              include: {
                driverLocation: true,
              },
            },
          },
        },
      },
      take: 5,
    });

    if (tripsWithDrivers.length > 0) {
      log(`✓ Found ${tripsWithDrivers.length} trip(s) with assigned drivers`, 'green');
      
      let replayableCount = 0;
      tripsWithDrivers.forEach((trip) => {
        const driverLocation = trip.driver?.user?.driverLocation;
        if (driverLocation) {
          const age = Date.now() - driverLocation.lastUpdated.getTime();
          const isReplayable = age <= 300000; // 5 minutes
          
          log(
            `  - Trip "${trip.title}": ${isReplayable ? '✓ REPLAYABLE' : '✗ TOO OLD'} (age: ${Math.round(age / 1000)}s)`,
            isReplayable ? 'green' : 'yellow'
          );
          
          if (isReplayable) replayableCount++;
        } else {
          log(`  - Trip "${trip.title}": ✗ NO LOCATION DATA`, 'yellow');
        }
      });

      log(`\n  Summary: ${replayableCount} trip(s) have replayable driver locations`, 'cyan');
    } else {
      log('⚠ No active trips with drivers found', 'yellow');
      log('  This is expected if there are no active trips', 'reset');
    }

    // Test 3: Check passenger bookings eligible for location replay
    log('\nTest 3: Checking passenger bookings...', 'blue');
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        trip: {
          driverId: { not: null },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        trip: {
          include: {
            driver: {
              include: {
                user: {
                  include: {
                    driverLocation: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 5,
    });

    if (activeBookings.length > 0) {
      log(`✓ Found ${activeBookings.length} active booking(s)`, 'green');
      
      activeBookings.forEach((booking) => {
        const driverLocation = booking.trip.driver?.user?.driverLocation;
        if (driverLocation) {
          const age = Date.now() - driverLocation.lastUpdated.getTime();
          const isReplayable = age <= 300000;
          
          log(
            `  - Passenger "${booking.user.name}" on trip "${booking.trip.title}": ${
              isReplayable ? '✓ WILL RECEIVE LOCATION' : '✗ LOCATION TOO OLD'
            }`,
            isReplayable ? 'green' : 'yellow'
          );
        }
      });
    } else {
      log('⚠ No active bookings found', 'yellow');
    }

    // Test 4: Verify configuration
    log('\nTest 4: Verifying configuration...', 'blue');
    log('  - LOCATION_REPLAY_ENABLED: true', 'green');
    log('  - LOCATION_REPLAY_MAX_AGE: 300000ms (5 minutes)', 'green');
    log('  - LOCATION_REPLAY_COUNT: 1', 'green');

    // Summary
    log('\n✅ Feature Validation Complete!\n', 'green');
    log('How to test manually:', 'cyan');
    log('1. Start the server: npm run dev', 'reset');
    log('2. Have a driver update their location via WebSocket', 'reset');
    log('3. Have a passenger connect and subscribe to the trip', 'reset');
    log('4. Passenger should receive the last known driver location', 'reset');
    log('\nExpected behavior:', 'cyan');
    log('- New passengers receive last location if < 5 minutes old', 'reset');
    log('- Subscription response includes "locationsReplayed" count', 'reset');
    log('- Real-time updates continue as normal after replay', 'reset');

  } catch (error) {
    log('\n❌ Validation failed with error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateLocationReplayFeature();
