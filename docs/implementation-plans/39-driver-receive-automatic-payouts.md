# 39 - Driver Receive Automatic Payouts - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Stripe Connect  
**Infrastructure**: Vercel (hosting), Stripe Connect (payouts), Vercel Cron (scheduled jobs)

## User Story

**As a** driver,  
**I want** to receive my earnings automatically in regular payouts,  
**so that** I don't have to manually request payments and can trust the platform with my income.

## Pre-conditions

- Driver must be registered with DRIVER role
- Driver must have completed at least one paid trip
- Story 33-38 (Booking and payment system) completed
- Stripe Connect account configured
- Cron job infrastructure set up

## Business Requirements

- **BR-1**: Automate driver payouts to reduce operational overhead and build trust
  - Success Metric: >90% of payouts processed automatically without manual intervention
  - Performance: Payout calculation <10 seconds per driver

- **BR-2**: Provide transparent earnings visibility to drivers
  - Success Metric: >80% of drivers check earnings dashboard weekly
  - Performance: Earnings dashboard loads <2 seconds

- **BR-3**: Ensure reliable payout delivery with minimal failures
  - Success Metric: >98% payout success rate
  - Performance: Failed payouts retry within 24 hours

- **BR-4**: Calculate accurate net earnings after platform commission
  - Success Metric: Zero commission calculation disputes
  - Performance: Commission calculated in real-time per trip

## Technical Specifications

### Integration Points
- **Stripe Connect**: Express accounts for driver payouts
- **Stripe Transfers**: Automated transfers to driver accounts
- **Cron Jobs**: Vercel Cron for scheduled payout runs
- **Email Notifications**: Payout confirmation emails
- **Database**: PostgreSQL for earnings and payout history

### Security Requirements
- Secure bank account/routing number storage (encrypted)
- PCI compliance for financial data
- Audit logging for all payout operations
- Rate limiting on payout API endpoints
- Two-factor authentication for account changes

### API Endpoints

#### GET /api/drivers/earnings
Retrieves driver's earnings summary and breakdown.

**Query Parameters:**
```typescript
interface EarningsQuery {
  period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}
```

**Response:**
```typescript
interface EarningsResponse {
  summary: {
    totalEarnings: number;
    platformCommission: number;
    netEarnings: number;
    completedTrips: number;
    currency: 'KZT';
  };
  
  breakdown: {
    byPeriod: EarningsPeriod[];
    byTripType: {
      private: number;
      shared: number;
      activity: number;
    };
  };
  
  upcomingPayout: {
    amount: number;
    scheduledDate: Date;
    includesTrips: number;
    status: 'PENDING' | 'SCHEDULED';
  } | null;
  
  lastPayout: {
    amount: number;
    paidAt: Date;
    status: 'PAID';
  } | null;
}

interface EarningsPeriod {
  period: string;  // "2025-01-01" or "2025-W01"
  earnings: number;
  commission: number;
  net: number;
  trips: number;
}
```

#### GET /api/drivers/payouts
Retrieves payout history with pagination.

**Query Parameters:**
```typescript
interface PayoutsQuery {
  page?: number;
  limit?: number;
  status?: 'ALL' | 'PAID' | 'PENDING' | 'FAILED';
}
```

**Response:**
```typescript
interface PayoutsResponse {
  payouts: PayoutSummary[];
  pagination: PaginationInfo;
  totalPaidOut: number;
}

interface PayoutSummary {
  id: string;
  payoutNumber: string;
  amount: number;
  currency: 'KZT';
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  
  // Period covered
  periodStart: Date;
  periodEnd: Date;
  tripsIncluded: number;
  
  // Breakdown
  grossEarnings: number;
  platformCommission: number;
  platformFeePercentage: number;
  netAmount: number;
  
  // Payout details
  scheduledDate: Date;
  processedAt?: Date;
  paidAt?: Date;
  arrivalDate?: Date;  // When funds arrive in bank
  
  // Payment method
  destination: {
    type: 'bank_account' | 'card';
    last4: string;
    bankName?: string;
  };
  
  // Stripe info
  stripePayoutId?: string;
  stripeTransferId?: string;
  
  // Failure info
  failureCode?: string;
  failureMessage?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### GET /api/drivers/payout-settings
Retrieves driver's payout configuration.

**Response:**
```typescript
interface PayoutSettingsResponse {
  stripeConnectStatus: 'NOT_CONNECTED' | 'PENDING' | 'ACTIVE' | 'RESTRICTED';
  stripeAccountId?: string;
  
