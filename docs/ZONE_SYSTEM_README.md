# Zone-Based Itinerary and Pricing System

This document explains the zone-based attraction selection and pricing system for StepperGO.

## Overview

The zone-based system allows travelers to select attractions from three geographic zones, each with different pricing and requirements:

- **Zone A (City Center)**: 0-10km radius, 1.0x price multiplier
- **Zone B (Suburban)**: 10-50km radius, 1.5x price multiplier
- **Zone C (Regional)**: 50-200km radius, 3.0x price multiplier

## Database Setup

### 1. Apply Migration

First, generate the Prisma client and apply the database migration:

```bash
# Generate Prisma client
npm run db:generate

# Apply migration
npm run db:migrate
```

This will create the following new tables:
- `Attraction` - Stores attraction data with zone classification
- `TripAttraction` - Junction table linking trips to attractions
- `Zone` - Enum for zone classification (A, B, C)

The migration also adds zone-related fields to the `Trip` table.

### 2. Seed Attractions Data

Seed the database with 40+ Kazakhstan attractions:

```bash
# Seed attractions
npx tsx prisma/seed-attractions.ts
```

This will populate:
- **Zone A**: 14 city center attractions (Panfilov Park, Green Bazaar, Kok Tobe, etc.)
- **Zone B**: 11 suburban attractions (Medeu, Shymbulak, Big Almaty Lake, etc.)
- **Zone C**: 15 regional attractions (Charyn Canyon, Kolsai Lakes, Singing Dunes, etc.)

## Features

### 1. Zone-Based Pricing

The system calculates trip prices based on:

```typescript
Total Price = (Base Vehicle Price × Zone Multiplier) 
            + Attraction Fees 
            + Cross-Zone Penalty 
            + Overnight Surcharge
```

**Example Calculation:**

- Vehicle: Van (8,000 KZT base)
- Attractions: 3 in Zone B
- Price: 8,000 × 1.5 + (3 × 20) = 12,060 KZT

### 2. Route Validation

The system validates routes in real-time:

- ✅ **Max Distance**: Prevents attractions >200km apart
- ✅ **Backtracking**: Detects inefficient zone progression (e.g., A→C→A)
- ⚠️  **Overnight Required**: Warns for multiple Zone C attractions
- ⚠️  **Cross-Zone Penalty**: 30% fee for non-adjacent zones
- ⚠️  **Long Duration**: Alerts if trip exceeds 12 hours

### 3. Distance Calculation

Uses the Haversine formula to calculate distances between attractions:

```typescript
distance = 2 × R × arcsin(√(sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)))
```

Where:
- R = Earth's radius (6,371 km)
- φ = latitude in radians
- λ = longitude in radians

## Usage

### Trip Creation Flow

1. **Step 1: Route** - Select origin and destination
2. **Step 2: Details** - Set departure time, seats, vehicle type
3. **Step 3: Attractions** (NEW) - Select attractions from zones
4. **Step 4: Itinerary** - Optional detailed itinerary

### Attraction Selection

```tsx
// In trip creation page
<AttractionSelector
  vehicleType={vehicleType}
  passengers={totalSeats}
  onAttractionsChange={handleAttractionsChange}
  onPriceChange={handlePriceChange}
/>
```

The component provides:
- Zone filtering (A/B/C/All)
- Visual attraction cards with checkboxes
- Real-time price calculator
- Route validation feedback
- Distance and duration estimates

### API Integration

**Fetch Attractions:**

```typescript
GET /api/attractions?zone=A&isActive=true
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Panfilov Park",
      "zone": "A",
      "latitude": 43.2548,
      "longitude": 76.9478,
      "basePriceImpact": 10,
      "estimatedDurationHours": 2,
      ...
    }
  ]
}
```

**Create Trip with Attractions:**

```typescript
POST /api/trips
{
  "title": "Almaty Day Tour",
  "origin": {...},
  "destination": {...},
  "vehicleType": "van",
  "totalSeats": 6,
  "selectedAttractions": ["attr-id-1", "attr-id-2", ...],
  ...
}
```

