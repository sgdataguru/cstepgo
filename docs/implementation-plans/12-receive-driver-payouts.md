# 12 Receive Driver Payouts - Implementation Planning

> **⚠️ ARCHIVED**  
> This implementation plan has been archived and is no longer active.  
> **Reason**: Feature deferred to Gate 3 (Financial Operations phase)  
> **Archived Date**: October 2025  
> **Status**: 🗄️ Deferred - will be revisited after payment infrastructure matures  
> **See**: [README.md](./README.md) for current active plans

---

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a driver, I want to receive automated payouts for completed trips, so that I get paid reliably for my services.

## Pre-conditions

- Driver is verified and approved on the platform
- Bank account or payment method details are validated
- Trip completion and payment confirmation system exists
- Financial reconciliation system is operational

## Business Requirements

- Ensure 100% accuracy in payout calculations
- Enable timely payouts within 24-48 hours of schedule
- Reduce support queries about payouts by 70%
- Support instant payouts for driver retention (future enhancement)
- Maintain compliance with financial regulations

## Technical Specifications

### Integration Points
- **Payment Processor**: Stripe Connect or similar for payouts
- **Banking APIs**: Local bank APIs for direct transfers
- **Accounting Service**: `/api/accounting/reconciliation`
- **Trip Service**: `/api/trips/completed` for earning calculation
- **Notification Service**: Email/SMS for payout notifications

### Security Requirements
- PCI DSS compliance for financial data
- Encryption of banking details at rest
- Secure API endpoints with authentication
- Audit trail for all financial transactions
- Two-factor authentication for payout changes

## Design Specifications

### Visual Layout & Components

**Driver Dashboard - Payouts Section**:
```
[Dashboard Layout]
├── [Sidebar Navigation]
│   ├── [Overview]
│   ├── [Trips]
│   ├── [Earnings] <- Active
│   └── [Settings]
├── [Main Content Area]
│   ├── [Earnings Overview Card]
│   │   ├── [Current Balance]
│   │   ├── [Next Payout Date]
│   │   └── [Quick Actions]
│   ├── [Payout Schedule Settings]
│   │   ├── [Frequency Selector]
│   │   └── [Payout Method]
│   └── [Earnings Breakdown]
│       ├── [Recent Trips Table]
│       ├── [Commission Details]
│       └── [Payout History]
└── [Right Sidebar]
    └── [Payout Summary Card]
```

**Payout Statement View**:
```
[Statement Container]
├── [Statement Header]
│   ├── [Period Dates]
│   ├── [Statement ID]
│   └── [Download Button]
├── [Earnings Summary]
│   ├── [Total Trips]
│   ├── [Gross Earnings]
│   ├── [Commission]
│   └── [Net Payout]
├── [Trip Details Table]
│   ├── [Trip ID]
│   ├── [Date/Time]
│   ├── [Route]
│   ├── [Fare]
│   └── [Commission]
└── [Statement Footer]
    ├── [Tax Information]
    └── [Support Contact]
```

### Design System Compliance

**Color Palette**:
```css
/* Financial Theme Colors */
--finance-primary: #059669;      /* Emerald-600 */
--finance-success: #10b981;      /* Emerald-500 */
--finance-warning: #f59e0b;      /* Amber-500 */
--finance-error: #ef4444;        /* Red-500 */

/* Status Colors */
--status-pending: #fbbf24;       /* Amber-400 */
--status-processing: #3b82f6;    /* Blue-500 */
--status-completed: #10b981;     /* Emerald-500 */
--status-failed: #ef4444;        /* Red-500 */

/* Background Colors */
--card-bg: #ffffff;              /* White */
--summary-bg: #f0fdf4;           /* Emerald-50 */
--table-bg: #fafafa;             /* Gray-50 */
```

**Typography Scale**:
```css
/* Financial Display */
--amount-display: 2.5rem;        /* 40px */
--amount-label: 0.875rem;        /* 14px */

/* Headers */
--section-title: 1.25rem;        /* 20px */
--table-header: 0.875rem;        /* 14px */

/* Body Text */
--body-text: 1rem;               /* 16px */
--small-text: 0.75rem;           /* 12px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.payout-dashboard {
  @apply flex flex-col space-y-4 px-4;
}

.earnings-card {
  @apply w-full p-4;
}

.trip-table {
  @apply overflow-x-auto;
}
```

