# 02 View Trip Itinerary - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a potential passenger, I want to view a detailed itinerary for each trip, so that I can understand the trip plan and activities before joining.

## Pre-conditions

- Trip data with itinerary JSON stored in database
- Trip card component already exists in the system
- Modal/drawer component available in design system
- API endpoints for fetching trip details implemented

## Business Requirements

- Increase user engagement by providing transparent trip details
- Improve booking conversion by 20% through detailed itinerary visibility
- Reduce customer support inquiries about trip details by 30%

## Technical Specifications

### Integration Points
- **Backend API**: `/api/trips/{id}/itinerary` endpoint to fetch detailed itinerary
- **Data Format**: JSON structure for itinerary activities
- **Caching**: Redis for frequently accessed itineraries
- **Analytics**: Track itinerary views and conversion rates

### Security Requirements
- Validate trip ID on server-side
- Sanitize itinerary content to prevent XSS
- Rate limiting on itinerary API endpoints
- Ensure itinerary data doesn't expose sensitive information

## Design Specifications

### Visual Layout & Components

**Trip Card Enhancement**:
```
[Trip Card]
├── [Trip Image]
├── [Trip Title]
├── [Trip Details]
└── [Action Buttons]
    ├── [View Itinerary] <- New Button
    └── [Join on WhatsApp]
```

**Itinerary Modal Structure**:
```
[Modal Container]
├── [Modal Header]
│   ├── [Trip Title]
│   ├── [Trip Dates]
│   └── [Close Button]
├── [Modal Body]
│   └── [Daily Activities List]
│       ├── [Day Divider]
│       └── [Activity Cards]
│           ├── [Time Badge]
│           ├── [Location Icon & Name]
│           └── [Activity Description]
└── [Modal Footer]
    └── [Action Buttons]
```

### Design System Compliance

**Color Palette**:
```css
/* Modal Background */
--modal-bg: rgba(0, 0, 0, 0.5);
--modal-content: #ffffff;
--modal-border: #e5e7eb;

/* Itinerary Elements */
--day-divider: #f3f4f6;
--time-badge-bg: #eff6ff;
--time-badge-text: #1e40af;
--location-icon: #6b7280;
--activity-bg: #fafafa;

/* Dark Mode */
--modal-content-dark: #1f2937;
--activity-bg-dark: #111827;
```

**Typography Scale**:
```css
/* Modal Title */
--modal-title-size: 1.5rem;    /* 24px */
--modal-title-weight: 700;

/* Day Headers */
--day-header-size: 1.125rem;   /* 18px */
--day-header-weight: 600;

/* Activity Text */
--activity-time: 0.875rem;     /* 14px */
--activity-location: 1rem;     /* 16px */
--activity-description: 0.875rem; /* 14px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.itinerary-modal {
  @apply fixed inset-0 z-50;
  /* Full screen modal on mobile */
}

.action-buttons {
  @apply flex flex-col space-y-2 w-full;
}
```

**Desktop (768px+)**:
```css
.itinerary-modal {
  @apply fixed inset-4 max-w-3xl mx-auto my-8 z-50;
  /* Centered modal with max width */
}

.action-buttons {
  @apply flex flex-row space-x-3;
}
```

### Interaction Patterns

**Modal States**:
```typescript
interface ModalStates {
  closed: { display: 'none', opacity: 0 };
  opening: { display: 'block', opacity: 0, transform: 'scale(0.95)' };
  open: { display: 'block', opacity: 1, transform: 'scale(1)' };
  closing: { display: 'block', opacity: 0, transform: 'scale(0.95)' };
}
```

**Activity Card States**:
```typescript
interface ActivityCardStates {
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  };
  hover: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    transform: 'translateX(4px)'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/trips/
├── components/
│   ├── TripCard.tsx                 # Modified
│   ├── ViewItineraryButton.tsx      # New
│   ├── ItineraryModal.tsx           # New
│   ├── ItineraryDaySection.tsx      # New
│   ├── ItineraryActivity.tsx        # New
│   └── hooks/
│       ├── useItinerary.ts          # New
│       └── useModalState.ts         # New
```

