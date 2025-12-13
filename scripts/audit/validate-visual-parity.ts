/**
 * StepperGO Visual Parity Validation Script
 * 
 * Validates that key pages maintain consistent visual theming,
 * specifically checking for neon/black gaming theme consistency
 * across the home page and Kazakhstan page.
 * 
 * Usage: npx tsx scripts/audit/validate-visual-parity.ts
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
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface ThemeCheck {
  name: string;
  patterns: string[];
  file: string;
}

async function main() {
  log('\n🎮 StepperGO Visual Parity Validation', 'bright');
  log('═'.repeat(60), 'cyan');
  log('Checking neon/black gaming theme consistency', 'cyan');
  
  const issues: string[] = [];
  const warnings: string[] = [];
  const successes: string[] = [];

  // Define theme elements to check
  const neonThemeChecks: ThemeCheck[] = [
    {
      name: 'Dark Background (#0a0a0a)',
      patterns: ['bg-\\[#0a0a0a\\]', 'bg-gaming-bg-primary'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Neon Cyan Accent (#00f0ff)',
      patterns: ['#00f0ff', 'text-\\[#00f0ff\\]', 'border-\\[#00f0ff\\]'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Neon Purple Accent (#cc00ff)',
      patterns: ['#cc00ff', 'text-\\[#cc00ff\\]', 'border-\\[#cc00ff\\]'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Neon Green Accent (#00ff88)',
      patterns: ['#00ff88', 'text-\\[#00ff88\\]', 'bg-\\[#00ff88\\]'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Gaming Display Font (Space Grotesk)',
      patterns: ['font-display'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Neon Glow Shadow Effects',
      patterns: ['shadow-neon', 'drop-shadow-\\[0_0_', 'animate-pulse'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Floating Neon Orbs Background',
      patterns: ['blur-3xl', 'animate-pulse', 'rounded-full'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Backdrop Blur Glass Effect',
      patterns: ['backdrop-blur'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
  ];

  log('\n🎨 Checking Gaming Theme Elements on Kazakhstan Page...', 'cyan');
  
  for (const check of neonThemeChecks) {
    const filePath = path.join(process.cwd(), check.file);
    
    if (!fs.existsSync(filePath)) {
      issues.push(`File not found: ${check.file}`);
      log(`  ✗ ${check.name}: File not found`, 'red');
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let found = false;

    for (const pattern of check.patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(content)) {
        found = true;
        break;
      }
    }

    if (found) {
      successes.push(`${check.name}: Present`);
      log(`  ✓ ${check.name}`, 'green');
    } else {
      issues.push(`${check.name}: Missing in ${check.file}`);
      log(`  ✗ ${check.name}: Not found`, 'red');
    }
  }

  // Check for anti-patterns (things that should NOT be present)
  log('\n🚫 Checking for Anti-Patterns (Gray/Default Styling)...', 'cyan');
  
  const antiPatterns = [
    {
      name: 'Gray Gradient Backgrounds',
      patterns: ['from-gray-50', 'to-gray-100', 'bg-gradient-to-br from-gray'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
    {
      name: 'Generic Button Colors',
      patterns: ['bg-gray-100', 'bg-primary-modernSg text-white(?!.*neon)'],
      file: 'src/app/trips/kazakhstan/page.tsx',
    },
  ];

  for (const antiPattern of antiPatterns) {
    const filePath = path.join(process.cwd(), antiPattern.file);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let found = false;

    for (const pattern of antiPattern.patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(content)) {
        found = true;
        break;
      }
    }

    if (found) {
      warnings.push(`${antiPattern.name}: Still present in ${antiPattern.file}`);
      log(`  ⚠ ${antiPattern.name}: Found (should be removed)`, 'yellow');
    } else {
      successes.push(`${antiPattern.name}: Properly removed`);
      log(`  ✓ ${antiPattern.name}: Not found (good)`, 'green');
    }
  }

  // Check for zone legend banner
  log('\n📋 Checking Zone Legend Banner Prominence...', 'cyan');
  
  const kazakhstanPath = path.join(process.cwd(), 'src/app/trips/kazakhstan/page.tsx');
  if (fs.existsSync(kazakhstanPath)) {
    const content = fs.readFileSync(kazakhstanPath, 'utf-8');
    
    const hasLegendBanner = /Day Trips.*Multi-Day.*Expeditions/i.test(content);
    const hasProminentStyling = /text-2xl.*font-display.*font-bold/i.test(content);
    const hasNeonStyling = /text-\[#00ff88\].*drop-shadow/i.test(content);
    
    if (hasLegendBanner && hasProminentStyling && hasNeonStyling) {
      successes.push('Zone legend banner: Prominent and styled correctly');
      log('  ✓ Zone legend banner with neon styling', 'green');
      log('  ✓ "Day Trips to Multi-Day Expeditions" text present', 'green');
      log('  ✓ Prominent heading with display font', 'green');
    } else {
      if (!hasLegendBanner) {
        issues.push('Zone legend banner: Missing "Day Trips to Multi-Day Expeditions" text');
        log('  ✗ Missing legend banner text', 'red');
      }
      if (!hasProminentStyling) {
        issues.push('Zone legend banner: Not using prominent styling');
        log('  ✗ Banner not prominently styled', 'red');
      }
      if (!hasNeonStyling) {
        warnings.push('Zone legend banner: Missing neon accent styling');
        log('  ⚠ Banner missing neon accent', 'yellow');
      }
    }
  }

  // Cross-page consistency check
  log('\n🔄 Checking Cross-Page Consistency...', 'cyan');
  
  const homePath = path.join(process.cwd(), 'src/app/page.tsx');
  if (fs.existsSync(homePath) && fs.existsSync(kazakhstanPath)) {
    const homeContent = fs.readFileSync(homePath, 'utf-8');
    const kazakhstanContent = fs.readFileSync(kazakhstanPath, 'utf-8');
    
    // Check for common neon color values
    const neonColors = ['#00f0ff', '#cc00ff', '#00ff88', '#0a0a0a'];
    let consistentColors = 0;
    
    for (const color of neonColors) {
      const inHome = homeContent.includes(color);
      const inKazakhstan = kazakhstanContent.includes(color);
      
      if (inHome && inKazakhstan) {
        consistentColors++;
      } else if (inHome && !inKazakhstan) {
        warnings.push(`Color ${color} used in home but not in Kazakhstan page`);
      }
    }
    
    if (consistentColors === neonColors.length) {
      successes.push('All neon colors consistently used across pages');
      log('  ✓ Neon color palette consistent across pages', 'green');
    } else if (consistentColors >= 3) {
      warnings.push('Most neon colors present but some inconsistency');
      log(`  ⚠ ${consistentColors}/${neonColors.length} neon colors consistent`, 'yellow');
    } else {
      issues.push('Significant color palette inconsistency between pages');
      log(`  ✗ Only ${consistentColors}/${neonColors.length} colors consistent`, 'red');
    }
  }

  // Final Report
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 Validation Summary', 'bright');
  log('═'.repeat(60), 'cyan');
  
  log(`\n✓ Successes: ${successes.length}`, 'green');
  if (successes.length > 0) {
    successes.forEach(s => log(`  • ${s}`, 'green'));
  }
  
  if (warnings.length > 0) {
    log(`\n⚠ Warnings: ${warnings.length}`, 'yellow');
    warnings.forEach(w => log(`  • ${w}`, 'yellow'));
  }
  
  if (issues.length > 0) {
    log(`\n✗ Issues: ${issues.length}`, 'red');
    issues.forEach(i => log(`  • ${i}`, 'red'));
    log('\n❌ Visual parity validation FAILED', 'red');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('\n⚠️  Visual parity validation passed with warnings', 'yellow');
    log('Consider addressing warnings for optimal consistency', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ Visual parity validation PASSED!', 'green');
    log('Kazakhstan page theme matches home page standards', 'green');
    process.exit(0);
  }
}

main().catch((error) => {
  log('\n❌ Validation script error:', 'red');
  console.error(error);
  process.exit(1);
});
