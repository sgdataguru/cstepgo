# User Story: 14 - Zone-Based Itinerary and Pricing

**As a** traveler creating a custom trip,
**I want** to select attractions grouped by geographic zones with zone-specific pricing,
**so that** I can build a realistic itinerary without illogical routing.

## Acceptance Criteria

### Zone Definition System
* Attractions categorized into zones based on distance from city center:
  - **Zone A (City Center)**: 0-10km radius - Example: Bishkek city sights
  - **Zone B (Suburban)**: 10-50km radius - Example: Ala-Archa National Park
  - **Zone C (Regional)**: 50-200km radius - Example: Issyk-Kul Lake, Song-Kol
* Each zone has base pricing formula
* Visual zone map displayed during trip creation

### Trip Creation Flow with Zones
1. **Select Primary Zone**:
   - User chooses main destination zone: "Where do you want to go?"
   - Display zone descriptions and example attractions
   - Show zone pricing indicator: $ (A), $$ (B), $$$ (C)

2. **Add Attractions Within Zone**:
   - After selecting zone, show curated list of attractions in that zone
   - User can multi-select attractions (checkboxes)
   - Real-time itinerary preview updates
   - Map view shows selected attractions

3. **Cross-Zone Addition (Optional)**:
   - User can add attractions from adjacent zones
   - Warning: "Adding [Attraction] from Zone C will increase distance by +150km"
   - Price recalculation shown immediately

### Pricing Logic by Zone
* **Zone A**: Base price + (number of attractions × $10)
* **Zone B**: Base price × 1.5 + (number of attractions × $20)
* **Zone C**: Base price × 3 + (number of attractions × $50) + overnight surcharge

* **Cross-Zone Penalty**: +30% for mixing non-adjacent zones
  - Example: Zone A + Zone C (skipping B) → +30% surcharge

### Route Validation
* System prevents illogical itineraries:
  - Cannot select attractions >200km apart in same day
  - Cannot choose Zone A → Zone C → Zone A (backtracking)
  - Multi-day trips required for Zone C combinations
* Validation errors display:
  - "This combination requires 2 days. Add overnight stay?"
  - "Attractions are too far apart. Consider splitting into separate trips."

### Price Transparency
* Real-time price calculator visible throughout:
  ```
  Base Vehicle Price: $100
  Zone B Multiplier: ×1.5 = $150
  Attractions (3): 3 × $20 = $60
  ---------------------------------
  Total Estimated: $210
  Per Person (if 4 join): $52.50
  ```

* Price breakdown modal:
  - Distance: [X] km
  - Estimated duration: [Y] hours
  - Zones covered: A, B
  - Attractions: [List]

### Vehicle Type Integration
* Zone affects vehicle recommendation:
  - Zone A: Any vehicle (Sedan, Van)
  - Zone B: Van recommended (comfort for longer distance)
  - Zone C: Mini-bus required (multi-day, luggage capacity)
* Pricing adjusted by vehicle type:
  - Sedan base: $100
  - Van base: $150
  - Mini-bus base: $300

## Technical Notes

### Database Schema
* `attractions` table:
  ```sql
  id: UUID
  name: STRING
  zone: ENUM('A', 'B', 'C')
  latitude: DECIMAL
  longitude: DECIMAL
  base_price_impact: DECIMAL
  estimated_duration_hours: INT
  ```

* `trips` table add columns:
  ```sql
  selected_attractions: JSONB (array of attraction IDs)
  zones_covered: ARRAY[zone_enum]
  total_distance_km: INT
  estimated_duration_hours: INT
  base_price_zone_adjusted: DECIMAL
  ```

### Pricing Calculation Formula
```javascript
function calculateZonePrice(attractions, vehicleType, passengers) {
  const zones = [...new Set(attractions.map(a => a.zone))];
  const basePrice = VEHICLE_PRICES[vehicleType];
  
  // Zone multiplier
  const maxZone = Math.max(...zones.map(z => ZONE_MULTIPLIERS[z]));
  let zoneAdjustedPrice = basePrice * maxZone;
  
  // Attraction fees
  const attractionFees = attractions.reduce((sum, a) => sum + a.base_price_impact, 0);
  
  // Cross-zone penalty
  const crossZonePenalty = zones.length > 2 ? 0.3 : 0;
  
  const totalPrice = (zoneAdjustedPrice + attractionFees) * (1 + crossZonePenalty);
  const pricePerPerson = totalPrice / passengers;
  
  return { totalPrice, pricePerPerson, breakdown: {...} };
}
```

### PostHog Events
* `trip_creation_zone_selected` (zone: A/B/C)
* `attraction_added` (zone, attraction_id)
* `cross_zone_warning_shown`
* `price_breakdown_viewed`
* `itinerary_validation_failed` (reason)

### Edge Cases
* User selects only Zone A attractions → No zone penalty
* User mixes all 3 zones → Show "This itinerary may take 3 days" warning
* Attraction temporarily closed → Gray out with tooltip
* Price exceeds typical budget → Show "This is a premium itinerary" badge

## Success Metrics
* % of trips using zone system: >80%
* Avg attractions per trip: 3-5
* Cross-zone penalty rate: <20% (indicates logical routing)
* Itinerary validation errors: <10% (system guides users well)

## Gate Assignment
**Gate 3** (Zone system implementation with pricing engine)
**Gate 4** (Advanced route optimization, overnight stay recommendations)

## Notes from Transcript
* Reese: "Let's say Singapore is a city, right? So we have three zones in Singapore. City center going to be one zone, they have one fixed price. So from the city 10 kilometers range, one zone, that's a fixed price..."
* Ming: "The platform should use some formula or whatever to calculate the price based on zones"
* Business Goal: Prevent users from creating illogical itineraries like "city center → 100km north → back to city → 150km south" which wastes driver time and gas
