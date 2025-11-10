# 04 Search Locations with Autocomplete - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver creating a trip, I want to search and select origin/destination using Google Places autocomplete, so that I can quickly and accurately specify trip locations.

## Pre-conditions

- Google Places API key configured and accessible
- Trip creation form component exists
- User authenticated with driver/organizer permissions
- Admin settings infrastructure for country restrictions

## Business Requirements

- Reduce location input errors by 90% through autocomplete
- Decrease average trip creation time by 35%
- Enable accurate pricing calculations with precise coordinates
- Support future expansion to neighboring countries

## Technical Specifications

### Integration Points
- **Google Places API**: Autocomplete service with session tokens
- **Admin Settings API**: `/api/admin/settings/countries` for restrictions
- **Trip API**: `/api/trips` for saving location data
- **Geocoding Service**: Reverse geocoding for validation

### Security Requirements
- API key restrictions (HTTP referrers, API restrictions)
- Rate limiting on autocomplete requests
- Session token implementation for cost optimization
- Input sanitization for location strings

## Design Specifications

### Visual Layout & Components

**Location Input Enhancement**:
```
[Location Input Container]
├── [Label & Helper Text]
├── [Input Field with Icon]
│   ├── [Location Pin Icon]
│   ├── [Input Text]
│   └── [Clear Button]
├── [Autocomplete Dropdown]
│   ├── [Suggestion List]
│   │   ├── [Primary Text (Place Name)]
│   │   └── [Secondary Text (Address)]
│   └── [Powered by Google]
└── [Selected Location Display]
    ├── [Place Name]
    └── [Coordinates Badge]
```

**Autocomplete Dropdown Structure**:
```
[Dropdown Container]
├── [Loading State]
├── [Suggestion Items]
│   ├── [Place Icon]
│   ├── [Text Container]
│   │   ├── [Main Text]
│   │   └── [Description]
│   └── [Selection Indicator]
├── [No Results State]
└── [Google Attribution]
```

### Design System Compliance

**Color Palette**:
```css
/* Input States */
--input-default: #ffffff;
--input-hover: #f8fafc;
--input-focus: #dbeafe;
--input-error: #fee2e2;

/* Dropdown */
--dropdown-bg: #ffffff;
--dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
--suggestion-hover: #f3f4f6;
--suggestion-selected: #dbeafe;

/* Text Colors */
--text-primary: #111827;
--text-secondary: #6b7280;
--text-placeholder: #9ca3af;
```

**Typography Scale**:
```css
/* Input Text */
--input-font-size: 1rem;      /* 16px */
--input-line-height: 1.5;

/* Suggestions */
--suggestion-primary: 0.875rem; /* 14px */
--suggestion-secondary: 0.75rem; /* 12px */

/* Labels */
--label-size: 0.875rem;        /* 14px */
--label-weight: 500;
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.location-input {
  @apply w-full;
}

.autocomplete-dropdown {
  @apply fixed left-0 right-0 top-auto max-h-60;
}
```

**Desktop (768px+)**:
```css
.location-input {
  @apply max-w-lg;
}

.autocomplete-dropdown {
  @apply absolute w-full max-h-80;
}
```

### Interaction Patterns

**Input States**:
```typescript
interface InputStates {
  idle: {
    border: 'border-gray-300',
    background: 'bg-white'
  };
  focus: {
    border: 'border-blue-500',
    background: 'bg-white',
    shadow: 'shadow-sm'
  };
  error: {
    border: 'border-red-500',
    background: 'bg-red-50'
  };
  disabled: {
    border: 'border-gray-200',
    background: 'bg-gray-50',
    cursor: 'cursor-not-allowed'
  };
}
```

**Dropdown Animation**:
```typescript
interface DropdownAnimation {
  enter: {
    opacity: 0,
    transform: 'translateY(-10px)'
  };
  enterActive: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'all 200ms ease-out'
  };
  exit: {
    opacity: 0,
    transform: 'translateY(-10px)',
    transition: 'all 150ms ease-in'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/trips/create/
├── components/
│   ├── LocationAutocomplete/
│   │   ├── index.tsx                 # Main component
│   │   ├── LocationInput.tsx         # Input field component
│   │   ├── SuggestionsList.tsx       # Dropdown list
│   │   ├── SuggestionItem.tsx        # Individual suggestion
│   │   ├── SelectedLocation.tsx      # Selected display
│   │   └── hooks/
│   │       ├── useGooglePlaces.ts    # Google Places hook
│   │       ├── useAutocomplete.ts    # Autocomplete logic
│   │       └── useDebounce.ts        # Debounce hook
│   └── TripForm.tsx                  # Modified
```

