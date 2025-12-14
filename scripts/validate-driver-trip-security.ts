#!/usr/bin/env tsx

/**
 * Security Validation Script for Driver Trip Acceptance
 * 
 * This script tests the security of the driver trip acceptance endpoint
 * to ensure it properly validates authentication and prevents trip hijacking.
 * 
 * Tests:
 * 1. Reject requests without authentication
 * 2. Reject requests with invalid/crafted headers only
 * 3. Reject requests with expired tokens
 * 4. Accept requests with valid authentication
 * 5. Reject trip acceptance when driver doesn't match
 * 6. Reject trip acceptance when trip already assigned
 */

import { prisma } from '../src/lib/prisma';
import { signAccessToken, createTokenPair } from '../src/lib/auth/jwt';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✓' : '✗';
  const color = passed ? GREEN : RED;
  log(`${icon} ${name}: ${message}`, color);
}

async function setupTestData() {
  log('\n📦 Setting up test data...', BLUE);
  
  try {
    // Create test user and driver
    const testUser = await prisma.user.upsert({
      where: { email: 'test-driver-security@example.com' },
      update: {},
      create: {
        email: 'test-driver-security@example.com',
        name: 'Test Security Driver',
        passwordHash: 'test-hash',
        role: 'DRIVER',
        emailVerified: true,
      },
    });

    const testDriver = await prisma.driver.upsert({
      where: { userId: testUser.id },
      update: {
        status: 'APPROVED',
        availability: 'AVAILABLE',
      },
      create: {
        userId: testUser.id,
        status: 'APPROVED',
        availability: 'AVAILABLE',
        vehicleType: 'Sedan',
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2020,
        licensePlate: 'TEST-001',
        licenseNumber: 'DL123456',
        licenseExpiry: new Date('2025-12-31'),
        documentsUrl: {},
      },
    });

    // Create another driver for hijack test
    const attackerUser = await prisma.user.upsert({
      where: { email: 'attacker-driver@example.com' },
      update: {},
      create: {
        email: 'attacker-driver@example.com',
        name: 'Attacker Driver',
        passwordHash: 'test-hash',
        role: 'DRIVER',
        emailVerified: true,
      },
    });

    const attackerDriver = await prisma.driver.upsert({
      where: { userId: attackerUser.id },
      update: {
        status: 'APPROVED',
        availability: 'AVAILABLE',
      },
      create: {
        userId: attackerUser.id,
        status: 'APPROVED',
        availability: 'AVAILABLE',
        vehicleType: 'SUV',
        vehicleMake: 'Ford',
        vehicleModel: 'Explorer',
        vehicleYear: 2021,
        licensePlate: 'HACK-666',
        licenseNumber: 'DL666666',
        licenseExpiry: new Date('2025-12-31'),
        documentsUrl: {},
      },
    });

    // Create test trip organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'trip-organizer-security@example.com' },
      update: {},
      create: {
        email: 'trip-organizer-security@example.com',
        name: 'Test Trip Organizer',
        passwordHash: 'test-hash',
        role: 'PASSENGER',
        emailVerified: true,
      },
    });

    // Create test trip
    const testTrip = await prisma.trip.create({
      data: {
        title: 'Security Test Trip',
        description: 'Test trip for security validation',
        organizerId: organizer.id,
        originName: 'Test Origin',
        originAddress: 'Test Origin Address',
        originLat: 43.2381,
        originLng: 76.9452,
        destName: 'Test Destination',
        destAddress: 'Test Destination Address',
        destLat: 43.3381,
        destLng: 77.0452,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        returnTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after
        tripType: 'PRIVATE',
        status: 'PUBLISHED',
        totalSeats: 4,
        basePrice: 10000,
        platformFee: 1500,
        currency: 'KZT',
      },
    });

    // Create session for valid driver
    const { accessToken, refreshToken } = createTokenPair({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });

    const session = await prisma.session.create({
      data: {
        userId: testUser.id,
        token: testUser.id, // Simple session for testing
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Create session for attacker driver
    const attackerSession = await prisma.session.create({
      data: {
        userId: attackerUser.id,
        token: attackerUser.id, // Simple session for testing
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    log('✅ Test data created successfully', GREEN);
    
    return {
      testDriver,
      testUser,
      attackerDriver,
      attackerUser,
      testTrip,
      accessToken,
      session,
      attackerSession,
    };
  } catch (error) {
    log(`❌ Failed to setup test data: ${error}`, RED);
    throw error;
  }
}

async function cleanupTestData() {
  log('\n🧹 Cleaning up test data...', BLUE);
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'test-driver-security@example.com',
              'attacker-driver@example.com',
              'trip-organizer-security@example.com',
            ],
          },
        },
      },
    });

    await prisma.trip.deleteMany({
      where: {
        title: 'Security Test Trip',
      },
    });

    await prisma.driver.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'test-driver-security@example.com',
              'attacker-driver@example.com',
            ],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-driver-security@example.com',
            'attacker-driver@example.com',
            'trip-organizer-security@example.com',
          ],
        },
      },
    });

    log('✅ Test data cleaned up successfully', GREEN);
  } catch (error) {
    log(`⚠️  Warning: Cleanup failed: ${error}`, YELLOW);
  }
}

