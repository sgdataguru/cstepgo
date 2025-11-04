# StepperGO Technical Description

## Application Overview
StepperGO is a comprehensive ride-sharing and group trip organization platform built with modern web technologies. The application focuses on enabling users to organize and join group trips with detailed itineraries, real-time trip status tracking, and dynamic pricing. It features a sophisticated countdown system for trip urgency, detailed day-by-day itinerary planning, and integrated payment processing.

Key Features:
- Real-time trip urgency tracking with visual indicators
- Comprehensive trip itinerary builder
- Location search with autocomplete
- Dynamic trip pricing
- Integrated payment processing
- WhatsApp group integration
- Driver profile management
- Passenger registration system

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Libraries**: 
  - React 18
  - TailwindCSS
  - shadcn/ui
- **State Management**: React Context + Hooks
- **Form Management**: react-hook-form
- **Data Fetching**: Next.js Server Components + API Routes

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Cache Layer**: Redis
- **Job Queue**: BullMQ
- **API Style**: RESTful with WebSocket support

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Fly.io/Render
- **CI/CD**: GitHub Actions
- **Monitoring**: TBD
- **Analytics**: TBD

## Project Folder Structure

```
STEPPERGO/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── trips/             # Trip management routes
│   │   ├── components/    # Trip-specific components
│   │   ├── create/        # Trip creation flow
│   │   ├── [id]/         # Individual trip routes
│   │   └── page.tsx      # Trip listing page
│   ├── api/              # API routes
│   ├── components/       # Shared components
│   ├── lib/             # Utility functions
│   └── styles/          # Global styles
├── components/           # Reusable UI components
│   ├── common/          # Basic UI elements
│   ├── forms/           # Form-related components
│   └── layouts/         # Layout components
├── hooks/               # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Constants and configurations
├── services/          # API services
├── styles/            # Component-specific styles
└── tests/             # Test files
    ├── unit/          
    ├── integration/   
    └── e2e/          
```

## Data Models

### Trip Model
```typescript
interface Trip {
  id: string;
  title: string;
  description: string;
  departureTime: Date;
  returnTime: Date;
  timezone: string;
  status: TripStatus;
  pricing: {
    basePrice: number;
    currency: string;
    dynamicFactors: PricingFactor[];
  };
  itinerary: {
    version: string;
    days: ItineraryDay[];
  };
  capacity: {
    total: number;
    booked: number;
  };
  organizer: {
    id: string;
    name: string;
    role: 'DRIVER' | 'ORGANIZER';
  };
  metadata: Record<string, any>;
}

interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  startTime: string;
  endTime?: string;
  location: Location;
  type: ActivityType;
  description: string;
  notes?: string;
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole[];
  profile: {
    avatar?: string;
    bio?: string;
    preferences: UserPreferences;
  };
  driverProfile?: DriverProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface DriverProfile {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  vehicle: VehicleInfo;
  documents: Document[];
  rating: number;
  completedTrips: number;
}
```

### Booking Model
```typescript
interface Booking {
  id: string;
  tripId: string;
  userId: string;
  status: BookingStatus;
  payment: {
    amount: number;
    currency: string;
    status: PaymentStatus;
    transactionId?: string;
  };
  passengers: PassengerInfo[];
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoint Specification

### Trip Management
- `POST /api/trips` - Create a new trip with itinerary
- `GET /api/trips` - List all available trips
- `GET /api/trips/{id}` - Get trip details
- `PUT /api/trips/{id}` - Update trip details
- `DELETE /api/trips/{id}` - Cancel/delete a trip
- `GET /api/trips/{id}/itinerary` - Get trip itinerary
- `PUT /api/trips/{id}/itinerary` - Update trip itinerary

### Booking & Payments
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}` - Update booking status
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/{id}/status` - Check payment status

### User Management
- `POST /api/users` - Register new user
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `POST /api/drivers/apply` - Submit driver application
- `GET /api/drivers/{id}` - Get driver profile

### Location Services
- `GET /api/locations/search` - Search locations
- `GET /api/locations/autocomplete` - Location autocomplete
- `GET /api/locations/{id}/details` - Get location details

## Frontend Component Hierarchy

```
App
├── Layout
│   ├── Navbar
│   ├── Sidebar
│   └── Footer
├── Pages
│   ├── Home
│   │   └── FeaturedTrips
│   ├── Trips
│   │   ├── TripList
│   │   │   └── TripCard
│   │   │       └── CountdownBadge
│   │   └── TripFilters
│   ├── TripDetails
│   │   ├── TripHeader
│   │   ├── ItineraryView
│   │   └── BookingSection
│   ├── CreateTrip
│   │   ├── TripForm
│   │   └── ItineraryBuilder
│   │       ├── DayTabs
│   │       ├── ActivityList
│   │       └── ActivityBlock
│   └── UserProfile
│       ├── ProfileInfo
│       ├── TripHistory
│       └── PaymentMethods
└── Shared
    ├── Button
    ├── Input
    ├── Select
    ├── Modal
    └── Toast
```

## Security Implementation

### Authentication
- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Session management with Redis

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Rate limiting
- Request validation

### API Security
- HTTPS enforced
- API key authentication
- Request signing
- IP whitelisting for admin routes

## Performance Optimization

### Frontend
- Server Components for data-heavy pages
- Dynamic imports for large components
- Image optimization with Next.js Image
- Efficient state management
- Debounced search inputs

### Backend
- Database query optimization
- Redis caching layer
- Connection pooling
- Rate limiting
- Request batching

### Infrastructure
- CDN integration
- Edge caching
- Database indexing
- Load balancing
- Auto-scaling

## Monitoring & Analytics

### System Metrics
- Response times
- Error rates
- CPU/Memory usage
- Database performance
- Cache hit rates

### Business Metrics
- User engagement
- Booking conversion
- Trip completion rate
- Payment success rate
- Driver ratings

### User Analytics
- User journey tracking
- Feature usage
- Drop-off points
- Search patterns
- Booking behavior

## Deployment Strategy

### Development Workflow
1. Feature branches
2. PR reviews
3. Automated testing
4. Staging deployment
5. Production deployment

### CI/CD Pipeline
1. Code linting
2. Type checking
3. Unit tests
4. Integration tests
5. Build process
6. Deployment

### Environment Management
- Development
- Staging
- Production
- Feature flags
- A/B testing support
