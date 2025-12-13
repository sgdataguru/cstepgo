/**
 * StepperGO Quick Validation Script
 * 
 * A lighter version that only checks database and file structure.
 * Does not require the server to be running.
 * 
 * Usage: npx tsx scripts/audit/quick-validate.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

async function main() {
  log('\n🔍 StepperGO Quick Validation', 'bright');
  log('═'.repeat(50), 'cyan');
  
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check required files
  log('\n�� Checking Project Structure...', 'cyan');
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'tsconfig.json',
    'prisma/schema.prisma',
    '.env',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/lib/prisma.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`  ✓ ${file}`, 'green');
    } else {
      log(`  ✗ ${file} - Missing!`, 'red');
      issues.push(`Missing required file: ${file}`);
    }
  }

  // 2. Check required directories
  log('\n📂 Checking Required Directories...', 'cyan');
  const requiredDirs = [
    'src/app/api',
    'src/components',
    'src/lib',
    'prisma',
    'public',
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      log(`  ✓ ${dir}/`, 'green');
    } else {
      log(`  ✗ ${dir}/ - Missing!`, 'red');
      issues.push(`Missing required directory: ${dir}`);
    }
  }

  // 3. Check environment variables
  log('\n🔐 Checking Environment Variables...', 'cyan');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const requiredEnvVars = ['DATABASE_URL'];
    const optionalEnvVars = ['JWT_SECRET', 'NEXT_PUBLIC_APP_URL', 'STRIPE_SECRET_KEY'];

    for (const envVar of requiredEnvVars) {
      if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your_`)) {
        log(`  ✓ ${envVar}`, 'green');
      } else {
        log(`  ✗ ${envVar} - Not configured`, 'red');
        issues.push(`Missing required env var: ${envVar}`);
      }
    }

    for (const envVar of optionalEnvVars) {
      if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your_`)) {
        log(`  ✓ ${envVar}`, 'green');
      } else {
        log(`  ⚠ ${envVar} - Not configured (optional)`, 'yellow');
        warnings.push(`Optional env var not configured: ${envVar}`);
      }
    }
  } else {
    log(`  ✗ .env file not found!`, 'red');
    issues.push('.env file is missing');
  }

  // 4. Check Database Connectivity
  log('\n🗄️  Checking Database...', 'cyan');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    log('  ✓ Database connection successful', 'green');

    // Check each table individually to handle missing tables
    const tables = [
      { name: 'Users', query: () => prisma.user.count() },
      { name: 'Trips', query: () => prisma.trip.count() },
      { name: 'Bookings', query: () => prisma.booking.count() },
      { name: 'Drivers', query: () => prisma.driver.count() },
      { name: 'Payments', query: () => prisma.payment.count() },
      { name: 'Sessions', query: () => prisma.session.count() },
    ];

    const tableCounts: { name: string; count: number }[] = [];
    
    log('\n  📊 Table Statistics:', 'bright');
    for (const table of tables) {
      try {
        const count = await table.query();
        tableCounts.push({ name: table.name, count });
        log(`     ${table.name}: ${count} records`);
      } catch {
        log(`     ${table.name}: Table not found or error`, 'yellow');
        warnings.push(`Table ${table.name} may not exist or had an error`);
      }
    }

    // Warnings for empty tables
    if (tableCounts.find(t => t.name === 'Users')?.count === 0) {
      warnings.push('No users in database - consider running seed script');
    }
    if (tableCounts.find(t => t.name === 'Trips')?.count === 0) {
      warnings.push('No trips in database - consider running seed script');
    }
    if (tableCounts.find(t => t.name === 'Drivers')?.count === 0) {
      warnings.push('No drivers in database - driver features will be limited');
    }

    await prisma.$disconnect();
  } catch (error) {
    log(`  ✗ Database connection failed: ${error}`, 'red');
    issues.push(`Database connection failed: ${error}`);
  }

  // 5. Check API Route Files
  log('\n🛣️  Checking API Routes...', 'cyan');
  const apiDir = path.join(process.cwd(), 'src/app/api');
  let apiRouteCount = 0;
  
  function countRoutes(dir: string): number {
    let count = 0;
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          count += countRoutes(itemPath);
        } else if (item === 'route.ts' || item === 'route.tsx') {
          count++;
        }
      }
    }
    return count;
  }

  apiRouteCount = countRoutes(apiDir);
  log(`  ✓ Found ${apiRouteCount} API route files`, 'green');

  // 6. Check Page Files
  log('\n📄 Checking Page Routes...', 'cyan');
  const appDir = path.join(process.cwd(), 'src/app');
  let pageCount = 0;

  function countPages(dir: string): number {
    let count = 0;
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory() && item !== 'api') {
          count += countPages(itemPath);
        } else if (item === 'page.tsx' || item === 'page.ts') {
          count++;
        }
      }
    }
    return count;
  }

  pageCount = countPages(appDir);
  log(`  ✓ Found ${pageCount} page route files`, 'green');

  // 7. Check Components
  log('\n🧩 Checking Components...', 'cyan');
  const componentsDir = path.join(process.cwd(), 'src/components');
  let componentCount = 0;

  function countComponents(dir: string): number {
    let count = 0;
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          count += countComponents(itemPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          count++;
        }
      }
    }
    return count;
  }

  componentCount = countComponents(componentsDir);
  log(`  ✓ Found ${componentCount} component files`, 'green');

  // Print Summary
  log('\n' + '═'.repeat(50), 'cyan');
  log('                VALIDATION SUMMARY', 'bright');
  log('═'.repeat(50), 'cyan');

  log(`\n📊 Statistics:`, 'bright');
  log(`   API Routes:   ${apiRouteCount}`);
  log(`   Page Routes:  ${pageCount}`);
  log(`   Components:   ${componentCount}`);

  if (issues.length > 0) {
    log(`\n❌ Issues Found (${issues.length}):`, 'red');
    for (const issue of issues) {
      log(`   • ${issue}`, 'red');
    }
  }

  if (warnings.length > 0) {
    log(`\n⚠️  Warnings (${warnings.length}):`, 'yellow');
    for (const warning of warnings) {
      log(`   • ${warning}`, 'yellow');
    }
  }

  if (issues.length === 0) {
    log('\n✅ All critical checks passed!', 'green');
  }

  log('\n' + '═'.repeat(50), 'cyan');

  // Exit with appropriate code
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Quick validation failed:', error);
  process.exit(1);
});
