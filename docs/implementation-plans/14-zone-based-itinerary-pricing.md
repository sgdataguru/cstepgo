# 14 - Zone-Based Itinerary and Pricing - Implementation Plan

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS  
**Backend**: NestJS/Next.js API Routes, Prisma ORM, PostgreSQL + PostGIS  
**Geospatial**: PostGIS for distance calculations, zone boundary definitions  
**Related Stories**: Story 03 (Create Trip with Itinerary), Story 05 (Dynamic Pricing)

## User Story
**As a** traveler creating a custom trip,  
**I want** to select attractions grouped by geographic zones with zone-specific pricing,  
**so that** I can build a realistic itinerary without illogical routing.

## Pre-conditions
- ✅ Database has PostGIS extension enabled
- ✅ Attractions database with latitude/longitude coordinates
- ✅ Trip creation flow exists (Story 03)
- ✅ Vehicle types defined (Sedan, Van, Mini-bus)
- ⏳ Admin panel to manage attraction zones (Story E1/E2)

## Business Requirements
- **Logical Routing**: >80% of trips use zone system appropriately
- **Cross-Zone Prevention**: <20% of trips trigger cross-zone penalties (indicates good UX guidance)
- **Price Transparency**: 100% of users see real-time price breakdown
- **Validation Success**: <10% itinerary validation error rate
- **Avg Attractions**: 3-5 attractions per custom trip

## Technical Specifications

### Zone Classification System
**Zone Definitions**:
```typescript
enum Zone {
  A = 'A', // City Center: 0-10km radius
  B = 'B', // Suburban: 10-50km radius
  C = 'C', // Regional: 50-200km radius
}

interface ZoneConfig {
  zone: Zone;
  radiusMin: number; // in km
  radiusMax: number;
  description: string;
  priceMultiplier: number;
  attractionBaseFee: number;
  vehicleRecommendation: VehicleType[];
}

const ZONE_CONFIG: Record<Zone, ZoneConfig> = {
  A: {
    zone: 'A',
    radiusMin: 0,
    radiusMax: 10,
    description: 'City Center - Quick urban tours',
    priceMultiplier: 1.0,
    attractionBaseFee: 10,
    vehicleRecommendation: ['Sedan', 'Van'],
  },
  B: {
    zone: 'B',
    radiusMin: 10,
    radiusMax: 50,
    description: 'Suburban - Day trips to nearby regions',
    priceMultiplier: 1.5,
    attractionBaseFee: 20,
    vehicleRecommendation: ['Van'],
  },
  C: {
    zone: 'C',
    radiusMin: 50,
    radiusMax: 200,
    description: 'Regional - Multi-day adventures',
    priceMultiplier: 3.0,
    attractionBaseFee: 50,
    vehicleRecommendation: ['Mini-bus'],
  },
};
```

