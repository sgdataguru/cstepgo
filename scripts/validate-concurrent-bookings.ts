#!/usr/bin/env tsx

/**
 * Concurrent Booking Validation Script
 * 
 * Tests that the seat accounting system properly handles race conditions
 * and prevents overbooking under concurrent load.
 * 
 * Run with: npx tsx scripts/validate-concurrent-bookings.ts
 */

import { prisma } from '../src/lib/prisma';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, details?: string, error?: string) {
  results.push({ name, passed, details, error });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  if (error) console.error(`   Error: ${error}`);
}

/**
 * Test 1: Verify version field exists in schema
 */
async function testVersionFieldExists(): Promise<void> {
  try {
    const trip = await prisma.trip.findFirst({
      select: { id: true, version: true },
    });
    
    if (trip && 'version' in trip) {
      logTest(
        'Version field exists in Trip model',
        true,
        `Found version field (value: ${trip.version})`
      );
    } else {
      logTest(
        'Version field exists in Trip model',
        false,
        'Version field not found in Trip model'
      );
    }
  } catch (error) {
    logTest(
      'Version field exists in Trip model',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Test 2: Create test trip for concurrent booking simulation
 */
async function createTestTrip(): Promise<string | null> {
  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'concurrent-test@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'concurrent-test@example.com',
          name: 'Concurrent Test User',
          passwordHash: 'test-hash',
          role: 'PASSENGER',
        },
      });
    }

    // Create a test trip with multiple seats
    const trip = await prisma.trip.create({
      data: {
        title: 'Concurrent Booking Test Trip',
        description: 'Test trip for concurrent booking validation',
        organizerId: testUser.id,
        departureTime: new Date(Date.now() + 86400000), // Tomorrow
        returnTime: new Date(Date.now() + 172800000), // Day after tomorrow
        originName: 'Test Origin',
        originAddress: 'Test Origin Address',
        originLat: 43.2220,
        originLng: 76.8512,
        destName: 'Test Destination',
        destAddress: 'Test Destination Address',
        destLat: 43.2567,
        destLng: 76.9286,
        totalSeats: 10,
        availableSeats: 10,
        basePrice: 5000,
        currency: 'KZT',
        platformFee: 500,
        itinerary: [],
        status: 'PUBLISHED',
        tripType: 'SHARED',
        version: 0,
      },
    });

    logTest(
      'Create test trip',
      true,
      `Created trip ${trip.id} with 10 available seats`
    );

    return trip.id;
  } catch (error) {
    logTest(
      'Create test trip',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}

/**
 * Test 3: Simulate concurrent bookings
 */
async function testConcurrentBookings(tripId: string): Promise<void> {
  try {
    // Create test users for concurrent bookings
    const testUsers = await Promise.all(
      Array.from({ length: 5 }, async (_, i) => {
        const email = `concurrent-passenger-${i}@example.com`;
        let user = await prisma.user.findFirst({ where: { email } });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: `Test Passenger ${i}`,
              passwordHash: 'test-hash',
              role: 'PASSENGER',
            },
          });
        }
        
        return user;
      })
    );

    // Each user tries to book 3 seats simultaneously (total 15 seats requested, only 10 available)
    const bookingPromises = testUsers.map(async (user) => {
      try {
        // Simulate concurrent requests using transaction with row locking
        const booking = await prisma.$transaction(async (tx) => {
          // Get trip with FOR UPDATE lock
          const tripRaw = await tx.$queryRaw<Array<{
            id: string;
            availableSeats: number;
            version: number;
          }>>`
            SELECT id, "availableSeats", version
            FROM "Trip"
            WHERE id = ${tripId}
            FOR UPDATE
          `;

          if (!tripRaw || tripRaw.length === 0) {
            throw new Error('Trip not found');
          }

          const trip = tripRaw[0];

          // Check seat availability
          if (trip.availableSeats < 3) {
            throw new Error(`Not enough seats available. Only ${trip.availableSeats} remaining.`);
          }

          // Create booking
          const newBooking = await tx.booking.create({
            data: {
              tripId,
              userId: user.id,
              seatsBooked: 3,
              totalAmount: 15000,
              currency: 'KZT',
              passengers: [
                { name: 'Passenger 1', age: 30 },
                { name: 'Passenger 2', age: 28 },
                { name: 'Passenger 3', age: 25 },
              ],
              paymentMethodType: 'CASH_TO_DRIVER',
              status: 'CONFIRMED',
            },
          });

          // Update seats with optimistic locking
          const updateResult = await tx.$executeRaw`
            UPDATE "Trip"
            SET "availableSeats" = "availableSeats" - 3,
                version = version + 1
            WHERE id = ${tripId}
              AND version = ${trip.version}
          `;

          if (updateResult === 0) {
            throw new Error('Concurrent modification detected');
          }

          return newBooking;
        });

        return { success: true, bookingId: booking.id, userId: user.id };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
        };
      }
    });

    // Wait for all concurrent booking attempts
    const bookingResults = await Promise.all(bookingPromises);

    // Count successful bookings
    const successfulBookings = bookingResults.filter((r) => r.success).length;
    const failedBookings = bookingResults.filter((r) => !r.success).length;

    // Verify final seat count
    const finalTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { availableSeats: true, totalSeats: true, version: true },
    });

    if (!finalTrip) {
      logTest('Concurrent booking race condition test', false, 'Trip not found after bookings');
      return;
    }

    const expectedSuccessful = Math.floor(10 / 3); // Should be 3 successful bookings (9 seats used)
    const expectedSeatsUsed = expectedSuccessful * 3;
    const expectedAvailableSeats = 10 - expectedSeatsUsed;

    const passed =
      successfulBookings === expectedSuccessful &&
      failedBookings === (5 - expectedSuccessful) &&
      finalTrip.availableSeats === expectedAvailableSeats;

    logTest(
      'Concurrent booking race condition test',
      passed,
      passed
        ? `Correctly handled concurrent bookings: ${successfulBookings} succeeded, ${failedBookings} failed, ${finalTrip.availableSeats} seats remaining (version: ${finalTrip.version})`
        : `Unexpected results: ${successfulBookings} succeeded (expected ${expectedSuccessful}), ${failedBookings} failed (expected ${5 - expectedSuccessful}), ${finalTrip.availableSeats} seats remaining (expected ${expectedAvailableSeats})`
    );

    // Additional verification: Check for overbooking
    const totalBookedSeats = await prisma.booking.aggregate({
      where: {
        tripId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      _sum: {
        seatsBooked: true,
      },
    });

    const bookedSeats = totalBookedSeats._sum.seatsBooked || 0;
    const noOverbooking = bookedSeats + finalTrip.availableSeats === 10;

    logTest(
      'No overbooking verification',
      noOverbooking,
      noOverbooking
        ? `Total seats accounted for: ${bookedSeats} booked + ${finalTrip.availableSeats} available = 10 total`
        : `Overbooking detected! ${bookedSeats} booked + ${finalTrip.availableSeats} available ≠ 10 total`
    );
  } catch (error) {
    logTest(
      'Concurrent booking race condition test',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Test 4: Test optimistic locking with version field
 */
async function testOptimisticLocking(tripId: string): Promise<void> {
  try {
    // Get current trip state
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { version: true, availableSeats: true },
    });

    if (!trip) {
      logTest('Optimistic locking test', false, 'Trip not found');
      return;
    }

    const oldVersion = trip.version;

    // Try to update with correct version
    const updateResult1 = await prisma.$executeRaw`
      UPDATE "Trip"
      SET "availableSeats" = "availableSeats" - 1,
          version = version + 1
      WHERE id = ${tripId}
        AND version = ${oldVersion}
    `;

    // Try to update again with old version (should fail)
    const updateResult2 = await prisma.$executeRaw`
      UPDATE "Trip"
      SET "availableSeats" = "availableSeats" - 1,
          version = version + 1
      WHERE id = ${tripId}
        AND version = ${oldVersion}
    `;

    const passed = updateResult1 === 1 && updateResult2 === 0;

    logTest(
      'Optimistic locking test',
      passed,
      passed
        ? 'Version-based updates work correctly: first update succeeded, second with stale version failed'
        : `Unexpected results: first update affected ${updateResult1} rows, second update affected ${updateResult2} rows`
    );
  } catch (error) {
    logTest(
      'Optimistic locking test',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Test 5: Cleanup test data
 */
async function cleanupTestData(tripId: string): Promise<void> {
  try {
    // Delete bookings
    await prisma.booking.deleteMany({
      where: { tripId },
    });

    // Delete trip
    await prisma.trip.delete({
      where: { id: tripId },
    });

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'concurrent-test@example.com',
            'concurrent-passenger-0@example.com',
            'concurrent-passenger-1@example.com',
            'concurrent-passenger-2@example.com',
            'concurrent-passenger-3@example.com',
            'concurrent-passenger-4@example.com',
          ],
        },
      },
    });

    logTest('Cleanup test data', true, 'Test data cleaned up successfully');
  } catch (error) {
    logTest(
      'Cleanup test data',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('\n🚀 Starting Concurrent Booking Validation Tests\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Version field
    await testVersionFieldExists();

    // Test 2: Create test trip
    const tripId = await createTestTrip();
    if (!tripId) {
      console.error('\n❌ Failed to create test trip. Aborting remaining tests.');
      process.exit(1);
    }

    // Test 3: Concurrent bookings
    await testConcurrentBookings(tripId);

    // Test 4: Optimistic locking
    await testOptimisticLocking(tripId);

    // Test 5: Cleanup
    await cleanupTestData(tripId);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary\n');

    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;
    const allPassed = passedTests === totalTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);

    if (allPassed) {
      console.log('\n✅ All tests passed! Concurrent booking system is race-safe.\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();
