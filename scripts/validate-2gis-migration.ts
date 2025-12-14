#!/usr/bin/env tsx

/**
 * Validation script for 2GIS Maps API integration
 * Checks that Google Maps has been removed and 2GIS is properly configured
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

console.log('🔍 Validating 2GIS Maps API Integration...\n');

// Test 1: Check that Google Maps dependencies are removed
function checkGoogleMapsDependenciesRemoved(): ValidationResult {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')
    );
    
    const googleDeps = [
      '@googlemaps/js-api-loader',
      '@types/google.maps',
      'google-map-react',
    ];
    
    const foundDeps = googleDeps.filter(
      dep => packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
    );
    
    if (foundDeps.length > 0) {
      return {
        passed: false,
        message: '❌ Google Maps dependencies still present',
        details: `Found: ${foundDeps.join(', ')}`,
      };
    }
    
    return {
      passed: true,
      message: '✅ Google Maps dependencies removed',
    };
  } catch (error) {
    return {
      passed: false,
      message: '❌ Failed to check package.json',
      details: String(error),
    };
  }
}

// Test 2: Check that 2GIS API key is configured
function check2GISApiKeyConfigured(): ValidationResult {
  try {
    const envExample = readFileSync(join(ROOT_DIR, '.env.example'), 'utf-8');
    
    if (envExample.includes('NEXT_PUBLIC_2GIS_API_KEY')) {
      return {
        passed: true,
        message: '✅ 2GIS API key configured in .env.example',
      };
    }
    
    return {
      passed: false,
      message: '❌ 2GIS API key not found in .env.example',
    };
  } catch (error) {
    return {
      passed: false,
      message: '❌ Failed to check .env.example',
      details: String(error),
    };
  }
}

// Test 3: Check that Google Maps API key is removed
function checkGoogleMapsKeyRemoved(): ValidationResult {
  try {
    const envExample = readFileSync(join(ROOT_DIR, '.env.example'), 'utf-8');
    
    if (envExample.includes('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') || 
        envExample.includes('GOOGLE_PLACES_API_KEY')) {
      return {
        passed: false,
        message: '❌ Google Maps API keys still in .env.example',
      };
    }
    
    return {
      passed: true,
      message: '✅ Google Maps API keys removed from .env.example',
    };
  } catch (error) {
    return {
      passed: false,
      message: '❌ Failed to check .env.example',
      details: String(error),
    };
  }
}

// Test 4: Check that 2GIS adapter exists
function check2GISAdapterExists(): ValidationResult {
  const adapterPath = join(ROOT_DIR, 'src/lib/maps/2gis-adapter.ts');
  
  if (existsSync(adapterPath)) {
    return {
      passed: true,
      message: '✅ 2GIS adapter file exists',
    };
  }
  
  return {
    passed: false,
    message: '❌ 2GIS adapter file not found',
    details: `Expected: ${adapterPath}`,
  };
}

// Test 5: Check that use2GISPlaces hook exists
function checkUse2GISPlacesHookExists(): ValidationResult {
  const hookPath = join(ROOT_DIR, 'src/hooks/use2GISPlaces.ts');
  
  if (existsSync(hookPath)) {
    return {
      passed: true,
      message: '✅ use2GISPlaces hook exists',
    };
  }
  
  return {
    passed: false,
    message: '❌ use2GISPlaces hook not found',
    details: `Expected: ${hookPath}`,
  };
}

// Test 6: Check that components use 2GIS instead of Google Maps
function checkComponentsUse2GIS(): ValidationResult {
  const filesToCheck = [
    'src/components/LocationAutocomplete/index.tsx',
    'src/components/navigation/NavigationMap.tsx',
    'src/components/tracking/LiveTrackingMap.tsx',
    'src/hooks/useAutocomplete.ts',
  ];
  
  const issues: string[] = [];
  
  for (const file of filesToCheck) {
    const filePath = join(ROOT_DIR, file);
    
    if (!existsSync(filePath)) {
      issues.push(`File not found: ${file}`);
      continue;
    }
    
    const content = readFileSync(filePath, 'utf-8');
    
    // Check for Google Maps references
    if (content.includes('@googlemaps/js-api-loader') ||
        content.includes('google.maps') ||
        content.includes('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')) {
      issues.push(`${file} still references Google Maps`);
    }
    
    // Check for 2GIS references
    if (!content.includes('2GIS') && !content.includes('2gis') && !content.includes('TwoGIS')) {
      issues.push(`${file} does not reference 2GIS`);
    }
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: '❌ Some components still use Google Maps',
      details: issues.join('\n'),
    };
  }
  
  return {
    passed: true,
    message: '✅ All components updated to use 2GIS',
  };
}

// Test 7: Check that documentation is updated
function checkDocumentationUpdated(): ValidationResult {
  const docsToCheck = [
    'README.md',
    'docs/GPS_NAVIGATION.md',
  ];
  
  const issues: string[] = [];
  
  for (const doc of docsToCheck) {
    const docPath = join(ROOT_DIR, doc);
    
    if (!existsSync(docPath)) {
      issues.push(`Documentation not found: ${doc}`);
      continue;
    }
    
    const content = readFileSync(docPath, 'utf-8');
    
    // Check for outdated Google Maps references
    if (content.includes('Google Maps API') || content.includes('Google Places')) {
      issues.push(`${doc} still mentions Google Maps`);
    }
  }
  
  // Check for 2GIS integration guide
  const integrationGuide = join(ROOT_DIR, 'docs/2GIS_MAPS_INTEGRATION.md');
  if (!existsSync(integrationGuide)) {
    issues.push('2GIS integration guide not found');
  }
  
  if (issues.length > 0) {
    return {
      passed: false,
      message: '❌ Documentation needs updates',
      details: issues.join('\n'),
    };
  }
  
  return {
    passed: true,
    message: '✅ Documentation updated',
  };
}

// Test 8: Check that API routes use 2GIS
function checkAPIRoutesUse2GIS(): ValidationResult {
  const routePath = join(ROOT_DIR, 'src/app/api/navigation/route/route.ts');
  
  if (!existsSync(routePath)) {
    return {
      passed: false,
      message: '❌ Navigation route API not found',
    };
  }
  
  const content = readFileSync(routePath, 'utf-8');
  
  if (content.includes('googleapis.com') || content.includes('Google')) {
    return {
      passed: false,
      message: '❌ API route still references Google Maps',
    };
  }
  
  if (content.includes('2gis') || content.includes('2GIS')) {
    return {
      passed: true,
      message: '✅ API routes updated to use 2GIS',
    };
  }
  
  return {
    passed: false,
    message: '❌ API routes do not reference 2GIS',
  };
}

// Run all tests
console.log('Running validation tests...\n');

results.push(checkGoogleMapsDependenciesRemoved());
results.push(check2GISApiKeyConfigured());
results.push(checkGoogleMapsKeyRemoved());
results.push(check2GISAdapterExists());
results.push(checkUse2GISPlacesHookExists());
results.push(checkComponentsUse2GIS());
results.push(checkDocumentationUpdated());
results.push(checkAPIRoutesUse2GIS());

// Print results
console.log('\n📊 Validation Results:\n');
console.log('='.repeat(60));

results.forEach(result => {
  console.log(result.message);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
});

console.log('='.repeat(60));

// Summary
const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\n✨ Passed: ${passed}/${total} (${percentage}%)\n`);

if (passed === total) {
  console.log('🎉 All validation checks passed!');
  console.log('✅ Migration from Google Maps to 2GIS is complete.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some validation checks failed.');
  console.log('Please address the issues above before deploying.\n');
  process.exit(1);
}
