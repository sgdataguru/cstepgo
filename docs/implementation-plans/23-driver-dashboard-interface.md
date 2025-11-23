# 23 Driver Dashboard Interface - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want a dedicated dashboard showing my earnings, trip statistics, and current status, so that I can track my performance and manage my driving activity effectively.

## Pre-conditions

- Driver authentication system is implemented
- Trip acceptance and completion workflows exist
- Earnings calculation system is functional
- Driver profile and status management is available
- Trip history data is being collected

## Business Requirements

- Real-time earnings display with platform commission breakdown
- Performance metrics (trips completed, ratings, hours online)
- Online/offline status management with quick toggle
- Trip history with customer feedback and earnings details
- Daily, weekly, and monthly analytics with charts
- Goal setting and achievement tracking

## Technical Specifications

### Integration Points
- **Analytics**: Chart.js/Recharts for earnings and performance visualizations
- **Real-time Updates**: WebSocket for live earnings and trip status updates
- **Payments**: Integration with earnings calculation and payout systems
- **Notifications**: Badge system for new trips, messages, and announcements
- **Maps**: Integration for trip route history and service area visualization

### Security Requirements
- Earnings data encryption and secure transmission
- PCI compliance for payment information display
- Role-based access control for driver-only data
- Audit logging for all dashboard actions
- Session management with auto-logout for security

## Design Specifications

### Visual Layout & Components

**Driver Dashboard Layout**:
```
[Header - Driver Navigation]
├── StepperGO Driver Logo
├── Online Status Toggle (Prominent)
├── Current Earnings Today
└── Profile Menu (Avatar + Dropdown)

[Main Dashboard Grid - 3 Columns on Desktop]
├── [Left Sidebar - Stats Cards]
│   ├── Today's Earnings Card
│   ├── Trips Completed Card
│   ├── Average Rating Card
│   └── Hours Online Card
│
├── [Center Content - Primary]
│   ├── [Quick Actions Bar]
│   │   ├── Go Online/Offline Button
│   │   ├── View Available Trips
│   │   └── Emergency Contact
│   │
│   ├── [Current Trip Status]
│   │   ├── Active Trip Details (if any)
│   │   ├── Next Pickup Information
│   │   └── Navigation Controls
│   │
│   └── [Recent Activity Feed]
│       ├── Completed Trip Notifications
│       ├── Earnings Updates
│       └── Platform Announcements
│
└── [Right Sidebar - Analytics]
    ├── [Earnings Chart - Weekly View]
    ├── [Performance Trends]
    └── [Goal Progress]

[Bottom Navigation - Mobile Only]
├── Dashboard (Active)
├── Trips
├── Earnings
└── Profile
```

**Earnings Card Component**:
```
[Today's Earnings - Card]
├── [Header]
│   ├── "Today's Earnings" Title
│   ├── Target Progress (₸2,125 of ₸3,000)
│   └── Progress Bar (71%)
│
├── [Main Amount]
│   └── ₸2,125 (Large, Bold)
│
├── [Breakdown]
│   ├── Gross Earnings: ₸2,500
│   ├── Platform Fee (-15%): -₸375
│   ├── Net Earnings: ₸2,125
│   └── Trips Completed: 8
│
└── [Quick Actions]
    ├── View Detailed Report
    └── Set Daily Goal
```

**Component Hierarchy**:
```tsx
<DriverDashboardLayout>
  <DriverHeader>
    <OnlineStatusToggle />
    <EarningsDisplay />
    <ProfileMenu />
  </DriverHeader>
  
  <DashboardGrid>
    <StatsCards>
      <EarningsCard />
      <TripsCard />
      <RatingCard />
      <OnlineTimeCard />
    </StatsCards>
    
    <MainContent>
      <QuickActions>
        <GoOnlineButton />
        <ViewTripsButton />
        <EmergencyButton />
      </QuickActions>
      
      <CurrentTripStatus />
      <RecentActivityFeed />
    </MainContent>
    
    <AnalyticsSidebar>
      <EarningsChart />
      <PerformanceTrends />
      <GoalProgress />
    </AnalyticsSidebar>
  </DashboardGrid>
  
  <MobileBottomNav />
</DriverDashboardLayout>
```

### Design System Compliance

**Color Palette (Dashboard)**:
```css
/* Dashboard Colors */
--dashboard-primary: #059669;      /* bg-emerald-600 */
--dashboard-secondary: #0f766e;    /* bg-teal-700 */
--earnings-positive: #10b981;      /* bg-emerald-500 */
--earnings-neutral: #6b7280;       /* bg-gray-500 */

/* Status Colors */
--status-online: #10b981;          /* bg-emerald-500 */
--status-offline: #ef4444;         /* bg-red-500 */
--status-busy: #f59e0b;            /* bg-amber-500 */
```

