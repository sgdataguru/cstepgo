# 07 Register as Passenger - Implementation Planning

## Project Context
**Technical Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
**Backend**: NestJS, PostgreSQL, Redis, BullMQ
**Infrastructure**: Vercel (FE), Fly.io/Render (BE), GitHub Actions CI/CD

## User Story

As a tourist or local passenger, I want to quickly register using my phone number or email, so that I can book trips without a lengthy signup process.

## Pre-conditions

- Authentication infrastructure exists (JWT/refresh tokens)
- OTP service configured (Twilio/similar)
- Email service configured (Postmark/similar)
- Database schema supports user profiles

## Business Requirements

- Reduce registration abandonment rate by 60%
- Achieve average registration completion time < 2 minutes
- Increase tourist user conversion by 45%
- Enable quick booking flow for new users

## Technical Specifications

### Integration Points
- **Authentication**: Supabase/Clerk Auth with custom OTP flow
- **SMS Service**: Twilio for phone OTP delivery
- **Email Service**: Postmark for email OTP delivery
- **User API**: `/api/auth/register` for account creation
- **Wallet Service**: Optional payment wallet integration

### Security Requirements
- OTP expiration (5 minutes)
- Rate limiting (3 attempts per 15 minutes)
- Phone number/email validation
- Session management with secure cookies
- GDPR compliance for data collection

## Design Specifications

### Visual Layout & Components

**Registration Flow Structure**:
```
[Registration Container]
├── [Progress Indicator] <- Shows current step
├── [Step 1: Contact Method]
│   ├── [Method Selection]
│   │   ├── [Phone Option]
│   │   └── [Email Option]
│   └── [Input Field]
│       ├── [Country Code Selector] (if phone)
│       ├── [Phone/Email Input]
│       └── [Continue Button]
├── [Step 2: OTP Verification]
│   ├── [OTP Input Fields]
│   ├── [Resend Link]
│   └── [Verify Button]
├── [Step 3: Basic Info]
│   ├── [Name Input]
│   ├── [Preferred Language]
│   └── [Complete Button]
└── [Optional: Wallet Setup]
    ├── [Skip/Later Button]
    └── [Setup Wallet Button]
```

**Mobile-First Registration Modal**:
```
[Modal Overlay]
├── [Close Button]
├── [Header]
│   ├── [Logo]
│   └── [Step Title]
├── [Content Area]
│   └── [Current Step Content]
└── [Footer]
    ├── [Back Button] (if applicable)
    └── [Primary Action Button]
```

### Design System Compliance

**Color Palette**:
```css
/* Registration Flow */
--reg-primary: #3b82f6;         /* Blue-500 */
--reg-success: #10b981;         /* Emerald-500 */
--reg-error: #ef4444;           /* Red-500 */
--reg-bg: #ffffff;              /* White */
--reg-border: #e5e7eb;          /* Gray-200 */

/* Progress Indicator */
--progress-complete: #10b981;    /* Emerald-500 */
--progress-active: #3b82f6;      /* Blue-500 */
--progress-inactive: #e5e7eb;    /* Gray-200 */

/* Input States */
--input-focus: #dbeafe;         /* Blue-100 */
--input-error: #fee2e2;         /* Red-50 */
--input-success: #d1fae5;       /* Emerald-50 */
```

**Typography Scale**:
```css
/* Headers */
--reg-title: 1.5rem;            /* 24px */
--reg-subtitle: 1.125rem;       /* 18px */

/* Form Elements */
--input-label: 0.875rem;        /* 14px */
--input-text: 1rem;             /* 16px */
--helper-text: 0.75rem;         /* 12px */

/* Buttons */
--button-text: 1rem;            /* 16px */
--button-weight: 600;
```

### Responsive Behavior

**Mobile (< 768px)**:
```css
.registration-modal {
  @apply fixed inset-0 z-50;
  /* Full screen modal */
}

.registration-content {
  @apply flex flex-col h-full px-4 py-6;
}

.otp-inputs {
  @apply flex justify-center gap-2;
}
```

