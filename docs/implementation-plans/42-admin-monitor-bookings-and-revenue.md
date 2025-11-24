# 42 - Admin Monitor Bookings and Revenue - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Redis (caching)  
**Infrastructure**: Vercel (hosting), Chart.js/Recharts (visualizations), WebSocket (real-time updates)

## User Story

**As an** admin,  
**I want** to monitor active trips, bookings, and high-level revenue metrics in a single dashboard,  
**so that** I can operate the platform effectively and respond quickly to issues.

## Pre-conditions

- User must have ADMIN role
- Stories 33-41 completed (all booking types available)
- Database populated with booking and payment data
- Analytics queries optimized with indexes
- Real-time update mechanism configured

## Business Requirements

- **BR-1**: Provide comprehensive operational visibility for platform management
  - Success Metric: Admin checks dashboard >3 times daily
  - Performance: Dashboard loads <3 seconds with all data

- **BR-2**: Enable quick identification and response to platform issues
  - Success Metric: Issue response time <15 minutes
  - Performance: Real-time updates within 10 seconds

- **BR-3**: Track business health through key revenue and booking metrics
  - Success Metric: Weekly revenue reports generated without manual effort
  - Performance: Analytics queries <2 seconds

- **BR-4**: Support data-driven decision making with trend analysis
  - Success Metric: >80% of business decisions backed by dashboard data
  - Performance: Export reports <5 seconds

## Technical Specifications

### Integration Points
- **Database**: Aggregated queries across all booking types
- **Real-time**: WebSocket for live trip updates
- **Charts**: Chart.js or Recharts for visualizations
- **Export**: CSV/Excel export functionality
- **Notifications**: Alert system for critical issues
- **Caching**: Redis for dashboard metrics

### Security Requirements
- RBAC: Only ADMIN role can access dashboard
- Audit logging: Track all admin actions
- Data anonymization: Mask PII in exports
- Rate limiting: Prevent dashboard abuse
- Session management: Auto-logout after inactivity

### API Endpoints

#### GET /api/admin/dashboard/overview
Retrieves high-level dashboard metrics.

**Response:**
```typescript
interface DashboardOverviewResponse {
  // Real-time metrics
  activeTrips: {
    count: number;
    inProgress: ActiveTrip[];
  };
  
  // Today's metrics
  today: {
    date: string;
    upcomingTrips: number;
    newBookings: number;
    completedTrips: number;
    cancelledBookings: number;
    grossRevenue: number;
    netRevenue: number;
  };
  
  // This week metrics
  thisWeek: {
    startDate: string;
    endDate: string;
    totalBookings: number;
    completedTrips: number;
    cancelledBookings: number;
    grossRevenue: number;
    netRevenue: number;
    averageBookingValue: number;
  };
  
  // This month metrics
  thisMonth: {
    startDate: string;
    endDate: string;
    totalBookings: number;
    grossRevenue: number;
    netRevenue: number;
    platformCommission: number;
  };
  
  // Comparison metrics
  comparison: {
    bookingsVsLastWeek: {
      current: number;
      previous: number;
      percentageChange: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
    };
    revenueVsLastWeek: {
      current: number;
      previous: number;
      percentageChange: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
    };
  };
  
  // System health
  systemHealth: {
    activeDrivers: number;
    activePassengers: number;
    platformStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    lastUpdated: Date;
  };
}

interface ActiveTrip {
  id: string;
  bookingNumber: string;
  type: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  
  driver: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone: string;
  };
  
  passenger: {
    id: string;
    name: string;
    phone: string;
  };
  
  origin: string;
  destination: string;
  
  status: 'IN_PROGRESS' | 'PICKING_UP' | 'DROPPING_OFF';
  startedAt: Date;
  estimatedCompletionAt: Date;
  
  amount: number;
  currency: 'KZT';
}
```

#### GET /api/admin/bookings
Retrieves paginated bookings list with filtering.

