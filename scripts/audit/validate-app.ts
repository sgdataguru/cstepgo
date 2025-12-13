/**
 * StepperGO Comprehensive Validation Script
 * 
 * This script tests all API endpoints, page routes, database connectivity,
 * and application functionality, then generates a detailed audit report.
 * 
 * Usage: npx tsx scripts/audit/validate-app.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TIMEOUT_MS = 10000;

// Types
interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
  message: string;
  duration?: number;
  details?: Record<string, unknown>;
}

interface AuditReport {
  timestamp: string;
  environment: string;
  baseUrl: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    warnings: number;
    passRate: string;
  };
  categories: Record<string, {
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  }>;
  databaseHealth: {
    connected: boolean;
    tableStats: Record<string, number>;
  };
  recommendations: string[];
}

// Utility Functions
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(result: TestResult) {
  const icon = {
    PASS: '✓',
    FAIL: '✗',
    SKIP: '○',
    WARNING: '⚠',
  }[result.status];
  
  const color = {
    PASS: 'green',
    FAIL: 'red',
    SKIP: 'yellow',
    WARNING: 'yellow',
  }[result.status] as keyof typeof colors;

  log(`  ${icon} ${result.name}: ${result.message}`, color);
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test Collections
const results: TestResult[] = [];

function addResult(result: TestResult) {
  results.push(result);
  logResult(result);
}

// ===========================================
// API ENDPOINT TESTS
// ===========================================

const API_ENDPOINTS = [
  // Trip APIs
  { method: 'GET', path: '/api/trips', name: 'List Trips', expectStatus: 200 },
  { method: 'GET', path: '/api/trips/kazakhstan', name: 'Kazakhstan Trips', expectStatus: 200 },
  
  // Driver APIs
  { method: 'GET', path: '/api/drivers', name: 'List Drivers', expectStatus: [200, 404] },
  { method: 'GET', path: '/api/drivers/trips/available', name: 'Available Trips for Drivers', expectStatus: 200 },
  { method: 'GET', path: '/api/drivers/dashboard', name: 'Driver Dashboard', expectStatus: [200, 401] },
  { method: 'GET', path: '/api/drivers/profile', name: 'Driver Profile', expectStatus: [200, 401] },
  { method: 'GET', path: '/api/drivers/availability', name: 'Driver Availability', expectStatus: [200, 401] },
  { method: 'GET', path: '/api/drivers/notifications', name: 'Driver Notifications', expectStatus: [200, 401] },
  { method: 'GET', path: '/api/drivers/payouts', name: 'Driver Payouts', expectStatus: [200, 401] },
  
  // Booking APIs
  { method: 'GET', path: '/api/bookings', name: 'List Bookings', expectStatus: [200, 401] },
  { method: 'GET', path: '/api/bookings/shared', name: 'Shared Ride Bookings', expectStatus: [200, 401] },
  
  // Passenger APIs
  { method: 'GET', path: '/api/passengers/bookings', name: 'Passenger Bookings', expectStatus: [200, 401] },
  
  // Activity APIs
  { method: 'GET', path: '/api/activities', name: 'List Activities', expectStatus: 200 },
  { method: 'GET', path: '/api/activities/owner', name: 'Activity Owner Data', expectStatus: [200, 401] },
  
  // Admin APIs
  { method: 'GET', path: '/api/admin/drivers', name: 'Admin - List Drivers', expectStatus: [200, 401, 403] },
  { method: 'GET', path: '/api/admin/settings', name: 'Admin Settings', expectStatus: [200, 401, 403] },
  { method: 'GET', path: '/api/admin/approvals', name: 'Admin Approvals', expectStatus: [200, 401, 403] },
  { method: 'GET', path: '/api/admin/documents', name: 'Admin Documents', expectStatus: [200, 401, 403] },
  
  // Location APIs
  { method: 'GET', path: '/api/locations/autocomplete?input=Almaty', name: 'Location Autocomplete', expectStatus: [200, 400] },
  
  // OTP APIs (POST required)
  { method: 'POST', path: '/api/otp/send', name: 'OTP Send', expectStatus: [200, 400], body: { phone: '+77001234567' } },
  
  // Debug API
  { method: 'GET', path: '/api/debug', name: 'Debug Endpoint', expectStatus: [200, 404] },
  
  // Navigation APIs
  { method: 'POST', path: '/api/navigation/route', name: 'Navigation Route', expectStatus: [200, 400], body: { origin: { lat: 43.238, lng: 76.945 }, destination: { lat: 43.352, lng: 77.071 } } },
  
  // Real-time APIs
  { method: 'GET', path: '/api/realtime/trip-status/test-id', name: 'Realtime Trip Status', expectStatus: [200, 404] },
  
  // Upload API
  { method: 'GET', path: '/api/upload', name: 'Upload Endpoint', expectStatus: [200, 405] },
];

async function testAPIEndpoints() {
  log('\n📡 Testing API Endpoints...', 'cyan');
  log('─'.repeat(50));

  for (const endpoint of API_ENDPOINTS) {
    const start = Date.now();
    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body && endpoint.method !== 'GET') {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetchWithTimeout(`${BASE_URL}${endpoint.path}`, options);
      const duration = Date.now() - start;
      const expectedStatuses = Array.isArray(endpoint.expectStatus) ? endpoint.expectStatus : [endpoint.expectStatus];

      if (expectedStatuses.includes(response.status)) {
        addResult({
          name: endpoint.name,
          category: 'API Endpoints',
          status: 'PASS',
          message: `${endpoint.method} ${endpoint.path} - Status ${response.status} (${duration}ms)`,
          duration,
          details: { statusCode: response.status, method: endpoint.method },
        });
      } else {
        addResult({
          name: endpoint.name,
          category: 'API Endpoints',
          status: 'FAIL',
          message: `Expected ${expectedStatuses.join(' or ')}, got ${response.status}`,
          duration,
          details: { statusCode: response.status, expected: expectedStatuses },
        });
      }
    } catch (error) {
      addResult({
        name: endpoint.name,
        category: 'API Endpoints',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error: String(error) },
      });
    }
  }
}

// ===========================================
// PAGE ROUTE TESTS
// ===========================================

const PAGE_ROUTES = [
  // Public Pages
  { path: '/', name: 'Home Page' },
  { path: '/trips', name: 'Trips Listing' },
  { path: '/trips/create', name: 'Create Trip' },
  { path: '/trips/kazakhstan', name: 'Kazakhstan Trips' },
  { path: '/trips/bundle', name: 'Trip Bundle' },
  
  // Auth Pages
  { path: '/auth/register', name: 'Registration' },
  { path: '/driver/login', name: 'Driver Login' },
  
  // Driver Portal Pages
  { path: '/driver/portal/dashboard', name: 'Driver Portal Dashboard' },
  { path: '/driver/portal/profile', name: 'Driver Portal Profile' },
  { path: '/driver/portal/earnings', name: 'Driver Portal Earnings' },
  { path: '/driver/portal/ratings', name: 'Driver Portal Ratings' },
  { path: '/driver/portal/notifications', name: 'Driver Portal Notifications' },
  { path: '/driver/portal/help', name: 'Driver Portal Help' },
  { path: '/driver/dashboard', name: 'Driver Dashboard' },
  
  // Admin Pages
  { path: '/admin/drivers', name: 'Admin Drivers' },
  { path: '/admin/drivers/new', name: 'Admin New Driver' },
  { path: '/admin/settings', name: 'Admin Settings' },
  
  // Activity Owner Pages
  { path: '/activity-owners/auth/login', name: 'Activity Owner Login' },
  { path: '/activity-owners/auth/register', name: 'Activity Owner Register' },
  { path: '/activity-owners/dashboard', name: 'Activity Owner Dashboard' },
  
  // My Trips Pages
  { path: '/my-trips', name: 'My Trips' },
  
  // Booking Pages
  { path: '/booking/confirmed', name: 'Booking Confirmed' },
  
  // Navigation
  { path: '/navigation/demo', name: 'Navigation Demo' },
  
  // Module Overview
  { path: '/module-overview', name: 'Module Overview' },
];

async function testPageRoutes() {
  log('\n🌐 Testing Page Routes...', 'cyan');
  log('─'.repeat(50));

  for (const route of PAGE_ROUTES) {
    const start = Date.now();
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${route.path}`);
      const duration = Date.now() - start;

      // Page should return 200 or redirect (3xx)
      if (response.status === 200 || (response.status >= 300 && response.status < 400)) {
        addResult({
          name: route.name,
          category: 'Page Routes',
          status: 'PASS',
          message: `${route.path} - Status ${response.status} (${duration}ms)`,
          duration,
        });
      } else if (response.status === 401 || response.status === 403) {
        // Auth-protected pages
        addResult({
          name: route.name,
          category: 'Page Routes',
          status: 'WARNING',
          message: `${route.path} - Protected (${response.status})`,
          duration,
        });
      } else {
        addResult({
          name: route.name,
          category: 'Page Routes',
          status: 'FAIL',
          message: `${route.path} - Unexpected status ${response.status}`,
          duration,
        });
      }
    } catch (error) {
      addResult({
        name: route.name,
        category: 'Page Routes',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ===========================================
// DATABASE CONNECTIVITY TESTS
// ===========================================

async function testDatabaseConnectivity(): Promise<{
  connected: boolean;
  tableStats: Record<string, number>;
}> {
  log('\n🗄️  Testing Database Connectivity...', 'cyan');
  log('─'.repeat(50));

  const prisma = new PrismaClient();
  const tableStats: Record<string, number> = {};

  try {
    // Test connection
    await prisma.$connect();
    addResult({
      name: 'Database Connection',
      category: 'Database',
      status: 'PASS',
      message: 'Successfully connected to PostgreSQL',
    });

    // Get table counts
    const tables = [
      { name: 'Users', query: () => prisma.user.count() },
      { name: 'Trips', query: () => prisma.trip.count() },
      { name: 'Bookings', query: () => prisma.booking.count() },
      { name: 'Drivers', query: () => prisma.driver.count() },
      { name: 'Payments', query: () => prisma.payment.count() },
      { name: 'Sessions', query: () => prisma.session.count() },
      { name: 'Reviews', query: () => prisma.review.count() },
      { name: 'Vehicles', query: () => prisma.vehicle.count() },
      { name: 'Activities', query: () => prisma.activity.count() },
      { name: 'Activity Owners', query: () => prisma.activityOwner.count() },
      { name: 'Activity Bookings', query: () => prisma.activityBooking.count() },
      { name: 'Payouts', query: () => prisma.payout.count() },
      { name: 'Messages', query: () => prisma.message.count() },
      { name: 'Conversations', query: () => prisma.conversation.count() },
    ];

    for (const table of tables) {
      try {
        const count = await table.query();
        tableStats[table.name] = count;
        addResult({
          name: `${table.name} Table`,
          category: 'Database',
          status: 'PASS',
          message: `${count} records found`,
          details: { count },
        });
      } catch (error) {
        addResult({
          name: `${table.name} Table`,
          category: 'Database',
          status: 'FAIL',
          message: error instanceof Error ? error.message : 'Query failed',
        });
      }
    }

    await prisma.$disconnect();
    return { connected: true, tableStats };
  } catch (error) {
    addResult({
      name: 'Database Connection',
      category: 'Database',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Connection failed',
    });
    return { connected: false, tableStats };
  }
}

// ===========================================
// FUNCTIONALITY TESTS
// ===========================================

async function testTripCreationFlow() {
  log('\n🚗 Testing Trip Creation Flow...', 'cyan');
  log('─'.repeat(50));

  // Test trip creation API
  try {
    const tripData = {
      title: 'Test Trip - Validation Script',
      description: 'Automated test trip for validation',
      originName: 'Almaty',
      originAddress: 'Almaty, Kazakhstan',
      originLat: 43.238949,
      originLng: 76.945465,
      destName: 'Nur-Sultan',
      destAddress: 'Nur-Sultan, Kazakhstan',
      destLat: 51.169392,
      destLng: 71.449074,
      departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      returnTime: new Date(Date.now() + 172800000).toISOString(), // Day after
      totalSeats: 4,
      basePrice: 15000,
      tripType: 'PRIVATE',
      itinerary: [],
    };

    const response = await fetchWithTimeout(`${BASE_URL}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });

    if (response.status === 201 || response.status === 200) {
      addResult({
        name: 'Trip Creation',
        category: 'Functionality',
        status: 'PASS',
        message: 'Trip creation API working',
      });
    } else if (response.status === 401) {
      addResult({
        name: 'Trip Creation',
        category: 'Functionality',
        status: 'WARNING',
        message: 'Requires authentication (expected behavior)',
      });
    } else {
      const errorBody = await response.text();
      addResult({
        name: 'Trip Creation',
        category: 'Functionality',
        status: 'FAIL',
        message: `Status ${response.status}: ${errorBody.substring(0, 100)}`,
      });
    }
  } catch (error) {
    addResult({
      name: 'Trip Creation',
      category: 'Functionality',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testDriverRegistrationFlow() {
  log('\n👤 Testing Driver Registration Flow...', 'cyan');
  log('─'.repeat(50));

  try {
    const driverData = {
      email: `test-driver-${Date.now()}@test.com`,
      phone: `+7700${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      name: 'Test Driver',
      vehicleType: 'sedan',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: 2020,
      licensePlate: 'TEST123',
      licenseNumber: 'DRV123456',
      licenseExpiry: new Date(Date.now() + 31536000000).toISOString(), // 1 year from now
    };

    const response = await fetchWithTimeout(`${BASE_URL}/api/drivers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData),
    });

    if (response.status === 201 || response.status === 200) {
      addResult({
        name: 'Driver Registration',
        category: 'Functionality',
        status: 'PASS',
        message: 'Driver registration API working',
      });
    } else if (response.status === 400) {
      addResult({
        name: 'Driver Registration',
        category: 'Functionality',
        status: 'WARNING',
        message: 'Validation working (expected for incomplete data)',
      });
    } else {
      addResult({
        name: 'Driver Registration',
        category: 'Functionality',
        status: 'FAIL',
        message: `Unexpected status ${response.status}`,
      });
    }
  } catch (error) {
    addResult({
      name: 'Driver Registration',
      category: 'Functionality',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testBookingFlow() {
  log('\n📝 Testing Booking Flow...', 'cyan');
  log('─'.repeat(50));

  // First get available trips
  try {
    const tripsResponse = await fetchWithTimeout(`${BASE_URL}/api/trips`);
    const tripsData = await tripsResponse.json();

    if (tripsData.success && tripsData.data?.length > 0) {
      const tripId = tripsData.data[0].id;

      // Try to create a booking
      const bookingData = {
        tripId,
        seatsBooked: 1,
        passengers: [{ name: 'Test Passenger', phone: '+77001234567' }],
        notes: 'Test booking from validation script',
        paymentMethodType: 'ONLINE',
      };

      const bookingResponse = await fetchWithTimeout(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (bookingResponse.status === 201 || bookingResponse.status === 200) {
        addResult({
          name: 'Booking Creation',
          category: 'Functionality',
          status: 'PASS',
          message: 'Booking API working',
        });
      } else if (bookingResponse.status === 401) {
        addResult({
          name: 'Booking Creation',
          category: 'Functionality',
          status: 'WARNING',
          message: 'Requires authentication (expected behavior)',
        });
      } else {
        addResult({
          name: 'Booking Creation',
          category: 'Functionality',
          status: 'FAIL',
          message: `Status ${bookingResponse.status}`,
        });
      }
    } else {
      addResult({
        name: 'Booking Creation',
        category: 'Functionality',
        status: 'SKIP',
        message: 'No trips available to test booking',
      });
    }
  } catch (error) {
    addResult({
      name: 'Booking Creation',
      category: 'Functionality',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testMessagingFlow() {
  log('\n💬 Testing Messaging System...', 'cyan');
  log('─'.repeat(50));

  try {
    // Test message sending endpoint
    const response = await fetchWithTimeout(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'test-trip-id',
        content: 'Test message',
      }),
    });

    if (response.status === 200 || response.status === 201) {
      addResult({
        name: 'Messaging System',
        category: 'Functionality',
        status: 'PASS',
        message: 'Message API responding',
      });
    } else if (response.status === 401 || response.status === 404) {
      addResult({
        name: 'Messaging System',
        category: 'Functionality',
        status: 'WARNING',
        message: 'Auth required or trip not found (expected)',
      });
    } else {
      addResult({
        name: 'Messaging System',
        category: 'Functionality',
        status: 'FAIL',
        message: `Unexpected status ${response.status}`,
      });
    }
  } catch (error) {
    addResult({
      name: 'Messaging System',
      category: 'Functionality',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ===========================================
// ENVIRONMENT & CONFIGURATION CHECKS
// ===========================================

async function testEnvironmentConfig() {
  log('\n⚙️  Testing Environment Configuration...', 'cyan');
  log('─'.repeat(50));

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'JWT_SECRET',
  ];

  const optionalEnvVars = [
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'STRIPE_SECRET_KEY',
    'TWILIO_ACCOUNT_SID',
    'AWS_S3_BUCKET',
    'REDIS_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      addResult({
        name: `ENV: ${envVar}`,
        category: 'Configuration',
        status: 'PASS',
        message: 'Configured',
      });
    } else {
      addResult({
        name: `ENV: ${envVar}`,
        category: 'Configuration',
        status: 'FAIL',
        message: 'Missing required environment variable',
      });
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      addResult({
        name: `ENV: ${envVar}`,
        category: 'Configuration',
        status: 'PASS',
        message: 'Configured',
      });
    } else {
      addResult({
        name: `ENV: ${envVar}`,
        category: 'Configuration',
        status: 'WARNING',
        message: 'Not configured (optional)',
      });
    }
  }
}

// ===========================================
// REPORT GENERATION
// ===========================================

function generateReport(databaseHealth: { connected: boolean; tableStats: Record<string, number> }): AuditReport {
  const categories: Record<string, { total: number; passed: number; failed: number; results: TestResult[] }> = {};

  for (const result of results) {
    if (!categories[result.category]) {
      categories[result.category] = { total: 0, passed: 0, failed: 0, results: [] };
    }
    categories[result.category].total++;
    if (result.status === 'PASS') categories[result.category].passed++;
    if (result.status === 'FAIL') categories[result.category].failed++;
    categories[result.category].results.push(result);
  }

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;

  const recommendations: string[] = [];

  // Generate recommendations based on results
  if (failed > 0) {
    recommendations.push(`🔴 ${failed} critical issues found that need immediate attention`);
  }
  if (warnings > 0) {
    recommendations.push(`🟡 ${warnings} warnings found - review for potential improvements`);
  }
  if (!databaseHealth.connected) {
    recommendations.push('🔴 Database connection failed - check DATABASE_URL configuration');
  }
  if ((databaseHealth.tableStats['Users'] || 0) === 0) {
    recommendations.push('🟡 No users in database - consider seeding test data');
  }
  if ((databaseHealth.tableStats['Trips'] || 0) === 0) {
    recommendations.push('🟡 No trips in database - consider seeding test data');
  }
  if ((databaseHealth.tableStats['Drivers'] || 0) === 0) {
    recommendations.push('🟡 No drivers in database - driver functionality may be limited');
  }

  // Check for missing API endpoints
  const failedAPIs = categories['API Endpoints']?.results.filter(r => r.status === 'FAIL') || [];
  if (failedAPIs.length > 0) {
    recommendations.push(`🔴 ${failedAPIs.length} API endpoints are failing - check server logs`);
  }

  // Check for missing pages
  const failedPages = categories['Page Routes']?.results.filter(r => r.status === 'FAIL') || [];
  if (failedPages.length > 0) {
    recommendations.push(`🔴 ${failedPages.length} page routes are failing - check Next.js routing`);
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operational - no critical issues found');
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
    summary: {
      total,
      passed,
      failed,
      skipped,
      warnings,
      passRate: `${((passed / total) * 100).toFixed(1)}%`,
    },
    categories,
    databaseHealth,
    recommendations,
  };
}

function printSummary(report: AuditReport) {
  log('\n' + '═'.repeat(60), 'cyan');
  log('                    AUDIT REPORT SUMMARY', 'bright');
  log('═'.repeat(60), 'cyan');

  log(`\n📅 Timestamp: ${report.timestamp}`);
  log(`🌍 Environment: ${report.environment}`);
  log(`🔗 Base URL: ${report.baseUrl}`);

  log('\n📊 Overall Results:', 'bright');
  log('─'.repeat(40));
  log(`  Total Tests:  ${report.summary.total}`);
  log(`  ✓ Passed:     ${report.summary.passed}`, 'green');
  log(`  ✗ Failed:     ${report.summary.failed}`, 'red');
  log(`  ○ Skipped:    ${report.summary.skipped}`, 'yellow');
  log(`  ⚠ Warnings:   ${report.summary.warnings}`, 'yellow');
  log(`  📈 Pass Rate: ${report.summary.passRate}`, 'bright');

  log('\n📁 Results by Category:', 'bright');
  log('─'.repeat(40));
  for (const [category, data] of Object.entries(report.categories)) {
    const rate = ((data.passed / data.total) * 100).toFixed(0);
    const color = data.failed === 0 ? 'green' : 'red';
    log(`  ${category}: ${data.passed}/${data.total} (${rate}%)`, color);
  }

  log('\n🗄️  Database Health:', 'bright');
  log('─'.repeat(40));
  log(`  Connected: ${report.databaseHealth.connected ? 'Yes ✓' : 'No ✗'}`, report.databaseHealth.connected ? 'green' : 'red');
  if (report.databaseHealth.connected) {
    for (const [table, count] of Object.entries(report.databaseHealth.tableStats)) {
      log(`  ${table}: ${count} records`);
    }
  }

  log('\n💡 Recommendations:', 'bright');
  log('─'.repeat(40));
  for (const rec of report.recommendations) {
    log(`  ${rec}`);
  }

  log('\n' + '═'.repeat(60), 'cyan');
}

async function saveReport(report: AuditReport) {
  const reportsDir = path.join(process.cwd(), 'scripts', 'audit', 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audit-report-${timestamp}.json`;
  const filepath = path.join(reportsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  log(`\n📄 Report saved to: ${filepath}`, 'green');

  // Also save a markdown report
  const mdFilename = `audit-report-${timestamp}.md`;
  const mdFilepath = path.join(reportsDir, mdFilename);
  const mdContent = generateMarkdownReport(report);
  fs.writeFileSync(mdFilepath, mdContent);
  log(`📄 Markdown report saved to: ${mdFilepath}`, 'green');
}

function generateMarkdownReport(report: AuditReport): string {
  let md = `# StepperGO Audit Report\n\n`;
  md += `**Generated:** ${report.timestamp}\n`;
  md += `**Environment:** ${report.environment}\n`;
  md += `**Base URL:** ${report.baseUrl}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${report.summary.total} |\n`;
  md += `| Passed | ${report.summary.passed} ✅ |\n`;
  md += `| Failed | ${report.summary.failed} ❌ |\n`;
  md += `| Skipped | ${report.summary.skipped} ⏭️ |\n`;
  md += `| Warnings | ${report.summary.warnings} ⚠️ |\n`;
  md += `| Pass Rate | ${report.summary.passRate} |\n\n`;

  md += `## Results by Category\n\n`;
  for (const [category, data] of Object.entries(report.categories)) {
    md += `### ${category}\n\n`;
    md += `| Test | Status | Message |\n`;
    md += `|------|--------|--------|\n`;
    for (const result of data.results) {
      const icon = { PASS: '✅', FAIL: '❌', SKIP: '⏭️', WARNING: '⚠️' }[result.status];
      md += `| ${result.name} | ${icon} ${result.status} | ${result.message} |\n`;
    }
    md += `\n`;
  }

  md += `## Database Health\n\n`;
  md += `**Connected:** ${report.databaseHealth.connected ? 'Yes ✅' : 'No ❌'}\n\n`;
  if (Object.keys(report.databaseHealth.tableStats).length > 0) {
    md += `| Table | Records |\n`;
    md += `|-------|--------|\n`;
    for (const [table, count] of Object.entries(report.databaseHealth.tableStats)) {
      md += `| ${table} | ${count} |\n`;
    }
    md += `\n`;
  }

  md += `## Recommendations\n\n`;
  for (const rec of report.recommendations) {
    md += `- ${rec}\n`;
  }

  return md;
}

// ===========================================
// MAIN EXECUTION
// ===========================================

async function main() {
  log('\n🔍 StepperGO Application Validation', 'bright');
  log('═'.repeat(60), 'cyan');
  log(`Started at: ${new Date().toISOString()}`);
  log(`Testing against: ${BASE_URL}`);

  // Check if server is running
  log('\n🚀 Checking server availability...', 'cyan');
  try {
    await fetchWithTimeout(`${BASE_URL}/api/trips`, {}, 5000);
    log('  Server is running ✓', 'green');
  } catch {
    log('  ⚠️  Server may not be running. Some tests may fail.', 'yellow');
    log('  Run "npm run dev" to start the development server.', 'yellow');
  }

  // Run all tests
  await testEnvironmentConfig();
  const databaseHealth = await testDatabaseConnectivity();
  await testAPIEndpoints();
  await testPageRoutes();
  await testTripCreationFlow();
  await testDriverRegistrationFlow();
  await testBookingFlow();
  await testMessagingFlow();

  // Generate and display report
  const report = generateReport(databaseHealth);
  printSummary(report);
  await saveReport(report);

  // Exit with appropriate code
  const exitCode = report.summary.failed > 0 ? 1 : 0;
  log(`\n✨ Validation complete. Exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red');
  process.exit(exitCode);
}

// Run the validation
main().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
