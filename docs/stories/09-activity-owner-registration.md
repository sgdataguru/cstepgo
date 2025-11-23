# 09 Activity Owner Registration - User Story

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, File Storage
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), AWS S3/Cloudinary (Images)

---

## User Story

**As an** adventure activity owner (horse riding, bike rental, paragliding, boating, hot air balloon, snowboarding, ski equipment rental, yurt stay, zip line, dog sledding, snow motorcycle, etc.)

**I want** to register my business and upload my activity details, prices, photos, and availability

**So that** travelers using StepperGO can discover and book my activities while traveling across Central Asia

---

## User Personas

### Primary Persona: Adventure Activity Owner
- **Name**: Askar (Horse Riding Guide, Almaty Region)
- **Age**: 35-45
- **Background**: Local entrepreneur offering outdoor activities
- **Tech Comfort**: Moderate (uses smartphone, basic computer skills)
- **Goals**: 
  - Increase bookings from tourists
  - Manage availability and pricing
  - Build reputation through reviews
  - Generate steady income
- **Pain Points**:
  - Limited online presence
  - Difficulty reaching international tourists
  - Manual booking management
  - Language barriers

### Secondary Personas
- **Outdoor Equipment Rental Shops** (ski, snowboard, bikes)
- **Accommodation Providers** (yurt stays, eco-lodges)
- **Adventure Tour Operators** (paragliding, zip line, dog sledding)
- **Hospitality Services** (traditional experiences, cultural activities)

---

## Acceptance Criteria

### Must-Have Features

#### Registration Process
- [ ] **Easy Sign-Up Flow**
  - Simple form with essential information
  - Email verification required
  - Phone number verification (SMS)
  - Multiple language support (English, Russian, Kazakh, Kyrgyz)

- [ ] **Business Information**
  - Activity type selection from predefined categories
  - Business name and description
  - Location with map integration
  - Operating hours and seasons
  - Contact details

- [ ] **Activity Details**
  - Multiple activity listings per business
  - Detailed descriptions
  - Duration and difficulty levels
  - Group size limits (min/max participants)
  - Age restrictions and requirements

- [ ] **Pricing Management**
  - Base pricing per activity
  - Seasonal pricing variations
  - Group discounts
  - Equipment rental fees (if applicable)
  - Currency selection (KZT, USD, EUR)

- [ ] **Photo Gallery**
  - Upload multiple high-quality photos
  - Photo categories (activity, location, equipment, accommodation)
  - Image optimization and compression
  - Cover photo selection

#### Business Profile Management
- [ ] **Dashboard Overview**
  - Booking requests and status
  - Revenue analytics
  - Customer reviews
  - Activity performance metrics

- [ ] **Availability Calendar**
  - Set available dates and times
  - Block unavailable periods
  - Seasonal availability patterns
  - Real-time availability updates

- [ ] **Booking Management**
  - Accept/decline booking requests
  - Communicate with customers
  - Manage cancellations and refunds
  - Generate booking confirmations

### Should-Have Features

#### Enhanced Business Tools
- [ ] **Verification System**
  - Business license upload
  - Insurance documentation
  - Safety certifications
  - Quality assurance badges

- [ ] **Advanced Analytics**
  - Visitor views and conversion rates
  - Popular activity trends
  - Revenue forecasting
  - Customer demographics

- [ ] **Marketing Tools**
  - Promotional pricing campaigns
  - Featured listing options
  - Social media integration
  - Customer review management

#### Customer Experience
- [ ] **Multi-Language Descriptions**
  - Activity descriptions in multiple languages
  - Auto-translation with manual review
  - Language-specific pricing
  - Cultural context explanations

- [ ] **360° Virtual Tours**
  - Immersive location previews
  - Equipment showcase
  - Activity demonstrations
  - Customer testimonial videos

### Could-Have Features

#### Advanced Integrations
- [ ] **Third-Party Bookings**
  - Integration with booking.com
  - Airbnb Experiences sync
  - GetYourGuide partnership
  - Local tourism board connections

- [ ] **Payment Gateway**
  - Multiple payment methods
  - Split payments (deposit + balance)
  - Automatic payouts to providers
  - Currency conversion

- [ ] **Insurance Integration**
  - Activity insurance options
  - Liability coverage information
  - Emergency contact systems
  - Safety incident reporting

---

## User Journey Flows

### 1. Registration Flow
```
Start Registration
    ↓
Choose Activity Category
    ↓
Basic Business Information
    ↓
Contact & Location Details
    ↓
Upload Business Documents
    ↓
Email/Phone Verification
    ↓
Profile Review & Approval
    ↓
Welcome to StepperGO Dashboard
```

