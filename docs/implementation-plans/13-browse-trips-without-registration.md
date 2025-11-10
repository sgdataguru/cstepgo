# 13 - Browse Trips Without Registration - Implementation Plan

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
**Backend**: Next.js API Routes, Prisma ORM, PostgreSQL (Supabase)
**Infrastructure**: Vercel (deployment), Supabase (database)
**Related Stories**: Gateway to Stories B1 (OTP Auth), B2/B3 (Bookings)

## User Story
**As a** visitor (unregistered user),  
**I want** to browse all available trips without creating an account,  
**so that** I can explore offerings before committing to sign up.

## Pre-conditions
- ✅ Database contains trip records with `status = 'published'`
- ✅ Trip model includes: origin, destination, departure time, vehicle type, pricing, seat capacity
- ✅ Basic landing page exists (Gate 1 already implemented)
- ✅ No authentication middleware blocking `/trips` route

## Business Requirements
- **User Acquisition**: >60% of visitors should browse trips (tracked via PostHog)
- **Conversion Funnel**: Browse → Sign up conversion rate >15%
- **Bounce Rate**: <40% on trip listing page
- **Time on Page**: >2 minutes average engagement
- **SEO Goal**: Trip pages indexable by Google for organic traffic

## Technical Specifications

### Integration Points
- **Authentication**: No auth required for viewing; redirect to OTP flow on booking attempt
- **Analytics**: PostHog events for public browsing behavior
- **Data Fetching**: Server-side rendering (SSR) for SEO
- **Caching**: Static generation with ISR (Incremental Static Regeneration) every 5 minutes

### Security Requirements
- **Data Masking**: Hide driver phone numbers, passenger details, booking IDs
- **XSS Protection**: Sanitize all user-generated content (trip descriptions)
- **Rate Limiting**: Prevent scraping (max 100 requests/minute per IP)
- **No Sensitive Data**: Only public trip metadata exposed

### Data Schema
```typescript
// Public Trip Response (API)
interface PublicTrip {
  id: string;
  title: string;
  originName: string;
  destName: string;
  departureTime: Date;
  vehicleType: 'Sedan' | 'Van' | 'Mini-bus' | 'SUV';
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
  pricePerSeat: number | null; // null for private trips
  currency: string;
  driverName: string; // First name only
  driverRating: number | null;
  status: 'published';
  // EXCLUDED: driver phone, passenger names, booking details
}
```

## Design Specifications

### Visual Layout & Components

**Page Structure** (`/trips`):
```
┌─────────────────────────────────────────────────┐
│  [Header: StepperGO Logo | Sign In]             │
├─────────────────────────────────────────────────┤
│  [Hero: "Discover Central Asia Together"]       │
│  [Search Bar: Origin → Destination | Date]      │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌───────────────────────────┐    │
│  │ Filters  │  │  Trip Card 1              │    │
│  │ ────────│  │  Almaty → Bishkek         │    │
│  │ □ Private│  │  Nov 8, 10:00 AM          │    │
│  │ □ Shared │  │  Van (6 seats) • 4 left   │    │
│  │          │  │  $45/person               │    │
│  │ Date     │  │  ⭐ 4.8 • Driver: Ali      │    │
│  │ Price    │  │  [View Details]           │    │
│  │ Seats    │  ├───────────────────────────┤    │
│  └──────────┘  │  Trip Card 2...           │    │
│                └───────────────────────────┘    │
│  [Pagination: 1 2 3 ... 10]                     │
└─────────────────────────────────────────────────┘
```

**Component Hierarchy**:
```jsx
<TripsPage>
  <Header authenticated={false} />
  <HeroSection />
  <SearchBar />
  <div className="grid md:grid-cols-4">
    <FilterSidebar />
    <TripListingGrid className="md:col-span-3">
      {trips.map(trip => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </TripListingGrid>
  </div>
  <Pagination />
  <RegistrationPromptModal />
</TripsPage>
```

### Design System Compliance

**Color Palette**:
```css
/* Primary Brand Colors (from TRIP_CREATION_FLOW_REDESIGN.md) */
--gold: #FFD700;           /* Primary CTA */
--turquoise: #40E0D0;      /* Secondary actions */

/* Trip Cards */
--card-bg: #FFFFFF;
--card-border: #E5E7EB;    /* gray-200 */
--card-hover: #F3F4F6;     /* gray-100 */

/* Status Badges */
--available: #10B981;      /* green-500 */
--filling-up: #F59E0B;     /* amber-500 */
--sold-out: #EF4444;       /* red-500 */
```

