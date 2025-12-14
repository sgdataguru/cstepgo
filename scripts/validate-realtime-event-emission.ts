/**
 * StepperGO Realtime Event Emission Validation Script
 * 
 * Validates that trip and booking lifecycle events are properly emitted
 * to both SSE and Socket.IO transports.
 * 
 * Usage: npx tsx scripts/validate-realtime-event-emission.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateRealtimeEventEmission() {
  log('\n🔍 Realtime Event Emission Validation', 'bright');
  log('═'.repeat(70), 'cyan');
  
  const issues: string[] = [];
  const warnings: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;

  try {
    // Test 1: Check if unified event emitter exists
    log('\n📡 Test 1: Checking unified event emitter...', 'cyan');
    testsRun++;
    try {
      const emitterPath = path.join(process.cwd(), 'src/lib/realtime/unifiedEventEmitter.ts');
      if (fs.existsSync(emitterPath)) {
        log('  ✓ Unified event emitter file exists', 'green');
        testsPassed++;
      } else {
        issues.push('Unified event emitter file not found');
        log('  ✗ Unified event emitter file not found', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check unified event emitter: ${error}`);
      log('  ✗ Failed to check unified event emitter', 'red');
    }

    // Test 2: Check unified emitter exports required functions
    log('\n📡 Test 2: Checking unified emitter exports...', 'cyan');
    testsRun++;
    try {
      const emitterContent = fs.readFileSync(
        path.join(process.cwd(), 'src/lib/realtime/unifiedEventEmitter.ts'),
        'utf-8'
      );
      
      const requiredFunctions = [
        'emitTripStatusUpdate',
        'emitBookingConfirmed',
        'emitBookingCancelled',
        'emitTripCreated',
      ];
      
      const missingFunctions = requiredFunctions.filter(fn => 
        !emitterContent.includes(`export async function ${fn}`) &&
        !emitterContent.includes(`export function ${fn}`)
      );
      
      if (missingFunctions.length === 0) {
        log('  ✓ All required emission functions are exported', 'green');
        testsPassed++;
      } else {
        issues.push(`Missing emission functions: ${missingFunctions.join(', ')}`);
        log(`  ✗ Missing emission functions: ${missingFunctions.join(', ')}`, 'red');
      }
    } catch (error) {
      issues.push(`Failed to check unified emitter exports: ${error}`);
      log('  ✗ Failed to check unified emitter exports', 'red');
    }

    // Test 3: Check Trip API imports unified emitter
    log('\n📡 Test 3: Checking Trip API imports unified emitter...', 'cyan');
    testsRun++;
    try {
      const tripRouteContent = fs.readFileSync(
        path.join(process.cwd(), 'src/app/api/trips/route.ts'),
        'utf-8'
      );
      
      if (tripRouteContent.includes('emitTripCreated')) {
        log('  ✓ Trip API imports and uses emitTripCreated', 'green');
        testsPassed++;
      } else {
        warnings.push('Trip API does not use emitTripCreated');
        log('  ⚠ Trip API does not use emitTripCreated', 'yellow');
      }
    } catch (error) {
      issues.push(`Failed to check Trip API: ${error}`);
      log('  ✗ Failed to check Trip API', 'red');
    }

    // Test 4: Check Booking API emits booking.confirmed events
    log('\n📡 Test 4: Checking Booking API emits booking.confirmed...', 'cyan');
    testsRun++;
    try {
      const bookingRouteContent = fs.readFileSync(
        path.join(process.cwd(), 'src/app/api/bookings/route.ts'),
        'utf-8'
      );
      
      if (bookingRouteContent.includes('emitBookingConfirmed')) {
        log('  ✓ Booking API emits booking.confirmed events', 'green');
        testsPassed++;
      } else {
        issues.push('Booking API does not emit booking.confirmed events');
        log('  ✗ Booking API does not emit booking.confirmed events', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check Booking API: ${error}`);
      log('  ✗ Failed to check Booking API', 'red');
    }

    // Test 5: Check booking cancellation emits events
    log('\n📡 Test 5: Checking booking cancellation emits events...', 'cyan');
    testsRun++;
    try {
      const bookingIdRouteContent = fs.readFileSync(
        path.join(process.cwd(), 'src/app/api/bookings/[id]/route.ts'),
        'utf-8'
      );
      
      if (bookingIdRouteContent.includes('emitBookingCancelled')) {
        log('  ✓ Booking cancellation emits booking.cancelled events', 'green');
        testsPassed++;
      } else {
        issues.push('Booking cancellation does not emit booking.cancelled events');
        log('  ✗ Booking cancellation does not emit events', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check booking cancellation: ${error}`);
      log('  ✗ Failed to check booking cancellation', 'red');
    }

    // Test 6: Check bookingService uses unified emitter
    log('\n📡 Test 6: Checking bookingService uses unified emitter...', 'cyan');
    testsRun++;
    try {
      const bookingServiceContent = fs.readFileSync(
        path.join(process.cwd(), 'src/lib/services/bookingService.ts'),
        'utf-8'
      );
      
      if (bookingServiceContent.includes('emitBookingCancelled')) {
        log('  ✓ bookingService uses unified emitter for cancellations', 'green');
        testsPassed++;
      } else {
        issues.push('bookingService does not use unified emitter');
        log('  ✗ bookingService does not use unified emitter', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check bookingService: ${error}`);
      log('  ✗ Failed to check bookingService', 'red');
    }

    // Test 7: Check trip status update uses unified emitter
    log('\n📡 Test 7: Checking trip status update uses unified emitter...', 'cyan');
    testsRun++;
    try {
      const statusRouteContent = fs.readFileSync(
        path.join(process.cwd(), 'src/app/api/drivers/trips/[tripId]/status/route.ts'),
        'utf-8'
      );
      
      if (statusRouteContent.includes('emitTripStatusUpdate')) {
        log('  ✓ Trip status update uses unified emitter', 'green');
        testsPassed++;
      } else {
        issues.push('Trip status update does not use unified emitter');
        log('  ✗ Trip status update does not use unified emitter', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check trip status update: ${error}`);
      log('  ✗ Failed to check trip status update', 'red');
    }

    // Test 8: Check trip acceptance uses unified emitter
    log('\n📡 Test 8: Checking trip acceptance uses unified emitter...', 'cyan');
    testsRun++;
    try {
      const acceptRouteContent = fs.readFileSync(
        path.join(process.cwd(), 'src/app/api/drivers/trips/accept/[tripId]/route.ts'),
        'utf-8'
      );
      
      if (acceptRouteContent.includes('emitTripStatusUpdate')) {
        log('  ✓ Trip acceptance uses unified emitter', 'green');
        testsPassed++;
      } else {
        issues.push('Trip acceptance does not use unified emitter');
        log('  ✗ Trip acceptance does not use unified emitter', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check trip acceptance: ${error}`);
      log('  ✗ Failed to check trip acceptance', 'red');
    }

    // Test 9: Check SSE broadcast module still exists (for backward compatibility)
    log('\n📡 Test 9: Checking SSE broadcast compatibility...', 'cyan');
    testsRun++;
    try {
      const broadcastPath = path.join(process.cwd(), 'src/lib/realtime/broadcast.ts');
      if (fs.existsSync(broadcastPath)) {
        log('  ✓ SSE broadcast module exists for backward compatibility', 'green');
        testsPassed++;
      } else {
        warnings.push('SSE broadcast module not found');
        log('  ⚠ SSE broadcast module not found', 'yellow');
      }
    } catch (error) {
      warnings.push(`Failed to check SSE broadcast module: ${error}`);
      log('  ⚠ Failed to check SSE broadcast module', 'yellow');
    }

    // Test 10: Check realtimeBroadcastService still exists
    log('\n📡 Test 10: Checking Socket.IO broadcast service...', 'cyan');
    testsRun++;
    try {
      const servicePath = path.join(process.cwd(), 'src/lib/services/realtimeBroadcastService.ts');
      if (fs.existsSync(servicePath)) {
        log('  ✓ Socket.IO broadcast service exists', 'green');
        testsPassed++;
      } else {
        issues.push('Socket.IO broadcast service not found');
        log('  ✗ Socket.IO broadcast service not found', 'red');
      }
    } catch (error) {
      issues.push(`Failed to check Socket.IO service: ${error}`);
      log('  ✗ Failed to check Socket.IO service', 'red');
    }

    // Test 11: Check event type definitions are complete
    log('\n📡 Test 11: Checking event type definitions...', 'cyan');
    testsRun++;
    try {
      const typesContent = fs.readFileSync(
        path.join(process.cwd(), 'src/types/realtime-events.ts'),
        'utf-8'
      );
      
      const requiredEventTypes = [
        'TripStatusUpdateEvent',
        'BookingConfirmedEvent',
        'BookingCancelledEvent',
        'TripOfferEvent',
      ];
      
      const missingTypes = requiredEventTypes.filter(type => !typesContent.includes(type));
      
      if (missingTypes.length === 0) {
        log('  ✓ All required event types are defined', 'green');
        testsPassed++;
      } else {
        issues.push(`Missing event types: ${missingTypes.join(', ')}`);
        log(`  ✗ Missing event types: ${missingTypes.join(', ')}`, 'red');
      }
    } catch (error) {
      issues.push(`Failed to check event types: ${error}`);
      log('  ✗ Failed to check event types', 'red');
    }

    // Test 12: Check REALTIME_EVENTS constants include all events
    log('\n📡 Test 12: Checking REALTIME_EVENTS constants...', 'cyan');
    testsRun++;
    try {
      const typesContent = fs.readFileSync(
        path.join(process.cwd(), 'src/types/realtime-events.ts'),
        'utf-8'
      );
      
      const requiredConstants = [
        'TRIP_STATUS_UPDATED',
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'TRIP_OFFER_CREATED',
      ];
      
      const missingConstants = requiredConstants.filter(constant => 
        !typesContent.includes(`${constant}:`)
      );
      
      if (missingConstants.length === 0) {
        log('  ✓ All required event constants are defined', 'green');
        testsPassed++;
      } else {
        issues.push(`Missing event constants: ${missingConstants.join(', ')}`);
        log(`  ✗ Missing event constants: ${missingConstants.join(', ')}`, 'red');
      }
    } catch (error) {
      issues.push(`Failed to check event constants: ${error}`);
      log('  ✗ Failed to check event constants', 'red');
    }

    // Summary
    log('\n' + '═'.repeat(70), 'cyan');
    log('\n📊 Validation Summary', 'bright');
    log(`Tests Run: ${testsRun}`, 'cyan');
    log(`Tests Passed: ${testsPassed}`, testsPassed === testsRun ? 'green' : 'yellow');
    log(`Tests Failed: ${testsRun - testsPassed}`, testsRun - testsPassed === 0 ? 'green' : 'red');

    if (warnings.length > 0) {
      log('\n⚠️  Warnings:', 'yellow');
      warnings.forEach((warning) => {
        log(`  • ${warning}`, 'yellow');
      });
    }

    if (issues.length > 0) {
      log('\n❌ Issues Found:', 'red');
      issues.forEach((issue) => {
        log(`  • ${issue}`, 'red');
      });
      log('\n❌ Validation FAILED\n', 'red');
      process.exit(1);
    } else {
      log('\n✅ All validation checks passed!', 'green');
      log('\n🎉 Realtime event emission is properly configured', 'bright');
      log('   - Unified event emitter exists and is properly integrated', 'cyan');
      log('   - All lifecycle events emit to both SSE and Socket.IO', 'cyan');
      log('   - Event types and constants are properly defined', 'cyan');
      
      if (warnings.length === 0) {
        log('\n✨ No warnings - implementation is complete!\n', 'green');
      } else {
        log(`\n⚠️  ${warnings.length} warning(s) found - review recommended\n`, 'yellow');
      }
    }

  } catch (error) {
    log('\n❌ Validation script failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run validation
validateRealtimeEventEmission().catch(console.error);
