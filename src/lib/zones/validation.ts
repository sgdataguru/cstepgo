// Route validation logic

import {
  Attraction,
  RouteValidationResult,
  RouteValidationError,
  RouteValidationWarning,
  Zone,
  MAX_SINGLE_DAY_DISTANCE,
} from './types';
import {
  calculateMaxDistance,
  calculateEstimatedDuration,
  findDistantAttractions,
} from './distance';

/**
 * Detect if a route has backtracking (inefficient zone progression)
 * Examples: A → C → A, or B → A → C
 * @param zones Array of zones in visit order
 * @returns True if backtracking detected
 */
function detectBacktracking(zones: Zone[]): boolean {
  if (zones.length < 3) {
    return false;
  }

  // Check for non-monotonic progression
  // Acceptable: A→A→B, A→B→B, B→C→C, A→B→C
  // Not acceptable: A→C→A, B→A→C, C→B→A
  
  for (let i = 0; i < zones.length - 2; i++) {
    const current = zones[i];
    const next = zones[i + 1];
    const afterNext = zones[i + 2];
    
    // Check if we go from inner to outer and back to inner
    // A (inner) → C (outer) → A (inner)
    if (current === Zone.A && next === Zone.C && afterNext === Zone.A) {
      return true;
    }
    
    // B → A → C (going backward then forward)
    if (current === Zone.B && next === Zone.A && afterNext === Zone.C) {
      return true;
    }
    
    // C → B → C (inefficient)
    if (current === Zone.C && next === Zone.B && afterNext === Zone.C) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate a trip itinerary based on selected attractions
 * @param attractions Array of attractions in visit order
 * @returns Validation result with errors, warnings, and suggestions
 */
export function validateItinerary(attractions: Attraction[]): RouteValidationResult {
  const errors: RouteValidationError[] = [];
  const warnings: RouteValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Rule 0: Must have at least one attraction
  if (attractions.length === 0) {
    errors.push({
      type: 'NO_ATTRACTIONS',
      message: 'Please select at least one attraction for your trip.',
      affectedAttractions: [],
    });
    return {
      isValid: false,
      errors,
      warnings,
      suggestions: ['Select attractions from the list to start planning your trip.'],
    };
  }
  
  // Rule 1: Cannot select attractions >200km apart in same day
  const maxDistance = calculateMaxDistance(attractions);
  if (maxDistance > MAX_SINGLE_DAY_DISTANCE) {
    const distantAttractions = findDistantAttractions(
      attractions,
      MAX_SINGLE_DAY_DISTANCE
    );
    
    errors.push({
      type: 'MAX_DISTANCE',
      message: `Some attractions are ${Math.round(maxDistance)}km apart. Maximum single-day distance is ${MAX_SINGLE_DAY_DISTANCE}km.`,
      affectedAttractions: distantAttractions,
    });
    suggestions.push('Consider splitting into a multi-day trip or removing distant attractions.');
  }
  
  // Rule 2: Prevent backtracking (Zone A → C → A)
  const zones = attractions.map(a => a.zone);
  if (detectBacktracking(zones)) {
    errors.push({
      type: 'BACKTRACKING',
      message: 'This route requires backtracking through zones inefficiently.',
      affectedAttractions: attractions.map(a => a.id),
    });
    suggestions.push('Reorder attractions to create a logical route (e.g., Zone A → B → C).');
  }
  
  // Rule 3: Zone C combinations require overnight (warning, not error)
  const zoneCAttractions = attractions.filter(a => a.zone === Zone.C).length;
  if (zoneCAttractions > 1) {
    warnings.push({
      type: 'OVERNIGHT_RECOMMENDED',
      message: `This itinerary includes ${zoneCAttractions} regional attractions and requires overnight stay.`,
      canProceed: true,
    });
    suggestions.push('An overnight stay will be included in your pricing.');
  }
  
  // Rule 4: Cross-zone penalty warning
  const uniqueZones = [...new Set(zones)];
  const hasZoneA = uniqueZones.includes(Zone.A);
  const hasZoneB = uniqueZones.includes(Zone.B);
  const hasZoneC = uniqueZones.includes(Zone.C);
  
  if ((hasZoneA && hasZoneC && !hasZoneB) || uniqueZones.length >= 3) {
    warnings.push({
      type: 'CROSS_ZONE',
      message: 'Mixing zones from different areas will incur a 30% cross-zone fee.',
      canProceed: true,
    });
    suggestions.push('Consider grouping attractions from the same zone to avoid additional fees.');
  }
  
  // Rule 5: Long duration warning
  const estimatedDuration = calculateEstimatedDuration(attractions);
  if (estimatedDuration > 12) {
    warnings.push({
      type: 'LONG_DURATION',
      message: `This itinerary requires approximately ${Math.round(estimatedDuration)} hours. This may be too long for a comfortable day trip.`,
      canProceed: true,
    });
    suggestions.push('Consider reducing the number of attractions or splitting into multiple days.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Check if a route is valid (no errors)
 * @param attractions Array of attractions
 * @returns True if route has no validation errors
 */
export function isValidRoute(attractions: Attraction[]): boolean {
  const result = validateItinerary(attractions);
  return result.isValid;
}