### State Management Architecture

**Local State Interface**:
```typescript
interface ItineraryState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  itinerary: TripItinerary | null;
  selectedDay: number | null;
}

interface TripItinerary {
  tripId: string;
  tripTitle: string;
  startDate: Date;
  endDate: Date;
  days: ItineraryDay[];
  totalActivities: number;
}

interface ItineraryDay {
  dayNumber: number;
  date: Date;
  title: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  id: string;
  time: string;
  duration?: number;
  location: {
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  type: 'transport' | 'activity' | 'meal' | 'accommodation' | 'other';
  notes?: string;
}
```

### API Integration Schema

**Request/Response Types**:
```typescript
// API Request
interface ItineraryRequest {
  tripId: string;
  includeDetails?: boolean;
}

// API Response
interface ItineraryResponse {
  success: boolean;
  data: {
    tripId: string;
    title: string;
    startDate: string; // ISO 8601
    endDate: string;   // ISO 8601
    itinerary: {
      version: string;
      days: Array<{
        day: number;
        date: string;
        title: string;
        activities: Array<{
          id: string;
          startTime: string;
          endTime?: string;
          location: {
            name: string;
            address?: string;
            placeId?: string;
            lat?: number;
            lng?: number;
          };
          description: string;
          type: string;
          metadata?: Record<string, any>;
        }>;
      }>;
    };
  };
  error?: string;
}
```

## Implementation Requirements

### Core Components

**ViewItineraryButton.tsx** - Trigger button for itinerary modal
```typescript
interface ViewItineraryButtonProps {
  tripId: string;
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**ItineraryModal.tsx** - Main modal container
```typescript
interface ItineraryModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**ItineraryDaySection.tsx** - Day grouping component
```typescript
interface ItineraryDaySectionProps {
  day: ItineraryDay;
  isExpanded?: boolean;
  onToggle?: () => void;
}
```

**ItineraryActivity.tsx** - Individual activity display
```typescript
interface ItineraryActivityProps {
  activity: ItineraryActivity;
  showDetails?: boolean;
}
```

### Custom Hooks

**useItinerary()** - Fetches and manages itinerary data
```typescript
function useItinerary(tripId: string): {
  itinerary: TripItinerary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**useModalState()** - Manages modal open/close state
```typescript
function useModalState(defaultOpen?: boolean): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

### Utility Functions

**itinerary-formatters.ts** - Format itinerary data
```typescript
function formatActivityTime(time: string): string
function groupActivitiesByDay(activities: Activity[]): ItineraryDay[]
function getActivityIcon(type: string): IconType
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ "View Itinerary" button visible on trip cards
- ✓ Button opens modal/page with full itinerary
- ✓ Daily activities displayed in chronological order
- ✓ Each activity shows time, location, and description
- ✓ Itinerary rendered from stored JSON data
- ✓ Modal/page responsive on all devices

**Data Management**
- ✓ Itinerary data fetched from API
- ✓ Loading state while fetching data
- ✓ Error handling for failed requests
- ✓ Caching of previously viewed itineraries

**User Interface**
- ✓ Smooth modal open/close animations
- ✓ Scrollable content for long itineraries
- ✓ Day navigation for multi-day trips
- ✓ Print-friendly view option

### Non-Functional Requirements

**Performance**
- Modal open time < 300ms
- Itinerary data load time < 1 second
- Smooth scrolling performance with 50+ activities

**Accessibility**
- Modal trap focus when open
- Escape key closes modal
- Screen reader announcements
- Proper heading hierarchy

**Security**
- Input sanitization for all text content
- No exposure of internal trip IDs
- Rate limiting on API calls

## Modified Files
```
src/
├── app/
│   └── trips/
│       └── components/
│           ├── TripCard.tsx ✓
│           ├── ViewItineraryButton.tsx ⬜
│           ├── ItineraryModal.tsx ⬜
│           ├── ItineraryDaySection.tsx ⬜
│           ├── ItineraryActivity.tsx ⬜
│           └── hooks/
│               ├── useItinerary.ts ⬜
│               └── useModalState.ts ⬜
├── lib/
│   └── utils/
│       └── itinerary-formatters.ts ⬜
├── types/
│   └── itinerary-types.ts ⬜
└── styles/
    └── itinerary.module.css ⬜
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- Trip model with itinerary JSON (existing from Gate 1)
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Trip cards to display "View Itinerary" button

