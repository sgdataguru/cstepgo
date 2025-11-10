# 09 Pay for Trip Booking - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a passenger, I want to pay for my trip booking using international or local payment methods, so that I can secure my seat on the trip.

## Pre-conditions

- User is authenticated as a passenger
- Trip has available seats
- Pricing calculation completed
- Payment gateway accounts configured (Stripe, Kaspi Pay)

## Business Requirements

- Support 95% of payment methods used by target audience
- Reduce payment abandonment rate below 15%
- Achieve payment success rate > 90%
- Enable instant booking confirmation

## Technical Specifications

### Integration Points
- **Stripe API**: International card payments with 3D Secure
- **Kaspi Pay API**: Local Kazakhstan payments
- **Booking Service**: `/api/bookings/create` for reservation
- **Notification Service**: Email (Postmark) + SMS (Twilio) for receipts
- **Payment Status Webhooks**: Real-time payment updates

### Security Requirements
- PCI DSS compliance for card handling
- Tokenization for sensitive payment data
- SSL/TLS encryption for all transactions
- Webhook signature verification
- Idempotency keys for duplicate prevention

## Design Specifications

### Visual Layout & Components

**Payment Flow Structure**:
```
[Payment Container]
├── [Progress Bar]
│   └── [Steps: Select → Pay → Confirm]
├── [Trip Summary Card]
│   ├── [Trip Details]
│   ├── [Seat Selection]
│   └── [Price Breakdown]
├── [Payment Method Selection]
│   ├── [International Card Option]
│   │   ├── [Stripe Logo]
│   │   └── [Card Types Accepted]
│   └── [Kaspi Pay Option]
│       ├── [Kaspi Logo]
│       └── [Local Payment Info]
├── [Payment Form] (Dynamic)
│   ├── [Stripe Elements] (if card)
│   └── [Kaspi Flow] (if Kaspi)
├── [Order Summary]
│   ├── [Subtotal]
│   ├── [Fees]
│   └── [Total Amount]
└── [Action Buttons]
    ├── [Back Button]
    └── [Pay Now Button]
```

**Payment Confirmation Page**:
```
[Confirmation Container]
├── [Success Animation]
├── [Booking Details]
│   ├── [Booking ID]
│   ├── [Trip Information]
│   └── [Receipt Actions]
├── [Next Steps]
│   ├── [WhatsApp Group Link]
│   └── [Calendar Add Option]
└── [Support Information]
```

### Design System Compliance

**Color Palette**:
```css
/* Payment States */
--payment-pending: #fbbf24;      /* Amber-400 */
--payment-success: #10b981;      /* Emerald-500 */
--payment-error: #ef4444;        /* Red-500 */
--payment-processing: #3b82f6;   /* Blue-500 */

/* Brand Colors */
--stripe-blue: #635bff;
--kaspi-red: #ff0033;
--kaspi-gold: #ffcc00;

/* Background Colors */
--payment-bg: #ffffff;
--summary-bg: #f8fafc;
--form-bg: #ffffff;
```

**Typography Scale**:
```css
/* Headers */
--payment-title: 1.5rem;         /* 24px */
--section-title: 1.25rem;        /* 20px */

/* Form Elements */
--label-size: 0.875rem;          /* 14px */
--input-size: 1rem;              /* 16px */
--helper-size: 0.75rem;          /* 12px */

/* Price Display */
--price-large: 2rem;             /* 32px */
--price-regular: 1.5rem;         /* 24px */
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.payment-container {
  @apply flex flex-col w-full px-4 py-6;
}

.payment-methods {
  @apply flex flex-col space-y-3;
}

.price-breakdown {
  @apply fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4;
}
```

**Desktop (768px+)**:
```css
.payment-container {
  @apply max-w-6xl mx-auto px-8 py-12 grid grid-cols-3 gap-8;
}

.payment-form {
  @apply col-span-2;
}

.order-summary {
  @apply col-span-1 sticky top-20;
}
```

### Interaction Patterns

**Payment Method Selection**:
```typescript
interface PaymentMethodStates {
  unselected: {
    border: 'border-gray-200',
    bg: 'bg-white',
    opacity: 1
  };
  selected: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    shadow: 'shadow-md'
  };
  disabled: {
    border: 'border-gray-100',
    bg: 'bg-gray-50',
    opacity: 0.5,
    cursor: 'cursor-not-allowed'
  };
}
```