**Query Parameters:**
```typescript
interface AdminBookingsQuery {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  status?: 'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  type?: 'ALL' | 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  paymentStatus?: 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  
  // Date range
  startDate?: string;
  endDate?: string;
  
  // Search
  query?: string;  // Search by booking number, user name, driver name
  
  // Sorting
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface AdminBookingsResponse {
  bookings: AdminBooking[];
  pagination: PaginationInfo;
  summary: {
    totalBookings: number;
    totalAmount: number;
    averageAmount: number;
    statusBreakdown: {
      confirmed: number;
      pending: number;
      completed: number;
      cancelled: number;
      refunded: number;
    };
  };
}

interface AdminBooking {
  id: string;
  bookingNumber: string;
  type: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  
  // User info
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  
  // Driver info (for trips)
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  
  // Activity info (for activities)
  activity?: {
    id: string;
    title: string;
    owner: string;
  };
  
  // Trip details
  origin?: string;
  destination?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  
  // Participants
  participants: number;
  
  // Financial
  amount: number;
  platformFee: number;
  netToProvider: number;
  currency: 'KZT';
  
  // Payment
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  
  // Status
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  
  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;
  refundAmount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### GET /api/admin/bookings/:id
Retrieves detailed booking information.

**Response:**
```typescript
interface AdminBookingDetailResponse {
  booking: AdminBookingDetail;
  timeline: BookingTimeline[];
  relatedBookings: AdminBooking[];  // For shared trips
}

interface AdminBookingDetail extends AdminBooking {
  // Extended details
  
  // User profile
  userProfile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalBookings: number;
    totalSpent: number;
    joinedAt: Date;
  };
  
  // Driver profile (if applicable)
  driverProfile?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    totalTrips: number;
    joinedAt: Date;
  };
  
  // Payment details
  payment: {
    id: string;
    paymentIntentId?: string;
    amount: number;
    currency: 'KZT';
    status: string;
    method: string;
    last4?: string;
    paidAt?: Date;
    
    // Breakdown
    breakdown: {
      baseAmount: number;
      platformFee: number;
      taxes: number;
      discount: number;
      total: number;
    };
  };
  
  // Refund details (if applicable)
  refund?: {
    id: string;
    amount: number;
    status: string;
    reason: string;
    processedAt: Date;
  };
  
  // Trip tracking (if applicable)
  tracking?: {
    startedAt: Date;
    completedAt?: Date;
    distance: number;
    duration: number;
    route: RoutePoint[];
  };
  
  // Activity details (if applicable)
  activityDetails?: {
    date: Date;
    timeSlot: string;
    participants: ParticipantInfo[];
    specialRequests?: string;
  };
  
  // Metadata
  metadata: {
    ipAddress: string;
    userAgent: string;
    bookingSource: 'WEB' | 'MOBILE' | 'API';
  };
}

interface BookingTimeline {
  id: string;
  timestamp: Date;
  event: 'CREATED' | 'CONFIRMED' | 'PAYMENT_COMPLETED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  description: string;
  actor?: {
    id: string;
    name: string;
    role: 'USER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';
  };
  metadata?: Record<string, any>;
}
```

#### GET /api/admin/analytics/revenue
Retrieves revenue analytics and trends.

**Query Parameters:**
```typescript
interface RevenueAnalyticsQuery {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  type?: 'ALL' | 'PRIVATE' | 'SHARED' | 'ACTIVITY';
}
```

**Response:**
```typescript
interface RevenueAnalyticsResponse {
  summary: {
    totalGrossRevenue: number;
    totalPlatformFee: number;
    totalNetRevenue: number;
    totalRefunds: number;
    totalPayouts: number;
    currency: 'KZT';
  };
  
  byType: {
    private: RevenueBreakdown;
    shared: RevenueBreakdown;
    activity: RevenueBreakdown;
  };
  
  trends: RevenueTrend[];
  
  topPerformers: {
    drivers: TopPerformer[];
    activityOwners: TopPerformer[];
  };
}