### Pricing Formula
```typescript
interface PriceCalculation {
  baseVehiclePrice: number;
  zoneMultiplier: number;
  zoneAdjustedPrice: number;
  attractionFees: number;
  crossZonePenalty: number;
  overnightSurcharge: number;
  totalPrice: number;
  pricePerPerson: number;
  breakdown: PriceBreakdown;
}

interface PriceBreakdown {
  basePrice: number;
  zoneName: string;
  zoneMultiplier: number;
  attractionCount: number;
  attractionFees: number;
  crossZonePenalty?: number;
  overnightRequired?: boolean;
  totalDistance: number;
  estimatedDuration: number;
}

function calculateZonePrice(
  attractions: Attraction[],
  vehicleType: VehicleType,
  passengers: number = 1
): PriceCalculation {
  // Extract unique zones
  const zones = [...new Set(attractions.map(a => a.zone))];
  
  // Base vehicle price
  const baseVehiclePrice = VEHICLE_PRICES[vehicleType];
  
  // Apply highest zone multiplier
  const maxZone = zones.reduce((max, zone) => {
    const multiplier = ZONE_CONFIG[zone].priceMultiplier;
    return multiplier > ZONE_CONFIG[max].priceMultiplier ? zone : max;
  }, zones[0]);
  
  const zoneMultiplier = ZONE_CONFIG[maxZone].priceMultiplier;
  const zoneAdjustedPrice = baseVehiclePrice * zoneMultiplier;
  
  // Calculate attraction fees
  const attractionFees = attractions.reduce((sum, attraction) => {
    return sum + ZONE_CONFIG[attraction.zone].attractionBaseFee;
  }, 0);
  
  // Cross-zone penalty (30% if mixing non-adjacent zones)
  let crossZonePenalty = 0;
  if (zones.includes('A') && zones.includes('C') && !zones.includes('B')) {
    crossZonePenalty = 0.3; // Skipping zone B
  } else if (zones.length > 2) {
    crossZonePenalty = 0.3; // Mixing all 3 zones
  }
  
  // Overnight surcharge (Zone C multi-attraction)
  let overnightSurcharge = 0;
  if (zones.includes('C') && attractions.length > 2) {
    overnightSurcharge = 100; // Flat overnight fee
  }
  
  // Total calculation
  const subtotal = zoneAdjustedPrice + attractionFees + overnightSurcharge;
  const totalPrice = subtotal * (1 + crossZonePenalty);
  const pricePerPerson = passengers > 0 ? totalPrice / passengers : totalPrice;
  
  return {
    baseVehiclePrice,
    zoneMultiplier,
    zoneAdjustedPrice,
    attractionFees,
    crossZonePenalty,
    overnightSurcharge,
    totalPrice,
    pricePerPerson,
    breakdown: {
      basePrice: baseVehiclePrice,
      zoneName: `Zone ${maxZone}`,
      zoneMultiplier,
      attractionCount: attractions.length,
      attractionFees,
      crossZonePenalty: crossZonePenalty > 0 ? crossZonePenalty : undefined,
      overnightRequired: overnightSurcharge > 0,
      totalDistance: calculateTotalDistance(attractions),
      estimatedDuration: calculateEstimatedDuration(attractions),
    },
  };
}
```

### Route Validation Logic
```typescript
interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}

interface RouteValidationError {
  type: 'MAX_DISTANCE' | 'BACKTRACKING' | 'OVERNIGHT_REQUIRED';
  message: string;
  affectedAttractions: string[];
}

function validateItinerary(attractions: Attraction[]): RouteValidationResult {
  const errors: RouteValidationError[] = [];
  const warnings: RouteValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Rule 1: Cannot select attractions >200km apart in same day
  const maxDistance = calculateMaxDistance(attractions);
  if (maxDistance > 200) {
    errors.push({
      type: 'MAX_DISTANCE',
      message: `Attractions are ${maxDistance}km apart. Maximum single-day distance is 200km.`,
      affectedAttractions: findDistantAttractions(attractions, 200),
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
    suggestions.push('Reorder attractions to create a logical route.');
  }
  
  // Rule 3: Zone C combinations require overnight
  const hasMultipleZoneC = attractions.filter(a => a.zone === 'C').length > 1;
  if (hasMultipleZoneC) {
    warnings.push({
      type: 'OVERNIGHT_REQUIRED',
      message: 'This combination requires 2 days. Add overnight stay?',
      canProceed: true,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
```

### Database Schema Extensions
```prisma
model Attraction {
  id                    String   @id @default(uuid())
  name                  String
  description           String?
  zone                  Zone     @default(A)
  latitude              Decimal  @db.Decimal(10, 8)
  longitude             Decimal  @db.Decimal(11, 8)
  basePriceImpact       Decimal  @default(0)
  estimatedDurationHours Int     @default(1)
  isActive              Boolean  @default(true)
  imageUrl              String?
  category              String?  // "Natural", "Cultural", "Historical"
  
  // PostGIS point for spatial queries
  location              Unsupported("geometry(Point, 4326)")?
  
  trips                 TripAttraction[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([zone])
  @@index([location], type: Gist) // Spatial index
}

enum Zone {
  A // City Center (0-10km)
  B // Suburban (10-50km)
  C // Regional (50-200km)
}

model Trip {
  // ... existing fields
  
  selectedAttractions   TripAttraction[]
  zonesCovered          Zone[]
  totalDistanceKm       Int?
  estimatedDurationHours Int?
  basePriceZoneAdjusted Decimal?
  requiresOvernight     Boolean @default(false)
  crossZonePenalty      Decimal @default(0)
}

model TripAttraction {
  id           String     @id @default(uuid())
  tripId       String
  attractionId String
  orderIndex   Int        // For route ordering
  
  trip         Trip       @relation(fields: [tripId], references: [id], onDelete: Cascade)
  attraction   Attraction @relation(fields: [attractionId], references: [id])
  
  @@unique([tripId, attractionId])
  @@index([tripId, orderIndex])
}
```