### State Management Architecture

**Component State Interface**:
```typescript
interface LocationAutocompleteState {
  // Input State
  inputValue: string;
  isSearching: boolean;
  isFocused: boolean;
  
  // Suggestions
  suggestions: PlaceSuggestion[];
  selectedSuggestion: PlaceSuggestion | null;
  highlightedIndex: number;
  
  // Selected Location
  selectedLocation: Location | null;
  
  // Configuration
  sessionToken: string;
  countryRestrictions: string[];
  
  // Error Handling
  error: string | null;
}

interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  types: string[];
}

interface Location {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  types: string[];
}
```

### API Integration Schema

**Google Places Types**:
```typescript
// Autocomplete Request
interface AutocompleteRequest {
  input: string;
  sessionToken: string;
  componentRestrictions: {
    country: string[];
  };
  types?: string[];
  language?: string;
}

// Place Details Request
interface PlaceDetailsRequest {
  placeId: string;
  sessionToken: string;
  fields: string[];
}

// Custom API Response
interface LocationSearchResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
  status: string;
}

// Admin Settings Response
interface CountrySettingsResponse {
  enabledCountries: Array<{
    code: string;
    name: string;
    isActive: boolean;
  }>;
  defaultCountry: string;
}
```

## Implementation Requirements

### Core Components

**LocationAutocomplete/index.tsx** - Main autocomplete component
```typescript
interface LocationAutocompleteProps {
  label: string;
  placeholder?: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
  onError?: (error: Error) => void;
  required?: boolean;
  disabled?: boolean;
  countryRestrictions?: string[];
}
```

**LocationInput.tsx** - Input field with clear functionality
```typescript
interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}
```

**SuggestionsList.tsx** - Dropdown container with suggestions
```typescript
interface SuggestionsListProps {
  suggestions: PlaceSuggestion[];
  highlightedIndex: number;
  onSelect: (suggestion: PlaceSuggestion) => void;
  onHighlight: (index: number) => void;
  isLoading: boolean;
  isOpen: boolean;
}
```

### Custom Hooks

**useGooglePlaces()** - Google Places API integration
```typescript
function useGooglePlaces(apiKey: string): {
  autocomplete: (input: string, options: AutocompleteOptions) => Promise<PlaceSuggestion[]>;
  getDetails: (placeId: string) => Promise<Location>;
  sessionToken: string;
  resetSession: () => void;
}
```

**useAutocomplete()** - Autocomplete state management
```typescript
function useAutocomplete(options: AutocompleteOptions): {
  inputValue: string;
  suggestions: PlaceSuggestion[];
  selectedLocation: Location | null;
  isSearching: boolean;
  error: string | null;
  handlers: {
    onInputChange: (value: string) => void;
    onSuggestionSelect: (suggestion: PlaceSuggestion) => void;
    onClear: () => void;
  };
}
```

**useDebounce()** - Debounce user input
```typescript
function useDebounce<T>(value: T, delay: number): T
```

### Utility Functions

**places-helpers.ts** - Google Places utilities
```typescript
function createSessionToken(): string
function formatPlaceResult(place: google.maps.places.PlaceResult): Location
function buildComponentRestrictions(countries: string[]): ComponentRestrictions
```

**validation.ts** - Input validation
```typescript
function validateLocation(location: Location): ValidationResult
function isValidCoordinates(lat: number, lng: number): boolean
function sanitizeLocationInput(input: string): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Google Places Autocomplete integrated in form
- ✓ Search restricted to Kazakhstan by default
- ✓ Kyrgyzstan option configurable via admin
- ✓ Captures place_id, coordinates, full name
- ✓ Selected location displays clearly
- ✓ Works on desktop and mobile devices

**Data Management**
- ✓ Session tokens optimize API costs
- ✓ Debounced search requests (300ms)
- ✓ Caches recent searches
- ✓ Persists selected location in form state

**User Interface**
- ✓ Clear visual feedback during search
- ✓ Keyboard navigation for suggestions
- ✓ Touch-friendly on mobile devices
- ✓ Accessible to screen readers

### Non-Functional Requirements

**Performance**
- Autocomplete response < 300ms
- Debounce delay optimized
- Minimal API calls via session tokens

**Accessibility**
- ARIA labels for autocomplete
- Keyboard navigation (arrows, enter, escape)
- Screen reader announcements
- High contrast mode support

**Security**
- API key protected server-side
- Input sanitization
- XSS prevention
- Rate limiting

## Modified Files
```
src/
├── app/
│   └── trips/
│       └── create/
│           ├── page.tsx ✓
│           └── components/
│               ├── TripForm.tsx ✓
│               └── LocationAutocomplete/
│                   ├── index.tsx ⬜
│                   ├── LocationInput.tsx ⬜
│                   ├── SuggestionsList.tsx ⬜
│                   ├── SuggestionItem.tsx ⬜
│                   ├── SelectedLocation.tsx ⬜
│                   └── hooks/
│                       ├── useGooglePlaces.ts ⬜
│                       ├── useAutocomplete.ts ⬜
│                       └── useDebounce.ts ⬜
├── lib/
│   ├── google/
│   │   └── places-client.ts ⬜
│   └── utils/
│       ├── places-helpers.ts ⬜
│       └── location-validation.ts ⬜
├── types/
│   └── google-places.d.ts ⬜
└── env/
    └── google.env ⬜
