# 06 View Driver Profile - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a potential passenger, I want to view detailed driver profiles, so that I can build trust and confidence before booking a trip.

## Pre-conditions

- Driver data model exists in database with profile information
- Authentication system can handle public profile viewing
- Driver verification system is implemented
- Review and rating system is functional

## Business Requirements

- Increase booking conversion by 35% through trust-building
- Reduce customer support inquiries about driver credentials by 40%
- Enable driver differentiation and competitive advantage
- Support driver retention through profile visibility

## Technical Specifications

### Integration Points
- **Driver API**: `/api/drivers/{id}` for profile data
- **Reviews API**: `/api/drivers/{id}/reviews` for ratings
- **Trips API**: `/api/drivers/{id}/trips` for upcoming trips
- **Verification Service**: Badge validation and display

### Security Requirements
- Public profiles with sensitive data protection
- Rate limiting on profile views
- Prevent scraping of driver information
- GDPR compliance for personal data display

## Design Specifications

### Visual Layout & Components

**Trip Card Driver Section Enhancement**:
```
[Trip Card]
├── [Driver Info Section] <- Enhanced
│   ├── [Driver Avatar]
│   ├── [Driver Name]
│   ├── [Rating Stars]
│   └── [View Profile Link]
├── [Trip Details]
└── [Actions]
```

**Driver Profile Page Structure**:
```
[Profile Page]
├── [Header Section]
│   ├── [Cover Image/Pattern]
│   └── [Profile Info Bar]
│       ├── [Large Avatar]
│       ├── [Name & Title]
│       ├── [Overall Rating]
│       └── [Verification Badges]
├── [Content Grid]
│   ├── [Left Column - 1/3]
│   │   ├── [Quick Stats Card]
│   │   ├── [Languages Card]
│   │   └── [Contact Card]
│   └── [Right Column - 2/3]
│       ├── [About Section]
│       ├── [Vehicle Information]
│       ├── [Reviews Section]
│       └── [Upcoming Trips]
└── [Mobile Bottom Bar]
    └── [Book Now CTA]
```

### Design System Compliance

**Color Palette**:
```css
/* Profile Colors */
--profile-header-bg: #1e293b;    /* Slate-800 */
--profile-accent: #3b82f6;       /* Blue-500 */
--badge-verified: #10b981;       /* Emerald-500 */
--badge-premium: #f59e0b;        /* Amber-500 */

/* Rating Colors */
--rating-star: #facc15;          /* Yellow-400 */
--rating-bg: #fef3c7;            /* Yellow-100 */

/* Card Backgrounds */
--card-bg: #ffffff;              /* White */
--card-border: #e5e7eb;          /* Gray-200 */
```

**Typography Scale**:
```css
/* Profile Header */
--driver-name: 2rem;             /* 32px */
--driver-title: 1rem;            /* 16px */

/* Stats & Labels */
--stat-number: 1.5rem;           /* 24px */
--stat-label: 0.875rem;          /* 14px */

/* Content Text */
--section-heading: 1.25rem;      /* 20px */
--body-text: 1rem;               /* 16px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.profile-layout {
  @apply flex flex-col;
}

.profile-header {
  @apply h-48 relative;
}

.content-grid {
  @apply flex flex-col space-y-4 px-4;
}

.bottom-cta {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg;
}
```

**Desktop (768px+)**:
```css
.profile-layout {
  @apply max-w-7xl mx-auto px-8;
}

.profile-header {
  @apply h-64 relative rounded-lg overflow-hidden;
}

.content-grid {
  @apply grid grid-cols-3 gap-6 mt-6;
}

.bottom-cta {
  @apply hidden;
}
```

### Interaction Patterns

**Profile Card Hover States**:
```typescript
interface CardStates {
  default: {
    transform: 'translateY(0)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  };
}
```