**Works With**:
- [01-view-trip-urgency-status.md](./01-view-trip-urgency-status.md) - Both enhance trip discovery
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Complementary trip details

**Enables**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Shows what drivers create

**Related Epics**:
- **Epic A - Discovery**: Enhances trip information transparency

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) for overall architecture

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#02---view-trip-itinerary)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create ViewItineraryButton component
- [ ] Set up ItineraryModal structure
- [ ] Define TypeScript interfaces
- [ ] Create API integration layer

### Phase 2: Core Implementation
- [ ] Implement modal open/close logic
- [ ] Build ItineraryDaySection component
- [ ] Create ItineraryActivity component
- [ ] Add data fetching with useItinerary hook

### Phase 3: Enhanced Features
- [ ] Add activity type icons
- [ ] Implement day navigation
- [ ] Add print view option
- [ ] Implement smooth animations

### Phase 4: Polish & Testing
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Unit tests for all components
- [ ] Integration tests for modal flow

## Dependencies

### Internal Dependencies
- Modal component from design system
- Trip data API service
- Icon library for activity types
- Date formatting utilities

### External Dependencies
- @radix-ui/react-dialog for accessible modal
- framer-motion for animations
- date-fns for date formatting

## Risk Assessment

### Technical Risks

**Large Itinerary Performance**
- Impact: High
- Mitigation: Virtual scrolling for long lists
- Contingency: Pagination of activities

**Complex JSON Parsing**
- Impact: Medium
- Mitigation: Schema validation
- Contingency: Graceful error handling

**Modal State Management**
- Impact: Low
- Mitigation: Proper state isolation
- Contingency: URL-based modal state

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('ItineraryModal', () => {
  it('should render itinerary data correctly', () => {});
  it('should handle loading states', () => {});
  it('should display error messages', () => {});
});

describe('useItinerary', () => {
  it('should fetch itinerary data', () => {});
  it('should cache previous requests', () => {});
  it('should handle API errors', () => {});
});
```

### Integration Tests
```typescript
describe('View Itinerary Flow', () => {
  it('should open modal when button clicked', () => {});
  it('should close modal on escape key', () => {});
  it('should navigate between days', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load modal components
- Code split itinerary features
- Optimize icon imports

### Runtime Performance
- Memoize formatted dates
- Virtual scroll for long lists
- Debounce scroll events

### Caching Strategy
- Cache itinerary data for 30 minutes
- Store in sessionStorage
- Implement stale-while-revalidate

## Deployment Plan

### Development Phase
- Feature flag for itinerary modal
- Test with various itinerary sizes
- Cross-browser compatibility testing

### Staging Phase
- Load test with concurrent users
- Verify mobile responsiveness
- A/B test button placement

### Production Phase
- Gradual rollout to 25% users
- Monitor performance metrics
- Collect user feedback

## Monitoring & Analytics

### Performance Metrics
- Modal open time
- Itinerary load time
- Scroll performance (FPS)

### Business Metrics
- Itinerary view rate
- View to booking conversion
- Time spent viewing itinerary

### Technical Metrics
- API response times
- Cache hit rates
- Error rates

## Documentation Requirements

### Technical Documentation
- Itinerary JSON schema
- Modal component API
- Hook usage examples

### User Documentation
- How to view trip itineraries
- Understanding activity types
- Mobile vs desktop experience

## Post-Launch Review

### Success Criteria
- 20% increase in booking conversion
- < 1s itinerary load time
- 90% positive user feedback
- 30% reduction in support inquiries

### Retrospective Items
- Modal UX effectiveness
- Performance optimization results
- Feature adoption rate