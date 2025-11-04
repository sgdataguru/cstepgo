# 03 Create Trip with Itinerary - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver/trip organizer, I want to create trips with detailed day-by-day itineraries, so that potential passengers can see exactly what activities are planned.

## Pre-conditions

- User is authenticated and has driver/organizer permissions
- Trip creation flow exists in the system
- Basic form validation is implemented
- Database schema supports JSON storage for itineraries

## Business Requirements

- Reduce trip creation time by 40% with intuitive interface
- Increase trip quality scores by 25% through structured itineraries
- Enable template usage to improve consistency across similar trips
- Support multi-day trip planning with unlimited activities

## Technical Specifications

### Integration Points
- **Backend API**: `/api/trips/create` endpoint to save trip with itinerary
- **Google Places API**: Location autocomplete for activity locations
- **Templates API**: `/api/templates` for pre-built itineraries
- **Validation Service**: Server-side itinerary validation

### Security Requirements
- Validate all activity inputs to prevent XSS
- Sanitize location data from Google Places
- Rate limit trip creation endpoints
- Ensure proper authorization for trip organizers

## Design Specifications

### Visual Layout & Components

**Trip Creation Flow Enhancement**:
```
[Create Trip Form]
├── [Basic Information Section]
│   ├── [Trip Title]
│   ├── [Dates]
│   └── [Description]
├── [Itinerary Builder Section] <- New Section
│   ├── [Template Selection]
│   ├── [Day Tabs]
│   └── [Activity Blocks]
│       ├── [Add Activity Button]
│       └── [Activity List]
│           ├── [Activity Card]
│           │   ├── [Drag Handle]
│           │   ├── [Activity Fields]
│           │   └── [Actions]
│           └── [Reorder Indicators]
├── [Preview Section]
│   └── [Itinerary Preview]
└── [Form Actions]
```

**Activity Block Structure**:
```
[Activity Block]
├── [Header]
│   ├── [Drag Handle Icon]
│   ├── [Activity Number]
│   └── [Collapse/Expand Toggle]
├── [Content]
│   ├── [Time Input]
│   ├── [Location Autocomplete]
│   ├── [Activity Type Selector]
│   └── [Description Textarea]
└── [Actions]
    ├── [Duplicate]
    ├── [Move Up/Down]
    └── [Delete]
```

### Design System Compliance

**Color Palette**:
```css
/* Builder Elements */
--builder-bg: #f8fafc;
--builder-border: #e2e8f0;
--activity-bg: #ffffff;
--activity-hover: #f1f5f9;

/* Drag & Drop States */
--drag-active: #3b82f6;
--drop-zone: #dbeafe;
--drag-handle: #94a3b8;

/* Activity Types */
--type-transport: #3b82f6;
--type-activity: #10b981;
--type-meal: #f59e0b;
--type-accommodation: #8b5cf6;
```

**Typography Scale**:
```css
/* Section Headers */
--section-title: 1.25rem;   /* 20px */
--section-weight: 600;

/* Activity Text */
--activity-label: 0.875rem; /* 14px */
--activity-input: 1rem;     /* 16px */
--helper-text: 0.75rem;     /* 12px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.itinerary-builder {
  @apply flex flex-col space-y-4;
}

.activity-actions {
  @apply flex flex-col space-y-2;
}

.day-tabs {
  @apply overflow-x-auto flex space-x-2;
}
```

**Desktop (768px+)**:
```css
.itinerary-builder {
  @apply grid grid-cols-[2fr_1fr] gap-6;
}

.activity-actions {
  @apply flex flex-row space-x-2;
}

.day-tabs {
  @apply flex space-x-4;
}
```

### Interaction Patterns

**Drag & Drop States**:
```typescript
interface DragStates {
  idle: { cursor: 'grab' };
  dragging: { 
    cursor: 'grabbing',
    opacity: 0.5,
    transform: 'rotate(2deg)'
  };
  over: {
    borderColor: 'border-blue-500',
    backgroundColor: 'bg-blue-50'
  };
}
```

**Activity States**:
```typescript
interface ActivityStates {
  collapsed: { height: '60px', overflow: 'hidden' };
  expanded: { height: 'auto', overflow: 'visible' };
  editing: { border: '2px solid blue' };
  error: { border: '2px solid red' };
  saving: { opacity: 0.6, pointerEvents: 'none' };
}
```

## Technical Architecture