## Design Specifications

### Visual Layout & Components

**Trip Creation Flow - Zone Selection**:
```
┌─────────────────────────────────────────────────┐
│  Step 2: Choose Your Adventure Zone             │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Zone A  │  │ Zone B  │  │ Zone C  │         │
│  │  $      │  │  $$     │  │  $$$    │         │
│  │ City    │  │Suburban │  │Regional │         │
│  │ 0-10km  │  │10-50km  │  │50-200km │         │
│  │         │  │         │  │         │         │
│  │[Select] │  │[Select] │  │[Select] │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                  │
│  🗺️ [View Zone Map]                             │
└─────────────────────────────────────────────────┘
```

**Attraction Selection Interface**:
```
┌─────────────────────────────────────────────────┐
│  Zone B: Suburban Adventures (10-50km)          │
├──────────────────────┬──────────────────────────┤
│  Selected (2)        │  Map View                │
│  ─────────────       │  ┌──────────────────┐   │
│  ☑ Ala-Archa Park    │  │   🗺️            │   │
│  ☑ Burana Tower      │  │     📍 Ala-Archa│   │
│                      │  │  📍 Burana      │   │
│  Available           │  │                  │   │
│  ─────────────       │  └──────────────────┘   │
│  ☐ Chon-Kemin Valley │                          │
│  ☐ Issyk-Ata Resort  │  💰 Real-time Price      │
│                      │  ────────────────────    │
│  [Add from Zone C?]  │  Base: $150             │
│                      │  Zone B: ×1.5 = $225    │
│                      │  Attractions: 2×$20=$40  │
│                      │  ────────────────────    │
│                      │  Total: $265             │
│                      │  Per person (4): $66.25  │
└──────────────────────┴──────────────────────────┘
```

**Cross-Zone Warning Modal**:
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Cross-Zone Addition                         │
├─────────────────────────────────────────────────┤
│  You're adding "Issyk-Kul Lake" from Zone C     │
│                                                  │
│  This will:                                      │
│  • Increase distance by +150km                  │
│  • Add 3 hours to trip duration                 │
│  • Increase price by +$120                      │
│  • Require overnight stay (2 days)              │
│                                                  │
│  New Total: $385 ($96.25/person for 4)          │
│                                                  │
│  [Cancel]  [Add Anyway]                         │
└─────────────────────────────────────────────────┘
```

### Design System Compliance

**Zone Badge Colors**:
```css
.zone-badge-a {
  @apply bg-green-100 text-green-800 border-green-300;
}

.zone-badge-b {
  @apply bg-yellow-100 text-yellow-800 border-yellow-300;
}

.zone-badge-c {
  @apply bg-red-100 text-red-800 border-red-300;
}
```

**Price Calculator**:
```tsx
<div className="sticky top-4 bg-white rounded-xl shadow-lg p-6 border-2 border-gold">
  <h3 className="text-xl font-bold mb-4">💰 Trip Cost Estimate</h3>
  
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-600">Base Vehicle (Van)</span>
      <span className="font-semibold">$150</span>
    </div>
    
    <div className="flex justify-between">
      <span className="text-gray-600">Zone B Multiplier (×1.5)</span>
      <span className="font-semibold">$225</span>
    </div>
    
    <div className="flex justify-between">
      <span className="text-gray-600">Attractions (3 × $20)</span>
      <span className="font-semibold">$60</span>
    </div>
    
    {crossZonePenalty > 0 && (
      <div className="flex justify-between text-amber-600">
        <span>⚠️ Cross-Zone Penalty (+30%)</span>
        <span className="font-semibold">+${crossZonePenalty}</span>
      </div>
    )}
    
    <div className="border-t-2 border-gray-200 pt-2 mt-2">
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span className="text-gold">${totalPrice}</span>
      </div>
      <div className="text-gray-600 text-sm">
        ${pricePerPerson}/person (for {passengerCount} people)
      </div>
    </div>
  </div>
  
  <button className="w-full mt-4 bg-turquoise text-white py-3 rounded-lg">
    View Detailed Breakdown
  </button>
