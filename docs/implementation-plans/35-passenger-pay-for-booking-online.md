# 35 - Passenger Pay for Booking Online - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM, Stripe SDK  
**Infrastructure**: Vercel (hosting), Stripe (payments + webhooks), PostgreSQL

## User Story

**As a** passenger,  
**I want** to pay for my booking online,  
**so that** I can instantly confirm my trip without manual payment processes.

## Pre-conditions

- User must have a valid booking (PENDING or HELD status)
- Booking must have a valid amount (>0)
- Story 33/34 (Booking infrastructure) completed
- Stripe account configured with publishable/secret keys
- Webhook endpoint registered in Stripe dashboard

## Business Requirements

- **BR-1**: Enable instant booking confirmation through automated payment processing
  - Success Metric: >90% payment success rate
  - Performance: Payment intent creation <500ms

- **BR-2**: Support multiple payment methods (cards, wallets)
  - Success Metric: 3+ payment methods available
  - Performance: Payment UI loads <1 second

- **BR-3**: Ensure payment security and PCI compliance
  - Success Metric: 100% compliance with PCI DSS
  - Performance: Zero payment data stored in database

- **BR-4**: Handle payment failures gracefully with retry options
  - Success Metric: <15% abandoned payments after failure
  - Performance: Failure feedback <300ms

## Technical Specifications

### Integration Points
- **Stripe Payments**: Checkout + Elements for card processing
- **Stripe Webhooks**: payment_intent.succeeded, payment_intent.payment_failed
- **Booking System**: Status transitions (PENDING → CONFIRMED)
- **Notifications**: Email/SMS on successful payment
- **Seat Release**: Auto-release on payment failure (shared rides)

### Security Requirements
- Never store raw card numbers or CVV
- Use Stripe Elements for PCI compliance
- Webhook signature verification required
- Idempotency keys for payment operations
- Rate limiting: 5 payment attempts per 10 minutes per booking

### API Endpoints

#### POST /api/payments/create-intent
Creates a Stripe PaymentIntent for booking.

**Request:**
```typescript
interface CreatePaymentIntentRequest {
  bookingId: string;
  paymentMethod?: 'card' | 'wechat' | 'alipay';  // Future expansion
}
```

**Response:**
```typescript
interface CreatePaymentIntentResponse {
  clientSecret: string;  // For Stripe Elements
  paymentIntentId: string;
  amount: number;
  currency: 'KZT';
  publishableKey: string;
}
```

#### POST /api/payments/webhook
Receives Stripe webhook events for payment status updates.

**Headers:**
```
stripe-signature: t=timestamp,v1=signature
```

**Request Body (Example):**
```typescript
interface StripeWebhookEvent {
  id: string;
  type: 'payment_intent.succeeded' | 'payment_intent.payment_failed';
  data: {
    object: {
      id: string;  // PaymentIntent ID
      amount: number;
      status: string;
      metadata: {
        bookingId: string;
      };
    };
  };
}
```

**Response:**
```typescript
{
  received: true
}
```

#### GET /api/payments/:paymentId/status
Checks payment status (client-side polling during payment).

**Response:**
```typescript
interface PaymentStatusResponse {
  paymentId: string;
  status: 'processing' | 'succeeded' | 'failed' | 'canceled';
  booking: {
    id: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  };
  errorMessage?: string;
}
```

#### POST /api/payments/:paymentId/retry
Retries a failed payment (creates new PaymentIntent).

**Response:**
```typescript
interface RetryPaymentResponse {
  newClientSecret: string;
  newPaymentIntentId: string;
}
```

## Design Specifications

### Visual Layout & Components

