# 38 - Passenger View Trip History and Receipts - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM  
**Infrastructure**: Vercel (hosting), PDF Generation (react-pdf or Puppeteer), Email (Postmark/SendGrid)

## User Story

**As a** passenger,  
**I want** to view my past trips and download receipts,  
**so that** I can keep records for personal tracking, expense claims, or tax purposes.

## Pre-conditions

- User must be authenticated (registered as PASSENGER role)
- User must have at least one completed or cancelled booking
- Story 33-37 (Booking and trip management) completed
- PDF generation library installed
- Email service configured

## Business Requirements

- **BR-1**: Enable passengers to access complete trip history for record-keeping
  - Success Metric: >70% of passengers access trip history within 3 months
  - Performance: History page loads <1.5 seconds

- **BR-2**: Provide professional receipts for business expense claims
  - Success Metric: >50% of receipts downloaded within 48 hours of trip completion
  - Performance: PDF generation <3 seconds

- **BR-3**: Support email receipt delivery for convenience
  - Success Metric: >95% email delivery success rate
  - Performance: Email sent within 30 seconds of request

- **BR-4**: Maintain data privacy and security for payment information
  - Success Metric: Zero PII exposure incidents
  - Performance: Masked payment data displayed instantly

## Technical Specifications

### Integration Points
- **PDF Generation**: react-pdf or Puppeteer for receipt creation
- **Email Service**: Postmark/SendGrid for receipt delivery
- **Storage**: Vercel Blob or S3 for PDF storage (optional caching)
- **Payment Data**: Stripe API for masked card details
- **Database**: PostgreSQL with booking and payment history

### Security Requirements
- User can only view own trip history (RBAC)
- Payment data masked (show last 4 digits only)
- Receipt generation rate limited (5 per minute)
- No full card numbers in receipts or logs
- Audit logging for receipt downloads

### API Endpoints

#### GET /api/bookings/history
Retrieves user's trip history with pagination and filtering.

**Query Parameters:**
```typescript
interface TripHistoryQuery {
  page?: number;
  limit?: number;  // Default: 20
  status?: 'COMPLETED' | 'CANCELLED' | 'ALL';
  tripType?: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'date' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface TripHistoryResponse {
  trips: TripHistorySummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalTrips: number;
    totalSpent: number;
    completedTrips: number;
    cancelledTrips: number;
  };
}

interface TripHistorySummary {
  id: string;
  bookingReference: string;
  
  // Trip Details
  trip: {
    title: string;
    originName: string;
    destName: string;
    departureTime: Date;
    completedAt?: Date;
  };
  
  // Booking Info
  status: 'COMPLETED' | 'CANCELLED';
  tripType: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  seatsBooked: number;
  
  // Payment Info
  totalAmount: number;
  currency: 'KZT';
  paymentStatus: 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  
  // Driver Info (if applicable)
  driver?: {
    name: string;
    rating: number;
  };
  
  // Receipt Availability
  hasReceipt: boolean;
  receiptAvailable: boolean;
  
  createdAt: Date;
}
```

#### GET /api/bookings/:bookingId/history-details
Retrieves detailed trip history for a specific booking.