interface RevenueBreakdown {
  grossRevenue: number;
  platformFee: number;
  netRevenue: number;
  bookings: number;
  averageValue: number;
}

interface RevenueTrend {
  period: string;  // "2025-01-01" or "2025-W01"
  grossRevenue: number;
  platformFee: number;
  netRevenue: number;
  bookings: number;
  refunds: number;
}

interface TopPerformer {
  id: string;
  name: string;
  totalRevenue: number;
  bookings: number;
  rating: number;
}
```

#### GET /api/admin/analytics/bookings
Retrieves booking analytics and trends.

**Response:**
```typescript
interface BookingAnalyticsResponse {
  summary: {
    totalBookings: number;
    completionRate: number;
    cancellationRate: number;
    averageBookingValue: number;
  };
  
  byStatus: {
    confirmed: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  
  byType: {
    private: number;
    shared: number;
    activity: number;
  };
  
  trends: BookingTrend[];
  
  peakHours: HourlyDistribution[];
  
  conversionFunnel: {
    searches: number;
    detailViews: number;
    bookingStarted: number;
    bookingCompleted: number;
    conversionRate: number;
  };
}

interface BookingTrend {
  period: string;
  bookings: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

interface HourlyDistribution {
  hour: number;  // 0-23
  bookings: number;
  percentage: number;
}
```

#### GET /api/admin/users
Retrieves user management data.

**Query Parameters:**
```typescript
interface AdminUsersQuery {
  role?: 'ALL' | 'PASSENGER' | 'DRIVER' | 'ACTIVITY_OWNER' | 'ADMIN';
  status?: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  page?: number;
  limit?: number;
  query?: string;
}
```

**Response:**
```typescript
interface AdminUsersResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
  summary: {
    totalUsers: number;
    activeUsers: number;
    newThisWeek: number;
    byRole: Record<string, number>;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  
  stats: {
    totalBookings: number;
    totalSpent: number;
    totalEarned: number;
    rating: number;
  };
  
  joinedAt: Date;
  lastActiveAt: Date;
}
```

#### POST /api/admin/export
Exports dashboard data to CSV/Excel.

**Request:**
```typescript
interface ExportRequest {
  type: 'bookings' | 'revenue' | 'users';
  format: 'csv' | 'excel';
  filters: Record<string, any>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}
```

**Response:**
```typescript
interface ExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}
```

## Design Specifications

### Visual Layout & Components

**Admin Dashboard:**
```
[Dashboard Header]
├── "Operations Dashboard" Title
├── Date Range Selector
│   ├── Quick filters: Today | This Week | This Month
│   └── Custom range picker
├── Auto-refresh toggle: ○ Auto-refresh (10s)
└── [Refresh Now] Button

[Key Metrics Row]
├── [Active Trips Card]
│   ├── Icon: 🚗
│   ├── Count: XX (large, bold)
│   ├── "Active Trips"
│   └── "View all →"
│
├── [Today's Bookings Card]
│   ├── Icon: 📅
│   ├── Count: XXX
│   ├── "Today's Bookings"
│   └── Change: +15% vs yesterday ↑
│
├── [Revenue Today Card]
│   ├── Icon: 💰
│   ├── Amount: ₸XX,XXX (large)
│   ├── "Revenue Today"
│   └── Change: +8% vs yesterday ↑
│
└── [Completion Rate Card]
    ├── Icon: ✓
    ├── Percentage: 94% (large)
    ├── "Completion Rate"
    └── This week

[Content Tabs]
├── Tab 1: Overview (active)
├── Tab 2: Active Trips
├── Tab 3: Recent Bookings
├── Tab 4: Revenue Analytics
└── Tab 5: Users

[Overview Tab]
├── [Left Column - Charts]
│   ├── [Bookings Trend Chart]
│   │   ├── "Bookings Last 30 Days"
│   │   ├── Line chart
│   │   │   ├── Line 1: Total bookings (blue)
│   │   │   ├── Line 2: Completed (green)
│   │   │   └── Line 3: Cancelled (red)
│   │   └── Chart legend
│   │
│   ├── [Revenue Trend Chart]
│   │   ├── "Revenue Last 30 Days"
│   │   ├── Area chart
│   │   │   ├── Area 1: Gross revenue (blue)
│   │   │   └── Area 2: Net revenue (green)
│   │   └── Y-axis: Amount (₸)
│   │
│   └── [Booking Distribution Chart]
│       ├── "Bookings by Type"
│       ├── Doughnut chart
│       │   ├── Private: 45% (blue)
│       │   ├── Shared: 35% (purple)
│       │   └── Activity: 20% (orange)
│       └── Legend with counts
│
└── [Right Column - Stats]
    ├── [This Week Summary]
    │   ├── Total Bookings: XXX
    │   ├── Completed: XXX
    │   ├── Cancelled: XX
    │   ├── Gross Revenue: ₸XX,XXX
    │   ├── Platform Fee: ₸X,XXX
    │   └── Net Revenue: ₸XX,XXX
    │
    ├── [Top Performing Drivers]
    │   ├── Driver list (top 5)
    │   │   ├── Avatar + Name
    │   │   ├── ⭐ Rating
    │   │   └── ₸XX,XXX earned
    │   └── [View All] Link
    │
    └── [System Health]
        ├── Status: ✓ Healthy (green)
        ├── Active Drivers: XXX
        ├── Active Passengers: X,XXX
        └── Last updated: 10s ago

[Active Trips Tab]
├── [Filter Bar]
│   ├── Status: All | In Progress | Picking Up
│   ├── Type: All | Private | Shared | Activity
│   └── Search by booking number
│
└── [Active Trips Table]
    ├── Column Headers
    │   ├── Booking # (sortable)
    │   ├── Type
    │   ├── Driver
    │   ├── Passenger
    │   ├── Route
    │   ├── Status
    │   ├── Started At
    │   └── Actions
    │
    └── Rows
        ├── #BOOK-12345
        ├── Badge: Private
        ├── Driver: Avatar + Name + ⭐4.8
        ├── Passenger: Name + Phone
        ├── Origin → Destination
        ├── Status Badge: In Progress
        ├── 15 min ago
        └── [View Details] [Track Live]

[Recent Bookings Tab]
├── [Advanced Filters]
│   ├── Status dropdown
│   ├── Type dropdown
│   ├── Payment status dropdown
│   ├── Date range picker
│   ├── Amount range slider
│   └── [Export] Button
│
├── [Summary Stats Bar]
│   ├── Showing: XXX bookings
│   ├── Total amount: ₸XX,XXX
│   ├── Avg amount: ₸X,XXX
│   └── Completion rate: XX%
│
└── [Bookings Table]
    ├── Columns
    │   ├── Booking # (link)
    │   ├── Date & Time
    │   ├── User
    │   ├── Type
    │   ├── Amount
    │   ├── Payment Status
    │   ├── Booking Status
    │   └── Actions
    │
    └── Row Actions Menu (•••)
        ├── View Details
        ├── View User Profile
        ├── View Driver Profile
        ├── Process Refund
        └── Export Details

[Revenue Analytics Tab]
├── [Time Period Selector]
│   ├── ○ Last 7 Days
│   ├── ● Last 30 Days (selected)
│   ├── ○ Last Quarter
│   └── ○ Custom Range
│
├── [Revenue Summary Cards]
│   ├── Gross Revenue: ₸XX,XXX,XXX
│   ├── Platform Fee: ₸X,XXX,XXX (15%)
│   ├── Net Revenue: ₸XX,XXX,XXX
│   └── Total Refunds: ₸XXX,XXX
│
├── [Revenue by Type Chart]
│   ├── Stacked bar chart
│   │   ├── Private trips (blue)
│   │   ├── Shared trips (purple)
│   │   └── Activities (orange)
│   └── Grouped by week/month
│
├── [Revenue Breakdown Table]
│   ├── By Type
│   │   ├── Private: ₸XX,XXX (45%)
│   │   ├── Shared: ₸XX,XXX (35%)
│   │   └── Activity: ₸XX,XXX (20%)
│   │
│   └── By Payment Method
│       ├── Card: ₸XX,XXX (80%)
│       ├── Cash: ₸X,XXX (15%)
│       └── Other: ₸XXX (5%)
│
└── [Top Revenue Generators]
    ├── Top Drivers (table)
    └── Top Activity Owners (table)

[Users Tab]
├── [User Stats Cards]
│   ├── Total Users: X,XXX
│   ├── New This Week: +XXX
│   ├── Active Drivers: XXX
│   └── Activity Owners: XX
│
├── [Filters]
│   ├── Role: All | Passenger | Driver | Activity Owner
│   ├── Status: All | Active | Suspended
│   └── Search by name/email/phone
│
└── [Users Table]
    ├── Columns
    │   ├── User (Avatar + Name)
    │   ├── Email
    │   ├── Phone
    │   ├── Role(s)
    │   ├── Total Bookings
    │   ├── Total Spent/Earned
    │   ├── Rating
    │   ├── Status
    │   ├── Joined
    │   └── Actions
    │
    └── Actions (•••)
        ├── View Profile
        ├── View Bookings
        ├── Suspend Account
        ├── Send Message
        └── Export Data
```

**Booking Detail Modal:**
```
[Modal: Booking Details]
├── Header
│   ├── Booking #BOOK-12345
│   ├── Status Badge: Completed ✓
│   └── Close Button
│
├── [Summary Section]
│   ├── Type: Private Trip
│   ├── Date: January 15, 2025 at 10:30 AM
│   ├── Total Amount: ₸15,000
│   └── Payment Status: Paid ✓
│
├── [Tabs]
│   ├── Tab 1: Details (active)
│   ├── Tab 2: Timeline
│   └── Tab 3: Payment
│
├── [Details Tab]
│   ├── [User Info Card]
│   │   ├── Avatar + Name
│   │   ├── Email + Phone
│   │   ├── Total bookings: XX
│   │   └── [View Profile] Link
│   │
│   ├── [Driver Info Card]
│   │   ├── Avatar + Name
│   │   ├── Phone + ⭐ 4.8
│   │   ├── Total trips: XXX
│   │   └── [View Profile] Link
│   │
│   ├── [Trip Details]
│   │   ├── Origin: Address
│   │   ├── Destination: Address
│   │   ├── Distance: XX km
│   │   ├── Duration: XX min
│   │   └── Passengers: X
│   │
│   └── [Financial Details]
│       ├── Base Fare: ₸XX,XXX
│       ├── Platform Fee (15%): ₸X,XXX
│       ├── Net to Driver: ₸XX,XXX
│       └── Payment Method: •••• 1234
│
├── [Timeline Tab]
│   └── Timeline items
│       ├── [Created] - User booked trip
│       ├── [Confirmed] - Driver accepted
│       ├── [Payment] - Payment completed
│       ├── [Started] - Trip started
│       └── [Completed] - Trip completed
│
└── [Actions]
    ├── [Export Details] Button
    ├── [Process Refund] Button (if applicable)
    └── [Contact Support] Link
```

### Design System Compliance

**Color Palette:**
```css
/* Status Colors */
--status-active: #10b981;       /* bg-emerald-500 */
--status-pending: #f59e0b;      /* bg-amber-500 */
--status-completed: #3b82f6;    /* bg-blue-500 */
--status-cancelled: #ef4444;    /* bg-red-500 */

/* Health Indicators */
--health-good: #10b981;         /* bg-emerald-500 */
--health-warning: #f59e0b;      /* bg-amber-500 */
--health-critical: #ef4444;     /* bg-red-500 */

/* Chart Colors */
--chart-blue: #3b82f6;
--chart-purple: #8b5cf6;
--chart-orange: #f59e0b;
--chart-green: #10b981;
--chart-red: #ef4444;
```

**Typography:**
```css
/* Dashboard Metrics */
.metric-value {
  @apply text-4xl font-bold text-gray-900;
}

.metric-label {
  @apply text-sm font-medium text-gray-600;
}

.metric-change {
  @apply text-sm font-medium;
}

.metric-change-positive {
  @apply text-green-600;
}

.metric-change-negative {
  @apply text-red-600;
}

/* Table Headers */
.table-header {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wider;
}
```

### Responsive Behavior

**Desktop Only (1024px+)**:
```css
/* Admin dashboard is desktop-first */
.admin-dashboard {
  @apply min-w-screen-lg;
}

.metrics-grid {
  @apply grid grid-cols-4 gap-6;
}

.content-layout {
  @apply grid grid-cols-3 gap-8;
  /* 2/3 charts, 1/3 stats */
}
```

**Tablet Warning (768px-1023px)**:
```
Display message: "For best experience, please use a desktop browser with minimum 1024px width."
```

## Technical Architecture

### Component Structure

```
src/app/
├── admin/
│   ├── dashboard/
│   │   ├── page.tsx                          # Main dashboard ⬜
│   │   ├── loading.tsx                       # Loading skeleton ⬜
│   │   └── components/
│   │       ├── DashboardHeader.tsx           # Header controls ⬜
│   │       ├── MetricsCards.tsx              # Key metrics ⬜
│   │       ├── OverviewTab.tsx               # Overview content ⬜
│   │       ├── ActiveTripsTab.tsx            # Active trips ⬜
│   │       ├── BookingsTab.tsx               # Bookings list ⬜
│   │       ├── RevenueTab.tsx                # Revenue analytics ⬜
│   │       ├── UsersTab.tsx                  # User management ⬜
│   │       ├── BookingsTrendChart.tsx        # Bookings chart ⬜
│   │       ├── RevenueTrendChart.tsx         # Revenue chart ⬜
│   │       ├── BookingDistributionChart.tsx  # Pie chart ⬜
│   │       ├── ActiveTripsTable.tsx          # Active trips ⬜
│   │       ├── BookingsTable.tsx             # Bookings table ⬜
│   │       ├── UsersTable.tsx                # Users table ⬜
│   │       ├── BookingDetailModal.tsx        # Detail modal ⬜
│   │       ├── FilterBar.tsx                 # Filters ⬜
│   │       ├── ExportButton.tsx              # Export data ⬜
│   │       └── LiveUpdateIndicator.tsx       # Real-time status ⬜
│   │
│   ├── bookings/
│   │   └── [id]/
│   │       └── page.tsx                      # Booking detail page ⬜
│   │
│   └── users/
│       └── [id]/
│           └── page.tsx                      # User profile page ⬜
│
└── api/
    └── admin/
        ├── dashboard/
        │   └── overview/
        │       └── route.ts                  # GET overview ⬜
        ├── bookings/
        │   ├── route.ts                      # GET list ⬜
        │   └── [id]/
        │       └── route.ts                  # GET detail ⬜
        ├── analytics/
        │   ├── revenue/
        │   │   └── route.ts                  # GET revenue ⬜
        │   └── bookings/
        │       └── route.ts                  # GET bookings ⬜
        ├── users/
        │   ├── route.ts                      # GET list ⬜
        │   └── [id]/
        │       └── route.ts                  # GET detail ⬜
        └── export/
            └── route.ts                      # POST export ⬜
```

### State Management Architecture

**Admin Dashboard State:**
```typescript
interface AdminDashboardState {
  // Metrics
  overview: {
    data: DashboardOverviewResponse | null;
    isLoading: boolean;
    lastUpdated: Date | null;
  };
  
  // Active trips
  activeTrips: {
    trips: ActiveTrip[];
    isLoading: boolean;
  };
  
  // Bookings
  bookings: {
    items: AdminBooking[];
    pagination: PaginationState;
    filters: BookingFilters;
    isLoading: boolean;
  };
  
  // Analytics
  revenue: {
    data: RevenueAnalyticsResponse | null;
    isLoading: boolean;
  };
  
  // Users
  users: {
    items: AdminUser[];
    pagination: PaginationState;
    filters: UserFilters;
    isLoading: boolean;
  };
  
  // UI state
  ui: {
    activeTab: 'overview' | 'trips' | 'bookings' | 'revenue' | 'users';
    dateRange: DateRange;
    autoRefresh: boolean;
    refreshInterval: number;
    selectedBooking: string | null;
  };
  
  // Actions
  loadOverview: () => Promise<void>;
  loadBookings: (filters?: BookingFilters) => Promise<void>;
  loadRevenue: (period: string) => Promise<void>;
  refreshData: () => Promise<void>;
  exportData: (type: string, filters: any) => Promise<void>;
}

interface BookingFilters {
  status?: string;
  type?: string;
  paymentStatus?: string;
  dateRange?: DateRange;
  searchQuery?: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}
```

### Database Queries Optimization

**Dashboard Overview Query:**
```typescript
async function getDashboardOverview(): Promise<DashboardOverviewResponse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parallel queries for performance
  const [
    activeTrips,
    todayMetrics,
    weekMetrics,
    monthMetrics,
    previousWeekMetrics,
  ] = await Promise.all([
    // Active trips
    prisma.booking.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'PICKING_UP'] },
      },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        passenger: { select: { id: true, name: true, phone: true } },
      },
      take: 20,
    }),
    
    // Today's metrics
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: today },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
    
    // Week metrics
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: getWeekStart(today) },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
    
    // Month metrics
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: getMonthStart(today) },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
    
    // Previous week for comparison
    prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: getPreviousWeekStart(today),
          lt: getWeekStart(today),
        },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);
  
  return {
    activeTrips: {
      count: activeTrips.length,
      inProgress: activeTrips,
    },
    today: {
      date: today.toISOString(),
      upcomingTrips: await getUpcomingTripsCount(today),
      newBookings: todayMetrics._count,
      grossRevenue: todayMetrics._sum.totalAmount || 0,
      netRevenue: calculateNetRevenue(todayMetrics._sum.totalAmount || 0),
    },
    // ... more calculations
  };
}
```

**Cached Analytics:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

async function getRevenueAnalytics(
  period: string
): Promise<RevenueAnalyticsResponse> {
  const cacheKey = `analytics:revenue:${period}`;
  
  // Check cache first (5 min TTL)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Calculate analytics
  const analytics = await calculateRevenueAnalytics(period);
  
  // Cache result
  await redis.setex(cacheKey, 300, JSON.stringify(analytics));
  
  return analytics;
}
```

