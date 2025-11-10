# 05 View Dynamic Trip Pricing - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a potential passenger, I want to see real-time pricing that decreases as more people join, so that I understand the value of shared rides and am incentivized to book.

## Pre-conditions

- Trip data with pricing parameters stored in database
- Vehicle information including total seats available
- Platform margin and pricing coefficients configured
- Real-time passenger count tracking system exists

## Business Requirements

- Increase shared ride bookings by 40% through transparent pricing
- Reduce single passenger trips by 25%
- Maintain driver income protection with minimum price floor
- Enable dynamic pricing adjustments based on demand

## Technical Specifications

### Integration Points
- **Pricing Engine API**: `/api/pricing/calculate` for real-time calculations
- **Trip Updates WebSocket**: Real-time seat availability updates
- **Admin Settings API**: `/api/admin/pricing-rules` for coefficients
- **Analytics API**: Track pricing views and conversion rates

### Security Requirements
- Validate pricing calculations server-side only
- Prevent client-side price manipulation
- Secure WebSocket connections for updates
- Rate limiting on pricing breakdown requests

## Design Specifications

### Visual Layout & Components

**Trip Card Pricing Section**:
```
[Trip Card]
├── [Trip Details]
├── [Pricing Display] <- Enhanced Section
│   ├── [Current Price Badge]
│   │   ├── [Price Amount]
│   │   ├── [Per Person Label]
│   │   └── [Currency Symbol]
│   ├── [Price Savings Indicator]
│   │   ├── [Original Price]
│   │   └── [Discount Percentage]
│   ├── [Seat Counter]
│   │   ├── [Filled Seats]
│   │   └── [Total Seats]
│   └── [View Breakdown Button]
└── [Action Buttons]
```

**Pricing Breakdown Modal**:
```
[Modal Container]
├── [Header]
│   ├── [Title: "Pricing Breakdown"]
│   └── [Close Button]
├── [Body]
│   ├── [Base Costs Section]
│   │   ├── [Distance Cost]
│   │   ├── [Time Cost]
│   │   └── [Fixed Fees]
│   ├── [Dynamic Pricing Section]
│   │   ├── [Current Occupancy]
│   │   ├── [Price per Person Chart]
│   │   └── [Savings Visualization]
│   └── [Final Price Section]
│       ├── [Your Price]
│       └── [Minimum Price Note]
└── [Footer]
    └── [Book Now Button]
```

### Design System Compliance

**Color Palette**:
```css
/* Pricing Colors */
--price-primary: #10b981;      /* Emerald for current price */
--price-original: #6b7280;     /* Gray for strikethrough */
--price-savings: #f59e0b;      /* Amber for savings */
--price-minimum: #ef4444;      /* Red for minimum price */

/* Background Colors */
--pricing-bg: #f0fdf4;         /* Light emerald bg */
--breakdown-bg: #ffffff;       /* White modal bg */
--chart-bg: #f9fafb;          /* Gray chart background */

/* Accent Colors */
--seat-filled: #3b82f6;        /* Blue for filled seats */
--seat-empty: #e5e7eb;         /* Light gray for empty */
```

**Typography Scale**:
```css
/* Price Display */
--price-size-lg: 2rem;         /* 32px - Main price */
--price-size-md: 1.5rem;       /* 24px - Modal price */
--price-size-sm: 1rem;         /* 16px - Breakdown items */

/* Labels */
--label-size: 0.875rem;        /* 14px */
--label-weight: 500;

/* Savings Text */
--savings-size: 0.875rem;      /* 14px */
--savings-weight: 600;
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.pricing-display {
  @apply flex flex-col space-y-2;
}

.price-badge {
  @apply text-2xl font-bold;
}

.breakdown-modal {
  @apply fixed inset-0 z-50;
}
```

**Desktop (768px+)**:
```css
.pricing-display {
  @apply flex items-center justify-between;
}

.price-badge {
  @apply text-3xl font-bold;
}

.breakdown-modal {
  @apply fixed inset-4 max-w-2xl mx-auto z-50;
}
```

### Interaction Patterns