**Desktop (768px+)**:
```css
.registration-modal {
  @apply fixed inset-0 z-50 flex items-center justify-center;
}

.registration-content {
  @apply w-full max-w-md mx-auto bg-white rounded-lg shadow-xl p-8;
}

.otp-inputs {
  @apply flex justify-center gap-3;
}
```

### Interaction Patterns

**Input Field States**:
```typescript
interface InputStates {
  default: {
    border: 'border-gray-300',
    bg: 'bg-white'
  };
  focus: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    outline: 'outline-blue-500'
  };
  error: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    shake: 'animate-shake'
  };
  success: {
    border: 'border-green-500',
    bg: 'bg-green-50'
  };
  disabled: {
    border: 'border-gray-200',
    bg: 'bg-gray-100',
    cursor: 'cursor-not-allowed'
  };
}
```

**Step Transitions**:
```typescript
interface StepAnimation {
  entering: {
    opacity: 0,
    transform: 'translateX(20px)'
  };
  entered: {
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'all 300ms ease-out'
  };
  exiting: {
    opacity: 0,
    transform: 'translateX(-20px)'
  };
}
```

## Technical Architecture

### Component Structure
```
src/app/auth/
├── register/
│   ├── page.tsx                     # Registration page
│   └── components/
│       ├── RegistrationFlow.tsx     # Main container
│       ├── ContactMethodStep.tsx    # Step 1
│       ├── OTPVerificationStep.tsx  # Step 2
│       ├── BasicInfoStep.tsx        # Step 3
│       ├── WalletSetupStep.tsx      # Optional step
│       ├── ProgressIndicator.tsx    # Progress UI
│       └── hooks/
│           ├── useRegistration.ts   # Registration logic
│           ├── useOTP.ts            # OTP management
│           └── useCountdown.ts      # Timer hook
└── components/
    └── PhoneInput.tsx               # Reusable phone input
```

### State Management Architecture

**Registration State Interface**:
```typescript
interface RegistrationState {
  // Flow State
  currentStep: RegistrationStep;
  completedSteps: Set<RegistrationStep>;
  
  // Form Data
  contactMethod: 'phone' | 'email' | null;
  contactValue: string;
  countryCode: string;
  name: string;
  preferredLanguage: string;
  
  // OTP State
  otpSent: boolean;
  otpToken: string | null;
  otpAttempts: number;
  otpExpiry: Date | null;
  canResend: boolean;
  resendCountdown: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  
  // Session
  tempUserId: string | null;
  sessionToken: string | null;
}

type RegistrationStep = 
  | 'contact-method'
  | 'otp-verification'
  | 'basic-info'
  | 'wallet-setup'
  | 'complete';

interface UserRegistrationData {
  id: string;
  contactMethod: 'phone' | 'email';
  contactValue: string;
  name: string;
  preferredLanguage: string;
  walletEnabled: boolean;
  createdAt: Date;
}
```

### API Integration Schema