  payoutSchedule: {
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    dayOfWeek?: 'MONDAY' | 'FRIDAY';  // For weekly
    dayOfMonth?: number;  // 1-28 for monthly
    nextPayoutDate: Date;
  };
  
  payoutMethod: {
    type: 'bank_account' | 'debit_card';
    last4: string;
    bankName?: string;
    cardBrand?: string;
    isVerified: boolean;
  } | null;
  
  minimumPayoutAmount: number;
  holdbackAmount: number;  // Amount held for disputes/refunds
  
  platformCommission: {
    percentage: number;
    fixedFee: number;
  };
  
  canEditSettings: boolean;
  requiresAction: boolean;  // Needs to complete onboarding
  actionUrl?: string;  // Stripe Connect onboarding URL
}
```

#### POST /api/drivers/connect-stripe
Initiates Stripe Connect account setup.

**Request:**
```typescript
interface ConnectStripeRequest {
  returnUrl: string;  // Where to redirect after setup
  refreshUrl: string;  // Where to redirect if user leaves
}
```

**Response:**
```typescript
interface ConnectStripeResponse {
  accountId: string;
  onboardingUrl: string;
  expiresAt: Date;
}
```

#### PUT /api/drivers/payout-settings
Updates payout preferences.

**Request:**
```typescript
interface UpdatePayoutSettingsRequest {
  payoutSchedule?: {
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    dayOfWeek?: string;
    dayOfMonth?: number;
  };
}
```

**Response:**
```typescript
interface UpdatePayoutSettingsResponse {
  success: boolean;
  settings: PayoutSettingsResponse;
}
```

#### POST /api/cron/process-payouts (Scheduled Job)
Cron job endpoint to process scheduled payouts.

**Response:**
```typescript
interface PayoutProcessingResult {
  totalDrivers: number;
  successfulPayouts: number;
  failedPayouts: number;
  skippedDrivers: number;
  totalAmountPaid: number;
  errors: {
    driverId: string;
    error: string;
  }[];
}
```

## Design Specifications

### Visual Layout & Components

**Earnings Dashboard Page:**
```
[Page Header]
├── "Earnings" Title
└── Date Range Selector (This Week, This Month, Custom)

[Summary Cards Row]
├── [Total Earnings Card]
│   ├── Icon: 💰
│   ├── "Total Earnings"
│   ├── Amount: ₸XXX,XXX (large, bold)
│   └── vs. last period: +15% ↑
│
├── [Net Earnings Card]
│   ├── Icon: 💵
│   ├── "Net After Commission"
│   ├── Amount: ₸XXX,XXX (large, green)
│   └── Platform fee: ₸X,XXX (15%)
│
├── [Completed Trips Card]
│   ├── Icon: 🚗
│   ├── "Completed Trips"
│   ├── Count: XXX trips
│   └── Avg per trip: ₸X,XXX
│
└── [Next Payout Card]
    ├── Icon: 📅
    ├── "Next Payout"
    ├── Amount: ₸XXX,XXX (large, blue)
    ├── Date: January 31, 2025
    └── Status: Scheduled ⏰