**Price Animation**:
```typescript
interface PriceAnimationStates {
  initial: {
    opacity: 0,
    transform: 'translateY(-10px)'
  };
  animate: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  };
  update: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1]
    }
  };
}
```

**Seat Visualization**:
```typescript
interface SeatStates {
  empty: {
    fill: '#e5e7eb',
    stroke: '#d1d5db'
  };
  filled: {
    fill: '#3b82f6',
    stroke: '#2563eb',
    animation: 'pulse 2s infinite'
  };
  justFilled: {
    fill: '#3b82f6',
    scale: [1, 1.2, 1],
    transition: { duration: 0.3 }
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/trips/
├── components/
│   ├── TripCard.tsx                 # Modified
│   ├── pricing/
│   │   ├── PricingDisplay.tsx       # New
│   │   ├── PriceBadge.tsx           # New
│   │   ├── SavingsIndicator.tsx     # New
│   │   ├── SeatCounter.tsx          # New
│   │   ├── PricingBreakdownModal.tsx # New
│   │   ├── PriceChart.tsx           # New
│   │   └── hooks/
│   │       ├── useDynamicPricing.ts # New
│   │       ├── usePriceAnimation.ts # New
│   │       └── usePricingSocket.ts  # New
│   └── shared/
│       └── Modal.tsx                # Existing
```

### State Management Architecture

**Pricing State Interface**:
```typescript
interface PricingState {
  // Current Pricing
  currentPrice: number;
  currency: string;
  pricePerPerson: number;
  
  // Seat Information
  filledSeats: number;
  totalSeats: number;
  seatPercentage: number;
  
  // Pricing Details
  baseCost: PriceComponents;
  platformMargin: number;
  minimumPrice: number;
  
  // Dynamic Updates
  isUpdating: boolean;
  lastUpdateTime: Date;
  priceHistory: PricePoint[];
}

interface PriceComponents {
  distanceCost: number;
  durationCost: number;
  fixedFees: number;
  totalBeforeMargin: number;
}

interface PricePoint {
  timestamp: Date;
  price: number;
  seats: number;
}

interface DynamicPricingFormula {
  calculatePrice: (params: PricingParams) => number;
  calculateSavings: (current: number, original: number) => number;
  projectPriceAtCapacity: (params: PricingParams) => number[];
}
```

### API Integration Schema

**Pricing Calculation Request/Response**:
```typescript
// Calculate Pricing Request
interface CalculatePricingRequest {
  tripId: string;
  filledSeats: number;
  includeBreakdown?: boolean;
}

// Pricing Response
interface PricingResponse {
  currentPrice: number;
  pricePerPerson: number;
  currency: string;
  seats: {
    filled: number;
    total: number;
    percentage: number;
  };
  breakdown?: {
    baseCosts: {
      distance: {
        km: number;
        ratePerKm: number;
        total: number;
      };
      duration: {
        hours: number;
        ratePerHour: number;
        total: number;
      };
      fixedFees: number;
    };
    platformMargin: number;
    minimumPrice: number;
    savingsAmount: number;
    savingsPercentage: number;
  };
  projectedPrices?: Array<{
    seats: number;
    price: number;
  }>;
}

// WebSocket Events
interface PricingWebSocketEvents {
  'price:update': {
    tripId: string;
    newPrice: number;
    filledSeats: number;
  };
  'seat:booked': {
    tripId: string;
    seatNumber: number;
    newTotal: number;
  };
  'price:subscribe': {
    tripId: string;
  };
  'price:unsubscribe': {
    tripId: string;
  };
}
```

## Implementation Requirements

### Core Components

**PricingDisplay.tsx** - Main pricing container
```typescript
interface PricingDisplayProps {
  tripId: string;
  initialPrice: number;
  initialSeats: SeatInfo;
  showBreakdown?: boolean;
  onPriceUpdate?: (newPrice: number) => void;
}
```

**PriceBadge.tsx** - Animated price display
```typescript
interface PriceBadgeProps {
  amount: number;
  currency: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  showPerPerson?: boolean;
}
```