**Typography**:
```css
/* Trip Card Title */
.trip-title {
  @apply text-lg font-semibold text-gray-900;
}

/* Trip Metadata */
.trip-meta {
  @apply text-sm text-gray-600;
}

/* Price Display */
.trip-price {
  @apply text-2xl font-bold text-gray-900;
}
```

### Responsive Behavior
**Breakpoints**:
- **Mobile (< 768px)**: Single column, filters in modal/drawer
- **Tablet (768px - 1023px)**: 2-column grid
- **Desktop (1024px+)**: Sidebar + 3-column grid

```tsx
// Responsive Grid
<div className="
  grid gap-4 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3
">
  {/* Trip Cards */}
</div>
```

### Interaction Patterns

**Trip Card Hover**:
```tsx
const cardStyles = `
  bg-white border border-gray-200 rounded-xl p-4
  hover:shadow-lg hover:border-turquoise
  transition-all duration-200
  cursor-pointer
`;
```

**Registration Modal**:
```tsx
// Triggered on "Book Now" click
<Modal>
  <h2>Sign up to book this trip</h2>
  <p>Registration takes 30 seconds</p>
  <button className="bg-gold">Sign Up with Phone</button>
  <button className="bg-white border">Continue Browsing</button>
</Modal>
```

## Technical Architecture

### Component Structure
```
src/app/trips/
├── page.tsx                           # Main trips listing page (SSR)
├── loading.tsx                        # Loading skeleton
├── error.tsx                          # Error boundary
├── [tripId]/
│   ├── page.tsx                       # Trip details page
│   └── loading.tsx
└── components/
    ├── TripCard.tsx                   # Individual trip card
    ├── TripListingGrid.tsx            # Grid wrapper
    ├── FilterSidebar.tsx              # Filters UI
    ├── SearchBar.tsx                  # Search input
    ├── RegistrationPromptModal.tsx    # Auth prompt
    └── hooks/
        ├── usePublicTrips.ts          # Data fetching
        ├── useTripFilters.ts          # Filter state
        └── useRegistrationPrompt.ts   # Modal control
```

### State Management Architecture