### Real-time Updates with WebSocket

```typescript
// Server-side WebSocket
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  // Admin connects
  if (socket.data.role === 'ADMIN') {
    socket.join('admin-dashboard');
    
    // Send real-time updates
    socket.on('subscribe-active-trips', () => {
      // Send updates when trips change
      subscribeToTripUpdates(socket);
    });
  }
});

// Emit updates when bookings change
function broadcastBookingUpdate(booking: Booking) {
  io.to('admin-dashboard').emit('booking-updated', {
    bookingId: booking.id,
    status: booking.status,
    timestamp: new Date(),
  });
}

// Client-side hook
function useRealtimeUpdates() {
  const socket = useSocket();
  
  useEffect(() => {
    socket.on('booking-updated', (data) => {
      // Update UI
      queryClient.invalidateQueries(['dashboard-overview']);
    });
    
    return () => {
      socket.off('booking-updated');
    };
  }, [socket]);
}
```

## Implementation Requirements

### Core Components

#### 1. DashboardHeader.tsx ⬜
**Purpose**: Dashboard controls

**Features**:
- Date range selector
- Auto-refresh toggle
- Manual refresh button
- Export functionality

#### 2. MetricsCards.tsx ⬜
**Purpose**: Key metrics display

**Features**:
- Real-time updates
- Trend indicators
- Clickable cards