</div>
```

### Responsive Behavior
**Breakpoints**:
- **Mobile (< 768px)**: Vertical layout, map in collapsible section
- **Tablet (768px - 1023px)**: 2-column (attractions + map)
- **Desktop (1024px+)**: 3-column (attractions + map + price calculator)

## Technical Architecture

### Component Structure
```
src/app/trips/create/
├── page.tsx                           # Main trip creation page
├── components/
│   ├── ZoneSelector.tsx               # Zone A/B/C cards
│   ├── AttractionSelector.tsx         # Checkbox list + map
│   ├── ZoneMap.tsx                    # Leaflet/Mapbox map
│   ├── PriceCalculator.tsx            # Real-time price display
│   ├── RouteValidator.tsx             # Validation warnings
│   ├── CrossZoneWarningModal.tsx      # Cross-zone confirmation
│   └── hooks/
│       ├── useZonePricing.ts          # Pricing calculations
│       ├── useRouteValidation.ts      # Validation logic
│       ├── useAttractionSelection.ts  # Multi-select state
│       └── useZoneMap.ts              # Map interactions
```

### State Management Architecture

**Zustand Store**:
```typescript
interface TripCreationState {
  // Zone selection
  selectedZone: Zone | null;
  selectedAttractions: Attraction[];
  
  // Vehicle selection
  vehicleType: VehicleType;
  passengerCount: number;
  
  // Pricing
  priceCalculation: PriceCalculation | null;
  
  // Validation
  validationResult: RouteValidationResult | null;
  
  // Actions
  selectZone: (zone: Zone) => void;
  toggleAttraction: (attraction: Attraction) => void;
  removeAttraction: (attractionId: string) => void;
  reorderAttractions: (from: number, to: number) => void;
  setVehicleType: (type: VehicleType) => void;
  setPassengerCount: (count: number) => void;
  calculatePrice: () => void;
  validateRoute: () => void;
}