**Payment Page Layout:**
```
[Progress Indicator]
├── Booking Details (✓)
├── Passenger Info (✓)
└── Payment (active)

[Main Content - Two Column]
├── [Left Column - Order Summary (Sticky)]
│   ├── Booking Summary Card
│   │   ├── Trip Details
│   │   │   ├── Origin → Destination
│   │   │   └── Date & Time
│   │   ├── Passenger Count
│   │   ├── Trip Type Badge (Private/Shared)
│   │   └── Special Requests (if any)
│   ├── Price Breakdown
│   │   ├── Base Fare: ₸XX,XXX
│   │   ├── Platform Fee: ₸XXX
│   │   ├── Taxes: ₸XXX
│   │   └── Total: ₸XX,XXX (bold, large)
│   └── Cancellation Policy
│       └── "Free cancellation until X hours before"
│
└── [Right Column - Payment Form]
    ├── Payment Method Selector
    │   ├── [Card] (active)
    │   ├── [Apple Pay] (if available)
    │   └── [Google Pay] (if available)
    ├── Stripe Card Element
    │   ├── Card Number Input
    │   ├── Expiry Date Input
    │   └── CVC Input
    ├── Billing Details (optional)
    │   ├── Name on Card
    │   └── Billing Address
    ├── Terms Checkbox
    │   └── "I agree to terms & conditions"
    ├── "Pay ₸XX,XXX" Button (primary, large)
    │   └── Shows lock icon + "Secure Payment"
    └── Security Badges
        ├── "Powered by Stripe"
        ├── SSL Encrypted
        └── PCI Compliant

[Trust Indicators Footer]
├── Accepted Cards: Visa, MC, Amex
└── "Your payment info is secure and encrypted"
```

**Processing State:**
```
[Full Screen Overlay]
├── Spinner Animation
├── "Processing Payment..."
├── "Please don't close this page"
└── Progress Bar (indeterminate)
```

**Success State:**
```
[Success Screen]
├── Checkmark Animation (green circle)
├── "Payment Successful!"
├── Booking Reference: #XXXXX
├── "Confirmation sent to your email"
├── Booking Details Summary
├── "View Booking" Button (primary)
└── "Book Another Trip" Button (secondary)
```

**Failure State:**
```
[Error Alert]
├── Error Icon (red)
├── "Payment Failed"
├── Error Message: "Insufficient funds" / "Card declined"
├── "Try Again" Button (primary)
├── "Use Different Card" Button (secondary)
└── "Contact Support" Link
```

### Design System Compliance

**Color Palette:**
```css
/* Payment States */
--payment-processing: #3b82f6;   /* bg-blue-500 */
--payment-success: #10b981;      /* bg-emerald-500 */
--payment-failed: #ef4444;       /* bg-red-500 */

/* Security Indicators */
--secure-badge: #059669;         /* bg-emerald-600 */
--ssl-icon: #10b981;            /* text-emerald-500 */

/* Stripe Branding */
--stripe-blue: #635bff;         /* Stripe brand color */
```

**Card Element Styling:**
```css
/* Match design system to Stripe Elements */
.StripeElement {
  @apply h-12 px-4 py-3;
  @apply border-2 border-gray-300 rounded-lg;
  @apply focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200;
  @apply transition-all duration-200;
}

.StripeElement--invalid {
  @apply border-red-500;
}

.StripeElement--complete {
  @apply border-emerald-500;
}
```

### Responsive Behavior

**Mobile Layout (<768px)**:
```css
.payment-page-mobile {
  @apply flex flex-col space-y-4 px-4;
}

.order-summary-mobile {
  @apply w-full;
  @apply bg-gray-50 rounded-lg p-4;
  @apply mb-6;  /* Above payment form */
}

.payment-form-mobile {
  @apply w-full;
}

.pay-button-mobile {
  @apply fixed bottom-0 left-0 right-0;
  @apply bg-white border-t-2 border-gray-200;
  @apply px-4 py-6 z-50 shadow-2xl;
}
```

**Desktop Layout (1024px+)**:
```css
.payment-page-desktop {
  @apply grid grid-cols-12 gap-8 px-8 max-w-7xl mx-auto;
}

.order-summary-desktop {
  @apply col-span-4;
  @apply sticky top-24 h-fit;
}

.payment-form-desktop {
  @apply col-span-8;
}
```

### Interaction Patterns

**Card Input Validation:**
```typescript
interface CardValidationStates {
  empty: 'border-gray-300';
  typing: 'border-blue-500 ring-2 ring-blue-200';
  invalid: 'border-red-500 ring-2 ring-red-200';
  complete: 'border-emerald-500 ring-2 ring-emerald-200';
}
```