**SavingsIndicator.tsx** - Shows potential savings
```typescript
interface SavingsIndicatorProps {
  originalPrice: number;
  currentPrice: number;
  showPercentage?: boolean;
  animate?: boolean;
}
```

**SeatCounter.tsx** - Visual seat availability
```typescript
interface SeatCounterProps {
  filled: number;
  total: number;
  variant?: 'compact' | 'detailed';
  showAnimation?: boolean;
}
```

**PricingBreakdownModal.tsx** - Detailed pricing info
```typescript
interface PricingBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  breakdown: PriceBreakdown;
}
```

### Custom Hooks

**useDynamicPricing()** - Manages pricing state and calculations
```typescript
function useDynamicPricing(tripId: string): {
  pricing: PricingState;
  isLoading: boolean;
  error: Error | null;
  refreshPricing: () => Promise<void>;
  showBreakdown: () => void;
}
```

**usePricingSocket()** - WebSocket connection for updates
```typescript
function usePricingSocket(tripId: string): {
  isConnected: boolean;
  lastUpdate: Date | null;
  subscribe: () => void;
  unsubscribe: () => void;
}
```

**usePriceAnimation()** - Smooth price transitions
```typescript
function usePriceAnimation(targetPrice: number): {
  displayPrice: number;
  isAnimating: boolean;
}
```

### Utility Functions

**pricing-calculations.ts** - Pricing formula implementations
```typescript
function calculateDynamicPrice(params: PricingParams): number
function calculatePerPersonPrice(totalCost: number, seats: SeatInfo): number
function enforceMinimumPrice(price: number, minimum: number): number
function calculateSavingsPercentage(original: number, current: number): number
```

**price-formatters.ts** - Price display formatting
```typescript
function formatCurrency(amount: number, currency: string): string
function formatSavings(amount: number, showSign?: boolean): string
function formatPriceChange(oldPrice: number, newPrice: number): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Current price per person displayed on trip cards
- ✓ Price updates automatically when passengers join
- ✓ Pricing formula correctly calculates based on:
  - ✓ Total trip distance and duration
  - ✓ Vehicle costs and platform margin
  - ✓ Current vs total seat occupancy
  - ✓ Minimum price floor enforced
- ✓ Price changes animate smoothly
- ✓ Pricing breakdown accessible on demand

**Data Management**
- ✓ Real-time price updates via WebSocket
- ✓ Price history tracked for analytics
- ✓ Caching of pricing calculations
- ✓ Graceful fallback if WebSocket fails

**User Interface**
- ✓ Clear price display with currency
- ✓ Visual seat availability indicator
- ✓ Savings amount/percentage shown
- ✓ Responsive on all devices

### Non-Functional Requirements

**Performance**
- Price updates < 100ms latency
- Smooth animations at 60fps
- Efficient WebSocket management
- Minimal re-renders on updates

**Accessibility**
- Price changes announced to screen readers
- Sufficient color contrast ratios
- Keyboard-navigable breakdown modal
- Alternative text for visualizations

**Security**
- All pricing calculations server-side
- No price manipulation possible client-side
- Secure WebSocket connections
- Rate limiting on API calls

## Modified Files
```
src/
├── app/
│   └── trips/
│       └── components/
│           ├── TripCard.tsx ✓
│           └── pricing/
│               ├── PricingDisplay.tsx ⬜
│               ├── PriceBadge.tsx ⬜
│               ├── SavingsIndicator.tsx ⬜
│               ├── SeatCounter.tsx ⬜
│               ├── PricingBreakdownModal.tsx ⬜
│               ├── PriceChart.tsx ⬜
│               └── hooks/
│                   ├── useDynamicPricing.ts ⬜
│                   ├── usePriceAnimation.ts ⬜
│                   └── usePricingSocket.ts ⬜
├── lib/
│   ├── pricing/
│   │   ├── calculations.ts ⬜
│   │   └── formatters.ts ⬜
│   └── websocket/
│       └── pricing-client.ts ⬜
├── types/
│   └── pricing-types.ts ⬜
└── styles/
    └── pricing.module.css ⬜
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- Trip model with pricing parameters (existing from Gate 1)
- Real-time booking count system