**Server State (React Query / SWR)**:
```typescript
interface TripsQueryParams {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  tripType?: 'Private' | 'Shared';
  minPrice?: number;
  maxPrice?: number;
  minSeats?: number;
  sortBy?: 'price' | 'date' | 'popularity';
  page?: number;
  limit?: number;
}

interface TripsResponse {
  trips: PublicTrip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Client State (React useState)**:
```typescript
interface TripsPageState {
  filters: TripsQueryParams;
  selectedTrip: PublicTrip | null;
  showRegistrationModal: boolean;
  searchQuery: string;
}
```

### API Integration Schema

**Endpoint**: `GET /api/trips`

**Query Parameters**:
```typescript
interface GetTripsQuery {
  origin_city?: string;
  destination_city?: string;
  date_from?: string;  // ISO 8601
  date_to?: string;
  is_private?: boolean;
  min_price?: number;
  max_price?: number;
  min_seats?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'date_asc' | 'popularity';
  page?: number;
  limit?: number;  // default: 20
}
```

**Response**:
```json
{
  "trips": [
    {
      "id": "trip_123",
      "title": "Almaty to Bishkek Express",
      "originName": "Almaty International Airport",
      "destName": "Bishkek City Center",
      "departureTime": "2025-11-08T10:00:00Z",
      "vehicleType": "Van",
      "totalSeats": 6,
      "availableSeats": 4,
      "basePrice": 300,
      "pricePerSeat": 50,
      "currency": "USD",
      "driverName": "Ali",
      "driverRating": 4.8,
      "status": "published"
    }
  ],
  "pagination": {
    "total": 85,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Database Query (Prisma)**:
```typescript
async function getPublicTrips(params: GetTripsQuery) {
  const where: Prisma.TripWhereInput = {
    status: 'published',
    departureTime: { gte: new Date() }, // Future trips only
    ...(params.origin_city && { 
      originName: { contains: params.origin_city, mode: 'insensitive' } 
    }),
    ...(params.destination_city && { 
      destName: { contains: params.destination_city, mode: 'insensitive' } 
    }),
    ...(params.is_private !== undefined && {
      // Private trips have no per-seat pricing
      pricePerSeat: params.is_private ? null : { not: null }
    }),
  };

  const trips = await prisma.trip.findMany({
    where,
    select: {
      id: true,
      title: true,
      originName: true,
      destName: true,
      departureTime: true,
      vehicleType: true,
      totalSeats: true,
      availableSeats: true,
      basePrice: true,
      pricePerSeat: true,
      currency: true,
      driver: {
        select: {
          user: { select: { name: true } },
          rating: true,
        },
      },
      status: true,
    },
    orderBy: getSortOrder(params.sort_by),
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  });

  // Transform to PublicTrip format
  return trips.map(trip => ({
    ...trip,
    driverName: trip.driver.user.name.split(' ')[0], // First name only
    driverRating: trip.driver.rating,
  }));
}
```

## Implementation Requirements

### Core Components

1. **TripCard.tsx** - Individual trip display
   ```tsx
   interface TripCardProps {
     trip: PublicTrip;
     onBookClick: (tripId: string) => void;
   }
   ```

2. **TripListingGrid.tsx** - Responsive grid wrapper
   ```tsx
   interface TripListingGridProps {
     trips: PublicTrip[];
     isLoading: boolean;
     error: Error | null;
   }
   ```

3. **FilterSidebar.tsx** - Advanced filtering
   ```tsx
   interface FilterSidebarProps {
     filters: TripsQueryParams;
     onFilterChange: (filters: Partial<TripsQueryParams>) => void;
   }
   ```

4. **RegistrationPromptModal.tsx** - Auth gate
   ```tsx
   interface RegistrationPromptModalProps {
     isOpen: boolean;
     onClose: () => void;
     redirectUrl: string; // After auth completion
   }
   ```

### Custom Hooks

1. **usePublicTrips.ts** - Data fetching
   ```typescript
   function usePublicTrips(params: TripsQueryParams) {
     return useQuery({
       queryKey: ['public-trips', params],
       queryFn: () => fetchPublicTrips(params),
       staleTime: 5 * 60 * 1000, // 5 minutes
       refetchOnWindowFocus: false,
     });
   }
   ```

2. **useTripFilters.ts** - Filter state management
   ```typescript
   function useTripFilters() {
     const [searchParams, setSearchParams] = useSearchParams();
     
     const filters = useMemo(() => ({
       origin: searchParams.get('origin') || undefined,
       destination: searchParams.get('destination') || undefined,
       // ... parse all filter params
     }), [searchParams]);

     const updateFilters = useCallback((newFilters) => {
       const params = new URLSearchParams(searchParams);
       Object.entries(newFilters).forEach(([key, value]) => {
         if (value) params.set(key, String(value));
         else params.delete(key);
       });
       setSearchParams(params);
     }, [searchParams, setSearchParams]);

     return { filters, updateFilters };
   }
   ```

3. **useRegistrationPrompt.ts** - Modal control
   ```typescript
   function useRegistrationPrompt() {
     const [isOpen, setIsOpen] = useState(false);
     const [redirectUrl, setRedirectUrl] = useState<string>('/trips');

     const promptRegistration = (tripId: string) => {
       setRedirectUrl(`/trips/${tripId}/book`);
       setIsOpen(true);
     };

     return { isOpen, redirectUrl, promptRegistration, close: () => setIsOpen(false) };
   }
   ```

### Utility Functions

1. **api-handlers.ts**
   ```typescript
   export async function fetchPublicTrips(params: TripsQueryParams): Promise<TripsResponse> {
     const queryString = new URLSearchParams(params as any).toString();
     const response = await fetch(`/api/trips?${queryString}`);
     if (!response.ok) throw new Error('Failed to fetch trips');
     return response.json();
   }
   ```

2. **formatters.ts**
   ```typescript
   export function formatTripDate(date: Date): string {
     return format(date, 'MMM d, yyyy, h:mm a');
   }

   export function formatPrice(amount: number, currency: string): string {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency,
     }).format(amount);
   }

   export function formatSeatAvailability(available: number, total: number): string {
     const percentFilled = ((total - available) / total) * 100;
     if (percentFilled >= 80) return '🔥 Filling up fast';
     if (percentFilled >= 50) return `${available} of ${total} seats left`;
     return `${available} seats available`;
   }
   ```

## Acceptance Criteria

### Functional Requirements

✅ **Public Trip Listing**
- [ ] Landing page has "Browse All Trips" CTA button
- [ ] `/trips` page loads without authentication
- [ ] Trip cards display all required info (origin, destination, date, vehicle, seats, price, driver)
- [ ] No sensitive data exposed (phone numbers, passenger names, booking IDs)

✅ **Trip Details View**
- [ ] Clicking trip card navigates to `/trips/[tripId]`
- [ ] Details page shows complete itinerary, vehicle specs, driver profile
- [ ] No login required to view details
- [ ] "Book Now" button triggers registration modal

✅ **Registration Prompt**
- [ ] Modal appears only on booking attempt
- [ ] Modal has "Sign Up" and "Continue Browsing" options
- [ ] After signup, user redirected back to booking page
- [ ] User can close modal and continue browsing

✅ **Search and Filter**
- [ ] Search bar filters by origin/destination
- [ ] Date range picker filters by departure date
- [ ] Trip type toggle (Private/Shared)
- [ ] Price range slider
- [ ] Sort by: Price, Date, Popularity
- [ ] Filters update URL params for shareable links

✅ **Performance**
- [ ] Initial page load < 2 seconds
- [ ] Trip list loads 20 items per page
- [ ] Pagination with "Load More" or numbered pages
- [ ] Images lazy-loaded below the fold

### Non-Functional Requirements

✅ **Performance**
- [ ] Lighthouse Performance Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size increase < 30KB

✅ **Accessibility**
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader announcements for dynamic content
- [ ] Focus indicators on all buttons/links

✅ **SEO**
- [ ] Server-side rendered trip listings
- [ ] Meta tags: title, description, Open Graph
- [ ] Structured data: Schema.org Trip/Event markup
- [ ] Canonical URLs for trip pages
- [ ] Sitemap includes all public trip pages

✅ **Security**
- [ ] No sensitive data in API responses
- [ ] Rate limiting on `/api/trips` endpoint
- [ ] Input sanitization for search queries
- [ ] CSP headers prevent XSS attacks

## Modified Files

```
src/
├── app/
│   ├── trips/
│   │   ├── page.tsx ⬜                    # Main listing page (SSR)
│   │   ├── loading.tsx ⬜                 # Skeleton loader
│   │   ├── error.tsx ⬜                   # Error boundary
│   │   ├── [tripId]/
│   │   │   ├── page.tsx ⬜                # Trip details page
│   │   │   └── loading.tsx ⬜
│   │   └── components/
│   │       ├── TripCard.tsx ⬜
│   │       ├── TripListingGrid.tsx ⬜
│   │       ├── FilterSidebar.tsx ⬜
│   │       ├── SearchBar.tsx ⬜
│   │       ├── RegistrationPromptModal.tsx ⬜
│   │       └── hooks/
│   │           ├── usePublicTrips.ts ⬜
│   │           ├── useTripFilters.ts ⬜
│   │           └── useRegistrationPrompt.ts ⬜
│   └── api/
│       └── trips/
│           └── route.ts ⬜                # GET /api/trips endpoint
├── lib/
│   ├── api/
│   │   └── trips-api.ts ⬜                # API client
│   └── utils/
│       ├── formatters.ts ⬜               # Date/price formatters
│       └── seo.ts ⬜                      # SEO utilities
└── types/
    └── trip.ts ⬜                         # PublicTrip interface
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- [07-register-as-passenger.md](./07-register-as-passenger.md) - OTP authentication for registration modal (B.1)
- [01-view-trip-urgency-status.md](./01-view-trip-urgency-status.md) - Urgency badges on trip cards
- [02-view-trip-itinerary.md](./02-view-trip-itinerary.md) - Itinerary viewing in trip details
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Dynamic pricing display

**Enables**:
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Payment flow after user browses trips
- [06-view-driver-profile.md](./06-view-driver-profile.md) - Driver profiles linked from trip cards

**Related Epics**:
- **Epic A - Discovery**: This is the primary anonymous browsing feature
- **Epic B - Booking**: Provides entry point to booking flow

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: Epic A

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#13---browse-trips-without-registration)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup ⬜
- [ ] Create `/trips` route structure
- [ ] Set up API endpoint `GET /api/trips`
- [ ] Define TypeScript interfaces (`PublicTrip`)
- [ ] Configure Prisma query for public trips

### Phase 2: Core UI Implementation ⬜
- [ ] Build `TripCard` component
- [ ] Build `TripListingGrid` component
- [ ] Implement `FilterSidebar` component
- [ ] Create `SearchBar` component
- [ ] Add loading states and error boundaries

### Phase 3: Data Fetching & Filtering ⬜
- [ ] Implement `usePublicTrips` hook with React Query
- [ ] Implement `useTripFilters` hook with URL params
- [ ] Add pagination logic
- [ ] Add sorting and filtering to API endpoint

### Phase 4: Registration Gate ⬜
- [ ] Build `RegistrationPromptModal` component
- [ ] Implement `useRegistrationPrompt` hook
- [ ] Add modal trigger on "Book Now" clicks
- [ ] Store redirect URL for post-auth navigation

### Phase 5: SEO & Performance ⬜
- [ ] Add meta tags and Open Graph images
- [ ] Implement Schema.org structured data
- [ ] Lazy load images
- [ ] Enable ISR (revalidate every 5 minutes)

### Phase 6: Testing & Polish ⬜
- [ ] Unit tests for components
- [ ] Integration tests for filtering
- [ ] E2E tests for browsing flow
- [ ] Accessibility audit
- [ ] Performance optimization

## Dependencies

### Internal Dependencies
- ✅ Trip database schema (already exists from Gate 1)
- ✅ Driver profiles (for displaying driver name/rating)
- ⏳ OTP authentication flow (Story B1 - for registration modal)

### External Dependencies
- **PostHog**: Analytics tracking
- **Google Fonts**: Typography
- **Vercel**: Hosting and ISR

## Risk Assessment

### Technical Risks

**Risk 1: Large Trip Dataset Performance**
- **Impact**: High (if 1000s of trips)
- **Mitigation**: Implement pagination, caching, database indexing
- **Contingency**: Add virtualized scrolling for large lists

**Risk 2: Stale Data in Cache**
- **Impact**: Medium (users see outdated availability)
- **Mitigation**: ISR with 5-minute revalidation, show "as of [time]" timestamp
- **Contingency**: Add manual refresh button

**Risk 3: SEO Indexing Issues**
- **Impact**: Medium (affects organic traffic)
- **Mitigation**: Ensure SSR works correctly, submit sitemap
- **Contingency**: Add static sitemap generation

### Business Risks

**Risk 1: Low Browse-to-Signup Conversion**
- **Impact**: High (affects user acquisition)
- **Mitigation**: A/B test modal messaging, optimize trip cards
- **Contingency**: Add guest checkout option

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('TripCard Component', () => {
  it('should display trip details correctly', () => {
    const trip: PublicTrip = { /* mock data */ };
    render(<TripCard trip={trip} onBookClick={jest.fn()} />);
    
    expect(screen.getByText('Almaty → Bishkek')).toBeInTheDocument();
    expect(screen.getByText('$45/person')).toBeInTheDocument();
  });

  it('should trigger registration modal on book click', () => {
    const onBookClick = jest.fn();
    render(<TripCard trip={mockTrip} onBookClick={onBookClick} />);
    
    fireEvent.click(screen.getByRole('button', { name: /book now/i }));
    expect(onBookClick).toHaveBeenCalledWith(mockTrip.id);
  });
});
```

### Integration Tests (React Testing Library)
```typescript
describe('Trips Listing Page', () => {
  it('should load and display trips', async () => {
    server.use(
      rest.get('/api/trips', (req, res, ctx) => {
        return res(ctx.json({ trips: mockTrips, pagination: {...} }));
      })
    );

    render(<TripsPage />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('trip-card')).toHaveLength(20);
    });
  });

  it('should filter trips by origin', async () => {
    render(<TripsPage />);
    
    const searchInput = screen.getByPlaceholderText('Where are you going?');
    fireEvent.change(searchInput, { target: { value: 'Almaty' } });
    
    await waitFor(() => {
      const trips = screen.getAllByTestId('trip-card');
      trips.forEach(trip => {
        expect(trip).toHaveTextContent(/Almaty/i);
      });
    });
  });
});
```

### E2E Tests (Playwright)
```typescript
test.describe('Public Trip Browsing Flow', () => {
  test('should allow browsing trips without signup', async ({ page }) => {
    await page.goto('/trips');
    
    // Should see trips without auth
    await expect(page.getByTestId('trip-card')).toHaveCount(20);
    
    // Should be able to view trip details
    await page.getByText('Almaty → Bishkek').first().click();
    await expect(page).toHaveURL(/\/trips\/trip_/);
    await expect(page.getByText('Trip Details')).toBeVisible();
    
    // Should trigger auth on book attempt
    await page.getByRole('button', { name: /book now/i }).click();
    await expect(page.getByText('Sign up to book this trip')).toBeVisible();
    
    // Should allow closing modal and continuing
    await page.getByRole('button', { name: /continue browsing/i }).click();
    await expect(page.getByText('Sign up to book')).not.toBeVisible();
  });
});
```

## Performance Considerations

### Bundle Optimization
- **Code Splitting**: Dynamic imports for FilterSidebar (not needed on initial load)
- **Tree Shaking**: Import only used Lucide icons
- **Image Optimization**: Use Next.js `<Image>` with blur placeholders

### Runtime Performance
- **React Query Caching**: Cache trip data for 5 minutes
- **Virtualization**: If >100 trips per page, use react-window
- **Debounced Search**: Debounce search input by 300ms

### Caching Strategy
- **ISR**: Revalidate `/trips` page every 5 minutes
- **CDN**: Cache static assets for 1 year
- **API Cache**: Cache `/api/trips` response in Redis for 2 minutes

## Deployment Plan

### Development Phase
1. Feature flag: `ENABLE_PUBLIC_BROWSING` (default: true in production)
2. Test in development environment with seed data
3. Verify analytics events fire correctly

### Staging Phase
1. Deploy to staging with production database replica
2. User acceptance testing with 100+ trip records
3. Performance testing with Lighthouse

### Production Phase
1. Deploy to Vercel production environment
2. Monitor PostHog for browse behavior
3. Monitor Vercel analytics for performance metrics
4. Gradual rollout: 10% → 50% → 100% over 3 days

## Monitoring & Analytics

### Performance Metrics (Vercel Analytics)
- Page load time: Target <2s (p95)
- API response time: Target <500ms (p95)
- Error rate: Target <0.5%

### Business Metrics (PostHog)
- Event: `public_trip_list_viewed` (count unique visitors)
- Event: `trip_details_viewed` (track which trips get clicks)
- Event: `signup_prompt_shown` (count booking attempts)
- Event: `signup_prompt_dismissed` (count modal closures)

**Funnel Analysis**:
```
Land on /trips (100%)
  ↓
View trip details (target: >40%)
  ↓
Click "Book Now" (target: >25%)
  ↓
Complete signup (target: >60%)
```

### Technical Metrics
- **Database Query Time**: Monitor Prisma query duration
- **Cache Hit Rate**: Track Redis cache effectiveness
- **API Rate Limit Breaches**: Alert on >10 breaches/day

## Documentation Requirements

### Technical Documentation
- **API Docs**: Add `/api/trips` endpoint to API reference
- **Component Docs**: Storybook stories for TripCard, FilterSidebar
- **Troubleshooting**: Common issues (e.g., "Trips not loading")

### User Documentation
- **FAQ**: "Do I need to sign up to browse trips?"
- **Help Article**: "How to search for trips"

## Post-Launch Review

### Success Criteria (Week 1)
- [ ] >1000 unique visitors to `/trips` page
- [ ] Bounce rate <40%
- [ ] Browse → Signup conversion >15%
- [ ] No critical bugs reported
- [ ] Page load time <2s (p95)

### Success Criteria (Month 1)
- [ ] >10,000 unique visitors
- [ ] >500 trip detail views
- [ ] SEO: 10+ keywords ranking in top 50
- [ ] Organic traffic >30% of total

### Retrospective Items
- Lessons learned about public browsing UX
- Filter usage patterns (which filters are most used?)
- Modal messaging effectiveness
- Performance bottlenecks identified

---

**Implementation Owner**: TBD  
**Estimated Effort**: 3-5 days (1 developer)  
**Priority**: High (Gateway to user acquisition)  
**Gate Assignment**: Gate 1 (Already partially implemented), Gate 2 (Full polish)