**Badge Animation**:
```typescript
interface BadgeStates {
  verified: {
    animation: 'pulse 2s infinite',
    color: '#10b981',
    icon: 'checkmark-circle'
  };
  premium: {
    animation: 'shimmer 3s infinite',
    color: '#f59e0b',
    icon: 'star'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/
├── drivers/
│   └── [id]/
│       ├── page.tsx                 # Driver profile page
│       ├── loading.tsx              # Loading state
│       └── error.tsx                # Error boundary
└── trips/
    └── components/
        ├── DriverInfo.tsx           # Modified
        └── driver-profile/
            ├── ProfileHeader.tsx    # New
            ├── ProfileStats.tsx     # New
            ├── VehicleCard.tsx      # New
            ├── LanguagesCard.tsx    # New
            ├── ReviewsSection.tsx   # New
            ├── UpcomingTrips.tsx    # New
            ├── VerificationBadges.tsx # New
            └── hooks/
                ├── useDriverProfile.ts # New
                ├── useDriverReviews.ts # New
                └── useDriverTrips.ts   # New
```

### State Management Architecture

**Profile State Interface**:
```typescript
interface DriverProfileState {
  // Driver Information
  driver: DriverProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsPagination: PaginationState;
  
  // Trips
  upcomingTrips: Trip[];
  tripsLoading: boolean;
  
  // UI State
  activeTab: 'about' | 'reviews' | 'trips';
  isContactModalOpen: boolean;
}

interface DriverProfile {
  id: string;
  name: string;
  photoUrl: string;
  coverPhotoUrl?: string;
  joinedDate: Date;
  
  // Professional Info
  yearsOfExperience: number;
  totalTrips: number;
  totalDistance: number;
  
  // Ratings
  rating: number;
  reviewCount: number;
  
  // Verification
  verificationBadges: VerificationBadge[];
  
  // Personal Info
  bio: string;
  languages: Language[];
  
  // Vehicle Info
  vehicles: Vehicle[];
  
  // Availability
  availability: AvailabilityStatus;
  responseTime: string;
}

interface VerificationBadge {
  type: 'identity' | 'license' | 'insurance' | 'background' | 'training';
  status: 'verified' | 'pending' | 'expired';
  verifiedDate?: Date;
  expiryDate?: Date;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  capacity: number;
  amenities: string[];
  photos: string[];
}
```

### API Integration Schema

**Driver Profile Request/Response**:
```typescript
// Get Driver Profile
interface GetDriverProfileRequest {
  driverId: string;
  includeStats?: boolean;
}

interface DriverProfileResponse {
  driver: {
    id: string;
    personalInfo: {
      name: string;
      photoUrl: string;
      bio: string;
      joinedDate: string;
    };
    professionalInfo: {
      yearsOfExperience: number;
      languages: Array<{
        code: string;
        name: string;
        proficiency: 'native' | 'fluent' | 'conversational';
      }>;
    };
    stats: {
      totalTrips: number;
      totalDistance: number;
      onTimePercentage: number;
      responseTime: string;
    };
    rating: {
      average: number;
      count: number;
      distribution: Record<number, number>;
    };
    verification: {
      badges: Array<{
        type: string;
        status: string;
        verifiedAt: string;
      }>;
      verificationLevel: 'basic' | 'standard' | 'premium';
    };
    vehicles: Array<{
      id: string;
      details: VehicleDetails;
      amenities: string[];
      photos: string[];
    }>;
  };
}

// Get Driver Reviews
interface GetDriverReviewsRequest {
  driverId: string;
  page?: number;
  limit?: number;
  sort?: 'recent' | 'rating';
}

interface ReviewsResponse {
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    tripId: string;
    reviewer: {
      name: string;
      photoUrl?: string;
    };
    response?: {
      comment: string;
      createdAt: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}
```

## Implementation Requirements

### Core Components

**ProfileHeader.tsx** - Hero section with driver info
```typescript
interface ProfileHeaderProps {
  driver: DriverProfile;
  onContactClick: () => void;
}
```