#### 3. BookingsTrendChart.tsx ⬜
**Purpose**: Bookings visualization

**Features**:
- Multi-line chart
- Date range filtering
- Interactive tooltips

#### 4. BookingsTable.tsx ⬜
**Purpose**: Bookings list

**Features**:
- Sorting/filtering
- Pagination
- Bulk actions
- Detail modal

### Custom Hooks

#### useDashboardData() ⬜
```typescript
interface UseDashboardDataReturn {
  overview: DashboardOverviewResponse | null;
  isLoading: boolean;
  error: Error | null;
  
  refresh: () => Promise<void>;
  startAutoRefresh: (interval: number) => void;
  stopAutoRefresh: () => void;
}
```

#### useRealtimeUpdates() ⬜
```typescript
interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  lastUpdate: Date | null;
  
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}
```

## Acceptance Criteria

### Functional Requirements

#### 1. Dashboard Overview ⬜
- [x] Shows active trips count
- [x] Displays today's metrics
- [x] Shows week/month summaries
- [x] Comparison with previous periods
- [x] Charts render correctly

#### 2. Bookings Management ⬜
- [x] Lists all bookings
- [x] Filters work correctly
- [x] Search functionality
- [x] Detail view accessible
- [x] Export to CSV works

#### 3. Revenue Analytics ⬜
- [x] Revenue trends displayed
- [x] Breakdown by type
- [x] Top performers shown
- [x] Calculations accurate