const useTripCreationStore = create<TripCreationState>((set, get) => ({
  selectedZone: null,
  selectedAttractions: [],
  vehicleType: 'Van',
  passengerCount: 4,
  priceCalculation: null,
  validationResult: null,
  
  selectZone: (zone) => {
    set({ selectedZone: zone, selectedAttractions: [] });
  },
  
  toggleAttraction: (attraction) => {
    const { selectedAttractions } = get();
    const exists = selectedAttractions.find(a => a.id === attraction.id);
    
    if (exists) {
      set({
        selectedAttractions: selectedAttractions.filter(a => a.id !== attraction.id),
      });
    } else {
      set({
        selectedAttractions: [...selectedAttractions, attraction],
      });
    }
    
    // Auto-recalculate price and validate
    get().calculatePrice();
    get().validateRoute();
  },
  
  calculatePrice: () => {
    const { selectedAttractions, vehicleType, passengerCount } = get();
    if (selectedAttractions.length === 0) {
      set({ priceCalculation: null });
      return;
    }
    
    const calculation = calculateZonePrice(
      selectedAttractions,
      vehicleType,
      passengerCount
    );
    
    set({ priceCalculation: calculation });
  },
  
  validateRoute: () => {
    const { selectedAttractions } = get();
    if (selectedAttractions.length < 2) {
      set({ validationResult: null });
      return;
    }
    
    const validation = validateItinerary(selectedAttractions);
    set({ validationResult: validation });
  },
}));
```

### API Integration Schema

**Endpoint**: `GET /api/attractions?zone={zone}`

**Response**:
```json
{
  "attractions": [
    {
      "id": "attr_001",
      "name": "Ala-Archa National Park",
      "description": "Scenic gorge with hiking trails",
      "zone": "B",
      "latitude": 42.5897,
      "longitude": 74.4947,
      "basePriceImpact": 20,
      "estimatedDurationHours": 4,
      "imageUrl": "https://cdn.steppergo.com/attractions/ala-archa.jpg",
      "category": "Natural"
    }
  ]
}
```

**Endpoint**: `POST /api/trips/calculate-price`

**Request**:
```json
{
  "attractionIds": ["attr_001", "attr_002"],
  "vehicleType": "Van",
  "passengerCount": 4
}
```

**Response**:
```json
{
  "baseVehiclePrice": 150,
  "zoneMultiplier": 1.5,
  "zoneAdjustedPrice": 225,
  "attractionFees": 40,
  "crossZonePenalty": 0,
  "overnightSurcharge": 0,
  "totalPrice": 265,
  "pricePerPerson": 66.25,
  "breakdown": {
    "basePrice": 150,
    "zoneName": "Zone B",
    "zoneMultiplier": 1.5,
    "attractionCount": 2,
    "attractionFees": 40,
    "totalDistance": 75,
    "estimatedDuration": 6
  }
}
```

## Implementation Requirements

### Core Components

1. **ZoneSelector.tsx** - Zone A/B/C cards
   ```tsx
   interface ZoneSelectorProps {
     selectedZone: Zone | null;
     onSelectZone: (zone: Zone) => void;
   }
   ```

2. **AttractionSelector.tsx** - Checkbox list
   ```tsx
   interface AttractionSelectorProps {
     zone: Zone;
     selectedAttractions: Attraction[];
     onToggleAttraction: (attraction: Attraction) => void;
   }
   ```

3. **ZoneMap.tsx** - Interactive map
   ```tsx
   interface ZoneMapProps {
     attractions: Attraction[];
     selectedAttractions: Attraction[];
     onAttractionClick: (attraction: Attraction) => void;
   }
   ```

4. **PriceCalculator.tsx** - Real-time pricing
   ```tsx
   interface PriceCalculatorProps {
     calculation: PriceCalculation | null;
     onViewBreakdown: () => void;
   }
   ```

5. **RouteValidator.tsx** - Validation display
   ```tsx
   interface RouteValidatorProps {
     validation: RouteValidationResult | null;
   }
   ```

### Custom Hooks

1. **useZonePricing.ts** - Price calculation
   ```typescript
   function useZonePricing(attractions: Attraction[], vehicleType: VehicleType, passengers: number) {
     return useMemo(() => {
       if (attractions.length === 0) return null;
       return calculateZonePrice(attractions, vehicleType, passengers);
     }, [attractions, vehicleType, passengers]);
   }
   ```

2. **useRouteValidation.ts** - Route validation
   ```typescript
   function useRouteValidation(attractions: Attraction[]) {
     return useMemo(() => {
       if (attractions.length < 2) return null;
       return validateItinerary(attractions);
     }, [attractions]);
   }
   ```

3. **useAttractionSelection.ts** - Multi-select logic
   ```typescript
   function useAttractionSelection(initialAttractions: Attraction[] = []) {
     const [selected, setSelected] = useState<Attraction[]>(initialAttractions);
     
     const toggle = useCallback((attraction: Attraction) => {
       setSelected(prev => {
         const exists = prev.find(a => a.id === attraction.id);
         if (exists) {
           return prev.filter(a => a.id !== attraction.id);
         }
         return [...prev, attraction];
       });
     }, []);
     
     const clear = () => setSelected([]);
     
     return { selected, toggle, clear };
   }
   ```

## Acceptance Criteria

### Functional Requirements

✅ **Zone Definition System**
- [ ] Attractions categorized into Zones A/B/C based on distance from city center
- [ ] Zone A: 0-10km, Zone B: 10-50km, Zone C: 50-200km
- [ ] Each zone has base pricing formula applied
- [ ] Visual zone map displayed during trip creation

✅ **Trip Creation Flow**
- [ ] User selects primary zone (A/B/C)
- [ ] Zone descriptions and example attractions shown
- [ ] Pricing indicator: $ (A), $$ (B), $$$ (C)
- [ ] After zone selection, curated attraction list displayed
- [ ] Multi-select checkboxes for attractions
- [ ] Real-time itinerary preview updates
- [ ] Map view shows selected attractions with markers

✅ **Cross-Zone Addition**
- [ ] User can add attractions from adjacent zones
- [ ] Warning displays distance increase and price impact
- [ ] Price recalculation shown immediately
- [ ] Modal confirmation for significant changes

✅ **Pricing Logic**
- [ ] Zone A: Base + (attractions × $10)
- [ ] Zone B: Base × 1.5 + (attractions × $20)
- [ ] Zone C: Base × 3 + (attractions × $50) + overnight
- [ ] Cross-zone penalty: +30% for non-adjacent zones
- [ ] Real-time calculator visible throughout

✅ **Route Validation**
- [ ] Cannot select attractions >200km apart in same day
- [ ] Cannot create backtracking routes (A → C → A)
- [ ] Multi-day requirement shown for Zone C combinations
- [ ] Validation errors display with suggestions

✅ **Vehicle Integration**
- [ ] Zone affects vehicle recommendation
- [ ] Zone A: Any vehicle, Zone B: Van, Zone C: Mini-bus
- [ ] Pricing adjusted by vehicle type

### Non-Functional Requirements

✅ **Performance**
- [ ] Price calculation < 100ms
- [ ] Map rendering < 2 seconds
- [ ] Route validation < 200ms
- [ ] Real-time updates without lag

✅ **Usability**
- [ ] Clear visual distinction between zones
- [ ] Intuitive attraction selection
- [ ] Price transparency throughout flow
- [ ] Helpful error messages and suggestions

## Modified Files

```
src/
├── app/
│   ├── trips/
│   │   └── create/
│   │       ├── page.tsx ⬜                    # Trip creation wizard
│   │       └── components/
│   │           ├── ZoneSelector.tsx ⬜
│   │           ├── AttractionSelector.tsx ⬜
│   │           ├── ZoneMap.tsx ⬜
│   │           ├── PriceCalculator.tsx ⬜
│   │           ├── RouteValidator.tsx ⬜
│   │           ├── CrossZoneWarningModal.tsx ⬜
│   │           └── hooks/
│   │               ├── useZonePricing.ts ⬜
│   │               ├── useRouteValidation.ts ⬜
│   │               ├── useAttractionSelection.ts ⬜
│   │               └── useZoneMap.ts ⬜
│   └── api/
│       ├── attractions/
│       │   └── route.ts ⬜                    # GET /api/attractions
│       └── trips/
│           └── calculate-price/
│               └── route.ts ⬜                # POST /api/trips/calculate-price
├── lib/
│   ├── pricing/
│   │   ├── zone-pricing.ts ⬜                # calculateZonePrice()
│   │   ├── route-validation.ts ⬜            # validateItinerary()
│   │   └── distance-calculator.ts ⬜         # PostGIS helpers
│   └── stores/
│       └── trip-creation-store.ts ⬜         # Zustand store
└── types/
    ├── zone.ts ⬜                            # Zone types
    ├── attraction.ts ⬜                      # Attraction types
    └── pricing.ts ⬜                         # PriceCalculation types