[Earnings Chart Section]
├── Chart Type Toggle: Line | Bar
├── Time Range: 7D | 1M | 3M | 1Y
└── Earnings Trend Chart
    ├── X-axis: Time periods
    ├── Y-axis: Amount (₸)
    ├── Line 1: Gross Earnings (blue)
    ├── Line 2: Net Earnings (green)
    └── Tooltip: Date, Amount, Trips

[Recent Earnings Table]
├── Table Headers
│   ├── Date
│   ├── Trip Type
│   ├── Gross Amount
│   ├── Commission
│   └── Net Amount
└── Rows (last 10 trips)
    ├── Date & Time
    ├── Badge (Private/Shared)
    ├── ₸XX,XXX
    ├── -₸X,XXX (15%)
    └── ₸XX,XXX (bold)

[Payout Settings Card]
├── "Payout Settings" Heading
├── Connected Account
│   ├── Status: ✓ Connected
│   ├── Bank: •••• 1234 (Chase)
│   └── "Update" Button
├── Payout Schedule
│   ├── Frequency: Weekly (Every Friday)
│   ├── Next Payout: January 31, 2025
│   └── "Change Schedule" Button
└── "View All Payouts" Link
```

**Payout History Page:**
```
[Page Header]
├── "Payout History" Title
├── Total Paid Out: ₸XX,XXX,XXX
└── Filter: All | Paid | Pending | Failed

[Payout List]
├── [Payout Card] × N
│   ├── [Left Section]
│   │   ├── Payout Number: #PAY-XXXXX
│   │   ├── Date Range: Jan 1 - Jan 7, 2025
│   │   └── Trips Included: XX trips
│   │
│   ├── [Center Section]
│   │   ├── Status Badge (Paid ✓ / Pending ⏰ / Failed ✗)
│   │   ├── Gross Earnings: ₸XX,XXX
│   │   ├── Commission: -₸X,XXX (15%)
│   │   └── Net Amount: ₸XX,XXX (large, bold)
│   │
│   └── [Right Section]
│       ├── Paid At: January 10, 2025
│       ├── Method: Bank •••• 1234
│       ├── Arrival: January 12, 2025
│       └── "View Details" Button
│
└── [Pagination]

[Failed Payout Card]
├── Status: Failed ✗
├── Reason: "Bank account closed"
├── Amount: ₸XX,XXX
├── "Update Bank Details" Button (primary)
└── "Retry Payout" Button (secondary)
```

**Stripe Connect Onboarding:**
```
[Onboarding Page]
├── "Set Up Payouts" Heading
├── Progress Steps
│   ├── 1. Business Info ✓
│   ├── 2. Bank Details (active)
│   └── 3. Verification
│
├── [Embedded Stripe Connect UI]
│   ├── Bank Account Form
│   │   ├── Account Holder Name
│   │   ├── Routing Number
│   │   └── Account Number
│   ├── Identity Verification
│   │   ├── ID Upload
│   │   └── Address Verification
│   └── Terms & Conditions
│
└── Action Buttons
    ├── "Continue" (primary)
    └── "Save & Exit" (secondary)
```

**Earnings Detail Modal:**
```
[Modal: Payout Details]
├── Header
│   ├── Payout #PAY-XXXXX
│   └── Close Button
│
├── [Summary Section]
│   ├── Period: Jan 1 - Jan 7, 2025
│   ├── Total Trips: XX trips
│   ├── Status: Paid ✓
│   └── Paid At: January 10, 2025
│
├── [Earnings Breakdown]
│   ├── Table
│   │   ├── Gross Earnings: ₸XX,XXX
│   │   ├── Platform Fee (15%): -₸X,XXX
│   │   ├── Refunds/Adjustments: -₸XXX
│   │   └── Net Payout: ₸XX,XXX (bold)
│   │
│   └── Trip Details Table
│       ├── Date | Trip | Amount | Commission | Net
│       └── Rows for each trip
│
├── [Payment Details]
│   ├── Payment Method: Bank •••• 1234
│   ├── Transfer ID: tr_XXXXXXXXX
│   └── Expected Arrival: January 12, 2025
│
└── Actions
    ├── "Download Statement" (PDF)
    └── "Report Issue" (support)