**Payment Processing States**:
```typescript
interface PaymentStates {
  idle: { button: 'Pay Now', disabled: false };
  validating: { button: 'Validating...', disabled: true };
  processing: { button: 'Processing...', disabled: true, spinner: true };
  redirecting: { button: 'Redirecting...', disabled: true };
  success: { button: 'Payment Complete', disabled: true, icon: 'check' };
  error: { button: 'Try Again', disabled: false, icon: 'error' };
}
```

## Technical Architecture

### Component Structure
```
src/app/bookings/
├── payment/
│   ├── page.tsx                      # Payment page
│   ├── layout.tsx                    # Payment layout
│   └── components/
│       ├── PaymentFlow.tsx           # Main container
│       ├── TripSummaryCard.tsx       # Trip details
│       ├── PaymentMethodSelector.tsx # Method selection
│       ├── StripePaymentForm.tsx     # Stripe integration
│       ├── KaspiPaymentFlow.tsx      # Kaspi integration
│       ├── PriceBreakdown.tsx        # Cost details
│       ├── PaymentStatus.tsx         # Status tracking
│       └── hooks/
│           ├── usePayment.ts         # Payment logic
│           ├── useStripePayment.ts   # Stripe hook
│           ├── useKaspiPayment.ts    # Kaspi hook
│           └── useBookingCreation.ts # Booking creation
├── confirmation/
│   └── [bookingId]/
│       └── page.tsx                  # Confirmation page
└── api/
    └── webhooks/
        ├── stripe/
        │   └── route.ts              # Stripe webhooks
        └── kaspi/
            └── route.ts              # Kaspi webhooks
```

### State Management Architecture

**Payment State Interface**:
```typescript
interface PaymentState {
  // Payment Flow
  currentStep: PaymentStep;
  paymentMethod: PaymentMethod | null;
  
  // Trip & Pricing
  tripId: string;
  seatCount: number;
  pricing: PricingDetails;
  
  // Payment Data
  paymentIntent: PaymentIntent | null;
  kaspiOrderId: string | null;
  
  // Status
  status: PaymentStatus;
  error: PaymentError | null;
  
  // UI State
  isProcessing: boolean;
  isValidating: boolean;
  fieldErrors: Record<string, string>;
}

interface PricingDetails {
  basePrice: number;
  perPersonPrice: number;
  platformFee: number;
  processingFee: number;
  totalAmount: number;
  currency: string;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_action' | 'succeeded';
}

type PaymentMethod = 'stripe' | 'kaspi';

type PaymentStep = 'select-method' | 'enter-details' | 'processing' | 'complete';

type PaymentStatus = 
  | 'unpaid'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded';

interface PaymentError {
  code: string;
  message: string;
  field?: string;
}
```

### API Integration Schema

**Payment APIs**:
```typescript
// Initialize Payment
interface InitializePaymentRequest {
  tripId: string;
  seatCount: number;
  paymentMethod: PaymentMethod;
  returnUrl: string;
}

interface InitializePaymentResponse {
  bookingId: string;
  pricing: PricingDetails;
  paymentData: {
    // Stripe
    clientSecret?: string;
    publishableKey?: string;
    
    // Kaspi
    orderUrl?: string;
    orderId?: string;
    qrCode?: string;
  };
}

// Confirm Payment
interface ConfirmPaymentRequest {
  bookingId: string;
  paymentIntentId?: string; // Stripe
  kaspiTransactionId?: string; // Kaspi
}

interface ConfirmPaymentResponse {
  success: boolean;
  booking: {
    id: string;
    status: BookingStatus;
    paidAt: string;
    receiptUrl: string;
  };
}

// Webhook Payloads
interface StripeWebhookPayload {
  type: 'payment_intent.succeeded' | 'payment_intent.failed';
  data: {
    object: {
      id: string;
      amount: number;
      metadata: {
        bookingId: string;
      };
    };
  };
}

interface KaspiWebhookPayload {
  orderId: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionId: string;
  amount: number;
}
```

## Implementation Requirements

### Core Components

**PaymentFlow.tsx** - Main payment orchestration
```typescript
interface PaymentFlowProps {
  tripId: string;
  seatCount: number;
  onSuccess: (bookingId: string) => void;
  onCancel: () => void;
}
```

**PaymentMethodSelector.tsx** - Method selection UI
```typescript
interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  availableMethods: PaymentMethod[];
}
```