**Desktop (768px+)**:
```css
.payout-dashboard {
  @apply grid grid-cols-12 gap-6 px-8;
}

.main-content {
  @apply col-span-9;
}

.sidebar {
  @apply col-span-3;
}
```

### Interaction Patterns

**Payout Schedule Selection**:
```typescript
interface PayoutScheduleOptions {
  daily: {
    label: 'Daily',
    description: 'Receive payouts every day',
    fee: 2.5
  };
  weekly: {
    label: 'Weekly',
    description: 'Receive payouts every Monday',
    fee: 0
  };
  monthly: {
    label: 'Monthly',
    description: 'Receive payouts on the 1st',
    fee: 0
  };
  instant: {
    label: 'Instant',
    description: 'Get paid immediately',
    fee: 5.0
  };
}
```

**Payout Status States**:
```typescript
interface PayoutStates {
  calculating: {
    icon: 'calculator',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  };
  scheduled: {
    icon: 'clock',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  };
  processing: {
    icon: 'refresh',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  };
  completed: {
    icon: 'check-circle',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  };
  failed: {
    icon: 'x-circle',
    color: 'text-red-600',
    bg: 'bg-red-50'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/driver/
├── earnings/
│   ├── page.tsx                      # Earnings dashboard
│   ├── layout.tsx                    # Driver layout
│   └── components/
│       ├── EarningsOverview.tsx      # Summary cards
│       ├── PayoutSchedule.tsx        # Schedule settings
│       ├── TripEarningsTable.tsx     # Detailed earnings
│       ├── PayoutHistory.tsx         # Past payouts
│       ├── PayoutStatement.tsx       # Statement view
│       └── hooks/
│           ├── useEarnings.ts        # Earnings data
│           ├── usePayoutSchedule.ts  # Schedule management
│           └── usePayoutHistory.ts   # Historical data
├── payouts/
│   └── [payoutId]/
│       └── page.tsx                  # Individual payout
└── api/
    └── payouts/
        ├── calculate/
        │   └── route.ts              # Calculate payouts
        ├── process/
        │   └── route.ts              # Process payouts
        └── webhook/
            └── route.ts              # Payment webhooks
```

### State Management Architecture

**Payout State Interface**:
```typescript
interface PayoutState {
  // Earnings Data
  currentBalance: number;
  pendingEarnings: number;
  processingPayouts: Payout[];
  
  // Schedule Settings
  payoutSchedule: PayoutSchedule;
  payoutMethod: PayoutMethod;
  minimumPayout: number;
  
  // History
  payoutHistory: PayoutRecord[];
  statements: Statement[];
  
  // UI State
  isLoading: boolean;
  selectedPeriod: DateRange;
  filters: PayoutFilters;
}

interface Payout {
  id: string;
  driverId: string;
  period: {
    start: Date;
    end: Date;
  };
  earnings: {
    gross: number;
    commission: number;
    adjustments: number;
    net: number;
  };
  tripCount: number;
  status: PayoutStatus;
  scheduledDate: Date;
  processedDate?: Date;
  transactionId?: string;
}

interface PayoutSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'instant';
  dayOfWeek?: number; // For weekly
  dayOfMonth?: number; // For monthly
  cutoffTime: string; // HH:mm format
  timezone: string;
}

interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'debit_card' | 'digital_wallet';
  details: {
    last4?: string;
    bankName?: string;
    accountType?: string;
  };
  isDefault: boolean;
  isVerified: boolean;
}

interface Statement {
  id: string;
  payoutId: string;
  generatedAt: Date;
  trips: TripEarning[];
  totals: {
    trips: number;
    gross: number;
    commission: number;
    adjustments: number;
    net: number;
  };
}
```

### API Integration Schema