prisma/
└── schema.prisma ⬜                           # Add Attraction model, Zone enum
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- [04-search-locations-autocomplete.md](./04-search-locations-autocomplete.md) - Location data
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Base pricing system
- PostGIS extension (database)

**Enhances**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Advanced pricing for itineraries
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - More sophisticated pricing

**Related Epics**:
- **Epic C - Payments (Advanced)**: Zone-based pricing model

**External Dependencies**:
- ⚠️ **PostGIS Extension** - Must be enabled in Supabase (REQUIRED)

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: PostGIS & Geofilter

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#14---zone-based-itinerary-pricing)

**Note**: **P2 Priority** - Advanced feature, can be deferred to post-MVP

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Database & Seed Data ⬜
- [ ] Add Attraction model to Prisma schema
- [ ] Add Zone enum (A/B/C)
- [ ] Enable PostGIS extension
- [ ] Seed attractions database (50+ attractions)
- [ ] Categorize attractions into zones

### Phase 2: Pricing Engine ⬜
- [ ] Implement `calculateZonePrice()` function
- [ ] Add cross-zone penalty logic
- [ ] Add overnight surcharge calculation
- [ ] Create price breakdown formatter
- [ ] Add vehicle-specific pricing

### Phase 3: Route Validation ⬜
- [ ] Implement `validateItinerary()` function
- [ ] Add max distance rule (>200km check)
- [ ] Add backtracking detection
- [ ] Add overnight requirement detection
- [ ] Create validation error messages