**ProfileStats.tsx** - Key performance metrics
```typescript
interface ProfileStatsProps {
  stats: {
    totalTrips: number;
    yearsExperience: number;
    onTimeRate: number;
    responseTime: string;
  };
}
```

**VehicleCard.tsx** - Vehicle information display
```typescript
interface VehicleCardProps {
  vehicle: Vehicle;
  onViewPhotos: (photos: string[]) => void;
}
```

**ReviewsSection.tsx** - Reviews with pagination
```typescript
interface ReviewsSectionProps {
  driverId: string;
  initialReviews?: Review[];
}
```

**VerificationBadges.tsx** - Trust indicators
```typescript
interface VerificationBadgesProps {
  badges: VerificationBadge[];
  size?: 'sm' | 'md' | 'lg';
  showTooltips?: boolean;
}
```

### Custom Hooks

**useDriverProfile()** - Fetches and manages driver data
```typescript
function useDriverProfile(driverId: string): {
  profile: DriverProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**useDriverReviews()** - Manages reviews with pagination
```typescript
function useDriverReviews(driverId: string): {
  reviews: Review[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  stats: ReviewStats;
}
```

**useDriverTrips()** - Fetches upcoming trips
```typescript
function useDriverTrips(driverId: string): {
  trips: Trip[];
  isLoading: boolean;
  error: Error | null;
}
```

### Utility Functions

**profile-formatters.ts** - Format profile data
```typescript
function formatExperience(years: number): string
function formatResponseTime(avgMinutes: number): string
function getVerificationLevel(badges: VerificationBadge[]): string
```

**badge-helpers.ts** - Badge display logic
```typescript
function getBadgeIcon(type: BadgeType): IconType
function getBadgeColor(status: BadgeStatus): string
function getBadgeTooltip(badge: VerificationBadge): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Driver name and photo visible on trip cards
- ✓ Clicking driver info navigates to profile
- ✓ Profile displays all required information:
  - ✓ Years of driving experience
  - ✓ Vehicle details with photos
  - ✓ Ratings and reviews with responses
  - ✓ Languages with proficiency levels
  - ✓ Verification badges with meanings
  - ✓ List of upcoming trips
- ✓ Profile page publicly accessible
- ✓ Responsive design for all devices

**Data Management**
- ✓ Profile data cached appropriately
- ✓ Reviews load with pagination
- ✓ Real-time availability status
- ✓ Graceful handling of missing data

**User Interface**
- ✓ Smooth navigation from trip card
- ✓ Clear visual hierarchy
- ✓ Interactive elements responsive
- ✓ Accessibility compliant

### Non-Functional Requirements

**Performance**
- Profile page load < 2 seconds
- Smooth scrolling with many reviews
- Image optimization for vehicles
- Lazy loading for trip list

**Accessibility**
- Screen reader friendly badges
- Keyboard navigation support
- Alt text for all images
- ARIA labels for ratings

**Security**
- No sensitive data exposed
- Rate limiting implemented
- Image URLs signed/secure
- GDPR compliant display

## Modified Files
```
src/
├── app/
│   ├── drivers/
│   │   └── [id]/
│   │       ├── page.tsx ⬜
│   │       ├── loading.tsx ⬜
│   │       └── error.tsx ⬜
│   └── trips/
│       └── components/
│           ├── DriverInfo.tsx ✓
│           └── driver-profile/
│               ├── ProfileHeader.tsx ⬜
│               ├── ProfileStats.tsx ⬜
│               ├── VehicleCard.tsx ⬜
│               ├── LanguagesCard.tsx ⬜
│               ├── ReviewsSection.tsx ⬜
│               ├── UpcomingTrips.tsx ⬜
│               ├── VerificationBadges.tsx ⬜
│               └── hooks/
│                   ├── useDriverProfile.ts ⬜
│                   ├── useDriverReviews.ts ⬜
│                   └── useDriverTrips.ts ⬜
├── lib/
│   ├── api/
│   │   └── drivers-api.ts ⬜
│   └── utils/
│       ├── profile-formatters.ts ⬜
│       └── badge-helpers.ts ⬜
├── types/
│   └── driver-types.ts ⬜
└── constants/
    └── verification-badges.ts ⬜
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- [08-apply-as-driver.md](./08-apply-as-driver.md) - Driver onboarding creates profiles
- [15-admin-manual-driver-registration.md](./15-admin-manual-driver-registration.md) - Admin-created driver profiles
- Driver model with verification data

**Works With**:
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Driver names shown on trip cards
- Review and rating system

**Enables**:
- Trust-building for bookings
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Users see driver before payment

**Related Epics**:
- **Epic D - Driver Portal**: Driver identity and verification
- **Epic A - Discovery**: Trust signals for browsing users

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: Epic D & E

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#06---view-driver-profile)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create driver profile page route
- [ ] Define TypeScript interfaces
- [ ] Set up API integration layer
- [ ] Create basic profile layout

### Phase 2: Core Implementation
- [ ] Build ProfileHeader component
- [ ] Implement stats and badges display
- [ ] Create vehicle information cards
- [ ] Add languages section

### Phase 3: Enhanced Features
- [ ] Reviews section with pagination
- [ ] Upcoming trips list
- [ ] Contact driver functionality
- [ ] Share profile feature

### Phase 4: Polish & Testing
- [ ] Responsive design refinements
- [ ] Loading and error states
- [ ] Performance optimizations
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- User authentication service
- Review/rating system
- Trip management service
- Image storage service

### External Dependencies
- Image optimization service
- Map service for trip routes
- Analytics tracking
- Social sharing APIs

## Risk Assessment

### Technical Risks

**Data Privacy Concerns**
- Impact: High
- Mitigation: Implement data masking
- Contingency: Configurable privacy levels

**Performance with Media**
- Impact: Medium
- Mitigation: CDN and lazy loading
- Contingency: Progressive image loading

**Review Authenticity**
- Impact: Medium
- Mitigation: Verified trip reviews only
- Contingency: Review moderation system

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Driver Profile Components', () => {
  it('should display driver information correctly', () => {});
  it('should handle missing optional data', () => {});
  it('should render verification badges', () => {});
  it('should paginate reviews properly', () => {});
});

describe('useDriverProfile Hook', () => {
  it('should fetch driver data successfully', () => {});
  it('should handle API errors gracefully', () => {});
  it('should cache profile data', () => {});
});
```

### Integration Tests
```typescript
describe('Driver Profile Integration', () => {
  it('should navigate from trip card to profile', async () => {});
  it('should load all profile sections', async () => {});
  it('should handle review interactions', () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load profile page components
- Code split review section
- Optimize image components

### Runtime Performance
- Implement virtual scrolling for reviews
- Memoize expensive calculations
- Debounce API calls

### Caching Strategy
- Cache driver profiles (30 minutes)
- Cache vehicle photos (24 hours)
- Store review pages locally

## Deployment Plan

### Development Phase
- Feature flag for profile pages
- Test with sample driver data
- Cross-device testing

### Staging Phase
- Load test with many reviews
- Verify image optimization
- Security audit

### Production Phase
- Gradual rollout by region
- Monitor page load times
- Collect user feedback

## Monitoring & Analytics

### Performance Metrics
- Profile page load times
- Image loading performance
- API response times

### Business Metrics
- Profile view to booking conversion
- Average time on profile
- Most viewed profile sections

### Technical Metrics
- Cache hit rates
- Error rates by component
- Review pagination usage

## Documentation Requirements

### Technical Documentation
- Profile data schema
- API endpoint documentation
- Component usage guide

### User Documentation
- Understanding verification badges
- How driver ratings work
- Booking from profiles

## Post-Launch Review

### Success Criteria
- 35% increase in booking conversion
- < 2s profile load time
- 90% positive user feedback
- 40% reduction in support inquiries

### Retrospective Items
- Profile information completeness
- User trust indicators effectiveness
- Performance optimization opportunities
- Feature