**Registration Request/Response Types**:
```typescript
// Initialize Registration
interface InitRegistrationRequest {
  contactMethod: 'phone' | 'email';
  contactValue: string;
  countryCode?: string; // For phone
}

interface InitRegistrationResponse {
  success: boolean;
  otpToken: string;
  expiresAt: string; // ISO date
  message?: string;
}

// Verify OTP
interface VerifyOTPRequest {
  otpToken: string;
  otpCode: string;
}

interface VerifyOTPResponse {
  success: boolean;
  tempUserId: string;
  sessionToken: string;
  nextStep: RegistrationStep;
}

// Complete Registration
interface CompleteRegistrationRequest {
  tempUserId: string;
  sessionToken: string;
  name: string;
  preferredLanguage: string;
  enableWallet?: boolean;
}

interface CompleteRegistrationResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    contactMethod: string;
    contactValue: string;
    walletId?: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

## Implementation Requirements

### Core Components

**RegistrationFlow.tsx** - Main registration container
```typescript
interface RegistrationFlowProps {
  onComplete: (user: UserRegistrationData) => void;
  onCancel: () => void;
  initialMethod?: 'phone' | 'email';
}
```

**ContactMethodStep.tsx** - Contact method selection
```typescript
interface ContactMethodStepProps {
  onSubmit: (method: 'phone' | 'email', value: string) => Promise<void>;
  initialMethod?: 'phone' | 'email';
}
```

**OTPVerificationStep.tsx** - OTP input and verification
```typescript
interface OTPVerificationStepProps {
  contactMethod: 'phone' | 'email';
  contactValue: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
}
```

**BasicInfoStep.tsx** - Minimal user information
```typescript
interface BasicInfoStepProps {
  onSubmit: (data: BasicInfoData) => Promise<void>;
  suggestedLanguage?: string;
}
```

**PhoneInput.tsx** - International phone input
```typescript
interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (value: string, countryCode: string) => void;
  error?: string;
  disabled?: boolean;
}
```

### Custom Hooks

**useRegistration()** - Main registration flow logic
```typescript
function useRegistration(): {
  state: RegistrationState;
  actions: {
    initRegistration: (method: 'phone' | 'email', value: string) => Promise<void>;
    verifyOTP: (code: string) => Promise<void>;
    completeRegistration: (data: BasicInfoData) => Promise<void>;
    resendOTP: () => Promise<void>;
    goToStep: (step: RegistrationStep) => void;
  };
}
```

**useOTP()** - OTP countdown and management
```typescript
function useOTP(expiryTime: Date | null): {
  timeRemaining: number;
  canResend: boolean;
  isExpired: boolean;
  resendCountdown: number;
}
```

**useCountdown()** - Generic countdown timer
```typescript
function useCountdown(initialTime: number): {
  timeLeft: number;
  isActive: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}
```

### Utility Functions

**validation.ts** - Input validation
```typescript
function validatePhone(phone: string, countryCode: string): ValidationResult
function validateEmail(email: string): ValidationResult
function validateOTP(otp: string): ValidationResult
```

**formatters.ts** - Display formatting
```typescript
function formatPhoneNumber(phone: string, countryCode: string): string
function formatOTPTime(seconds: number): string
function maskContactInfo(value: string, method: 'phone' | 'email'): string
```

## Acceptance Criteria

### Functional Requirements

**Core Feature Functionality**
- ✓ Simple registration with phone or email
- ✓ OTP verification working correctly
- ✓ Minimal information collection (name only)
- ✓ Optional wallet setup offered
- ✓ Registration completes < 2 minutes
- ✓ Clear success confirmation

**Data Management**
- ✓ Secure storage of user credentials
- ✓ Session management implemented
- ✓ Auto-login after registration
- ✓ Profile data properly saved

**User Interface**
- ✓ Mobile-first responsive design
- ✓ Clear progress indication
- ✓ Error messages helpful
- ✓ Loading states visible

### Non-Functional Requirements

**Performance**
- Page load < 1 second
- OTP delivery < 30 seconds
- Form submission < 2 seconds
- Smooth animations (60fps)

**Accessibility**
- Keyboard navigation support
- Screen reader compatible
- Clear focus indicators
- Error announcements

**Security**
- OTP expiration enforced
- Rate limiting active
- Input sanitization
- Secure session handling

## Modified Files
```
src/
├── app/
│   └── auth/
│       └── register/
│           ├── page.tsx ⬜
│           └── components/
│               ├── RegistrationFlow.tsx ⬜
│               ├── ContactMethodStep.tsx ⬜
│               ├── OTPVerificationStep.tsx ⬜
│               ├── BasicInfoStep.tsx ⬜
│               ├── WalletSetupStep.tsx ⬜
│               ├── ProgressIndicator.tsx ⬜
│               └── hooks/
│                   ├── useRegistration.ts ⬜
│                   ├── useOTP.ts ⬜
│                   └── useCountdown.ts ⬜
├── components/
│   └── PhoneInput.tsx ⬜
├── lib/
│   ├── auth/
│   │   └── registration-service.ts ⬜
│   └── utils/
│       ├── validation.ts ⬜
│       └── formatters.ts ⬜
├── types/
│   └── auth-types.ts ⬜
└── constants/
    └── countries.ts ⬜
