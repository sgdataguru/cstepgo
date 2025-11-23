# User Story: Epic B.1 - Traveler Identity (OTP Verification)

**Epic:** B — Booking (Private vs Shared)

**As a** traveler,
**I want** to verify my identity quickly using OTP,
**so that** I can book a trip without lengthy registration forms.

## Acceptance Criteria

### Entry Point
* When user clicks "Book This Trip" from detail page
* If not authenticated, show identity verification modal
* If already authenticated, skip to booking type selection (B.2/B.3)

### Identity Collection
* Minimal required fields:
  - Name (full name)
  - Phone number OR Email
* UI clearly indicates: "Quick verification - no password needed"
* Phone format validation (international format support)
* Email format validation

### OTP Delivery
* User selects verification channel:
  - SMS (default for phone)
  - Email (default for email)
* OTP code: 6 digits, 60-second delivery SLA
* Clear messaging: "Code sent to [phone/email]"
* Resend option available after 30 seconds
* Fallback channel offered if primary fails

### OTP Verification
* 6-digit code input field
* Code valid for 10 minutes
* 3 incorrect attempts allowed
* After 3 failures:
  - Throttle: 5-minute lockout
  - Display: "Too many attempts. Try again in 5 minutes."
* Success → Create user record with `otp_verified_at` timestamp

### User Record Creation
* `users` table fields populated:
  - `role: 'traveller'`
  - `name`
  - `phone` OR `email`
  - `otp_verified_at: NOW()`
* Session cookie/token issued (JWT)
* Redirect to booking type selection (B.2 or B.3)

### Edge Cases
* Duplicate phone/email → Log in existing user (skip creation)
* OTP service down → Display fallback: "Verification temporarily unavailable. Try email instead."
* Network timeout → Retry mechanism with clear error message

## Technical Notes

* OTP service: Twilio (SMS) + Resend (Email)
* Rate limiting: Max 5 OTP requests per phone/email per hour
* User session: JWT with 24-hour expiry
* PostHog events:
  - `otp_requested` (channel: sms/email)
  - `otp_verified_success`
  - `otp_verified_failed` (reason: invalid_code/throttled)

## Privacy & Security
* OTP codes never logged in plaintext
* Hashed verification codes stored temporarily (10 min TTL)
* No marketing emails without explicit consent
* GDPR/privacy notice displayed during signup

## Page Layout Design

### Step 1: Contact Method Selection
```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐   │
│  │              StepperGO                   │   │
│  │              [Logo]                      │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Quick Registration                             │
│  ━━━━━━━━━━━━━━━━━                              │
│                                                  │
│  Travel smart in 2 minutes 🚀                   │
│                                                  │
│  ● Step 1 of 3                                  │
│  ○ ○                                            │
│                                                  │
│  Choose verification method:                    │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  📱 Phone Number (Recommended)          │   │
│  │  Fast WhatsApp/SMS verification         │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  📧 Email Address                       │   │
│  │  Verification via email                 │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [IF PHONE SELECTED]:                           │
│  Country Code: [+996 ▾]                         │
│  Phone: [_________________________]             │
│                                                  │
│  [IF EMAIL SELECTED]:                           │
│  Email: [_________________________]             │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Continue                        │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Already have an account? [Sign In]             │
│                                                  │
│  [Privacy Policy] • [Terms of Service]          │
└─────────────────────────────────────────────────┘
```

### Step 2: OTP Verification
```
┌─────────────────────────────────────────────────┐
│  ← Back                                         │
│                                                  │
│  Verify Your Number                             │
│  ━━━━━━━━━━━━━━━━━                              │
│                                                  │
│  ● ● Step 2 of 3                                │
│  ○                                               │
│                                                  │
│  We sent a 6-digit code to:                     │
│  +996 555 123 456                               │
│  [Change]                                        │
│                                                  │
│  Enter verification code:                       │
│                                                  │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐          │
│  │ _ │ │ _ │ │ _ │ │ _ │ │ _ │ │ _ │          │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘          │
│                                                  │
│  ⏱️ Resend code in 0:28                         │
│                                                  │
│  Didn't receive it?                             │
│  [Send via SMS instead]                         │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Verify                          │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [LOADING STATE]:                               │
│  ┌─────────────────────────────────────────┐   │
│  │  ⏳ Verifying...                        │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [ERROR STATE]:                                 │
│  ⚠️ Invalid code. 2 attempts remaining.         │
└─────────────────────────────────────────────────┘
```

### Step 3: Basic Information
```
┌─────────────────────────────────────────────────┐
│  ← Back                                         │
│                                                  │
│  Complete Your Profile                          │
│  ━━━━━━━━━━━━━━━━━                              │
│                                                  │
│  ● ● ● Step 3 of 3                              │
│                                                  │
│  Just one more thing...                         │
│                                                  │
│  Full Name *                                    │
│  ┌─────────────────────────────────────────┐   │
│  │ [_________________________________]     │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  Preferred Language                             │
│  ┌─────────────────────────────────────────┐   │
│  │  🇬🇧 English                            │   │
│  │  🇷🇺 Русский                            │   │
│  │  🇰🇬 Кыргызча                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ☐ I agree to [Terms of Service] and           │
│     [Privacy Policy]                            │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │    Complete Registration                │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Success Screen
```
┌─────────────────────────────────────────────────┐
│                                                  │
│              ✅                                  │
│         Welcome Aboard!                         │
│         ━━━━━━━━━━━                             │
│                                                  │
│  Your account is ready, Ali!                    │
│                                                  │
│  You can now:                                   │
│  • Browse and book trips                        │
│  • Join trip WhatsApp groups                    │
│  • Save favorite routes                         │
│  • Track your bookings                          │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │      Start Exploring Trips              │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [Skip - Go to Homepage]                        │
└─────────────────────────────────────────────────┘
```

### Mobile Responsive Layout (< 768px)
```
┌───────────────────────┐
│  ✕                    │
│                       │
│  Quick Registration   │
│  ━━━━━━━━━━━          │
│                       │
│  ● ○ ○  Step 1 of 3   │
│                       │
│  📱 Phone Number      │
│  ┌─────────────────┐ │
│  │ +996 [▾]        │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ 555 123 456     │ │
│  └─────────────────┘ │
│                       │
│  📧 Email            │
│  ┌─────────────────┐ │
│  │ user@email.com  │ │
│  └─────────────────┘ │
│                       │
│  ┌─────────────────┐ │
│  │    Continue     │ │
│  └─────────────────┘ │
│                       │
│  [Sign In]            │
└───────────────────────┘
```

## UI/UX Specifications

### Color Scheme
- **Primary Action**: Teal (#00C2B0)
- **Success**: Emerald (#10b981)
- **Error**: Red (#ef4444)
- **Progress Active**: Blue (#3b82f6)
- **Progress Inactive**: Gray (#e5e7eb)

### Typography
- **Title**: 24px, Bold (font-display)
- **Subtitle**: 18px, Regular
- **Input**: 16px, Regular
- **Helper**: 14px, Light

### Spacing
- Modal padding: 24px (desktop), 16px (mobile)
- Input spacing: 16px between fields
- Button height: 48px (touch-friendly)

### Animations
- Step transitions: 300ms ease-out
- Input focus: 150ms ease
- Button hover: 200ms ease
- Error shake: 400ms

## Gate Assignment
**Gate 2** (OTP verification required before booking)

---

**Note:** This story replaces the old password-based registration. Lean OTP flow reduces friction for travelers.