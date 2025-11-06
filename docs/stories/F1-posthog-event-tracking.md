# User Story: Epic F.1 - PostHog Event Tracking

**Epic:** F — Analytics & Observability (PostHog)

**As a** product team,
**I want** to track key user events throughout the booking funnel,
**so that** I can identify drop-off points and optimize conversions.

## Acceptance Criteria

### PostHog Setup
* PostHog Cloud account configured:
  - Project: "StepperGO Production"
  - API key stored in `.env.local`
  - SDK installed: `posthog-js` (client-side) + `posthog-node` (server-side)
* Initialization:
  ```javascript
  posthog.init('<API_KEY>', {
    api_host: 'https://app.posthog.com',
    autocapture: false, // Manual events only
    capture_pageviews: true
  });
  ```

### Event Tracking: Traveler Funnel

**1. Trip Discovery Events**
* Event: `trip_list_viewed`
  - Trigger: User loads trip list page
  - Props: `{total_trips, filter_applied, sort_order}`
  - Anon ID: Generated on first visit

* Event: `trip_detail_viewed`
  - Trigger: User clicks trip card
  - Props: `{trip_id, origin, destination, price_per_seat, departure_date}`
  - Anon ID: Same as above

**2. Booking Events**
* Event: `booking_started`
  - Trigger: User clicks "Book This Trip"
  - Props: `{trip_id, booking_type: 'private' | 'shared'}`
  
* Event: `otp_requested`
  - Trigger: User submits phone/email for OTP (Story B.1)
  - Props: `{channel: 'sms' | 'email'}`
  - **No PII**: Use hashed phone/email OR anon_id only

* Event: `otp_verified_success`
  - Trigger: User enters valid OTP
  - Props: `{channel, attempt_number}`

* Event: `otp_verified_failed`
  - Trigger: Invalid OTP entered
  - Props: `{reason: 'invalid_code' | 'throttled', attempt_number}`

* Event: `seat_selected`
  - Trigger: User selects seat count (Story B.3)
  - Props: `{trip_id, seats, booking_type: 'shared'}`

* Event: `shared_booking_held`
  - Trigger: Soft hold created (Story B.3)
  - Props: `{trip_id, seats, hold_duration_seconds: 600}`

**3. Payment Events**
* Event: `payment_initiated`
  - Trigger: User clicks "Proceed to Payment"
  - Props: `{trip_id, booking_id, amount, payment_method: 'stripe'}`

* Event: `payment_succeeded`
  - Trigger: Stripe webhook confirms payment (Story C.1)
  - Props: `{booking_id, amount, platform_fee}`

* Event: `payment_failed`
  - Trigger: Payment declined/failed
  - Props: `{booking_id, reason: 'card_declined' | 'insufficient_funds'}`

**4. Driver Acceptance Events**
* Event: `driver_booking_accepted`
  - Trigger: Driver clicks Accept (Story D.2)
  - Props: `{booking_id, trip_id, time_to_accept_seconds}`

* Event: `trip_completed`
  - Trigger: Driver marks complete (Story D.3)
  - Props: `{trip_id, booking_count, days_after_departure}`

### Event Tracking: Admin Events
* Event: `admin_trip_created`
* Event: `admin_trip_approved`
* Event: `admin_driver_created`
* (See respective stories for full details)

### Privacy & Compliance

**NO PII Sent to PostHog:**
* ❌ Names, emails, phone numbers, addresses
* ✅ Hashed user IDs, anonymous IDs, aggregated data
* ✅ Trip IDs, booking IDs (non-identifiable)

**Example - WRONG:**
```javascript
// ❌ DO NOT DO THIS
posthog.capture('otp_requested', {
  phone: '+77001234567', // PII!
  email: 'user@example.com' // PII!
});
```

**Example - CORRECT:**
```javascript
// ✅ CORRECT
posthog.capture('otp_requested', {
  channel: 'sms',
  user_id_hash: crypto.createHash('sha256').update(userId).digest('hex')
});
```

### Identify Users (Post-Login Only)
* After OTP verification:
  ```javascript
  posthog.identify(userId, {
    role: 'traveler', // OK - not PII
    registration_date: '2025-01-15', // OK
    // NO name, email, phone
  });
  ```

* After driver login:
  ```javascript
  posthog.identify(driverId, {
    role: 'driver',
    vehicle_type: 'SUV',
    home_location_city: 'Almaty' // City OK, not full address
  });
  ```

### Server-Side vs Client-Side Tracking

**Client-Side (posthog-js):**
* Pageviews
* Button clicks
* Form interactions
* User journey events

**Server-Side (posthog-node):**
* Payment events (from Stripe webhooks)
* Admin actions
* Cron job events
* API-triggered events

## Technical Notes

### PostHog SDK Installation
```bash
npm install posthog-js posthog-node
```

### Environment Variables
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Event Naming Convention
* Format: `[noun]_[past_tense_verb]`
* Examples:
  - ✅ `trip_viewed`, `booking_started`, `payment_succeeded`
  - ❌ `view_trip`, `start_booking`, `success_payment`

### Event Properties Standards
* Use snake_case: `booking_type`, `time_to_accept_seconds`
* Include context: `trip_id`, `booking_id`, `user_id_hash`
* Avoid nested objects (flatten for easier querying)

### PostHog Events Wrapper
```typescript
// lib/analytics.ts
import posthog from 'posthog-js';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // Remove any PII before sending
    const sanitizedProps = sanitizeProperties(properties);
    posthog.capture(eventName, sanitizedProps);
  }
};

const sanitizeProperties = (props: Record<string, any>) => {
  // Strip out email, phone, name fields
  const sanitized = { ...props };
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.name;
  delete sanitized.address;
  return sanitized;
};
```

### Error Tracking
* Capture errors as events:
  ```javascript
  posthog.capture('error_occurred', {
    error_type: 'payment_failed',
    error_code: 'insufficient_funds',
    page: '/checkout'
  });
  ```

## Success Metrics
* Event tracking coverage: 100% of funnel steps
* PII incidents: Zero (automated sanitization)
* Event delivery rate: >99%

## Gate Assignment
**Gate 2** (Core funnel tracking: View → Detail → Book → OTP → Pay → Accept)
**Gate 3** (Advanced analytics: Cohort analysis, A/B testing, session recordings)