**Typography Scale**:
```css
--earnings-display: 2.5rem;        /* text-4xl - Main earnings */
--card-title: 1.125rem;            /* text-lg - Card headers */
--stat-number: 1.5rem;             /* text-2xl - Statistics */
--body-text: 1rem;                 /* text-base - Regular text */
```

## Technical Architecture

### Database Schema Changes

```sql
-- Create driver_sessions table for tracking online time
CREATE TABLE driver_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  total_minutes INTEGER,
  earnings_during_session DECIMAL(10,2) DEFAULT 0,
  trips_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create driver_daily_stats table for performance tracking
CREATE TABLE driver_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  gross_earnings DECIMAL(10,2) DEFAULT 0,
  platform_fees DECIMAL(10,2) DEFAULT 0,
  trips_completed INTEGER DEFAULT 0,
  total_online_minutes INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_distance_km DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(driver_id, date)
);

-- Create driver_goals table for goal tracking
CREATE TABLE driver_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- 'daily_earnings', 'weekly_trips', etc.
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  target_date DATE NOT NULL,
  achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_driver_sessions_driver_date ON driver_sessions(driver_id, session_start);
CREATE INDEX idx_driver_daily_stats_driver_date ON driver_daily_stats(driver_id, date);
CREATE INDEX idx_driver_goals_driver_active ON driver_goals(driver_id, achieved, target_date);
```

### API Endpoints

```typescript
// Dashboard Data APIs
GET /api/drivers/dashboard/stats
GET /api/drivers/dashboard/earnings?period=today|week|month
GET /api/drivers/dashboard/trips/recent
GET /api/drivers/dashboard/performance

// Status Management APIs
POST /api/drivers/status/online
POST /api/drivers/status/offline
GET /api/drivers/status/current

// Goals Management APIs
GET /api/drivers/goals
POST /api/drivers/goals
PUT /api/drivers/goals/:id
DELETE /api/drivers/goals/:id

// Analytics APIs
GET /api/drivers/analytics/earnings-chart?period=7d
GET /api/drivers/analytics/performance-trends
GET /api/drivers/analytics/activity-feed
```

### Real-time Updates System