**Response:**
```typescript
interface TripHistoryDetailResponse {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  
  // Trip Information
  trip: {
    id: string;
    title: string;
    description: string;
    originName: string;
    originAddress: string;
    destName: string;
    destAddress: string;
    departureTime: Date;
    returnTime?: Date;
    completedAt?: Date;
    distance: number;
    estimatedDuration: string;
    actualDuration?: string;
  };
  
  // Driver Information
  driver?: {
    name: string;
    phone: string;  // Masked
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;  // Partially masked
    };
    rating: number;
    totalTrips: number;
  };
  
  // Passenger Details
  passengers: PassengerInfo[];
  seatsBooked: number;
  specialRequests?: string;
  
  // Payment Information
  payment: {
    totalAmount: number;
    baseAmount: number;
    platformFee: number;
    taxes: number;
    currency: 'KZT';
    
    paymentMethod: string;  // "Visa ending in 1234"
    last4: string;
    brand: string;
    
    paymentStatus: string;
    paidAt: Date;
    
    // Refund Info (if cancelled)
    refundAmount?: number;
    refundStatus?: string;
    refundedAt?: Date;
  };
  
  // Cancellation Info (if applicable)
  cancellation?: {
    cancelledAt: Date;
    reason?: string;
    refundAmount: number;
    refundStatus: string;
  };
  
  // Receipt Info
  receipt: {
    available: boolean;
    receiptNumber: string;
    issuedAt: Date;
    downloadUrl?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### GET /api/bookings/:bookingId/receipt
Generates and returns PDF receipt.

**Query Parameters:**
```typescript
interface ReceiptQuery {
  format?: 'pdf' | 'html';  // Default: pdf
  download?: boolean;  // Default: true (force download)
}
```

**Response (PDF):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-BOOKING_REF.pdf"
[PDF Binary Data]
```

**Response (HTML):**
```typescript
interface ReceiptHTMLResponse {
  html: string;  // Formatted HTML for printing
  styles: string;  // CSS styles
}
```

#### POST /api/bookings/:bookingId/email-receipt
Sends receipt to user's email.

**Request:**
```typescript
interface EmailReceiptRequest {
  email?: string;  // Optional: override default email
  includeItinerary?: boolean;  // Include full trip details
}
```

**Response:**
```typescript
interface EmailReceiptResponse {
  success: boolean;
  emailSent: boolean;
  sentTo: string;
  messageId?: string;  // Email service message ID
  estimatedDelivery: string;  // "within 2 minutes"
}
```

## Design Specifications

### Visual Layout & Components

**Trip History Page Layout:**
```
[Page Header]
├── "Trip History" Title
├── Summary Cards Row
│   ├── Total Trips Card
│   ├── Total Spent Card
│   ├── Completed Trips Card
│   └── Cancelled Trips Card
└── "Download All Receipts" Button (if >1 completed trip)

[Filter & Sort Bar]
├── Date Range Picker
│   ├── Quick Filters: This Month, Last 3 Months, This Year, All Time
│   └── Custom Range
├── Status Filter Dropdown
│   ├── All
│   ├── Completed
│   └── Cancelled
├── Trip Type Filter
│   ├── All Types
│   ├── Private
│   ├── Shared
│   └── Activities
└── Sort Dropdown (Date/Amount/Status)

[Trip History List/Timeline]
├── [Trip History Card] × N
│   ├── [Left Section - Date Badge]
│   │   ├── Month (e.g., "JAN")
│   │   └── Day (e.g., "15")
│   │
│   ├── [Center Section - Trip Details]
│   │   ├── Origin → Destination
│   │   ├── Trip Type Badge (Private/Shared/Activity)
│   │   ├── Status Badge (Completed ✓ / Cancelled ✗)
│   │   ├── Date & Time
│   │   ├── Driver Name (if available)
│   │   └── Booking Reference: #XXXXX
│   │
│   └── [Right Section - Payment & Actions]
│       ├── Amount: ₸XX,XXX
│       ├── Payment Status (Paid/Refunded)
│       ├── Actions
│       │   ├── "View Details" Button
│       │   ├── "Download Receipt" Button (PDF icon)
│       │   └── "Email Receipt" Button (Email icon)
│       └── Receipt Indicator (if downloaded)
│
└── [Pagination Controls]

[Empty State]
└── "No trips found" with "Book a Trip" CTA
```