### Phase 4: UI Components ⬜
- [ ] Build ZoneSelector component
- [ ] Build AttractionSelector with checkboxes
- [ ] Build ZoneMap with Leaflet/Mapbox
- [ ] Build PriceCalculator (sticky sidebar)
- [ ] Build RouteValidator (error/warning display)
- [ ] Build CrossZoneWarningModal

### Phase 5: State Management ⬜
- [ ] Create Zustand store for trip creation
- [ ] Implement attraction selection logic
- [ ] Add real-time price recalculation
- [ ] Add real-time validation
- [ ] Sync with URL params for deep linking

### Phase 6: API Integration ⬜
- [ ] Build GET /api/attractions endpoint
- [ ] Build POST /api/trips/calculate-price endpoint
- [ ] Add PostGIS distance queries
- [ ] Add caching for attraction lists

### Phase 7: Testing & Polish ⬜
- [ ] Unit tests for pricing formulas
- [ ] Unit tests for validation logic
- [ ] Integration tests for trip creation flow
- [ ] E2E tests for zone selection
- [ ] Accessibility audit

## Dependencies

### Internal Dependencies
- ✅ Trip creation flow (Story 03)
- ✅ Vehicle types defined
- ⏳ Admin panel for attraction management (Story E1/E2)

### External Dependencies
- **PostGIS**: Geospatial calculations
- **Mapbox/Leaflet**: Interactive map display
- **PostHog**: Event tracking

### New Package Installations
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@turf/turf": "^6.5.0",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

## Risk Assessment

### Technical Risks

**Risk 1: PostGIS Performance with Many Attractions**
- **Impact**: High (slow price calculations)
- **Mitigation**: Index spatial columns, cache attraction lists, use materialized views
- **Contingency**: Pre-calculate distances and store in database

**Risk 2: Complex Validation Logic**
- **Impact**: Medium (false positives/negatives)
- **Mitigation**: Extensive testing with real-world itineraries
- **Contingency**: Add "Override validation" option for admin/driver review

**Risk 3: Map Library Bundle Size**
- **Impact**: Medium (page load time)
- **Mitigation**: Lazy load map component, code-split by route
- **Contingency**: Use lightweight alternative (Google Maps embed)

### Business Risks

**Risk 1: Users Confused by Zone System**
- **Impact**: High (low adoption)
- **Mitigation**: Clear onboarding tooltips, example itineraries
- **Contingency**: Add "Simple Mode" with pre-built packages

**Risk 2: Pricing Too Complex**
- **Impact**: Medium (abandoned trip creation)
- **Mitigation**: Simple visual breakdown, tooltips for penalties
- **Contingency**: Hide advanced pricing details, show only total

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Zone Pricing Calculations', () => {
  it('should apply Zone B multiplier correctly', () => {
    const attractions: Attraction[] = [
      { id: '1', zone: 'B', basePriceImpact: 20 },
      { id: '2', zone: 'B', basePriceImpact: 20 },
    ];
    
    const result = calculateZonePrice(attractions, 'Van', 4);
    
    expect(result.zoneMultiplier).toBe(1.5);
    expect(result.zoneAdjustedPrice).toBe(225); // 150 × 1.5
    expect(result.attractionFees).toBe(40);
    expect(result.totalPrice).toBe(265);
    expect(result.pricePerPerson).toBe(66.25);
  });

  it('should apply cross-zone penalty for A+C', () => {
    const attractions: Attraction[] = [
      { id: '1', zone: 'A', basePriceImpact: 10 },
      { id: '2', zone: 'C', basePriceImpact: 50 },
    ];
    
    const result = calculateZonePrice(attractions, 'Van', 1);
    
    expect(result.crossZonePenalty).toBe(0.3); // 30%
    expect(result.totalPrice).toBeGreaterThan(result.zoneAdjustedPrice + result.attractionFees);
  });
});