### Component Structure
```
src/app/trips/create/
├── page.tsx                         # Modified
├── components/
│   ├── TripForm.tsx                 # Modified
│   ├── ItineraryBuilder/
│   │   ├── index.tsx                # New
│   │   ├── DayTabs.tsx              # New
│   │   ├── ActivityList.tsx         # New
│   │   ├── ActivityBlock.tsx        # New
│   │   ├── ActivityForm.tsx         # New
│   │   ├── TemplateSelector.tsx     # New
│   │   └── ItineraryPreview.tsx     # New
│   └── hooks/
│       ├── useItineraryBuilder.ts   # New
│       ├── useDragAndDrop.ts        # New
│       └── useActivityTemplates.ts  # New
```

### State Management Architecture

**Local State Interface**:
```typescript
interface ItineraryBuilderState {
  days: ItineraryDay[];
  selectedDay: number;
  activities: Activity[];
  isDragging: boolean;
  draggedActivity: Activity | null;
  errors: Record<string, string>;
  template: Template | null;
}

interface ItineraryDay {
  dayNumber: number;
  date: Date;
  title: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  dayNumber: number;
  order: number;
  startTime: string;
  endTime?: string;
  location: {
    name: string;
    address?: string;
    placeId?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  type: ActivityType;
  description: string;
  notes?: string;
  isExpanded: boolean;
}

type ActivityType = 'transport' | 'activity' | 'meal' | 'accommodation' | 'other';

interface Template {
  id: string;
  name: string;
  description: string;
  duration: number;
  activities: TemplateActivity[];
}
```

### API Integration Schema

**Request/Response Types**:
```typescript
// Create Trip Request
interface CreateTripRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  itinerary: {
    version: string;
    days: Array<{
      dayNumber: number;
      date: string;
      title: string;
      activities: Array<{
        startTime: string;
        endTime?: string;
        location: {
          name: string;
          address?: string;
          placeId?: string;
          coordinates?: {
            lat: number;
            lng: number;
          };
        };
        type: string;
        description: string;
        notes?: string;
      }>;
    }>;
  };
  metadata?: Record<string, any>;
}

// Template Response
interface TemplateResponse {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    duration: number;
    thumbnail?: string;
    activities: Array<{
      dayOffset: number;
      defaultTime: string;
      type: string;
      title: string;
      description: string;
      duration: number;
    }>;
  }>;
}
```

## Implementation Requirements

### Core Components

**ItineraryBuilder/index.tsx** - Main container for itinerary builder
```typescript
interface ItineraryBuilderProps {
  startDate: Date;
  endDate: Date;
  onChange: (itinerary: ItineraryData) => void;
  defaultTemplate?: string;
}
```

**DayTabs.tsx** - Navigation between days
```typescript
interface DayTabsProps {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}
```

**ActivityBlock.tsx** - Individual activity with drag capability
```typescript
interface ActivityBlockProps {
  activity: Activity;
  index: number;
  onUpdate: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
}
```

**TemplateSelector.tsx** - Pre-built itinerary templates
```typescript
interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  tripDuration: number;
}
```

### Custom Hooks

**useItineraryBuilder()** - Main state management for builder
```typescript
function useItineraryBuilder(
  startDate: Date,
  endDate: Date
): {
  days: ItineraryDay[];
  activities: Activity[];
  addActivity: (dayNumber: number) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  moveActivity: (from: number, to: number) => void;
  applyTemplate: (template: Template) => void;
  getItineraryData: () => ItineraryData;
}
```

**useDragAndDrop()** - Drag and drop functionality
```typescript
function useDragAndDrop<T>(
  items: T[],
  onReorder: (from: number, to: number) => void
): {
  draggedItem: T | null;
  handleDragStart: (item: T) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (index: number) => void;
}
```

### Utility Functions