## Code Structure

```
src/
├── lib/
│   └── zones/
│       ├── types.ts           # Zone types and interfaces
│       ├── distance.ts        # Distance calculations
│       ├── pricing.ts         # Price calculation logic
│       ├── validation.ts      # Route validation
│       └── index.ts          # Main exports
│
├── app/
│   ├── api/
│   │   └── attractions/
│   │       ├── route.ts      # GET /api/attractions
│   │       └── [id]/
│   │           └── route.ts  # GET /api/attractions/[id]
│   │
│   └── trips/
│       └── create/
│           └── components/
│               └── AttractionSelector/
│                   ├── index.tsx              # Main component
│                   ├── ZoneSelector.tsx       # Zone filter tabs
│                   ├── AttractionCard.tsx     # Individual card
│                   ├── AttractionList.tsx     # Grid of cards
│                   ├── PriceCalculator.tsx    # Pricing sidebar
│                   └── RouteValidator.tsx     # Validation alerts
│
└── prisma/
    ├── schema.prisma              # Database schema
    └── seed-attractions.ts        # Attraction seed data
```

## Pricing Configuration

Default vehicle prices (in KZT):

```typescript
const VEHICLE_BASE_PRICES = {
  sedan: 5000,
  van: 8000,
  minibus: 15000,
};
```

Zone configurations:

```typescript
const ZONE_CONFIG = {
  A: {
    priceMultiplier: 1.0,
    attractionBaseFee: 10,
    radiusMax: 10,
    vehicleRecommendation: ['sedan', 'van'],
  },
  B: {
    priceMultiplier: 1.5,
    attractionBaseFee: 20,
    radiusMax: 50,
    vehicleRecommendation: ['van'],
  },
  C: {
    priceMultiplier: 3.0,
    attractionBaseFee: 50,
    radiusMax: 200,
    vehicleRecommendation: ['minibus'],
  },
};
```

Additional fees:
- Cross-zone penalty: 30% of subtotal
- Overnight surcharge: 5,000 KZT flat fee

## Business Rules

1. **Single-Day Limit**: Attractions must be within 200km of each other
2. **Efficient Routing**: No backtracking through zones
3. **Overnight Requirement**: Multiple Zone C attractions require overnight stay
4. **Cross-Zone Penalty**: Applied when mixing non-adjacent zones (A+C without B)
5. **Duration Warnings**: Trips over 12 hours trigger warnings

## Testing

### Unit Tests (Future)

```bash
npm test src/lib/zones/
```

Test coverage should include:
- Distance calculations
- Price calculations
- Route validation logic
- Edge cases (empty selections, single attraction, etc.)

### Integration Testing

1. Create trip with Zone A attractions
2. Create trip with Zone C attractions
3. Test cross-zone combinations
4. Verify price calculations
5. Test validation rules

## Performance

- Distance calculations: O(n²) for max distance, O(n) for route distance
- Price calculation: O(n) linear time
- Validation: O(n) linear time
- Real-time updates: Optimized with React.useMemo

Target performance:
- Price calculation: <100ms
- Route validation: <50ms
- UI updates: <16ms (60fps)

## Future Enhancements

1. **Map Visualization**: Show attractions on interactive map
2. **Route Optimization**: Suggest optimal visiting order
3. **Time Windows**: Consider opening hours for attractions
4. **Seasonal Pricing**: Adjust prices based on season
5. **Multi-Day Trips**: Support for overnight stays
6. **Custom Zones**: Allow dynamic zone definitions
7. **Analytics**: Track popular attraction combinations

## Support

For issues or questions:
- Check database setup is complete
- Verify attraction seed data is loaded
- Review browser console for errors
- Test API endpoints directly

## Migration Rollback

If you need to rollback the changes:

```bash
# Rollback last migration
npx prisma migrate dev --rollback

# Remove seed data
npx prisma db push --force-reset
```

**Warning**: This will delete all attraction data!