```

### Design System Compliance

**Color Palette:**
```css
/* Earnings Colors */
--earnings-gross: #3b82f6;      /* bg-blue-500 */
--earnings-net: #10b981;        /* bg-emerald-500 */
--commission: #ef4444;          /* bg-red-500 */

/* Payout Status Colors */
--payout-paid: #10b981;         /* bg-emerald-500 */
--payout-pending: #f59e0b;      /* bg-amber-500 */
--payout-processing: #3b82f6;   /* bg-blue-500 */
--payout-failed: #ef4444;       /* bg-red-500 */

/* Chart Colors */
--chart-primary: #3b82f6;       /* Blue line */
--chart-secondary: #10b981;     /* Green line */
--chart-grid: #e5e7eb;          /* Light gray grid */
```

**Typography:**
```css
/* Earnings Dashboard */
.earnings-amount {
  @apply text-4xl font-bold text-gray-900;
}

.earnings-label {
  @apply text-sm font-medium text-gray-600;
}

.commission-amount {
  @apply text-base font-medium text-red-600;
}

/* Payout Cards */
.payout-number {
  @apply text-lg font-semibold text-gray-900;
}

.payout-amount {
  @apply text-2xl font-bold text-emerald-600;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.earnings-page-mobile {
  @apply flex flex-col space-y-4 px-4 pb-20;
}

.summary-cards-mobile {
  @apply grid grid-cols-2 gap-4;
  /* 2x2 grid */
}

.chart-mobile {
  @apply w-full h-64;
  /* Simplified chart */
}

.payout-card-mobile {
  @apply flex flex-col space-y-2 p-4;
}
```

**Desktop Layout (1024px+)**:
```css
.earnings-page-desktop {
  @apply max-w-7xl mx-auto px-8 py-8;
}

.summary-cards-desktop {
  @apply grid grid-cols-4 gap-6;
}

.chart-desktop {
  @apply w-full h-96;
}

.payout-card-desktop {
  @apply grid grid-cols-12 gap-4 p-6;
}
```

## Technical Architecture

### Component Structure

```
src/app/
├── driver/
│   └── earnings/
│       ├── page.tsx                          # Earnings dashboard ⬜
│       ├── loading.tsx                       # Loading state ⬜
│       ├── components/
│       │   ├── EarningsDashboard.tsx         # Main dashboard ⬜
│       │   ├── EarningsSummaryCards.tsx      # Stats cards ⬜
│       │   ├── EarningsChart.tsx             # Trend chart ⬜
│       │   ├── RecentEarningsTable.tsx       # Trip earnings ⬜
│       │   ├── PayoutSettingsCard.tsx        # Settings widget ⬜
│       │   └── NextPayoutWidget.tsx          # Upcoming payout ⬜
│       │
│       └── payouts/
│           ├── page.tsx                      # Payout history ⬜
│           └── components/
│               ├── PayoutHistoryList.tsx     # Payout list ⬜
│               ├── PayoutCard.tsx            # Payout summary card ⬜
│               ├── PayoutDetailModal.tsx     # Detail view ⬜
│               ├── PayoutStatusBadge.tsx     # Status indicator ⬜
│               └── FailedPayoutAlert.tsx     # Error handling ⬜
│
├── api/
│   ├── drivers/
│   │   ├── earnings/
│   │   │   └── route.ts                      # GET earnings data ⬜
│   │   ├── payouts/
│   │   │   └── route.ts                      # GET payout history ⬜
│   │   ├── payout-settings/
│   │   │   └── route.ts                      # GET/PUT settings ⬜
│   │   └── connect-stripe/
│   │       └── route.ts                      # POST Stripe Connect ⬜
│   │
│   └── cron/
│       └── process-payouts/
│           └── route.ts                      # Scheduled payout job ⬜
│
└── webhooks/
    └── stripe-connect/
        └── route.ts                          # Stripe Connect webhooks ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface DriverEarningsStore {
  // Earnings Data
  earnings: {
    summary: EarningsSummary | null;
    breakdown: EarningsBreakdown | null;
    isLoading: boolean;
    error: string | null;
    period: EarningsPeriod;
  };
  
  // Payout Data
  payouts: {
    items: PayoutSummary[];
    isLoading: boolean;
    error: string | null;
    pagination: PaginationState;
  };
  
  // Payout Settings
  settings: {
    data: PayoutSettingsResponse | null;
    isLoading: boolean;
    isConnected: boolean;
    requiresAction: boolean;
  };
  
  // Actions
  loadEarnings: (period?: EarningsPeriod) => Promise<void>;
  loadPayouts: (page?: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  connectStripe: (returnUrl: string) => Promise<string>;
  updateSchedule: (schedule: PayoutSchedule) => Promise<void>;
}

interface EarningsPeriod {
  type: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}
```

### Database Schema Updates

```prisma
model User {
  // ... existing fields
  
  // Stripe Connect
  stripeConnectAccountId String?   @unique
  stripeConnectStatus    String?   // active, pending, restricted
  stripeOnboardedAt      DateTime?
  
  earnings Earning[]
  payouts  Payout[]
}

model Earning {
  id              String   @id @default(cuid())
  driverId        String
  driver          User     @relation(fields: [driverId], references: [id])
  bookingId       String
  booking         Booking  @relation(fields: [bookingId], references: [id])
  
  // Amounts
  grossAmount     Int      // Total trip cost
  platformFee     Int      // Commission taken by platform
  platformFeePercentage Float
  netAmount       Int      // Amount driver receives
  currency        String   @default("KZT")
  
  // Trip Info
  tripCompletedAt DateTime
  tripType        String   // PRIVATE, SHARED, ACTIVITY
  
  // Payout Association
  payoutId        String?
  payout          Payout?  @relation(fields: [payoutId], references: [id])
  
  createdAt       DateTime @default(now())
  
  @@index([driverId, tripCompletedAt])
  @@index([payoutId])
}

model Payout {
  id              String   @id @default(cuid())
  payoutNumber    String   @unique
  driverId        String
  driver          User     @relation(fields: [driverId], references: [id])
  
  // Period
  periodStart     DateTime
  periodEnd       DateTime
  
  // Amounts
  grossEarnings   Int
  platformFee     Int
  platformFeePercentage Float
  adjustments     Int      @default(0)  // Refunds, bonuses, etc.
  netAmount       Int
  currency        String   @default("KZT")
  
  // Status
  status          String   // PENDING, PROCESSING, PAID, FAILED, CANCELLED
  scheduledDate   DateTime
  processedAt     DateTime?
  paidAt          DateTime?
  arrivalDate     DateTime?
  
  // Stripe Info
  stripePayoutId  String?  @unique
  stripeTransferId String? @unique
  
  // Failure Info
  failureCode     String?
  failureMessage  String?
  retryCount      Int      @default(0)
  
  // Associated Earnings
  earnings        Earning[]
  tripsCount      Int
  
  // Metadata
  metadata        Json?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([driverId, status])
  @@index([scheduledDate])
}

model PayoutSchedule {
  id              String   @id @default(cuid())
  driverId        String   @unique
  driver          User     @relation(fields: [driverId], references: [id])
  
  frequency       String   // WEEKLY, BIWEEKLY, MONTHLY
  dayOfWeek       String?  // For weekly: MONDAY, FRIDAY, etc.
  dayOfMonth      Int?     // For monthly: 1-28
  
  minimumAmount   Int      @default(5000)  // Minimum payout threshold
  
  nextPayoutDate  DateTime
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### API Integration Schema

**Stripe Connect Integration:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create Connect account
async function createConnectAccount(driver: User) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'KZ',  // Kazakhstan
    email: driver.email,
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      product_description: 'Driver services for StepperGO',
    },
  });
  
  return account.id;
}