**Pay Button States:**
```typescript
interface PayButtonStates {
  ready: {
    text: 'Pay ₸XX,XXX',
    bg: 'bg-blue-600 hover:bg-blue-700',
    cursor: 'cursor-pointer',
  };
  processing: {
    text: 'Processing...',
    bg: 'bg-gray-400',
    cursor: 'cursor-not-allowed',
    spinner: true,
  };
  disabled: {
    text: 'Complete card details',
    bg: 'bg-gray-300',
    cursor: 'cursor-not-allowed',
  };
}
```

## Technical Architecture

### Component Structure

```
src/app/
├── bookings/
│   └── [bookingId]/
│       └── payment/
│           ├── page.tsx                          # Payment page ⬜
│           └── components/
│               ├── PaymentForm.tsx               # Main payment form ⬜
│               ├── StripeCardElement.tsx         # Stripe Elements wrapper ⬜
│               ├── OrderSummary.tsx              # Booking summary ⬜
│               ├── PaymentMethodSelector.tsx     # Payment method tabs ⬜
│               ├── PaymentProcessing.tsx         # Loading overlay ⬜
│               ├── PaymentSuccess.tsx            # Success screen ⬜
│               └── PaymentError.tsx              # Error handling ⬜
├── payment/
│   └── success/
│       └── page.tsx                              # Post-payment redirect ⬜
└── api/
    └── payments/
        ├── create-intent/
        │   └── route.ts                          # POST create PaymentIntent ⬜
        ├── webhook/
        │   └── route.ts                          # POST Stripe webhook ⬜
        ├── [paymentId]/
        │   ├── status/
        │   │   └── route.ts                      # GET payment status ⬜
        │   └── retry/
        │       └── route.ts                      # POST retry payment ⬜
        └── refund/
            └── route.ts                          # POST refund (Story 36) ⬜
```

### State Management Architecture

**Global State (Zustand):**
```typescript
interface PaymentStore {
  // Current Payment State
  currentPayment: {
    bookingId: string | null;
    clientSecret: string | null;
    paymentIntentId: string | null;
    amount: number | null;
    status: 'idle' | 'creating' | 'processing' | 'succeeded' | 'failed';
  };
  
  // Error Handling
  paymentError: {
    code: string | null;
    message: string | null;
    canRetry: boolean;
  } | null;
  
  // Actions
  createPaymentIntent: (bookingId: string) => Promise<CreatePaymentIntentResponse>;
  confirmPayment: (clientSecret: string, paymentMethodId: string) => Promise<PaymentResult>;
  retryPayment: (paymentId: string) => Promise<RetryPaymentResponse>;
  pollPaymentStatus: (paymentId: string) => Promise<PaymentStatusResponse>;
  clearPaymentState: () => void;
}
```

**Local Component State:**
```typescript
// PaymentForm.tsx
interface PaymentFormState {
  cardComplete: boolean;
  cardError: string | null;
  billingDetails: {
    name: string;
    email: string;
    address?: Address;
  };
  termsAccepted: boolean;
  isProcessing: boolean;
  paymentMethodId: string | null;
}
```

### Database Schema Updates

```prisma
model Booking {
  // ... existing fields
  
  // Payment fields
  stripePaymentIntentId String?   @unique
  paymentStatus         String    @default("PENDING")  // PENDING, PROCESSING, PAID, FAILED
  paidAt                DateTime?
  
  payments Payment[]
}

model Payment {
  id                   String   @id @default(cuid())
  bookingId            String
  booking              Booking  @relation(fields: [bookingId], references: [id])
  
  stripePaymentIntentId String  @unique
  amount               Int      // In smallest currency unit (tenge)
  currency             String   @default("KZT")
  
  status               String   // processing, succeeded, failed, canceled
  paymentMethod        String?  // card, wechat, alipay
  last4                String?  // Last 4 digits of card
  brand                String?  // visa, mastercard, etc
  
  failureCode          String?
  failureMessage       String?
  
  metadata             Json?    // Additional Stripe metadata
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  @@index([bookingId])
  @@index([stripePaymentIntentId])
}
```

### API Integration Schema