**itinerary-validators.ts** - Validation rules
```typescript
function validateActivity(activity: Activity): ValidationResult
function validateItinerary(itinerary: ItineraryData): ValidationResult
function checkTimeConflicts(activities: Activity[]): TimeConflict[]
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Block-based itinerary builder integrated in trip creation
- ✓ Support for multiple activities per day
- ✓ Drag-and-drop reordering of activities
- ✓ Move up/down buttons as fallback
- ✓ Activity fields: time, location, description
- ✓ Live preview of itinerary
- ✓ Itinerary saved as structured JSON

**Data Management**
- ✓ Auto-save draft functionality
- ✓ Template selection and application
- ✓ Location autocomplete integration
- ✓ Time conflict detection

**User Interface**
- ✓ Intuitive drag handles
- ✓ Clear visual feedback during drag
- ✓ Responsive layout for all devices
- ✓ Keyboard navigation support

### Non-Functional Requirements

**Performance**
- Activity add/remove < 100ms
- Drag operation smooth at 60fps
- Template application < 500ms

**Accessibility**
- Keyboard-only operation support
- Screen reader announcements
- Clear focus indicators
- Alternative to drag-and-drop

**Security**
- Input sanitization for all fields
- XSS prevention in descriptions
- Rate limiting on saves

## Modified Files
```
src/
├── app/
│   └── trips/
│       └── create/
│           ├── page.tsx ✓
│           └── components/
│               ├── TripForm.tsx ✓
│               └── ItineraryBuilder/
│                   ├── index.tsx ⬜
│                   ├── DayTabs.tsx ⬜
│                   ├── ActivityList.tsx ⬜
│                   ├── ActivityBlock.tsx ⬜
│                   ├── ActivityForm.tsx ⬜
│                   ├── TemplateSelector.tsx ⬜
│                   ├── ItineraryPreview.tsx ⬜
│                   └── hooks/
│                       ├── useItineraryBuilder.ts ⬜
│                       ├── useDragAndDrop.ts ⬜
│                       └── useActivityTemplates.ts ⬜
├── lib/
│   └── utils/
│       ├── itinerary-validators.ts ⬜
│       └── activity-helpers.ts ⬜
├── types/
│   └── itinerary-builder-types.ts ⬜
└── constants/
    └── activity-types.ts ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create ItineraryBuilder component structure
- [ ] Define TypeScript interfaces
- [ ] Set up day navigation tabs
- [ ] Create basic activity form

### Phase 2: Core Implementation
- [ ] Implement add/edit/delete activities
- [ ] Build drag-and-drop functionality
- [ ] Add location autocomplete
- [ ] Create activity type selector

### Phase 3: Enhanced Features
- [ ] Template selector integration
- [ ] Live preview component
- [ ] Time conflict detection
- [ ] Auto-save functionality

### Phase 4: Polish & Testing
- [ ] Keyboard navigation
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- Form validation utilities
- Google Places integration service
- Date/time utilities
- Icon library for activity types

### External Dependencies
- @dnd-kit/sortable for drag-and-drop
- @googlemaps/js-api-loader for Places API
- date-fns for date manipulation
- react-hook-form for form management

## Risk Assessment

### Technical Risks

**Complex State Management**
- Impact: High
- Mitigation: Use reducer pattern
- Contingency: Simplify to single day editing

**Drag-and-Drop Cross-browser**
- Impact: Medium
- Mitigation: Use battle-tested library
- Contingency: Button-based reordering only

**Large Itinerary Performance**
- Impact: Medium
- Mitigation: Virtual scrolling
- Contingency: Pagination by day

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('ItineraryBuilder', () => {
  it('should add new activities correctly', () => {});
  it('should reorder activities via drag-drop', () => {});
  it('should validate time conflicts', () => {});
  it('should apply templates correctly', () => {});
});

describe('useItineraryBuilder', () => {
  it('should manage multi-day state', () => {});
  it('should handle activity CRUD operations', () => {});
  it('should generate valid JSON output', () => {});
});
```

### Integration Tests
```typescript
describe('Trip Creation with Itinerary', () => {
  it('should complete full trip creation flow', () => {});
  it('should save draft and resume', () => {});
  it('should handle template application', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load drag-and-drop library
- Code split template selector
- Optimize Google Places loading

### Runtime Performance
- Memoize activity components
- Debounce auto-save operations
- Virtual scroll for long lists

### Caching Strategy
- Cache templates locally
- Store drafts in localStorage
- Cache location search results

## Deployment Plan

### Development Phase
- Feature flag for itinerary builder
- Test with various trip durations
- Cross-browser compatibility

### Staging Phase
- Load test with complex itineraries
- Template functionality validation
- Mobile usability testing

### Production Phase
- Gradual rollout to power users
- Monitor builder usage metrics
- Collect user feedback

## Monitoring & Analytics

### Performance Metrics
- Activity add/remove times
- Drag operation frame rates
- Save operation duration

### Business Metrics
- Builder adoption rate
- Template usage statistics
- Average activities per trip

### Technical Metrics
- Error rates in builder
- API call frequencies
- Client-side performance

## Documentation Requirements

### Technical Documentation
- Itinerary JSON schema
- Drag-and-drop implementation
- Template structure guide

### User Documentation
- Step-by-step builder guide
- Template usage instructions
- Best practices for itineraries

## Post-Launch Review

### Success Criteria
- 40% reduction in trip creation time
- 80% of trips use itinerary builder
- < 5% error rate in submissions
- 25% increase in trip quality scores

### Retrospective Items
- Builder UX effectiveness
- Template variety sufficiency
- Performance optimization needs
- Feature enhancement requests