// Create onboarding link
async function createOnboardingLink(accountId: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.APP_URL}/driver/earnings/connect-failed`,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  
  return accountLink.url;
}

// Create payout/transfer
async function createPayout(payout: Payout, driver: User) {
  const transfer = await stripe.transfers.create({
    amount: payout.netAmount,
    currency: 'kzt',
    destination: driver.stripeConnectAccountId!,
    description: `Payout for period ${payout.periodStart} - ${payout.periodEnd}`,
    metadata: {
      payoutId: payout.id,
      driverId: driver.id,
      periodStart: payout.periodStart.toISOString(),
      periodEnd: payout.periodEnd.toISOString(),
    },
  });
  
  return transfer.id;
}
```

**Payout Calculation Logic:**
```typescript
interface PayoutCalculation {
  grossEarnings: number;
  platformFee: number;
  platformFeePercentage: number;
  adjustments: number;
  netAmount: number;
}

async function calculateDriverPayout(
  driverId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayoutCalculation> {
  // Get all completed trips in period
  const earnings = await prisma.earning.findMany({
    where: {
      driverId,
      tripCompletedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
      payoutId: null,  // Not yet paid out
    },
  });
  
  const grossEarnings = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
  const platformFee = earnings.reduce((sum, e) => sum + e.platformFee, 0);
  
  // Calculate adjustments (refunds, bonuses, etc.)
  const adjustments = await calculateAdjustments(driverId, periodStart, periodEnd);
  
  const netAmount = grossEarnings - platformFee + adjustments;
  const platformFeePercentage = (platformFee / grossEarnings) * 100;
  
  return {
    grossEarnings,
    platformFee,
    platformFeePercentage,
    adjustments,
    netAmount,
  };
}
```