**Trip History Detail Modal/Page:**
```
[Modal Header]
├── "Trip Details" Title
├── Booking Reference: #XXXXX
└── Close Button

[Trip Summary Section]
├── Route Map (Static Image)
├── Origin → Destination
├── Date & Time
├── Duration & Distance
└── Status Badge

[Itinerary Section]
├── Timeline Visualization
│   ├── Booking Created ✓
│   ├── Payment Confirmed ✓
│   ├── Driver Assigned ✓
│   ├── Trip Started ✓
│   └── Trip Completed ✓
└── Detailed Stops (if multi-stop)

[Driver Section] (if applicable)
├── Driver Photo
├── Name & Rating
├── Vehicle Details
└── Contact (masked)

[Passenger Section]
├── Passenger Names
├── Seats Booked
└── Special Requests

[Payment Section]
├── Price Breakdown Table
│   ├── Base Fare: ₸XX,XXX
│   ├── Platform Fee: ₸XXX
│   ├── Taxes: ₸XXX
│   └── Total: ₸XX,XXX (bold)
├── Payment Method: Visa •••• 1234
├── Payment Status: Paid ✓
├── Payment Date
└── Transaction ID

[Cancellation Section] (if cancelled)
├── Cancelled At
├── Cancellation Reason
├── Refund Amount: ₸XX,XXX
└── Refund Status

[Action Buttons]
├── "Download Receipt" (primary)
├── "Email Receipt" (secondary)
└── "Print" Button (tertiary)
```

**PDF Receipt Template:**
```
[Receipt Header]
├── StepperGO Logo
├── "RECEIPT" Title
├── Receipt Number: RCP-XXXXXXXXX
└── Issue Date

[Company Information]
├── StepperGO
├── Address Line 1
├── Address Line 2
└── Tax ID: XXXXXXXXX

[Customer Information]
├── Passenger Name
├── Email
└── Phone (masked)

[Trip Details]
├── Booking Reference: #XXXXX
├── Trip Date: DD/MM/YYYY HH:MM
├── Origin: Full Address
├── Destination: Full Address
├── Trip Type: Private/Shared
└── Distance: X.X km

[Driver Information] (if applicable)
├── Driver Name
├── Vehicle: Make Model (Color)
└── License Plate: XXX-XXX

[Payment Breakdown Table]
┌─────────────────────────────┬───────────┐
│ Description                 │ Amount    │
├─────────────────────────────┼───────────┤
│ Base Fare                   │ ₸XX,XXX   │
│ Platform Fee                │ ₸XXX      │
│ Taxes (XX%)                 │ ₸XXX      │
├─────────────────────────────┼───────────┤
│ TOTAL                       │ ₸XX,XXX   │
└─────────────────────────────┴───────────┘

[Payment Information]
├── Payment Method: Visa ending in 1234
├── Transaction ID: txn_XXXXXXXXX
├── Payment Date: DD/MM/YYYY HH:MM
└── Status: PAID

[Footer]
├── "Thank you for choosing StepperGO"
├── Support Email: support@steppergo.com
├── Website: www.steppergo.com
└── Terms & Conditions apply
```

### Design System Compliance

**Color Palette:**
```css
/* Trip Status Colors */
--trip-completed: #10b981;      /* bg-emerald-500 */
--trip-cancelled: #ef4444;      /* bg-red-500 */

/* Payment Status Colors */
--payment-paid: #10b981;        /* bg-emerald-500 */
--payment-refunded: #8b5cf6;    /* bg-violet-500 */
--payment-partial: #f59e0b;     /* bg-amber-500 */

/* Receipt Colors */
--receipt-bg: #ffffff;          /* bg-white */
--receipt-border: #e5e7eb;      /* border-gray-200 */
--receipt-text: #1f2937;        /* text-gray-800 */
--receipt-heading: #111827;     /* text-gray-900 */
```