**StripePaymentForm.tsx** - Stripe Elements integration
```typescript
interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onError: (error: Error) => void;
}
```

**KaspiPaymentFlow.tsx** - Kaspi payment handling
```typescript
interface KaspiPaymentFlowProps {
  orderId: string;
  orderUrl: string;
  amount: number;
  onComplete: (transactionId: string) => void;
  onCancel: () => void;
}
```

### Custom Hooks

**usePayment()** - Main payment orchestration
```typescript
function usePayment(tripId: string, seatCount: number): {
  paymentState: PaymentState;
  initializePayment: (method: PaymentMethod) => Promise<void>;
  confirmPayment: (paymentData: any) => Promise<void>;
  cancelPayment: () => void;
}
```

**useStripePayment()** - Stripe-specific logic
```typescript
function useStripePayment(): {
  stripe: Stripe | null;
  elements: StripeElements | null;
  confirmCardPayment: (clientSecret: string) => Promise<PaymentResult>;
  handleCardElement: (element: StripeCardElement) => void;
}
```

**useKaspiPayment()** - Kaspi integration
```typescript
function useKaspiPayment(): {
  initializeKaspiPayment: (amount: number) => Promise<KaspiOrder>;
  checkPaymentStatus: (orderId: string) => Promise<PaymentStatus>;
  openKaspiApp: (orderUrl: string) => void;
}
```

### Utility Functions

**payment-validators.ts** - Payment validation
```typescript
function validateCardDetails(card: CardDetails): ValidationResult
function validatePaymentAmount(amount: number): boolean
function checkPaymentMethodAvailability(method: PaymentMethod): boolean
```

**price-calculator.ts** - Pricing calculations
```typescript
function calculateProcessingFee(amount: number, method: PaymentMethod): number
function calculateTotalAmount(base: number, seats: number, fees: Fees): number
function formatPrice(amount: number, currency: string): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Stripe integration for international cards with 3D Secure
- ✓ Kaspi Pay integration for local transactions
- ✓ Clear payment flow with step indicators
- ✓ Complete pricing breakdown displayed
- ✓ Secure payment processing with tokenization
- ✓ Immediate booking confirmation upon success
- ✓ Receipt sent via email and SMS

**Payment Status Tracking**
- ✓ Status progression: unpaid → pending → paid
- ✓ Failed payment recovery flow
- ✓ Refund status tracking
- ✓ Real-time webhook updates

**User Interface**
- ✓ Mobile-optimized payment forms
- ✓ Clear error messaging
- ✓ Loading states during processing
- ✓ Success confirmation with next steps

### Non-Functional Requirements

**Performance**
- Payment page load < 2 seconds
- Payment processing < 10 seconds
- Webhook processing < 500ms
- Zero payment data loss

**Accessibility**
- Form fields properly labeled
- Error messages announced
- Keyboard navigation support
- High contrast mode compatible

**Security**
- PCI DSS compliance maintained
- No card data stored locally
- All API calls over HTTPS
- Webhook signatures verified

## Modified Files
```
src/
├── app/
│   ├── bookings/
│   │   ├── payment/
│   │   │   ├── page.tsx ⬜
│   │   │   ├── layout.tsx ⬜
│   │   │   └── components/
│   │   │       ├── PaymentFlow.tsx ⬜
│   │   │       ├── TripSummaryCard.tsx ⬜
│   │   │       ├── PaymentMethodSelector.tsx ⬜
│   │   │       ├── StripePaymentForm.tsx ⬜
│   │   │       ├── KaspiPaymentFlow.tsx ⬜
│   │   │       ├── PriceBreakdown.tsx ⬜
│   │   │       ├── PaymentStatus.tsx ⬜
│   │   │       └── hooks/
│   │   │           ├── usePayment.ts ⬜
│   │   │           ├── useStripePayment.ts ⬜
│   │   │           ├── useKaspiPayment.ts ⬜
│   │   │           └── useBookingCreation.ts ⬜
│   │   └── confirmation/
│   │       └── [bookingId]/
│   │           └── page.tsx ⬜
│   └── api/
│       └── webhooks/
│           ├── stripe/
│           │   └── route.ts ⬜
│           └── kaspi/
│               └── route.ts ⬜
├── lib/
│   ├── payments/
│   │   ├── stripe-client.ts ⬜
│   │   ├── kaspi-client.ts ⬜
│   │   └── payment-service.ts ⬜
│   └── utils/
│       ├── payment-validators.ts ⬜
│       └── price-calculator.ts ⬜
├── types/
│   └── payment-types.ts ⬜
└── constants/
    └── payment-config.ts ⬜