## Implementation Requirements

### Core Components

#### 1. EarningsDashboard.tsx ⬜
**Purpose**: Main earnings overview

**Features**:
- Summary cards
- Earnings trend chart
- Period selection
- Next payout widget

#### 2. EarningsChart.tsx ⬜
**Purpose**: Visual earnings trends

**Features**:
- Line/bar chart toggle
- Time range selection
- Gross vs. net comparison
- Interactive tooltips

#### 3. PayoutHistoryList.tsx ⬜
**Purpose**: Payout history display

**Features**:
- Paginated list
- Status filtering
- Detail modal
- Failed payout alerts

#### 4. StripeConnectOnboarding.tsx ⬜
**Purpose**: Stripe Connect setup

**Features**:
- Embedded Stripe UI
- Progress tracking
- Error handling
- Return URL handling

### Custom Hooks

#### useDriverEarnings() ⬜
```typescript
interface UseDriverEarningsReturn {
  earnings: EarningsSummary | null;
  breakdown: EarningsBreakdown | null;
  isLoading: boolean;
  error: string | null;
  
  loadEarnings: (period?: EarningsPeriod) => Promise<void>;
  refreshEarnings: () => Promise<void>;
}
```

#### usePayouts() ⬜
```typescript
interface UsePayoutsReturn {
  payouts: PayoutSummary[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  
  loadPayouts: (page?: number) => Promise<void>;
  loadPayoutDetail: (payoutId: string) => Promise<PayoutDetail>;
}
```

### Utility Functions

#### src/lib/payouts/payout-calculator.ts ⬜
```typescript
export async function calculatePayout(
  driverId: string,
  period: DateRange
): Promise<PayoutCalculation>;

export function calculatePlatformFee(
  grossAmount: number,
  feePercentage: number
): number;

export function generatePayoutNumber(): string;
```

## Acceptance Criteria

### Functional Requirements