**Works With**:
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Price display on trip cards
- [01-view-trip-urgency-status.md](./01-view-trip-urgency-status.md) - Both enhance trip card UX
- [02-view-trip-itinerary.md](./02-view-trip-itinerary.md) - Both provide trip details

**Builds On**:
- [14-zone-based-itinerary-pricing.md](./14-zone-based-itinerary-pricing.md) - Advanced pricing algorithm

**Enables**:
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Shows prices before payment

**Related Epics**:
- **Epic C - Payments**: Core pricing display
- **Epic A - Discovery**: Transparent pricing drives conversion

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: Epic C

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#05---view-dynamic-trip-pricing)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create pricing component structure
- [ ] Define TypeScript interfaces
- [ ] Set up pricing calculations
- [ ] Create basic price display

### Phase 2: Core Implementation
- [ ] Implement dynamic pricing hook
- [ ] Build price animation system
- [ ] Create seat counter visualization
- [ ] Add savings indicator

### Phase 3: Enhanced Features
- [ ] WebSocket integration for real-time
- [ ] Pricing breakdown modal
- [ ] Price projection chart
- [ ] Historical price tracking

### Phase 4: Polish & Testing
- [ ] Smooth animations
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- Trip data service
- WebSocket infrastructure
- Admin pricing settings
- Animation utilities

### External Dependencies
- framer-motion for animations
- recharts for price visualization
- socket.io-client for WebSocket
- currency.js for price calculations

## Risk Assessment

### Technical Risks

**WebSocket Reliability**
- Impact: High
- Mitigation: Implement reconnection logic
- Contingency: Polling fallback mechanism

**Pricing Calculation Accuracy**
- Impact: High
- Mitigation: Extensive testing, validation
- Contingency: Manual review process

**Performance with Many Updates**
- Impact: Medium
- Mitigation: Debounce, memoization
- Contingency: Reduce update frequency

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Dynamic Pricing', () => {
  it('should calculate price based on occupancy', () => {});
  it('should enforce minimum price floor', () => {});
  it('should format prices correctly', () => {});
  it('should handle WebSocket updates', () => {});
});

describe('useDynamicPricing', () => {
  it('should update price on seat changes', () => {});
  it('should handle connection failures', () => {});
  it('should cache pricing data', () => {});
});
```

### Integration Tests
```typescript
describe('Pricing Display Integration', () => {
  it('should show real-time price updates', async () => {});
  it('should display breakdown modal', () => {});
  it('should animate price changes', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load chart library
- Tree shake animation utilities
- Minimize WebSocket payload

### Runtime Performance
- Memoize pricing calculations
- Throttle WebSocket updates
- Use CSS animations where possible

### Caching Strategy
- Cache pricing rules (1 hour)
- Store recent calculations (5 minutes)
- Local price history (session)

## Deployment Plan

### Development Phase
- Mock WebSocket for testing
- Feature flag dynamic pricing
- Simulate various occupancy levels

### Staging Phase
- Load test WebSocket connections
- Verify pricing accuracy
- Test with real trip data

### Production Phase
- Gradual rollout by region
- Monitor pricing accuracy
- A/B test price display formats

## Monitoring & Analytics

### Performance Metrics
- WebSocket connection stability
- Price calculation latency
- Animation frame rates

### Business Metrics
- Shared ride conversion rate
- Average occupancy increase
- Revenue per trip impact

### Technical Metrics
- API response times
- WebSocket message rates
- Client-side errors

## Documentation Requirements

### Technical Documentation
- Pricing formula documentation
- WebSocket event reference
- Integration guide

### User Documentation
- How dynamic pricing works
- Understanding savings
- Booking at optimal times

## Post-Launch Review

### Success Criteria
- 40% increase in shared bookings
- < 100ms price update latency
- 95% WebSocket uptime
- Positive user feedback on transparency

### Retrospective Items
- Pricing formula effectiveness
- Real-time update performance
- User understanding of savings
- Technical