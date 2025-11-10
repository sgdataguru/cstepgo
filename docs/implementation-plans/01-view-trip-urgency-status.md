# 01 View Trip Urgency Status - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a potential passenger, I want to see a countdown timer with color-coded urgency indicators on trip cards, so that I can quickly understand how much time is left to join a trip and make timely booking decisions.

## Pre-conditions

- Trip data with departure times stored in database
- Server-side API endpoints available for trip data retrieval
- Trip card component exists in the system
- Timezone information available for accurate calculations

## Business Requirements

- Increase trip booking conversion by 15% through urgency indicators
- Reduce last-minute cancellations by helping users make timely decisions
- Improve user experience with clear visual time indicators

## Technical Specifications

### Integration Points
- **Backend API**: `/api/trips` endpoint to fetch trip data with departure times
- **Time Calculation**: Server-side computation to handle timezone conversions
- **Real-time Updates**: WebSocket or polling for live countdown updates
- **Caching**: Redis for frequently accessed trip time calculations

### Security Requirements
- Validate trip departure times on server-side
- Prevent client-side time manipulation
- Secure WebSocket connections for real-time updates

## Design Specifications

### Visual Layout & Components

**Trip Card Enhancement**:
```
[Trip Card]
├── [Trip Image]
├── [Trip Title]
├── [Countdown Badge] <- New Component
│   ├── [Timer Icon]
│   ├── [Time Remaining Text]
│   └── [Color Indicator]
├── [Trip Details]
└── [Action Buttons]
```

### Design System Compliance

**Color Palette**:
```css
/* Urgency Colors */
--urgency-teal: #14b8a6;     /* > 72 hours */
--urgency-amber: #f59e0b;    /* 24-72 hours */
--urgency-red: #ef4444;      /* < 24 hours */
--urgency-gray: #6b7280;     /* Departed */

/* Timer Background */
--timer-bg: rgba(0, 0, 0, 0.05);
--timer-border: rgba(0, 0, 0, 0.1);
```

**Typography Scale**:
```css
/* Countdown Text */
--countdown-font-size: 0.875rem;  /* 14px */
--countdown-font-weight: 600;
--countdown-line-height: 1.25;
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.countdown-badge {
  @apply flex items-center gap-1 text-sm px-2 py-1;
}
```

**Desktop (768px+)**:
```css
.countdown-badge {
  @apply flex items-center gap-2 text-base px-3 py-1.5;
}
```

### Interaction Patterns

**Badge States**:
```typescript
interface CountdownStates {
  moreThan72Hours: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200'
  };
  between24And72Hours: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  };
  lessThan24Hours: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  };
  departed: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/trips/
├── components/
│   ├── TripCard.tsx                 # Modified
│   ├── CountdownBadge.tsx           # New
│   └── hooks/
│       ├── useCountdown.ts          # New
│       └── useTripUrgency.ts        # New
```

### State Management Architecture

**Local State Interface**:
```typescript
interface CountdownState {
  timeRemaining: number; // milliseconds
  displayText: string;   // formatted time
  urgencyLevel: 'high' | 'medium' | 'low' | 'departed';
  isLoading: boolean;
}

interface TripUrgencyState {
  tripId: string;
  departureTime: Date;
  serverTime: Date;
  timezone: string;
  countdown: CountdownState;
}
```

### API Integration Schema

**Request/Response Types**:
```typescript
// API Response Enhancement
interface TripResponse {
  id: string;
  title: string;
  departureTime: string; // ISO 8601
  timezone: string;
  currentServerTime: string; // ISO 8601
  // ... existing fields
}

// Countdown Calculation Response
interface CountdownResponse {
  tripId: string;
  millisecondsRemaining: number;
  urgencyLevel: string;
  formattedTime: string;
}
```

## Implementation Requirements

### Core Components

**CountdownBadge.tsx** - Displays countdown timer with urgency colors
```typescript
interface CountdownBadgeProps {
  departureTime: Date;
  serverTime: Date;
  timezone: string;
}
```

**TripCard.tsx** - Enhanced with countdown display
```typescript
// Add countdown badge integration
```

### Custom Hooks

**useCountdown()** - Manages countdown timer logic
```typescript
function useCountdown(targetDate: Date, serverTime: Date): CountdownState
```

**useTripUrgency()** - Determines urgency level and styling
```typescript
function useTripUrgency(timeRemaining: number): UrgencyLevel
```

### Utility Functions