```typescript
// Dashboard Real-time Updates
class DriverDashboardService {
  private ws: WebSocket;
  private driverId: string;
  
  constructor(driverId: string) {
    this.driverId = driverId;
    this.initializeWebSocket();
  }
  
  private initializeWebSocket() {
    this.ws = new WebSocket(`${process.env.WS_URL}/drivers/dashboard/${this.driverId}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleDashboardUpdate(data);
    };
  }
  
  private handleDashboardUpdate(update: DashboardUpdate) {
    switch (update.type) {
      case 'earnings-update':
        this.updateEarningsDisplay(update.data);
        break;
      case 'trip-completed':
        this.incrementTripCounter(update.data);
        this.updateEarnings(update.data.earnings);
        break;
      case 'rating-update':
        this.updateAverageRating(update.data);
        break;
      case 'goal-progress':
        this.updateGoalProgress(update.data);
        break;
    }
  }
  
  async goOnline(): Promise<void> {
    try {
      await fetch('/api/drivers/status/online', { method: 'POST' });
      this.ws.send(JSON.stringify({ type: 'status-change', status: 'online' }));
    } catch (error) {
      console.error('Failed to go online:', error);
    }
  }
  
  async goOffline(): Promise<void> {
    try {
      await fetch('/api/drivers/status/offline', { method: 'POST' });
      this.ws.send(JSON.stringify({ type: 'status-change', status: 'offline' }));
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  }
}
```

### Component Implementation

**DriverDashboard**:
```typescript
const DriverDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { driver } = useDriverAuth();
  
  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!driver?.id) return;
    
    const dashboardService = new DriverDashboardService(driver.id);
    
    return () => {
      dashboardService.disconnect();
    };
  }, [driver?.id]);
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [stats, earnings, trips, performance] = await Promise.all([
        fetch('/api/drivers/dashboard/stats').then(r => r.json()),
        fetch('/api/drivers/dashboard/earnings?period=today').then(r => r.json()),
        fetch('/api/drivers/dashboard/trips/recent').then(r => r.json()),
        fetch('/api/drivers/dashboard/performance').then(r => r.json())
      ]);
      
      setDashboardData({
        stats,
        earnings,
        recentTrips: trips,
        performance
      });
      setIsOnline(stats.isOnline);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusToggle = async () => {
    try {
      if (isOnline) {
        await fetch('/api/drivers/status/offline', { method: 'POST' });
        setIsOnline(false);
        toast.success('You are now offline');
      } else {
        await fetch('/api/drivers/status/online', { method: 'POST' });
        setIsOnline(true);
        toast.success('You are now online and ready for trips');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="driver-dashboard min-h-screen bg-gray-50">
      <DriverHeader 
        isOnline={isOnline}
        todaysEarnings={dashboardData?.earnings.today || 0}
        onStatusToggle={handleStatusToggle}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            <EarningsCard 
              earnings={dashboardData?.earnings}
              goal={dashboardData?.goals?.dailyEarnings}
            />
            <TripsCard 
              completed={dashboardData?.stats.tripsToday}
              target={dashboardData?.goals?.dailyTrips}
            />
            <RatingCard 
              rating={dashboardData?.performance.averageRating}
              trend={dashboardData?.performance.ratingTrend}
            />
            <OnlineTimeCard 
              minutes={dashboardData?.stats.onlineTimeToday}
              target={8 * 60} // 8 hours target
            />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActionsBar 
              isOnline={isOnline}
              onGoOnline={() => handleStatusToggle()}
              onViewTrips={() => router.push('/drivers/trips')}
            />
            
            <CurrentTripStatus 
              activeTrip={dashboardData?.stats.activeTrip}
            />
            
            <RecentActivityFeed 
              activities={dashboardData?.recentActivities}
            />
          </div>
          
          {/* Analytics Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <EarningsChart 
              data={dashboardData?.earnings.weeklyChart}
            />
            <PerformanceTrends 
              data={dashboardData?.performance.trends}
            />
            <GoalProgress 
              goals={dashboardData?.goals.active}
            />
          </div>
        </div>
      </div>
      
      <MobileBottomNavigation />
    </div>
  );
};
```

**EarningsCard Component**:
```typescript
interface EarningsCardProps {
  earnings: {
    today: number;
    gross: number;
    platformFees: number;
    net: number;
  };
  goal?: {
    target: number;
    current: number;
  };
}

const EarningsCard: React.FC<EarningsCardProps> = ({ earnings, goal }) => {
  const progressPercentage = goal ? (goal.current / goal.target) * 100 : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Earnings</CardTitle>
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        </div>
        {goal && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Goal Progress</span>
              <span>₸{goal.current} of ₸{goal.target}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="text-3xl font-bold text-emerald-600 mb-4">
          ₸{earnings.net.toLocaleString()}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Earnings</span>
            <span>₸{earnings.gross.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee (-15%)</span>
            <span className="text-red-600">-₸{earnings.platformFees.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Net Earnings</span>
            <span className="text-emerald-600">₸{earnings.net.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          View Detailed Report
        </Button>
      </CardFooter>
    </Card>
  );
};
```

## Implementation Steps

### Phase 1: Core Dashboard (Week 1)
1. **Backend Analytics**
   - Dashboard data aggregation APIs
   - Real-time earnings calculation
   - Performance metrics computation

2. **Basic UI Components**
   - Dashboard layout structure
   - Stats cards implementation
   - Online/offline status toggle

3. **Data Integration**
   - WebSocket connection for real-time updates
   - Dashboard data loading and caching
   - Error handling and loading states

### Phase 2: Advanced Features (Week 2)
1. **Charts & Visualization**
   - Earnings trends chart implementation
   - Performance analytics visualization
   - Goal progress tracking

2. **Interactive Elements**
   - Quick action buttons
   - Goal setting interface
   - Activity feed with real-time updates

3. **Mobile Optimization**
   - Responsive design implementation
   - Mobile-specific navigation
   - Touch-optimized interactions

### Phase 3: Analytics & Polish (Week 3)
1. **Advanced Analytics**
   - Historical performance trends
   - Predictive earnings insights
   - Comparative performance metrics

2. **User Experience**
   - Animation and micro-interactions
   - Accessibility improvements
   - Performance optimization

3. **Testing & Refinement**
   - Cross-browser compatibility
   - Mobile device testing
   - Performance benchmarking

## Success Metrics

### Performance KPIs
- Dashboard load time < 2 seconds
- Real-time update latency < 500ms
- Chart rendering performance < 1 second
- Mobile responsiveness score > 95

### Business KPIs
- Driver engagement time on dashboard > 3 minutes daily
- Goal setting adoption rate > 60%
- Online status toggle usage > 80% of drivers
- Earnings tracking accuracy 100%