```

## Cross-References

### Related Implementation Plans

**Required By**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Location selection in trip creation (BLOCKER)
- [14-zone-based-itinerary-pricing.md](./14-zone-based-itinerary-pricing.md) - Location data for zone calculations

**Works With**:
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Search functionality on browse page

**Related Epics**:
- **Epic D - Driver Portal**: Essential for trip creation
- **Epic A - Discovery**: Enables search functionality

**External Dependencies**:
- ⚠️ **Google Places API Key** - Must be configured before implementation

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: External Services

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#04---search-locations-autocomplete)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Configure Google Places API key
- [ ] Create base component structure
- [ ] Define TypeScript interfaces
- [ ] Set up Google Places client

### Phase 2: Core Implementation
- [ ] Build LocationInput component
- [ ] Implement useGooglePlaces hook
- [ ] Create suggestions dropdown
- [ ] Add keyboard navigation

### Phase 3: Enhanced Features
- [ ] Session token management
- [ ] Country restrictions from admin
- [ ] Recent searches cache
- [ ] Mobile optimizations

### Phase 4: Polish & Testing
- [ ] Accessibility improvements
- [ ] Error handling scenarios
- [ ] Performance optimizations
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- Admin settings service
- Form validation utilities
- Design system components
- Environment configuration

### External Dependencies
- @googlemaps/google-maps-services-js
- @googlemaps/js-api-loader
- react-use for utility hooks
- lodash.debounce for input debouncing

## Risk Assessment

### Technical Risks

**API Rate Limits**
- Impact: High
- Mitigation: Session tokens, caching
- Contingency: Fallback to manual input

**Google Places Costs**
- Impact: Medium
- Mitigation: Optimize with sessions
- Contingency: Monthly budget alerts

**Network Connectivity**
- Impact: Medium
- Mitigation: Offline fallback
- Contingency: Manual coordinate input

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('LocationAutocomplete', () => {
  it('should display suggestions on input', async () => {});
  it('should handle country restrictions', () => {});
  it('should capture all location data', () => {});
  it('should handle API errors gracefully', () => {});
});

describe('useGooglePlaces', () => {
  it('should manage session tokens correctly', () => {});
  it('should debounce API requests', () => {});
  it('should format place details', () => {});
});
```

### Integration Tests
```typescript
describe('Location Selection Flow', () => {
  it('should complete location selection', async () => {});
  it('should update form with location data', () => {});
  it('should validate selected locations', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load Google Maps library
- Tree shake unused utilities
- Minimize autocomplete payload

### Runtime Performance
- Debounce user input (300ms)
- Cache autocomplete results
- Reuse session tokens

### Caching Strategy
- Cache place details (1 hour)
- Store recent searches (localStorage)
- Session token lifecycle (3 minutes)

## Deployment Plan

### Development Phase
- Mock Google Places for testing
- Feature flag for gradual rollout
- API key configuration

### Staging Phase
- Real API integration testing
- Cost monitoring setup
- Performance benchmarking

### Production Phase
- Monitor API usage/costs
- A/B test debounce timing
- Collect user feedback

## Monitoring & Analytics

### Performance Metrics
- Autocomplete response times
- API call frequency
- Error rates

### Business Metrics
- Location selection accuracy
- Time to complete location input
- User satisfaction scores

### Technical Metrics
- API costs per user
- Cache hit rates
- Session token efficiency

## Documentation Requirements

### Technical Documentation
- Google Places integration guide
- Session token management
- Country restriction configuration

### User Documentation
- How to search locations
- Supported countries list
- Troubleshooting guide

## Post-Launch Review

### Success Criteria
- 90% reduction in location errors
- 35% faster trip creation
- API costs within budget
- Positive user feedback

### Retrospective Items
- API cost optimization
- User experience improvements
- Performance enhancements
-