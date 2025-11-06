# User Story: Epic F.2 - Analytics Funnel Dashboard

**Epic:** F — Analytics & Observability (PostHog)

**As a** product manager,
**I want** to visualize the booking funnel and conversion rates,
**so that** I can identify bottlenecks and improve user experience.

## Acceptance Criteria

### PostHog Funnel Configuration
* Navigate to PostHog dashboard → Insights → New Funnel
* Create funnel: "Traveler Booking Journey"
* Steps configured:
  1. `trip_list_viewed` (Entry point)
  2. `trip_detail_viewed`
  3. `booking_started`
  4. `otp_verified_success`
  5. `payment_initiated`
  6. `payment_succeeded`
  7. `driver_booking_accepted` (Completion)

### Funnel Visualization
* Display:
  - Step-by-step conversion rates
  - Drop-off percentages between steps
  - Time to convert (median, p90)
  - Total users at each step
* Filters available:
  - Date range (last 7/30/90 days)
  - Booking type (private vs shared)
  - Device type (mobile vs desktop)
  - Origin/destination (if tracked)

### Key Metrics Dashboard

**Primary KPIs (PostHog Dashboard)**
1. **Conversion Rate: View → Booking**
   - Target: >15%
   - Formula: `(payment_succeeded / trip_list_viewed) × 100`

2. **OTP Success Rate**
   - Target: >90%
   - Formula: `(otp_verified_success / otp_requested) × 100`

3. **Payment Success Rate**
   - Target: >95%
   - Formula: `(payment_succeeded / payment_initiated) × 100`

4. **Driver Acceptance Rate**
   - Target: >80%
   - Formula: `(driver_booking_accepted / payment_succeeded) × 100`

5. **Time to Driver Acceptance**
   - Target: <5 minutes (from product spec)
   - Metric: Median time between `payment_succeeded` and `driver_booking_accepted`

### Drop-Off Analysis
* Identify highest drop-off steps:
  - If OTP verification has >20% drop-off → Investigate UX issues
  - If payment has >10% drop-off → Check payment errors (Story C.1)
  - If driver acceptance has >20% drop-off → Check driver portal (Story D.2)

### Trend Analysis
* Time-series chart:
  - X-axis: Date
  - Y-axis: Conversion rate (%)
  - Line graph showing trend over time
* Annotations for key changes:
  - Feature launches
  - A/B test variations
  - Marketing campaigns

### Cohort Analysis (G3 - Future)
* Compare user cohorts:
  - New vs returning users
  - Mobile vs desktop users
  - Different traffic sources (organic, paid, referral)

### Custom Admin Dashboard (In-App)
* Admin console page: `/admin/analytics`
* Embed PostHog dashboard via iframe OR
* Build custom charts using PostHog API:
  - Real-time booking count (today)
  - Conversion rate (this week vs last week)
  - Top-performing trips (by bookings)
  - Driver acceptance time (avg, median, p90)

### Alerts & Notifications
* Set up PostHog alerts:
  - If conversion rate drops below 10% → Slack/email notification
  - If payment_failed events spike >10% → Immediate alert
  - If avg driver acceptance time >10 min → Daily digest

## Technical Notes

### PostHog Funnel Query (API)
```javascript
// Fetch funnel data via PostHog API
const response = await fetch('https://app.posthog.com/api/projects/:project_id/insights/funnel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.POSTHOG_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    events: [
      { id: 'trip_list_viewed', name: 'Trip List Viewed', type: 'events' },
      { id: 'trip_detail_viewed', name: 'Detail Viewed', type: 'events' },
      { id: 'booking_started', name: 'Booking Started', type: 'events' },
      { id: 'otp_verified_success', name: 'OTP Verified', type: 'events' },
      { id: 'payment_succeeded', name: 'Payment Success', type: 'events' },
      { id: 'driver_booking_accepted', name: 'Driver Accepted', type: 'events' }
    ],
    date_from: '-30d',
    funnel_window_days: 7
  })
});
```

### Custom Metrics (Database Queries)
* Supplement PostHog with direct DB queries for financial metrics:
  ```sql
  -- Today's bookings
  SELECT COUNT(*) FROM bookings 
  WHERE created_at >= CURRENT_DATE;

  -- Avg driver acceptance time (last 7 days)
  SELECT AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) / 60 AS avg_minutes
  FROM bookings 
  WHERE accepted_at IS NOT NULL 
    AND created_at >= NOW() - INTERVAL '7 days';
  ```

### Dashboard Refresh Rate
* PostHog dashboard: Auto-refresh every 5 minutes
* In-app admin dashboard: Real-time (via React Query polling)

### Data Export
* Export funnel data to CSV:
  - Button: "Export Funnel Data"
  - Columns: Date, Step, Users, Conversion Rate
* Automated weekly reports:
  - Email to stakeholders every Monday
  - Includes: Conversion trends, top insights, action items

## Success Metrics (from Product Spec)
* **50+ completed trips in 30 days** ⭐ GOAL
* **<2% double-booking rate** ⭐ GOAL
* **<5 min avg driver accept time** ⭐ GOAL
* **NPS ≥40** (G3 - surveys)
* **80% driver retention** (G3)

## Reporting Schedule
* **Daily**: Quick stats (bookings, revenue)
* **Weekly**: Funnel analysis, conversion trends
* **Monthly**: Cohort analysis, growth metrics
* **Quarterly**: Strategic review, roadmap planning

## Gate Assignment
**Gate 2** (Basic funnel tracking, PostHog dashboard)
**Gate 3** (Custom admin dashboard, automated alerts, advanced cohorts)