### 2. Activity Creation Flow
```
Dashboard → Add New Activity
    ↓
Activity Type & Name
    ↓
Detailed Description
    ↓
Upload Photos
    ↓
Set Pricing & Packages
    ↓
Define Availability
    ↓
Safety & Requirements
    ↓
Preview & Publish
    ↓
Activity Live on Platform
```

### 3. Booking Management Flow
```
New Booking Request
    ↓
Review Customer Details
    ↓
Check Availability
    ↓
Accept/Decline/Modify
    ↓
Send Confirmation
    ↓
Pre-Activity Communication
    ↓
Activity Completion
    ↓
Request Review
    ↓
Payment Processing
```

---

## Activity Categories & Examples

### Adventure Sports
- **Paragliding** (Issyk-Kul, Almaty mountains)
- **Zip Line** (Charyn Canyon, Ala-Archa)
- **Rock Climbing** (Chunkurchak, Karakol)
- **Bungee Jumping** (mountain locations)

### Winter Activities
- **Snowboarding/Skiing** (Shymbulak, Karakol Ski Base)
- **Snow Motorcycle Tours** (mountain trails)
- **Dog Sledding** (traditional experiences)
- **Ice Skating** (natural rinks)

### Equipment Rentals
- **Bike Rentals** (mountain bikes, e-bikes)
- **Ski Equipment** (skis, snowboards, boots)
- **Camping Gear** (tents, sleeping bags, hiking equipment)
- **Water Sports** (kayaks, rafts, fishing gear)

### Cultural & Traditional
- **Horse Riding** (traditional Central Asian style)
- **Yurt Stays** (authentic nomadic experience)
- **Eagle Hunting** (Kazakh traditions)
- **Traditional Craft Workshops** (felt making, jewelry)

### Water Activities
- **Boating** (Issyk-Kul, Balkhash, mountain lakes)
- **Fishing Tours** (guided fishing experiences)
- **Swimming** (natural hot springs, lake access)
- **Water Sports** (jet skiing, banana boats)

### Air Activities
- **Hot Air Balloon** (scenic flights over landscapes)
- **Helicopter Tours** (mountain and canyon views)
- **Drone Photography** (guided aerial photography)

---

## Technical Requirements

### Frontend Components

#### Registration Pages
- `ActivityOwnerRegistration.tsx` - Main registration wizard
- `BusinessInfoForm.tsx` - Business details collection
- `ActivityCreationForm.tsx` - Individual activity setup
- `PhotoUploader.tsx` - Multi-image upload with preview
- `PricingManager.tsx` - Pricing and package configuration
- `AvailabilityCalendar.tsx` - Availability management
- `LocationPicker.tsx` - Interactive map for location selection

#### Dashboard Components
- `ProviderDashboard.tsx` - Main dashboard overview
- `BookingRequestsList.tsx` - Manage incoming bookings
- `ActivityList.tsx` - Manage existing activities
- `AnalyticsSummary.tsx` - Performance metrics
- `ReviewsManagement.tsx` - Customer feedback
- `EarningsOverview.tsx` - Financial summary

### Backend Endpoints

#### Authentication & Registration
```
POST /api/activity-owners/register
POST /api/activity-owners/verify-email
POST /api/activity-owners/verify-phone
POST /api/activity-owners/login
POST /api/activity-owners/reset-password
```

#### Business Management
```
GET /api/activity-owners/profile
PUT /api/activity-owners/profile
POST /api/activity-owners/activities
PUT /api/activity-owners/activities/:id
DELETE /api/activity-owners/activities/:id
```

#### Booking Management
```
GET /api/activity-owners/bookings
PUT /api/activity-owners/bookings/:id/status
POST /api/activity-owners/bookings/:id/message
```

#### Media & Assets
```
POST /api/activity-owners/upload-photos
DELETE /api/activity-owners/photos/:id
POST /api/activity-owners/upload-documents
```

### Database Schema