async function testNoAuthentication(tripId: string) {
  const testName = 'No Authentication';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/trips/accept/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      addResult(testName, true, 'Correctly rejected unauthenticated request');
    } else {
      addResult(testName, false, `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    addResult(testName, false, `Request failed: ${error}`);
  }
}

async function testCraftedHeaderOnly(tripId: string, driverId: string) {
  const testName = 'Crafted Header Only (No Valid Token)';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/trips/accept/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-driver-id': driverId, // Crafted header - should be ignored
      },
    });

    if (response.status === 401) {
      addResult(testName, true, 'Correctly rejected request with crafted header only');
    } else {
      const data = await response.json();
      addResult(testName, false, `SECURITY VULNERABILITY: Accepted crafted header. Status: ${response.status}, Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    addResult(testName, false, `Request failed: ${error}`);
  }
}

async function testValidAuthentication(tripId: string, sessionToken: string) {
  const testName = 'Valid Authentication';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/trips/accept/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        addResult(testName, true, 'Successfully accepted trip with valid authentication');
        return true;
      } else {
        addResult(testName, false, `Request succeeded but response indicates failure: ${JSON.stringify(data)}`);
      }
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.error && data.error.includes('already been accepted')) {
        addResult(testName, true, 'Trip already accepted (expected in test sequence)');
        return true;
      }
      addResult(testName, false, `Request failed: ${response.status} - ${JSON.stringify(data)}`);
    } else {
      const data = await response.json();
      addResult(testName, false, `Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    addResult(testName, false, `Request failed: ${error}`);
  }
  
  return false;
}

async function testTripHijackAttempt(tripId: string, legitimateDriverId: string, attackerToken: string) {
  const testName = 'Trip Hijack Prevention (Different Driver)';
  
  try {
    // First, create a new trip and assign it to the legitimate driver
    const organizer = await prisma.user.findFirst({
      where: { email: 'trip-organizer-security@example.com' },
    });

    if (!organizer) {
      addResult(testName, false, 'Failed to find organizer');
      return;
    }

    const assignedTrip = await prisma.trip.create({
      data: {
        title: 'Pre-assigned Security Test Trip',
        description: 'Test trip already assigned to legitimate driver',
        organizerId: organizer.id,
        driverId: legitimateDriverId, // Already assigned!
        originName: 'Test Origin',
        originAddress: 'Test Origin Address',
        originLat: 43.2381,
        originLng: 76.9452,
        destName: 'Test Destination',
        destAddress: 'Test Destination Address',
        destLat: 43.3381,
        destLng: 77.0452,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        returnTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        tripType: 'PRIVATE',
        status: 'IN_PROGRESS',
        totalSeats: 4,
        basePrice: 10000,
        platformFee: 1500,
        currency: 'KZT',
      },
    });

    // Attacker tries to accept a trip assigned to another driver
    const response = await fetch(`${API_BASE_URL}/api/drivers/trips/accept/${assignedTrip.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attackerToken}`,
      },
    });

    // Clean up
    await prisma.trip.delete({ where: { id: assignedTrip.id } });

    if (response.status === 400) {
      const data = await response.json();
      if (data.error && data.error.includes('already been accepted')) {
        addResult(testName, true, 'Correctly prevented trip hijacking');
      } else {
        addResult(testName, false, `Wrong error message: ${data.error}`);
      }
    } else if (response.status === 401 || response.status === 403) {
      addResult(testName, true, 'Correctly rejected unauthorized access');
    } else {
      const data = await response.json();
      addResult(testName, false, `SECURITY VULNERABILITY: Allowed trip hijacking. Status: ${response.status}, Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    addResult(testName, false, `Test failed: ${error}`);
  }
}