**Payout Management APIs**:
```typescript
// Calculate Payout
interface CalculatePayoutRequest {
  driverId: string;
  period: {
    start: Date;
    end: Date;
  };
  includeDetails?: boolean;
}

interface CalculatePayoutResponse {
  payout: {
    gross: number;
    commission: number;
    platformFee: number;
    processingFee: number;
    adjustments: number;
    net: number;
  };
  trips: Array<{
    id: string;
    date: Date;
    fare: number;
    commission: number;
  }>;
  eligibility: {
    meetsMinimum: boolean;
    minimumRequired: number;
  };
}

// Process Payout
interface ProcessPayoutRequest {
  payoutIds: string[];
  method: 'scheduled' | 'instant';
}

interface ProcessPayoutResponse {
  processed: string[];
  failed: Array<{
    payoutId: string;
    reason: string;
  }>;
  estimatedArrival: Date;
}

// Update Payout Schedule
interface UpdateScheduleRequest {
  driverId: string;
  schedule: PayoutSchedule;
  effectiveDate: Date;
}

interface UpdateScheduleResponse {
  success: boolean;
  schedule: PayoutSchedule;
  nextPayoutDate: Date;
}

// Get Payout History
interface GetPayoutHistoryRequest {
  driverId: string;
  startDate?: Date;
  endDate?: Date;
  status?: PayoutStatus[];
  page?: number;
  limit?: number;
}

interface PayoutHistoryResponse {
  payouts: Payout[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
  summary: {
    totalPaid: number;
    averagePayout: number;
    lastPayoutDate: Date;
  };
}
```

## Implementation Requirements

### Core Components

**EarningsOverview.tsx** - Dashboard summary cards
```typescript
interface EarningsOverviewProps {
  currentBalance: number;
  pendingEarnings: number;
  nextPayoutDate: Date;
  lastPayoutAmount?: number;
}
```

**PayoutSchedule.tsx** - Schedule configuration
```typescript
interface PayoutScheduleProps {
  currentSchedule: PayoutSchedule;
  availableOptions: PayoutScheduleOption[];
  onScheduleChange: (schedule: PayoutSchedule) => Promise<void>;
  payoutMethods: PayoutMethod[];
}
```

**TripEarningsTable.tsx** - Detailed trip earnings
```typescript
interface TripEarningsTableProps {
  trips: TripEarning[];
  period: DateRange;
  onPeriodChange: (period: DateRange) => void;
  isLoading?: boolean;
}
```

**PayoutStatement.tsx** - Statement generation
```typescript
interface PayoutStatementProps {
  payoutId: string;
  onDownload: () => void;
  onEmail: () => void;
}
```

### Custom Hooks

**useEarnings()** - Earnings data management
```typescript
function useEarnings(driverId: string): {
  earnings: EarningsData;
  isLoading: boolean;
  error: Error | null;
  refreshEarnings: () => Promise<void>;
  calculatePayout: (period: DateRange) => Promise<PayoutCalculation>;
}
```

**usePayoutSchedule()** - Schedule management
```typescript
function usePayoutSchedule(driverId: string): {
  schedule: PayoutSchedule;
  updateSchedule: (newSchedule: PayoutSchedule) => Promise<void>;
  nextPayoutDate: Date;
  estimateArrival: (method: PayoutMethod) => Date;
}
```

**usePayoutHistory()** - Historical data access
```typescript
function usePayoutHistory(driverId: string): {
  payouts: Payout[];
  loadMore: () => Promise<void>;
  hasMore: boolean;
  downloadStatement: (payoutId: string) => Promise<Blob>;
}
```

### Utility Functions

**payout-calculations.ts** - Financial calculations
```typescript
function calculateCommission(fare: number, rate: number): number
function calculatePlatformFee(gross: number): number
function calculateNetPayout(gross: number, deductions: Deductions): number
function validateMinimumPayout(amount: number, minimum: number): boolean
```