#### 4. Real-time Updates ⬜
- [x] Auto-refresh works
- [x] WebSocket updates received
- [x] UI updates without refresh

### Non-Functional Requirements

#### Performance ⬜
- [x] Dashboard loads <3 seconds
- [x] Charts render <1 second
- [x] Tables support 10,000+ rows

#### Security ⬜
- [x] ADMIN role enforced
- [x] Audit logging enabled
- [x] PII protected in exports

## Modified Files

```
src/app/admin/dashboard/
├── page.tsx                                  ⬜
└── components/                               ⬜ (17 files)

src/app/api/admin/
├── dashboard/overview/route.ts               ⬜
├── bookings/route.ts                         ⬜
├── analytics/                                ⬜ (2 endpoints)
├── users/route.ts                            ⬜
└── export/route.ts                           ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Dashboard Foundation (Week 1) ⬜
- [ ] Dashboard layout
- [ ] Metrics cards
- [ ] API endpoints
- [ ] Data fetching

### Phase 2: Analytics & Charts (Week 2) ⬜
- [ ] Bookings trends
- [ ] Revenue analytics
- [ ] Chart components
- [ ] Caching layer

### Phase 3: Tables & Details (Week 2-3) ⬜
- [ ] Bookings table
- [ ] Active trips table
- [ ] Detail modals
- [ ] Export functionality

### Phase 4: Real-time & Polish (Week 3) ⬜
- [ ] WebSocket integration
- [ ] Auto-refresh
- [ ] Testing
- [ ] Performance optimization

## Dependencies

- **All Stories 33-41**: Data sources
- **WebSocket**: Real-time updates
- **Chart.js/Recharts**: Visualizations
- **Redis**: Caching

## Risk Assessment

### Technical Risks

#### Risk 1: Performance with Large Datasets
- **Impact**: Critical (slow dashboard)
- **Mitigation**: Caching + pagination + indexes
- **Contingency**: Query optimization

#### Risk 2: Real-time Update Scalability
- **Impact**: Medium (connection limits)
- **Mitigation**: Connection pooling
- **Contingency**: Polling fallback

## Testing Strategy

```typescript
describe('Admin Dashboard', () => {
  it('loads overview metrics', async () => {
    // Test data loading
  });
  
  it('filters bookings correctly', async () => {
    // Test filtering
  });
  
  it('exports data successfully', async () => {
    // Test export
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3 weeks (1 developer)