```

## Implementation Status

**OVERALL STATUS**: ⬜ NOT STARTED

### Phase 1: Foundation & Setup
- [ ] Create registration page structure
- [ ] Define TypeScript interfaces
- [ ] Set up API integration
- [ ] Configure OTP services

### Phase 2: Core Implementation
- [ ] Build contact method step
- [ ] Implement OTP verification
- [ ] Create basic info form
- [ ] Add progress indicator

### Phase 3: Enhanced Features
- [ ] Phone number country selector
- [ ] OTP resend functionality
- [ ] Wallet setup option
- [ ] Session management

### Phase 4: Polish & Testing
- [ ] Error handling improvements
- [ ] Loading state refinements
- [ ] Accessibility enhancements
- [ ] Comprehensive testing

## Dependencies

### Internal Dependencies
- Authentication service
- User profile service
- Session management
- API client utilities

### External Dependencies
- Twilio (SMS OTP)
- Postmark (Email OTP)
- libphonenumber-js (phone validation)
- react-phone-number-input (UI component)

## Risk Assessment

### Technical Risks

**OTP Delivery Failures**
- Impact: High
- Mitigation: Multiple providers, retry logic
- Contingency: Manual verification option

**Session Management**
- Impact: Medium
- Mitigation: Secure cookie implementation
- Contingency: Force re-authentication

**Phone Number Validation**
- Impact: Medium
- Mitigation: Robust validation library
- Contingency: Manual review process

## Testing Strategy

### Unit Tests (Jest)
```typescript
describe('Registration Flow', () => {
  it('should complete phone registration successfully', async () => {});
  it('should handle OTP verification errors', () => {});
  it('should validate input formats correctly', () => {});
  it('should enforce time limits', () => {});
});

describe('useRegistration Hook', () => {
  it('should manage state transitions correctly', () => {});
  it('should handle API failures gracefully', () => {});
  it('should clear sensitive data on completion', () => {});
});
```

### Integration Tests
```typescript
describe('Registration Integration', () => {
  it('should complete full registration flow', async () => {});
  it('should handle OTP expiration correctly', async () => {});
  it('should create user session properly', async () => {});
});
```

## Performance Considerations

### Bundle Optimization
- Lazy load phone input library
- Code split registration flow
- Optimize validation utilities

### Runtime Performance
- Debounce input validation
- Memoize country list
- Optimize re-renders

### Caching Strategy
- Cache country codes
- Store partial progress
- Session persistence

## Deployment Plan

### Development Phase
- Mock OTP service for testing
- Feature flag registration flow
- Test various edge cases

### Staging Phase
- Real OTP service integration
- Load testing with concurrent users
- Security penetration testing

### Production Phase
- Gradual rollout (10% → 50% → 100%)
- Monitor OTP delivery rates
- Track registration funnel

## Monitoring & Analytics

### Performance Metrics
- Registration completion time
- OTP delivery success rate
- Page load performance

### Business Metrics
- Registration conversion rate
- Drop-off points analysis
- Method preference (phone vs email)

### Technical Metrics
- API response times
- OTP service reliability
- Error rates by step

## Documentation Requirements

### Technical Documentation
- API endpoint documentation
- OTP service configuration
- Session management guide

### User Documentation
- Registration help guide
- Troubleshooting OTP issues
- Privacy policy updates

## Post-Launch Review

### Success Criteria
- 60% reduction in abandonment rate
- < 2 minute average completion
- 95% OTP delivery success
- 45% increase in tourist conversions

### Retrospective Items
- User feedback on simplicity
- OTP delivery performance
- Security audit results
-