**payout-formatters.ts** - Display formatting
```typescript
function formatCurrency(amount: number, currency?: string): string
function formatPayoutPeriod(start: Date, end: Date): string
function formatPayoutStatus(status: PayoutStatus): string
function generateStatementPDF(statement: Statement): Promise<Blob>
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Automatic payout calculation after trip completion
- ✓ Platform commission deducted transparently
- ✓ Payout schedule options (daily/weekly/monthly)
- ✓ Clear payout statements showing all required details
- ✓ Multiple payout methods supported (bank/card/wallet)
- ✓ Complete payout history accessible in dashboard

**Financial Accuracy**
- ✓ 100% accurate calculations with audit trail
- ✓ Real-time balance updates
- ✓ Commission transparency
- ✓ Adjustment tracking and explanations

**User Interface**
- ✓ Intuitive earnings dashboard
- ✓ Clear statement presentation
- ✓ Easy schedule management
- ✓ Mobile-responsive design

### Non-Functional Requirements

**Performance**
- Dashboard load < 2 seconds
- Payout calculation < 1 second
- Statement generation < 3 seconds
- Real-time balance updates

**Accessibility**
- Screen reader compatible
- Keyboard navigation
- High contrast support
- Clear financial formatting

**Security**
- Encrypted financial data
- Secure API endpoints
- Audit logging
- PCI compliance

## Modified Files
```
src/
├── app/
│   └── driver/
│       ├── earnings/
│       │   ├── page.tsx ⬜
│       │   ├── layout.tsx ⬜
│       │   └── components/
│       │       ├── EarningsOverview.tsx ⬜
│       │       ├── PayoutSchedule.tsx ⬜
│       │       ├── TripEarningsTable.tsx ⬜
│       │       ├── PayoutHistory.tsx ⬜
│       │       ├── PayoutStatement.tsx ⬜
│       │       └── hooks/
│       │           ├── useEarnings.ts ⬜
│       │           ├── usePayoutSchedule.ts ⬜
│       │           └── usePayoutHistory.ts ⬜
│       └── payouts/
│           └── [payoutId]/
│               └── page.tsx ⬜
├── lib/
│   ├── payouts/
│   │   ├── payout-service.ts ⬜
│   │   └── calculation-engine.ts ⬜
│   └── utils/
│       ├── payout-calculations.ts ⬜
│       └── payout-formatters.ts ⬜
├── types/
│   └── payout-types.ts ⬜
└── constants/
    └── payout-config.ts ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create payout data models
- [ ] Set up calculation engine
- [ ] Define TypeScript interfaces
- [ ] Configure payment processor

### Phase 2: Core Implementation
- [ ] Build earnings dashboard
- [ ] Implement payout calculations
- [ ] Create schedule management
- [ ] Add payout history

### Phase 3: Enhanced Features
- [ ] Statement generation
- [ ] Instant payout option
- [ ] Tax documentation
- [ ] Export capabilities

### Phase 4: Polish & Testing
- [ ] Financial accuracy testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] End-to-end testing

## Dependencies

### Internal Dependencies
- Trip completion service
- Driver verification status
- Commission rate configuration
- Notification service

### External Dependencies
- Stripe Connect or similar
- Banking API integrations
- PDF generation library
- Currency formatting utilities

## Risk Assessment

### Technical Risks

**Financial Calculation Errors**
- Impact: Critical
- Mitigation: Extensive testing, audit logs
- Contingency: Manual reconciliation tools

**Payment Processing Failures**
- Impact: High
- Mitigation: Retry logic, multiple providers
- Contingency: Manual payout option

**Banking API Downtime**
- Impact: Medium
- Mitigation: Queue system, status tracking
- Contingency: Batch processing

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Payout Calculations', () => {
  it('should calculate commission correctly', () => {});
  it('should apply platform fees accurately', () => {});
  it('should validate minimum payout amounts', () => {});
  it('should handle currency conversions', () => {});
});

describe('useEarnings Hook', () => {
  it('should fetch earnings data correctly', async () => {});
  it('should update balance in real-time', () => {});
  it('should handle calculation errors', () => {});
});
```

### Integration Tests
```typescript
describe('Payout Processing', () => {
  it('should process scheduled payouts', async () => {});
  it('should handle payment failures', async () => {});
  it('should generate accurate statements', async () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load statement components
- Code split financial calculations
- Optimize dashboard queries

### Runtime Performance
- Cache earnings calculations
- Paginate transaction history
- Optimize real-time updates

### Caching Strategy
- Cache balance (1 minute)
- Cache statements (permanent)
- Cache exchange rates (1 hour)

## Deployment Plan

### Development Phase
- Mock payment processors
- Test with sample data
- Validate calculations

### Staging Phase
- Integration with real APIs
- Load testing
- Financial audit

### Production Phase
- Phased rollout by region
- Monitor transaction accuracy
- Real-time alerting

## Monitoring & Analytics

### Performance Metrics
- Calculation accuracy rates
- Payment success rates
- API response times

### Business Metrics
- Average payout amount
- Payout frequency distribution
- Instant payout adoption

### Technical Metrics
- Processing queue length
- Failed transaction rate
- System uptime

## Documentation Requirements

### Technical Documentation
- Calculation algorithms
- API integration guides
- Troubleshooting procedures

### User Documentation
- Payout schedule guide
- Statement interpretation
- Tax documentation help

## Post-Launch Review

### Success Criteria
- 100% calculation accuracy
- < 48 hour payout delivery
- 70% reduction in support queries
- Positive driver feedback

### Retrospective Items
- Process improvements
- Feature enhancements
- Performance optimization
- Additional