**Typography:**
```css
/* History Page */
.page-title {
  @apply text-3xl font-bold text-gray-900;
}

.trip-destination {
  @apply text-lg font-semibold text-gray-900;
}

.trip-details {
  @apply text-sm text-gray-600;
}

/* Receipt Typography */
.receipt-title {
  @apply text-2xl font-bold text-gray-900;
}

.receipt-section-title {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.receipt-text {
  @apply text-base text-gray-700;
}

.receipt-amount {
  @apply text-xl font-bold text-gray-900;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.history-page-mobile {
  @apply flex flex-col space-y-4 px-4 pb-20;
}

.trip-card-mobile {
  @apply w-full rounded-lg border-2 border-gray-200;
  @apply p-4 space-y-3;
}

.trip-card-mobile .date-badge {
  @apply absolute top-2 left-2;
  @apply w-12 h-12 rounded bg-blue-600 text-white;
  @apply flex flex-col items-center justify-center;
}

.trip-card-mobile .actions {
  @apply flex flex-col space-y-2 w-full;
}

.filter-bar-mobile {
  @apply flex flex-col space-y-2 px-4 py-3;
  @apply sticky top-14 z-30 bg-white;
}
```

**Desktop Layout (1024px+)**:
```css
.history-page-desktop {
  @apply max-w-7xl mx-auto px-8 py-8;
}

.trip-card-desktop {
  @apply grid grid-cols-12 gap-4;
  @apply rounded-lg border border-gray-200;
  @apply p-6 hover:shadow-lg transition-shadow;
}

.trip-card-desktop .date-badge {
  @apply col-span-1;
}

.trip-card-desktop .trip-details {
  @apply col-span-8;
}

.trip-card-desktop .payment-actions {
  @apply col-span-3 text-right;
}
```

### Interaction Patterns

**Receipt Download States:**
```typescript
interface ReceiptDownloadStates {
  idle: {
    text: 'Download Receipt',
    icon: 'download',
    cursor: 'cursor-pointer',
  };
  generating: {
    text: 'Generating...',
    icon: 'spinner',
    cursor: 'cursor-wait',
  };
  downloading: {
    text: 'Downloading...',
    icon: 'download',
    cursor: 'cursor-wait',
  };
  success: {
    text: 'Downloaded ✓',
    icon: 'check',
    cursor: 'cursor-default',
    duration: 2000,  // Reset after 2s
  };
  error: {
    text: 'Try Again',
    icon: 'alert',
    cursor: 'cursor-pointer',
  };
}
```

**Email Receipt States:**
```typescript
interface EmailReceiptStates {
  idle: 'Send to Email';
  sending: 'Sending...';
  success: 'Email Sent ✓';
  error: 'Failed. Try Again';
}
```

## Technical Architecture

### Component Structure

```
src/app/
├── bookings/
│   └── history/
│       ├── page.tsx                          # History page ⬜
│       ├── loading.tsx                       # Loading skeleton ⬜
│       └── components/
│           ├── TripHistoryList.tsx           # Main list component ⬜
│           ├── TripHistoryCard.tsx           # Individual trip card ⬜
│           ├── HistorySummaryCards.tsx       # Stats cards ⬜
│           ├── HistoryFilters.tsx            # Date/status filters ⬜
│           ├── DateRangePicker.tsx           # Date range selector ⬜
│           ├── TripDetailModal.tsx           # Detail modal ⬜
│           ├── TripTimeline.tsx              # Visual timeline ⬜
│           ├── ReceiptDownloadButton.tsx     # Download button ⬜
│           ├── EmailReceiptButton.tsx        # Email button ⬜
│           └── HistoryEmptyState.tsx         # No trips message ⬜
└── api/
    └── bookings/
        ├── history/
        │   └── route.ts                      # GET trip history ⬜
        ├── [bookingId]/
        │   ├── history-details/
        │   │   └── route.ts                  # GET trip detail ⬜
        │   ├── receipt/
        │   │   └── route.ts                  # GET/generate receipt ⬜
        │   └── email-receipt/
        │       └── route.ts                  # POST email receipt ⬜
        └── receipts/
            └── bulk-download/
                └── route.ts                  # POST bulk download ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface TripHistoryStore {
  // Trip History State
  history: {
    trips: TripHistorySummary[];
    isLoading: boolean;
    error: string | null;
    filters: HistoryFilters;
    pagination: PaginationState;
    summary: HistorySummary;
  };
  
  // Selected Trip Detail
  selectedTrip: TripHistoryDetailResponse | null;
  isLoadingDetail: boolean;
  
  // Receipt State
  receipts: {
    generating: Set<string>;  // Booking IDs
    downloading: Set<string>;
    emailing: Set<string>;
    errors: Map<string, string>;
  };
  
  // Actions
  loadHistory: (filters?: HistoryFilters) => Promise<void>;
  loadTripDetail: (bookingId: string) => Promise<TripHistoryDetailResponse>;
  updateFilters: (filters: Partial<HistoryFilters>) => void;
  downloadReceipt: (bookingId: string, format: 'pdf' | 'html') => Promise<void>;
  emailReceipt: (bookingId: string, email?: string) => Promise<void>;
  bulkDownloadReceipts: (bookingIds: string[]) => Promise<void>;
}

interface HistoryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status: 'ALL' | 'COMPLETED' | 'CANCELLED';
  tripType?: 'PRIVATE' | 'SHARED' | 'ACTIVITY';
  sortBy: 'date' | 'amount' | 'status';
  sortOrder: 'asc' | 'desc';
}
```