**time-formatters.ts** - Format time remaining display
```typescript
function formatTimeRemaining(milliseconds: number): string
function calculateUrgencyLevel(hoursRemaining: number): UrgencyLevel
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Countdown timer displays directly under trip title
- ✓ Timer shows appropriate time units (days/hours/minutes)
- ✓ Timer color changes based on time remaining
- ✓ Timer updates in real-time without page refresh
- ✓ Server-side calculation prevents timezone issues

**Data Management**
- ✓ Trip departure times fetched from API
- ✓ Server time synchronized for accurate countdowns
- ✓ Timezone conversions handled properly

**User Interface**
- ✓ Responsive design for mobile and desktop
- ✓ Smooth color transitions between urgency levels
- ✓ Accessible color contrast ratios

### Non-Functional Requirements

**Performance**
- Countdown updates every minute (not every second to save resources)
- Minimal re-renders using React.memo
- Batch timer updates for multiple trip cards

**Accessibility**
- ARIA labels for screen readers
- Color not sole indicator (includes text)
- Keyboard navigation support

**Security**
- Server-side time validation
- No client-side time manipulation
- Secure API endpoints

## Modified Files
```
src/
├── app/
│   └── trips/
│       └── components/
│           ├── TripCard.tsx ✓
│           ├── CountdownBadge.tsx ⬜
│           └── hooks/
│               ├── useCountdown.ts ⬜
│               └── useTripUrgency.ts ⬜
├── lib/
│   └── utils/
│       └── time-formatters.ts ⬜
├── types/
│   └── trip-types.ts ✓
└── styles/
    └── countdown.module.css ⬜
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- Trip model (existing from Gate 1)
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Trip cards to display urgency badges

**Works With**:
- [02-view-trip-itinerary.md](./02-view-trip-itinerary.md) - Both enhance trip discovery
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Complementary trip card features

**Enables**:
- Better user engagement and booking conversion

**Related Epics**:
- **Epic A - Discovery**: Enhances anonymous browsing experience

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) for overall architecture

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#01---view-trip-urgency-status)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create CountdownBadge component structure
- [ ] Define TypeScript interfaces
- [ ] Set up time formatting utilities
- [ ] Create urgency level calculations

### Phase 2: Core Implementation
- [ ] Implement useCountdown hook
- [ ] Implement useTripUrgency hook
- [ ] Integrate CountdownBadge into TripCard
- [ ] Add server-side time synchronization

### Phase 3: Enhanced Features
- [ ] Add real-time updates
- [ ] Implement smooth color transitions
- [ ] Add loading states
- [ ] Handle error scenarios

### Phase 4: Polish & Testing
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Unit tests for all components
- [ ] Integration tests

## Dependencies

### Internal Dependencies
- Trip data API service
- Design system color tokens
- Time utility functions
- Trip card component

### External Dependencies
- date-fns for time calculations
- react-use for interval hooks

## Risk Assessment

### Technical Risks

**Time Synchronization**
- Impact: High
- Mitigation: Server-side time as source of truth
- Contingency: Fallback to static display

**Performance with Multiple Timers**
- Impact: Medium
- Mitigation: Batch updates, use RAF
- Contingency: Limit active timers

**Timezone Handling**
- Impact: Medium
- Mitigation: Use reliable timezone library
- Contingency: Default to UTC

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('CountdownBadge', () => {
  it('should display correct urgency color for > 72 hours', () => {});
  it('should update countdown text every minute', () => {});
  it('should handle departed trips correctly', () => {});
});

describe('useCountdown', () => {
  it('should calculate time remaining accurately', () => {});
  it('should handle timezone conversions', () => {});
});
```

### Integration Tests
```typescript
describe('Trip Card Countdown Integration', () => {
  it('should display countdown badge on trip cards', () => {});
  it('should update multiple countdowns efficiently', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load countdown logic for trip pages
- Tree shake unused time utilities
- Minimize countdown update frequency

### Runtime Performance
- Use React.memo for CountdownBadge
- Batch DOM updates for multiple timers
- Throttle real-time updates

### Caching Strategy
- Cache urgency calculations
- Store server time offset
- Memoize formatting functions

## Deployment Plan

### Development Phase
- Feature flag for countdown display
- Test with various timezones
- Performance profiling

### Staging Phase
- Load test with many trip cards
- Verify server-client time sync
- Cross-browser testing

### Production Phase
- Gradual rollout by region
- Monitor performance metrics
- A/B test conversion impact

## Monitoring & Analytics

### Performance Metrics
- Countdown render performance
- Timer update frequency
- Memory usage with multiple timers

### Business Metrics
- Click-through rate on urgent trips
- Booking conversion by urgency level
- User engagement with countdown

### Technical Metrics
- API response times for trip data
- Client-server time drift
- Error rates in time calculations

## Documentation Requirements

### Technical Documentation
- Countdown calculation logic
- Timezone handling approach
- Performance optimization techniques

### User Documentation
- Explanation of urgency indicators
- Time remaining interpretation
- Booking deadline guidance

## Post-Launch Review

### Success Criteria
- 15% increase in booking conversion
- < 100ms countdown update latency
- Zero timezone-related bugs
- Positive user feedback on urgency indicators

### Retrospective Items
- Effectiveness of color coding
- Real-time update performance
- User comprehension of urgency levels