**Stripe PaymentIntent Creation:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function createPaymentIntent(booking: Booking) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.totalAmount, // In tenge
    currency: 'kzt',
    metadata: {
      bookingId: booking.id,
      userId: booking.userId,
      tripId: booking.tripId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
  
  return paymentIntent;
}
```

**Webhook Signature Verification:**
```typescript
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Handle event
  if (event.type === 'payment_intent.succeeded') {
    await handlePaymentSuccess(event.data.object);
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## Implementation Requirements

### Core Components

#### 1. PaymentForm.tsx ⬜
**Purpose**: Main payment interface with Stripe Elements

**Features**:
- Stripe card input integration
- Billing details form
- Terms acceptance checkbox
- Real-time validation
- Error handling

#### 2. StripeCardElement.tsx ⬜
**Purpose**: Wrapper for Stripe Elements with custom styling

**Features**:
- Matches design system
- Real-time validation feedback
- Error display
- Complete state indicator

#### 3. PaymentProcessing.tsx ⬜
**Purpose**: Loading overlay during payment processing

**Features**:
- Full-screen overlay
- Animated spinner
- Progress messages
- Prevents user interaction

#### 4. PaymentSuccess.tsx ⬜
**Purpose**: Success confirmation screen

**Features**:
- Animated checkmark
- Booking reference display
- Email confirmation notice
- Action buttons (View/Book More)

#### 5. PaymentError.tsx ⬜
**Purpose**: Error display with retry options

**Features**:
- Error message display
- Retry button
- Alternative payment method
- Support contact link

### Custom Hooks

#### useStripePayment() ⬜
```typescript
interface UseStripePaymentReturn {
  createPaymentIntent: (bookingId: string) => Promise<string>;
  confirmPayment: (clientSecret: string) => Promise<PaymentResult>;
  paymentStatus: PaymentStatus;
  isProcessing: boolean;
  error: PaymentError | null;
  retryPayment: () => Promise<void>;
}
```

#### usePaymentPolling() ⬜
```typescript
interface UsePaymentPollingReturn {
  startPolling: (paymentId: string) => void;
  stopPolling: () => void;
  currentStatus: PaymentStatus;
  isPolling: boolean;
}
```

### Utility Functions

#### src/lib/payment/stripe-utils.ts ⬜
```typescript
export function formatStripeAmount(amount: number, currency: string): string;
export function validatePaymentIntent(intent: Stripe.PaymentIntent): boolean;
export function getPaymentErrorMessage(code: string): string;
export async function confirmBookingPayment(
  bookingId: string,
  paymentIntentId: string
): Promise<void>;
```

#### src/lib/payment/webhook-handlers.ts ⬜
```typescript
export async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void>;

export async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent
): Promise<void>;

export async function releaseHeldSeats(bookingId: string): Promise<void>;
```

## Acceptance Criteria

### Functional Requirements

#### 1. Payment Intent Creation ⬜
- [x] Creates Stripe PaymentIntent with correct amount
- [x] Returns client secret for frontend
- [x] Stores PaymentIntent ID in database
- [x] Includes booking metadata
- [x] Handles creation errors gracefully

#### 2. Payment Form Display ⬜
- [x] Stripe Elements loads within 1 second
- [x] Card input fields properly styled
- [x] Real-time validation feedback
- [x] Terms checkbox required
- [x] Pay button disabled until valid

#### 3. Payment Processing ⬜
- [x] Confirms payment with Stripe
- [x] Shows processing overlay
- [x] Prevents double submission
- [x] Handles 3D Secure authentication
- [x] Polls payment status

#### 4. Webhook Processing ⬜
- [x] Verifies webhook signature
- [x] Updates booking status to CONFIRMED
- [x] Updates payment status to PAID
- [x] Releases held seats (if shared)
- [x] Sends confirmation email
- [x] Returns 200 response to Stripe

#### 5. Success Flow ⬜
- [x] Displays success animation
- [x] Shows booking reference
- [x] Redirects to booking details
- [x] Email confirmation sent
- [x] Booking status updated

#### 6. Error Handling ⬜
- [x] Displays user-friendly error messages
- [x] Provides retry option
- [x] Suggests alternative payment method
- [x] Logs errors for debugging
- [x] Releases held seats on repeated failures

### Non-Functional Requirements

#### Performance ⬜
- [x] Payment intent creation <500ms
- [x] Card Element loads <1 second
- [x] Payment confirmation <3 seconds
- [x] Webhook processing <1 second

#### Security ⬜
- [x] No card data stored in database
- [x] Webhook signature verified
- [x] HTTPS enforced
- [x] Idempotency keys used
- [x] Rate limiting implemented

#### Accessibility ⬜
- [x] Card inputs keyboard accessible
- [x] Error messages announced
- [x] Loading states communicated
- [x] Focus management correct

## Modified Files

```
src/app/
├── bookings/[bookingId]/payment/
│   ├── page.tsx                                      ⬜
│   └── components/
│       ├── PaymentForm.tsx                           ⬜
│       ├── StripeCardElement.tsx                     ⬜
│       ├── OrderSummary.tsx                          ⬜
│       ├── PaymentMethodSelector.tsx                 ⬜
│       ├── PaymentProcessing.tsx                     ⬜
│       ├── PaymentSuccess.tsx                        ⬜
│       └── PaymentError.tsx                          ⬜
├── payment/success/
│   └── page.tsx                                      ⬜
├── api/payments/
│   ├── create-intent/route.ts                        ⬜
│   ├── webhook/route.ts                              ⬜
│   ├── [paymentId]/
│   │   ├── status/route.ts                           ⬜
│   │   └── retry/route.ts                            ⬜
│   └── refund/route.ts                               ⬜
├── lib/
│   ├── payment/
│   │   ├── stripe-utils.ts                           ⬜
│   │   └── webhook-handlers.ts                       ⬜
│   └── hooks/
│       ├── useStripePayment.ts                       ⬜
│       └── usePaymentPolling.ts                      ⬜
└── types/payment.ts                                  ⬜
```

## Implementation Status

**OVERALL STATUS: ⬜ NOT STARTED**

### Phase 1: Stripe Setup (Week 1) ⬜
- [ ] Install Stripe SDK and types
- [ ] Configure Stripe keys in .env
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Create Payment model in Prisma
- [ ] Database migration

### Phase 2: Payment Intent & UI (Week 1-2) ⬜
- [ ] Create PaymentIntent API endpoint
- [ ] Build PaymentForm component
- [ ] Integrate Stripe Elements
- [ ] Add OrderSummary component
- [ ] Implement validation

### Phase 3: Payment Processing (Week 2) ⬜
- [ ] Implement payment confirmation flow
- [ ] Add processing overlay
- [ ] Build success/error screens
- [ ] Implement status polling

### Phase 4: Webhooks & Automation (Week 3) ⬜
- [ ] Build webhook handler
- [ ] Implement signature verification
- [ ] Add payment success automation
- [ ] Add failure handling
- [ ] Release seats on failure

### Phase 5: Testing & Edge Cases (Week 3-4) ⬜
- [ ] Test 3D Secure flow
- [ ] Test various card errors
- [ ] Test webhook reliability
- [ ] Load testing
- [ ] E2E payment tests

## Dependencies

- **Stripe Account**: Must be fully activated
- **Story 33/34**: Booking infrastructure
- **Email Service**: For confirmations
- **Webhook Endpoint**: Must be publicly accessible

## Risk Assessment

### Technical Risks

#### Risk 1: Webhook Delivery Failures
- **Impact**: Critical (booking not confirmed)
- **Mitigation**: Status polling + idempotency
- **Contingency**: Manual reconciliation cron job

#### Risk 2: 3D Secure Redirect Issues
- **Impact**: Medium (payment abandonment)
- **Mitigation**: Clear instructions + testing
- **Contingency**: Support team assistance

#### Risk 3: Currency/Amount Mismatches
- **Impact**: Critical (wrong amounts charged)
- **Mitigation**: Server-side amount calculation
- **Contingency**: Automatic refunds + alerts

## Testing Strategy

```typescript
describe('Stripe Payment Flow', () => {
  it('creates PaymentIntent with correct amount', async () => {
    // Test intent creation
  });
  
  it('handles successful payment webhook', async () => {
    // Test webhook processing
  });
  
  it('verifies webhook signature', async () => {
    // Test security
  });
  
  it('handles card declined gracefully', async () => {
    // Test error handling
  });
  
  it('releases seats on payment failure', async () => {
    // Test cleanup
  });
});
```

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Ready for Development  
**Estimated Effort:** 3-4 weeks (1 developer)