**Local Component State:**
```typescript
// TripDetailModal.tsx
interface TripDetailModalState {
  isOpen: boolean;
  activeTab: 'details' | 'payment' | 'timeline';
  isPrinting: boolean;
}

// ReceiptDownloadButton.tsx
interface ReceiptButtonState {
  status: 'idle' | 'generating' | 'downloading' | 'success' | 'error';
  progress: number;  // 0-100 for progress bar
  errorMessage: string | null;
}
```

### Database Schema Updates

```prisma
model Booking {
  // ... existing fields
  
  // History/Receipt Fields
  receiptNumber     String?   @unique
  receiptIssuedAt   DateTime?
  receiptDownloadCount Int    @default(0)
  lastReceiptEmailSent DateTime?
  
  @@index([userId, status, departureTime])
}

model Receipt {
  id                String   @id @default(cuid())
  bookingId         String   @unique
  booking           Booking  @relation(fields: [bookingId], references: [id])
  
  receiptNumber     String   @unique
  issuedAt          DateTime @default(now())
  
  // PDF Storage (optional)
  pdfUrl            String?
  pdfGeneratedAt    DateTime?
  
  // Metadata
  downloadCount     Int      @default(0)
  lastDownloadedAt  DateTime?
  emailSentCount    Int      @default(0)
  lastEmailSentAt   DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([bookingId])
  @@index([receiptNumber])
}
```

### API Integration Schema

**PDF Generation (react-pdf):**
```typescript
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  table: {
    width: '100%',
    border: '1px solid #000',
  },
  // ... more styles
});

const ReceiptPDF = ({ booking }: { booking: BookingDetailResponse }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text>RECEIPT</Text>
        <Text style={styles.receiptNumber}>#{booking.receiptNumber}</Text>
      </View>
      
      {/* Trip Details */}
      <View style={styles.section}>
        <Text>Trip Date: {formatDate(booking.trip.departureTime)}</Text>
        <Text>From: {booking.trip.originName}</Text>
        <Text>To: {booking.trip.destName}</Text>
      </View>
      
      {/* Payment Table */}
      <View style={styles.table}>
        {/* Table rows */}
      </View>
    </Page>
  </Document>
);

// Server-side generation
import { renderToStream } from '@react-pdf/renderer';

async function generateReceiptPDF(booking: Booking): Promise<Buffer> {
  const stream = await renderToStream(<ReceiptPDF booking={booking} />);
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
```