#### Activity Owners Table
```sql
CREATE TABLE activity_owners (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  business_license VARCHAR(255),
  contact_person VARCHAR(255),
  languages JSONB, -- ['en', 'ru', 'kk', 'ky']
  location JSONB, -- {lat, lng, address, city, region}
  verification_status VARCHAR(20) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Activities Table
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES activity_owners(id),
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  duration_minutes INTEGER,
  difficulty_level VARCHAR(20), -- easy, moderate, hard, expert
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  base_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'KZT',
  equipment_included JSONB,
  requirements TEXT,
  safety_notes TEXT,
  cancellation_policy TEXT,
  location JSONB,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Activity Photos Table
```sql
CREATE TABLE activity_photos (
  id UUID PRIMARY KEY,
  activity_id UUID REFERENCES activities(id),
  url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INTEGER,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Pricing Packages Table
```sql
CREATE TABLE pricing_packages (
  id UUID PRIMARY KEY,
  activity_id UUID REFERENCES activities(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER,
  included_items JSONB,
  max_participants INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Availability Table
```sql
CREATE TABLE activity_availability (
  id UUID PRIMARY KEY,
  activity_id UUID REFERENCES activities(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(activity_id, date, start_time)
);
```

---

## Design Specifications

### Visual Design System

#### Color Palette for Activity Owners
```css
/* Activity Owner Brand Colors */
--provider-primary: #059669;     /* Emerald 600 - trustworthy, nature */
--provider-secondary: #0891b2;   /* Cyan 600 - adventure, water */
--provider-accent: #dc2626;      /* Red 600 - excitement, adventure */
--provider-warning: #d97706;     /* Amber 600 - attention, caution */

/* Status Colors */
--status-pending: #f59e0b;       /* Amber - pending approval */
--status-approved: #10b981;      /* Emerald - approved/active */
--status-rejected: #ef4444;      /* Red - rejected/inactive */
--status-featured: #8b5cf6;      /* Purple - featured listings */

/* Background Colors */
--provider-bg-light: #f0fdf4;    /* Light emerald background */
--provider-bg-card: #ffffff;     /* White cards */
--provider-bg-dark: #064e3b;     /* Dark emerald for dark mode */
```

#### Typography Scale
```css
/* Provider Dashboard Typography */
--heading-xl: 2.25rem;           /* 36px - Main dashboard title */
--heading-lg: 1.875rem;          /* 30px - Section headers */
--heading-md: 1.5rem;            /* 24px - Card titles */
--heading-sm: 1.25rem;           /* 20px - Subsection headers */

/* Body Text */
--body-lg: 1.125rem;             /* 18px - Important descriptions */
--body-base: 1rem;               /* 16px - Standard text */
--body-sm: 0.875rem;             /* 14px - Meta information */
--body-xs: 0.75rem;              /* 12px - Small labels */
```

### Page Layouts

#### Registration Wizard Layout
```
┌─────────────────────────────────────────────────────┐
│ [StepperGO Logo]              [Language Selector]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ●━━━━━○━━━━━○━━━━━○━━━━━○                          │
│   Step 1 → 2 → 3 → 4 → 5                          │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │                                             │   │
│   │         [Registration Form Content]         │   │
│   │                                             │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  │   │
│   │  │    [Cancel]     │  │   [Continue]    │  │   │
│   │  └─────────────────┘  └─────────────────┘  │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Provider Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│ [Logo] [Dashboard] [Activities] [Bookings] [Profile]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Total   │ │ Active  │ │ Pending │ │ Revenue │    │
│ │Bookings │ │Activities│ │Requests│ │This Month│    │
│ │   24    │ │    8    │ │    3    │ │ ₸45,000 │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │   Recent Bookings   │ │    Activity Performance │ │
│ │                     │ │                         │ │
│ │ • Horse Riding Tour │ │    📊 [Chart Widget]    │ │
│ │ • Yurt Stay         │ │                         │ │
│ │ • Paragliding       │ │                         │ │
│ └─────────────────────┘ └─────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Activity Creation Form Layout
```
┌─────────────────────────────────────────────────────┐
│ Create New Activity                        [Save] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │   Basic Info        │ │   Photo Gallery         │ │
│ │                     │ │                         │ │
│ │ Activity Name: ____ │ │ ┌───┐ ┌───┐ ┌───┐ [+]  │ │
│ │ Category: [Select]  │ │ │img│ │img│ │img│      │ │
│ │ Description: ______ │ │ └───┘ └───┘ └───┘      │ │
│ │                     │ │                         │ │
│ └─────────────────────┘ └─────────────────────────┘ │
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │   Pricing & Time    │ │   Requirements          │ │
│ │                     │ │                         │ │
│ │ Base Price: _______ │ │ Min Age: ______________ │ │
│ │ Duration: _________ │ │ Max Participants: _____ │ │
│ │ Difficulty: [Easy]  │ │ Equipment Needed: _____ │ │
│ │                     │ │                         │ │
│ └─────────────────────┘ └─────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Status**: ⬜ Not Started

#### Setup & Infrastructure
- [ ] Database schema design and migration
- [ ] Basic authentication system
- [ ] File upload infrastructure (Cloudinary/S3)
- [ ] Email/SMS verification system

#### Core Registration Flow
- [ ] Registration wizard (5 steps)
- [ ] Business information collection
- [ ] Email/phone verification
- [ ] Basic profile management

**Deliverables**:
- Activity owners can register accounts
- Basic profile creation and editing
- Document upload functionality
- Admin approval workflow

### Phase 2: Activity Management (Weeks 3-4)
**Status**: ⬜ Not Started

#### Activity Creation & Management
- [ ] Activity creation form
- [ ] Photo gallery management
- [ ] Pricing and package setup
- [ ] Availability calendar

#### Provider Dashboard
- [ ] Dashboard overview
- [ ] Activity list and management
- [ ] Basic analytics
- [ ] Profile settings

**Deliverables**:
- Complete activity creation workflow
- Provider dashboard with basic features
- Activity listing and editing
- Photo upload and management

### Phase 3: Booking Integration (Weeks 5-6)
**Status**: ⬜ Not Started

#### Booking System Integration
- [ ] Booking request handling
- [ ] Communication system
- [ ] Calendar integration
- [ ] Notification system

#### Customer-Facing Features
- [ ] Activity discovery in main app
- [ ] Detailed activity pages
- [ ] Booking flow integration
- [ ] Review system

**Deliverables**:
- End-to-end booking workflow
- Activity listings visible to travelers
- Review and rating system
- Communication platform

### Phase 4: Advanced Features (Weeks 7-8)
**Status**: ⬜ Not Started

#### Enhanced Business Tools
- [ ] Advanced analytics and reporting
- [ ] Marketing and promotion tools
- [ ] Multi-language support
- [ ] Payment integration

#### Quality & Performance
- [ ] Performance optimization
- [ ] Security audit
- [ ] Comprehensive testing
- [ ] Documentation completion

**Deliverables**:
- Advanced dashboard features
- Marketing tools for providers
- Complete documentation
- Production-ready system

---

## Business Impact

### For Activity Owners
- **Increased Revenue**: Access to international travelers
- **Reduced Marketing Costs**: Built-in discovery platform
- **Streamlined Operations**: Automated booking management
- **Professional Presence**: Quality business profiles
- **Analytics Insights**: Data-driven business decisions

### For StepperGO Platform
- **Expanded Offering**: Complete travel ecosystem
- **Revenue Diversification**: Commission from activity bookings
- **User Retention**: More reasons to use the platform
- **Market Differentiation**: Unique value proposition
- **Local Partnerships**: Strong community connections

### For Travelers
- **Authentic Experiences**: Direct connection with local providers
- **Trusted Activities**: Verified and reviewed experiences
- **Convenient Booking**: Everything in one platform
- **Competitive Pricing**: Direct pricing without middlemen
- **Cultural Immersion**: Genuine local experiences

---

## Success Metrics

### Short-term (3 months)
- [ ] 50+ activity owners registered
- [ ] 200+ activities listed
- [ ] 100+ completed bookings
- [ ] 4.5+ average rating
- [ ] 15% of travelers book activities

### Medium-term (6 months)
- [ ] 150+ activity owners
- [ ] 500+ activities across all categories
- [ ] 1,000+ completed bookings
- [ ] ₸500,000+ GMV from activities
- [ ] 25% of travelers book activities

### Long-term (12 months)
- [ ] 300+ activity owners
- [ ] 1,000+ activities
- [ ] 5,000+ completed bookings
- [ ] ₸2,000,000+ GMV
- [ ] Regional market leadership in adventure tourism

---

## Risk Assessment & Mitigation

### Technical Risks
- **File Upload Performance**: Use CDN and image optimization
- **Database Scaling**: Implement proper indexing and caching
- **Payment Integration**: Partner with established payment providers
- **Multi-language Complexity**: Phased rollout by language

### Business Risks
- **Provider Adoption**: Incentivize early adopters with reduced commissions
- **Quality Control**: Implement verification and review systems
- **Competition**: Focus on unique Central Asian market
- **Regulatory Compliance**: Partner with local tourism authorities

### Operational Risks
- **Customer Support**: Multi-language support team
- **Dispute Resolution**: Clear policies and mediation process
- **Insurance Coverage**: Partner with travel insurance providers
- **Safety Standards**: Implement safety certification requirements

---

## Next Steps

### Immediate Actions (This Week)
1. **Stakeholder Review**: Present user story to product team
2. **Technical Planning**: Architecture review with engineering
3. **Design Mockups**: Create detailed UI designs
4. **Market Research**: Validate with potential activity owners

### Short-term (Next 2 Weeks)
1. **Database Design**: Finalize schema and relationships
2. **API Specification**: Define all endpoints and data flows
3. **UI Components**: Build core component library
4. **Legal Framework**: Terms and conditions for providers

### Medium-term (Next Month)
1. **MVP Development**: Build Phase 1 features
2. **Beta Testing**: Recruit test activity owners
3. **Integration Testing**: End-to-end workflow validation
4. **Marketing Preparation**: Provider acquisition strategy

---

*This user story provides a comprehensive foundation for developing the activity owner registration and management system that will expand StepperGO's platform into the adventure tourism market across Central Asia.*
