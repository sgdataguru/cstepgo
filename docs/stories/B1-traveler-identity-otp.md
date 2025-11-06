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

## Gate Assignment
**Gate 2** (OTP verification required before booking)
