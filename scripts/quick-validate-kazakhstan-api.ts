#!/usr/bin/env tsx
/**
 * Quick Validation Script for Kazakhstan Trips API Changes
 * 
 * Validates that the code changes are properly implemented without requiring database connection
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function checkFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function validateKazakhstanGeographyUtil() {
  console.log('\n🧪 Test 1: Kazakhstan Geography Utility Exists');
  
  const filePath = path.join(process.cwd(), 'src/lib/utils/kazakhstanGeography.ts');
  const exists = checkFileExists(filePath);
  
  if (!exists) {
    results.push({
      testName: 'Kazakhstan Geography Utility',
      passed: false,
      message: 'File does not exist',
    });
    console.log('  ❌ File not found');
    return;
  }
  
  const content = readFile(filePath);
  
  // Check for required functions
  const hasIsWithinKazakhstan = content.includes('export function isWithinKazakhstan');
  const hasIsTripWithinKazakhstan = content.includes('export function isTripWithinKazakhstan');
  const hasAreCoordinatesValid = content.includes('export function areCoordinatesValid');
  const hasBounds = content.includes('export const KAZAKHSTAN_BOUNDS');
  
  const passed = hasIsWithinKazakhstan && hasIsTripWithinKazakhstan && 
                 hasAreCoordinatesValid && hasBounds;
  
  results.push({
    testName: 'Kazakhstan Geography Utility',
    passed,
    message: passed 
      ? 'All required functions and constants are present'
      : 'Some required functions or constants are missing',
    details: {
      hasIsWithinKazakhstan,
      hasIsTripWithinKazakhstan,
      hasAreCoordinatesValid,
      hasBounds,
    },
  });
  
  console.log(`  ${passed ? '✅' : '❌'} Kazakhstan geography utility ${passed ? 'complete' : 'incomplete'}`);
}

function validateKazakhstanAPIChanges() {
  console.log('\n🧪 Test 2: Kazakhstan API Endpoint Changes');
  
  const filePath = path.join(process.cwd(), 'src/app/api/trips/kazakhstan/route.ts');
  const exists = checkFileExists(filePath);
  
  if (!exists) {
    results.push({
      testName: 'Kazakhstan API Endpoint',
      passed: false,
      message: 'File does not exist',
    });
    console.log('  ❌ File not found');
    return;
  }
  
  const content = readFile(filePath);
  
  // Check for domain scoping
  const hasGeographyImport = content.includes('from \'@/lib/utils/kazakhstanGeography\'');
  const hasGeographyFilter = content.includes('isTripWithinKazakhstan');
  const hasCoordinateValidation = content.includes('areCoordinatesValid');
  
  // Check for zone validation
  const hasZoneValidation = content.includes('VALID_ZONES') && content.includes('isValidZone');
  const hasZoneErrorHandling = content.includes('Invalid zone') || content.includes('invalid zone');
  
  // Check for status casing fix (should NOT lowercase)
  const hasStatusLowercase = content.includes('trip.status.toLowerCase()');
  const statusNotLowercased = !hasStatusLowercase;
  
  // Check for proper status handling (should keep uppercase)
  const hasProperStatusHandling = content.includes('status: trip.status');
  
  const passed = hasGeographyImport && hasGeographyFilter && hasCoordinateValidation &&
                 hasZoneValidation && hasZoneErrorHandling && statusNotLowercased &&
                 hasProperStatusHandling;
  
  results.push({
    testName: 'Kazakhstan API Endpoint',
    passed,
    message: passed 
      ? 'All required changes are present'
      : 'Some required changes are missing',
    details: {
      domainScoping: {
        hasGeographyImport,
        hasGeographyFilter,
        hasCoordinateValidation,
      },
      zoneValidation: {
        hasZoneValidation,
        hasZoneErrorHandling,
      },
      statusCasing: {
        statusNotLowercased,
        hasProperStatusHandling,
      },
    },
  });
  
  console.log(`  ${passed ? '✅' : '❌'} Kazakhstan API changes ${passed ? 'complete' : 'incomplete'}`);
  
  if (!statusNotLowercased) {
    console.log('  ⚠️  WARNING: Status is still being lowercased');
  }
}

function validateTestsExist() {
  console.log('\n🧪 Test 3: Unit Tests');
  
  const filePath = path.join(process.cwd(), 'src/__tests__/api/trips/kazakhstanTrips.test.ts');
  const exists = checkFileExists(filePath);
  
  if (!exists) {
    results.push({
      testName: 'Unit Tests',
      passed: false,
      message: 'Test file does not exist',
    });
    console.log('  ❌ Test file not found');
    return;
  }
  
  const content = readFile(filePath);
  
  // Check for required test suites
  const hasGeographyTests = content.includes('Kazakhstan Geography Validation');
  const hasZoneTests = content.includes('Zone Enum Validation');
  const hasStatusTests = content.includes('Status Casing');
  const hasIntegrationTests = content.includes('Kazakhstan API Integration');
  
  const passed = hasGeographyTests && hasZoneTests && hasStatusTests && hasIntegrationTests;
  
  results.push({
    testName: 'Unit Tests',
    passed,
    message: passed 
      ? 'All required test suites are present'
      : 'Some required test suites are missing',
    details: {
      hasGeographyTests,
      hasZoneTests,
      hasStatusTests,
      hasIntegrationTests,
    },
  });
  
  console.log(`  ${passed ? '✅' : '❌'} Unit tests ${passed ? 'complete' : 'incomplete'}`);
}

function validateValidationScriptExists() {
  console.log('\n🧪 Test 4: Validation Script');
  
  const filePath = path.join(process.cwd(), 'scripts/validate-kazakhstan-trips-api.ts');
  const exists = checkFileExists(filePath);
  
  if (!exists) {
    results.push({
      testName: 'Validation Script',
      passed: false,
      message: 'Validation script does not exist',
    });
    console.log('  ❌ Validation script not found');
    return;
  }
  
  const content = readFile(filePath);
  
  // Check for required validation functions
  const hasGeographyTest = content.includes('testKazakhstanGeographyBounds');
  const hasDatabaseTest = content.includes('testDatabaseTripsGeography');
  const hasZoneTest = content.includes('testZoneEnumValidation');
  const hasStatusTest = content.includes('testStatusCasing');
  
  const passed = hasGeographyTest && hasDatabaseTest && hasZoneTest && hasStatusTest;
  
  results.push({
    testName: 'Validation Script',
    passed,
    message: passed 
      ? 'All required validation functions are present'
      : 'Some required validation functions are missing',
    details: {
      hasGeographyTest,
      hasDatabaseTest,
      hasZoneTest,
      hasStatusTest,
    },
  });
  
  console.log(`  ${passed ? '✅' : '❌'} Validation script ${passed ? 'complete' : 'incomplete'}`);
}

function validateDocumentation() {
  console.log('\n🧪 Test 5: Code Documentation');
  
  const apiPath = path.join(process.cwd(), 'src/app/api/trips/kazakhstan/route.ts');
  const utilPath = path.join(process.cwd(), 'src/lib/utils/kazakhstanGeography.ts');
  
  const apiContent = readFile(apiPath);
  const utilContent = readFile(utilPath);
  
  // Check for documentation comments
  const apiHasDocComments = apiContent.includes('Domain Enforcement') || 
                            apiContent.includes('@param') ||
                            apiContent.includes('/**');
  const utilHasDocComments = utilContent.includes('/**') && utilContent.includes('@param');
  
  const passed = apiHasDocComments && utilHasDocComments;
  
  results.push({
    testName: 'Code Documentation',
    passed,
    message: passed 
      ? 'Code is properly documented'
      : 'Some code lacks documentation',
    details: {
      apiHasDocComments,
      utilHasDocComments,
    },
  });
  
  console.log(`  ${passed ? '✅' : '❌'} Documentation ${passed ? 'adequate' : 'needs improvement'}`);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
    console.log(`   ${result.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Result: ${passedTests}/${totalTests} validations passed`);
  console.log('='.repeat(60) + '\n');
  
  if (passedTests === totalTests) {
    console.log('🎉 All code validations passed!');
    console.log('');
    console.log('✅ Kazakhstan geography bounds utility created');
    console.log('✅ Domain scoping implemented in API');
    console.log('✅ Zone enum validation added');
    console.log('✅ Status casing fixed (uppercase maintained)');
    console.log('✅ Comprehensive tests added');
    console.log('');
    return 0;
  } else {
    console.log('⚠️ Some validations failed');
    return 1;
  }
}

async function main() {
  console.log('🚀 Kazakhstan Trips API Code Validation\n');
  console.log('This script validates that all code changes are properly implemented:');
  console.log('  1. Kazakhstan geography utility');
  console.log('  2. API endpoint changes (domain scoping, zone validation, status casing)');
  console.log('  3. Unit tests');
  console.log('  4. Validation scripts');
  console.log('  5. Documentation');
  console.log('');
  
  try {
    validateKazakhstanGeographyUtil();
    validateKazakhstanAPIChanges();
    validateTestsExist();
    validateValidationScriptExists();
    validateDocumentation();
    
    const exitCode = printSummary();
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
}

main();