**Email Integration:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function emailReceipt(
  booking: Booking,
  recipientEmail: string,
  pdfBuffer: Buffer
) {
  await resend.emails.send({
    from: 'StepperGO <receipts@steppergo.com>',
    to: recipientEmail,
    subject: `Your StepperGO Receipt - Booking #${booking.bookingReference}`,
    html: `
      <h2>Thank you for traveling with StepperGO!</h2>
      <p>Please find your receipt attached for:</p>
      <ul>
        <li>Booking Reference: ${booking.bookingReference}</li>
        <li>Trip Date: ${formatDate(booking.trip.departureTime)}</li>
        <li>Amount: ₸${booking.totalAmount.toLocaleString()}</li>
      </ul>
      <p>Need help? Contact us at support@steppergo.com</p>
    `,
    attachments: [
      {
        filename: `receipt-${booking.bookingReference}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
```

## Implementation Requirements

### Core Components

#### 1. TripHistoryList.tsx ⬜
**Purpose**: Main list with pagination

**Features**:
- Paginated trip list
- Filtering by date/status
- Sorting options
- Empty state handling

#### 2. TripHistoryCard.tsx ⬜
**Purpose**: Individual trip display card

**Features**:
- Trip summary display
- Status badges
- Quick actions (view, download, email)
- Payment info display

#### 3. TripDetailModal.tsx ⬜
**Purpose**: Comprehensive trip details modal

**Features**:
- Full trip information
- Driver/passenger details
- Payment breakdown
- Action buttons

#### 4. ReceiptDownloadButton.tsx ⬜
**Purpose**: PDF receipt download

**Features**:
- One-click download
- Progress indication
- Error handling
- Format selection (PDF/HTML)

#### 5. EmailReceiptButton.tsx ⬜
**Purpose**: Email receipt delivery

**Features**:
- Email sending
- Success confirmation
- Custom email input (optional)
- Delivery status

### Custom Hooks

#### useTripHistory() ⬜
```typescript
interface UseTripHistoryReturn {
  trips: TripHistorySummary[];
  isLoading: boolean;
  error: string | null;
  filters: HistoryFilters;
  pagination: PaginationState;
  summary: HistorySummary;
  
  updateFilters: (filters: Partial<HistoryFilters>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

#### useReceiptDownload() ⬜
```typescript
interface UseReceiptDownloadReturn {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  
  downloadReceipt: (bookingId: string, format?: 'pdf' | 'html') => Promise<void>;
  emailReceipt: (bookingId: string, email?: string) => Promise<boolean>;
}
```

### Utility Functions

#### src/lib/receipts/receipt-generator.ts ⬜
```typescript
export async function generateReceiptPDF(
  booking: BookingDetailResponse
): Promise<Buffer>;

export function generateReceiptHTML(
  booking: BookingDetailResponse
): string;

export function generateReceiptNumber(
  bookingId: string
): string;

export function formatReceiptDate(
  date: Date
): string;
```

#### src/lib/receipts/receipt-validator.ts ⬜
```typescript
export function isReceiptAvailable(
  booking: Booking
): boolean;

export function validateReceiptData(
  booking: Booking
): ValidationResult;

export function sanitizePaymentData(
  payment: Payment
): SanitizedPayment;
```

## Acceptance Criteria

### Functional Requirements

#### 1. Trip History Display ⬜
- [x] Shows all completed and cancelled trips
- [x] Pagination works (20 trips per page)
- [x] Date range filtering functional
- [x] Status filtering works
- [x] Trip type filtering works
- [x] Sorting by date/amount works

#### 2. Trip Details ⬜
- [x] Shows complete trip information
- [x] Displays driver details
- [x] Shows payment breakdown
- [x] Shows cancellation info (if cancelled)
- [x] Displays masked payment data

#### 3. Receipt Download ⬜
- [x] PDF generates correctly
- [x] All required fields included
- [x] Receipt number unique and sequential
- [x] Download triggers immediately
- [x] HTML format available for printing

#### 4. Email Receipt ⬜
- [x] Email sent within 30 seconds
- [x] PDF attached correctly
- [x] Email content formatted properly
- [x] Delivery confirmation shown
- [x] Can resend if failed

#### 5. Data Security ⬜
- [x] Payment card masked (last 4 only)
- [x] Driver phone masked
- [x] No PII in logs
- [x] User can only view own history
- [x] Rate limiting enforced

### Non-Functional Requirements

#### Performance ⬜
- [x] History page loads <1.5 seconds
- [x] PDF generation <3 seconds
- [x] Email sent <30 seconds
- [x] Filtering response <300ms

#### Security ⬜
- [x] User authentication required
- [x] RBAC enforced
- [x] Audit logging for downloads
- [x] Payment data sanitized

#### Accessibility ⬜
- [x] Screen reader compatible
- [x] Keyboard navigation support
- [x] Print-friendly receipt format
- [x] High contrast mode support

## Modified Files

```
src/app/
├── bookings/history/
│   ├── page.tsx                                      ⬜
│   ├── loading.tsx                                   ⬜
│   └── components/
│       ├── TripHistoryList.tsx                       ⬜
│       ├── TripHistoryCard.tsx                       ⬜
│       ├── HistorySummaryCards.tsx                   ⬜
│       ├── HistoryFilters.tsx                        ⬜
│       ├── DateRangePicker.tsx                       ⬜
│       ├── TripDetailModal.tsx                       ⬜
│       ├── TripTimeline.tsx                          ⬜
│       ├── ReceiptDownloadButton.tsx                 ⬜
│       ├── EmailReceiptButton.tsx                    ⬜
│       └── HistoryEmptyState.tsx                     ⬜
├── api/bookings/
│   ├── history/route.ts                              ⬜
│   └── [bookingId]/
│       ├── history-details/route.ts                  ⬜
│       ├── receipt/route.ts                          ⬜
│       └── email-receipt/route.ts                    ⬜
├── lib/
│   ├── receipts/
│   │   ├── receipt-generator.ts                      ⬜
│   │   ├── receipt-validator.ts                      ⬜
│   │   └── receipt-template.tsx                      ⬜
│   └── hooks/
│       ├── useTripHistory.ts                         ⬜
│       └── useReceiptDownload.ts                     ⬜
└── types/trip-history.ts                             ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Foundation (Week 1) ⬜
- [ ] Database schema updates
- [ ] Type definitions
- [ ] API route stubs
- [ ] PDF library setup

### Phase 2: History Display (Week 1-2) ⬜
- [ ] TripHistoryList component
- [ ] Filtering and sorting
- [ ] Pagination
- [ ] Trip detail modal

### Phase 3: Receipt Generation (Week 2) ⬜
- [ ] PDF template design
- [ ] Receipt generator
- [ ] Download functionality
- [ ] HTML format

### Phase 4: Email Integration (Week 2) ⬜
- [ ] Email service setup
- [ ] Email receipt button
- [ ] Email template
- [ ] Delivery tracking

### Phase 5: Testing & Polish (Week 2) ⬜
- [ ] Unit tests
- [ ] Receipt validation tests
- [ ] E2E download tests
- [ ] Performance optimization

## Dependencies

- **Story 33-37**: Booking infrastructure
- **PDF Library**: react-pdf or Puppeteer
- **Email Service**: Postmark/SendGrid
- **Storage**: Optional PDF caching

## Risk Assessment

### Technical Risks

#### Risk 1: PDF Generation Performance
- **Impact**: Medium (slow downloads)
- **Mitigation**: Background generation + caching
- **Contingency**: HTML fallback

#### Risk 2: Email Delivery Failures
- **Impact**: Low (user can download)
- **Mitigation**: Retry logic + status tracking
- **Contingency**: Manual resend option

## Testing Strategy

```typescript
describe('Trip History & Receipts', () => {
  it('displays trip history correctly', () => {
    // Test history listing
  });
  
  it('generates valid PDF receipt', async () => {
    // Test PDF generation
  });
  
  it('emails receipt successfully', async () => {
    // Test email delivery
  });
  
  it('masks sensitive payment data', () => {
    // Test data sanitization
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 2 weeks (1 developer)