describe('Route Validation', () => {
  it('should reject attractions >200km apart', () => {
    const attractions: Attraction[] = [
      { id: '1', latitude: 42.8746, longitude: 74.5698 }, // Bishkek
      { id: '2', latitude: 42.4304, longitude: 78.3686 }, // Issyk-Kul (250km)
    ];
    
    const result = validateItinerary(attractions);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('MAX_DISTANCE');
  });
});
```

### E2E Tests (Playwright)
```typescript
test.describe('Zone-Based Trip Creation', () => {
  test('should create Zone B trip with 2 attractions', async ({ page }) => {
    await page.goto('/trips/create');
    
    // Select Zone B
    await page.getByRole('button', { name: /zone b/i }).click();
    
    // Select attractions
    await page.getByLabel('Ala-Archa National Park').check();
    await page.getByLabel('Burana Tower').check();
    
    // Verify price calculation
    await expect(page.getByText('Total: $265')).toBeVisible();
    await expect(page.getByText('$66.25/person')).toBeVisible();
    
    // Submit trip
    await page.getByRole('button', { name: /create trip/i }).click();
    await expect(page).toHaveURL(/\/trips\/trip_/);
  });

  test('should show cross-zone warning for A+C', async ({ page }) => {
    await page.goto('/trips/create');
    
    // Select Zone A
    await page.getByRole('button', { name: /zone a/i }).click();
    await page.getByLabel('Osh Bazaar').check();
    
    // Try to add Zone C attraction
    await page.getByRole('button', { name: /add from zone c/i }).click();
    await page.getByLabel('Issyk-Kul Lake').check();
    
    // Verify warning modal
    await expect(page.getByText(/cross-zone penalty/i)).toBeVisible();
    await expect(page.getByText(/\+30%/i)).toBeVisible();
  });
});
```

## Performance Considerations

### Database Optimization
- **Spatial Indexing**: GiST index on `location` column
- **Query Optimization**: Select only needed fields
- **Caching**: Cache attraction lists per zone (5 min TTL)

### Frontend Optimization
- **Code Splitting**: Lazy load map component
- **Memoization**: Memoize price calculations
- **Debouncing**: Debounce price recalculations (300ms)

## Deployment Plan

### Development Phase
1. Feature flag: `ENABLE_ZONE_PRICING` (default: false)
2. Test with seed data (50 attractions)
3. Verify PostGIS queries work correctly

### Staging Phase
1. Deploy to staging with production-like data
2. Performance testing with 200+ attractions
3. User acceptance testing with sample itineraries

### Production Phase
1. Deploy with feature flag enabled for 10% of users
2. Monitor PostHog events for zone selection patterns
3. Full rollout after 1 week of monitoring

## Monitoring & Analytics

### Performance Metrics
- Price calculation time: Target <100ms (p95)
- Map rendering time: Target <2s
- Route validation time: Target <200ms

### Business Metrics (PostHog)
- Event: `trip_creation_zone_selected` (track zone popularity)
- Event: `attraction_added` (track which attractions get selected)
- Event: `cross_zone_warning_shown` (track cross-zone attempts)
- Event: `price_breakdown_viewed` (track user engagement)
- Event: `itinerary_validation_failed` (track validation errors)

**Success Metrics**:
- % of trips using zone system: >80%
- Avg attractions per trip: 3-5
- Cross-zone penalty rate: <20%
- Validation error rate: <10%

## Post-Launch Review

### Success Criteria (Week 1)
- [ ] >100 trips created with zone system
- [ ] <10% validation error rate
- [ ] No performance regressions
- [ ] Price calculations accurate within $5

### Success Criteria (Month 1)
- [ ] >80% trips use zone system
- [ ] 3-5 avg attractions per trip
- [ ] <20% cross-zone penalty rate
- [ ] User feedback: "Pricing is clear and fair"

---

**Implementation Owner**: TBD  
**Estimated Effort**: 10-14 days (1 developer)  
**Priority**: High (Core pricing differentiation)  
**Gate Assignment**: Gate 3 (Complex pricing engine), Gate 4 (Route optimization)