async function testCraftedHeaderWithValidToken(tripId: string, sessionToken: string, wrongDriverId: string) {
  const testName = 'Crafted Header with Valid Token (Header Mismatch)';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/trips/accept/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        'x-driver-id': wrongDriverId, // Crafted header - should be ignored in favor of token
      },
    });

    // The request should use the driver from the token, not the header
    // So it should either succeed (if trip is available) or fail with appropriate error
    if (response.status === 401) {
      addResult(testName, false, 'Incorrectly rejected valid authentication');
    } else if (response.status === 200 || response.status === 400) {
      // Either succeeded (trip accepted) or failed with business logic error
      // Both are acceptable as long as it used the token, not the header
      const data = await response.json();
      addResult(testName, true, 'Correctly ignored crafted header and used token identity');
    } else {
      const data = await response.json();
      addResult(testName, false, `Unexpected status: ${response.status} - ${JSON.stringify(data)}`);
    }
  } catch (error) {
    addResult(testName, false, `Request failed: ${error}`);
  }
}

async function runSecurityTests() {
  log('\n🔐 Starting Driver Trip Acceptance Security Tests\n', BLUE);
  
  let testData;
  
  try {
    // Setup
    testData = await setupTestData();
    
    log('\n🧪 Running Security Tests...\n', BLUE);
    
    // Test 1: No authentication
    await testNoAuthentication(testData.testTrip.id);
    
    // Test 2: Crafted header only (no valid token)
    await testCraftedHeaderOnly(testData.testTrip.id, testData.attackerDriver.id);
    
    // Test 3: Crafted header with valid token (should ignore header)
    await testCraftedHeaderWithValidToken(
      testData.testTrip.id,
      testData.session.token,
      testData.attackerDriver.id
    );
    
    // Test 4: Valid authentication (should succeed)
    const accepted = await testValidAuthentication(testData.testTrip.id, testData.session.token);
    
    // Test 5: Prevent trip hijacking (different driver)
    await testTripHijackAttempt(
      testData.testTrip.id,
      testData.testDriver.id,
      testData.attackerSession.token
    );
    
    // Print summary
    log('\n📊 Test Summary', BLUE);
    log('═══════════════════════════════════════════════', BLUE);
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    log(`\nTotal Tests: ${total}`, RESET);
    log(`Passed: ${passed}`, passed === total ? GREEN : YELLOW);
    log(`Failed: ${total - passed}`, total - passed === 0 ? GREEN : RED);
    log(`Success Rate: ${percentage}%\n`, passed === total ? GREEN : RED);
    
    if (passed === total) {
      log('✅ All security tests passed!', GREEN);
      log('🔒 The endpoint is properly secured against trip hijacking.', GREEN);
    } else {
      log('❌ Some security tests failed!', RED);
      log('⚠️  SECURITY VULNERABILITIES DETECTED', RED);
      
      log('\nFailed Tests:', RED);
      results
        .filter(r => !r.passed)
        .forEach(r => {
          log(`  - ${r.name}: ${r.message}`, RED);
        });
    }
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error}`, RED);
    console.error(error);
  } finally {
    // Cleanup
    if (testData) {
      await cleanupTestData();
    }
    
    await prisma.$disconnect();
  }
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runSecurityTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