```

## Cross-References

### Related Implementation Plans

**Depends On**:
- [07-register-as-passenger.md](./07-register-as-passenger.md) - User authentication (BLOCKER)
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Users browse before booking
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Price information
- Booking model

**Enables**:
- Revenue generation (CRITICAL)
- Trip booking completion
- Driver payouts (future)

**Works With**:
- [06-view-driver-profile.md](./06-view-driver-profile.md) - Driver info shown during checkout
- Platform fee calculations

**Related Epics**:
- **Epic C.1 - Payments (Stripe Integration)**: Core payment processing
- **Epic B - Booking**: Completes booking flow

**External Dependencies**:
- ⚠️ **Stripe Account** - Payment processing (REQUIRED)
- Webhook infrastructure

**Master Plan Reference**: See [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) Section: Epic C.1

**Status Tracking**: See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md#09---pay-for-trip-booking)

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Payment gateway account setup
- [ ] Create payment page structure
- [ ] Define TypeScript interfaces
- [ ] Set up webhook endpoints

### Phase 2: Core Implementation
- [ ] Stripe integration with Elements
- [ ] Kaspi Pay flow implementation
- [ ] Price calculation logic
- [ ] Booking creation on payment

### Phase 3: Enhanced Features
- [ ] 3D Secure handling
- [ ] Payment status tracking
- [ ] Receipt generation
- [ ] Webhook processing

### Phase 4: Polish & Testing
- [ ] Error recovery flows
- [ ] Performance optimizations
- [ ] Security audit
- [ ] End-to-end testing

## Dependencies

### Internal Dependencies
- Authentication service
- Booking management service
- Notification service
- Price calculation service

### External Dependencies
- Stripe SDK (@stripe/stripe-js)
- Stripe Node.js library
- Kaspi Pay SDK/API
- Email/SMS providers

## Risk Assessment

### Technical Risks

**Payment Gateway Downtime**
- Impact: High
- Mitigation: Fallback payment methods
- Contingency: Queue payments for retry

**3D Secure Failures**
- Impact: Medium
- Mitigation: Clear user guidance
- Contingency: Alternative verification

**Webhook Delivery Issues**
- Impact: High
- Mitigation: Webhook retry logic
- Contingency: Manual status sync

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Payment Flow', () => {
  it('should calculate prices correctly', () => {});
  it('should handle payment method selection', () => {});
  it('should validate payment amounts', () => {});
  it('should handle payment errors', () => {});
});

describe('usePayment Hook', () => {
  it('should initialize payment correctly', async () => {});
  it('should handle payment confirmation', async () => {});
  it('should update payment status', () => {});
});
```

### Integration Tests
```typescript
describe('Payment Integration', () => {
  it('should complete Stripe payment flow', async () => {});
  it('should handle Kaspi payment redirect', async () => {});
  it('should process webhooks correctly', async () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load payment SDKs
- Code split by payment method
- Optimize Stripe Elements loading

### Runtime Performance
- Cache pricing calculations
- Debounce validation calls
- Optimize webhook processing

### Caching Strategy
- Cache payment configuration
- Store temporary payment state
- Cache successful receipts

## Deployment Plan

### Development Phase
- Test mode payment gateways
- Mock webhook endpoints
- Sandbox transaction testing

### Staging Phase
- Real gateway test mode
- Load test payment flows
- Security penetration testing

### Production Phase
- Gradual rollout with monitoring
- Payment success rate tracking
- Real-time alerting setup

## Monitoring & Analytics

### Performance Metrics
- Payment page load times
- Transaction processing duration
- Webhook processing latency

### Business Metrics
- Payment success rate
- Abandonment rate by step
- Average transaction value
- Payment method preference

### Technical Metrics
- Gateway API response times
- Webhook delivery success
- Error rates by type

## Documentation Requirements

### Technical Documentation
- Payment gateway integration guide
- Webhook handling documentation
- Security best practices

### User Documentation
- Payment method guides
- Troubleshooting common issues
- Refund policy documentation

## Post-Launch Review

### Success Criteria
- 90%+ payment success rate
- < 15% abandonment rate
- Zero security incidents
- Positive user feedback

### Retrospective Items
- Payment flow optimization
- Additional payment methods
- Performance improvements
- User experience