#### 1. Earnings Dashboard ⬜
- [x] Shows total and net earnings
- [x] Displays platform commission
- [x] Shows completed trips count
- [x] Next payout amount and date visible
- [x] Chart displays trends correctly

#### 2. Payout History ⬜
- [x] Lists all payouts with pagination
- [x] Status badges display correctly
- [x] Failed payouts highlighted
- [x] Detail modal shows breakdown
- [x] Can download payout statements

#### 3. Stripe Connect ⬜
- [x] Onboarding flow completes
- [x] Bank account connected
- [x] Verification successful
- [x] Status displayed in dashboard

#### 4. Automated Payouts ⬜
- [x] Cron job runs on schedule
- [x] Payouts calculated correctly
- [x] Stripe transfers initiated
- [x] Status updated automatically
- [x] Email notifications sent

### Non-Functional Requirements

#### Performance ⬜
- [x] Dashboard loads <2 seconds
- [x] Payout calculation <10 seconds
- [x] Chart renders <500ms
- [x] Cron job completes <5 minutes

#### Security ⬜
- [x] Bank details encrypted
- [x] Stripe webhooks verified
- [x] Audit logging enabled
- [x] PCI compliance maintained

## Modified Files

```
src/app/driver/earnings/
├── page.tsx                                      ⬜
├── loading.tsx                                   ⬜
├── components/
│   ├── EarningsDashboard.tsx                     ⬜
│   ├── EarningsSummaryCards.tsx                  ⬜
│   ├── EarningsChart.tsx                         ⬜
│   ├── RecentEarningsTable.tsx                   ⬜
│   ├── PayoutSettingsCard.tsx                    ⬜
│   └── NextPayoutWidget.tsx                      ⬜
├── payouts/
│   ├── page.tsx                                  ⬜
│   └── components/
│       ├── PayoutHistoryList.tsx                 ⬜
│       ├── PayoutCard.tsx                        ⬜
│       ├── PayoutDetailModal.tsx                 ⬜
│       └── FailedPayoutAlert.tsx                 ⬜
└── connect/
    ├── page.tsx                                  ⬜
    └── StripeConnectOnboarding.tsx               ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Stripe Connect Setup (Week 1) ⬜
- [ ] Stripe Connect configuration
- [ ] Account creation flow
- [ ] Onboarding integration
- [ ] Database schema

### Phase 2: Earnings Dashboard (Week 1-2) ⬜
- [ ] Dashboard UI
- [ ] Charts implementation
- [ ] Earnings calculation
- [ ] Period filtering

### Phase 3: Payout System (Week 2-3) ⬜
- [ ] Payout history
- [ ] Payout calculation logic
- [ ] Stripe transfer integration
- [ ] Status tracking

### Phase 4: Automation (Week 3) ⬜
- [ ] Cron job setup
- [ ] Automated payout processing
- [ ] Email notifications
- [ ] Error handling

### Phase 5: Testing (Week 3-4) ⬜
- [ ] Unit tests
- [ ] Integration tests
- [ ] Payout simulation
- [ ] E2E testing

## Dependencies

- **Stripe Connect**: Express accounts
- **Story 33-38**: Booking/payment infrastructure
- **Vercel Cron**: Scheduled jobs
- **Email Service**: Notifications

## Risk Assessment

### Technical Risks

#### Risk 1: Stripe Transfer Failures
- **Impact**: Critical (drivers not paid)
- **Mitigation**: Retry logic + alerts
- **Contingency**: Manual processing

#### Risk 2: Commission Calculation Errors
- **Impact**: High (financial disputes)
- **Mitigation**: Extensive testing + audit logs
- **Contingency**: Manual adjustments

## Testing Strategy

```typescript
describe('Driver Payouts', () => {
  it('calculates earnings correctly', () => {
    // Test calculation logic
  });
  
  it('processes automated payout', async () => {
    // Test payout flow
  });
  
  it('handles Stripe transfer failure', async () => {
    // Test error handling
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 weeks (1 developer)
