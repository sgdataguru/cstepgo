# StepperGO User Story Mapping
**Last Updated**: November 6, 2025
**Source**: Meeting Transcript from November 4, 2025
**Product**: Ride-sharing platform for Central Asia (Kyrgyzstan, Kazakhstan)

## Executive Summary
This document maps all user stories extracted from the product discovery meeting. Stories follow **INVEST principles** and use **vertical slicing** to deliver end-to-end value in each iteration.

## Story Organization

### Epic A: Trip Discovery & Browsing (Public Access)
*Allows visitors to explore trips without registration*

- **Story 01**: [View Trip Urgency Status](./01-view-trip-urgency-status.md) - See departure urgency
- **Story 02**: [View Trip Itinerary](./02-view-trip-itinerary.md) - See detailed trip route
- **Story 03**: [Create Trip with Itinerary](./03-create-trip-with-itinerary.md) - Tourist creates custom trip
- **Story 04**: [Search Locations Autocomplete](./04-search-locations-autocomplete.md) - Find destinations easily
- **Story 13**: [Browse Trips Without Registration](./13-browse-trips-without-registration.md) - Public trip listing 🆕
- **Story 14**: [Zone-Based Itinerary & Pricing](./14-zone-based-itinerary-pricing.md) - Geographic zones with smart pricing 🆕

### Epic B: Booking (Private vs Shared)
*Core booking flows with different pricing models*

- **Story B1**: [Traveler Identity via OTP](./B1-traveler-identity-otp.md) - Phone/email verification
- **Story B2**: [Private Booking](./B2-private-booking.md) - Book entire vehicle
- **Story B3**: [Shared Booking Per-Seat](./B3-shared-booking-per-seat.md) - Book individual seats
- **Story 17**: [Dynamic Shared Trip Pricing](./17-dynamic-shared-trip-pricing.md) - Price decreases as more join 🆕
- **Story 19**: [Passenger Upgrade or Cancel](./19-passenger-upgrade-or-cancel.md) - Pre-departure options 🆕

### Epic C: Payments & Pricing
*Secure payment processing with transparency*

- **Story 05**: [View Dynamic Trip Pricing](./05-view-dynamic-trip-pricing.md) - Transparent price breakdown
- **Story 09**: [Pay for Trip Booking](./09-pay-for-trip-booking.md) - Stripe integration
- **Story C2**: [Platform Fees & Ledgers](./C2-platform-fees-ledgers.md) - Financial tracking
- **Story G1**: [Cancellation & Refunds](./G1-cancellation-refunds.md) - Refund processing

### Epic D: Driver Portal
*Driver dashboard, trip management, and earnings*

- **Story D1**: [Driver Sign In](./D1-driver-sign-in.md) - Driver authentication
- **Story D2**: [Accept/Decline Booking](./D2-accept-decline-booking.md) - Atomic booking acceptance
- **Story D3**: [Mark Trip Complete](./D3-mark-trip-complete.md) - Trip completion tracking 🔄 Updated
- **Story D4**: [Geofilter Drivers](./D4-geofilter-drivers.md) - 50km radius filter 🔄 Updated
- **Story 06**: [View Driver Profile](./06-view-driver-profile.md) - Driver public profile
- **Story 12**: [Receive Driver Payouts](./12-receive-driver-payouts.md) - Payout processing
- **Story 16**: [Driver Mark Trip Complete](./16-driver-mark-trip-complete.md) - Completion workflow 🆕

### Epic E: Admin Operations
*Platform management and driver onboarding*

- **Story E1**: [Admin Trip Approval](./E1-admin-trip-approval.md) - Review before publishing
- **Story E2**: [Admin Driver Management](./E2-admin-driver-management.md) - Driver lifecycle
- **Story 15**: [Admin Manual Driver Registration](./15-admin-manual-driver-registration.md) - Onboard 100 existing drivers 🆕

### Epic F: Analytics & Tracking
*Data collection for platform optimization*

- **Story F1**: [PostHog Event Tracking](./F1-posthog-event-tracking.md) - User behavior analytics
- **Story F2**: [Analytics Funnel Dashboard](./F2-analytics-funnel-dashboard.md) - Conversion tracking

### Epic G: Passenger Experience
*Registration, communication, and engagement*

- **Story 07**: [Register as Passenger](./07-register-as-passenger.md) - Account creation
- **Story 10**: [Join WhatsApp Group](./10-join-whatsapp-group.md) - Trip coordination
- **Story 11**: [Manage Trip Settings](./11-manage-trip-settings.md) - Booking preferences

### Epic H: Driver Onboarding
*Public driver application (Gate 4)*

- **Story 08**: [Apply as Driver](./08-apply-as-driver.md) - Self-registration for future phase

---

## Gate-Based Roadmap

### Gate 1: Landing Page & Public Discovery ✅ COMPLETED
**Timeline**: Completed (Demo on Nov 4, 2025)
**Stories**:
- 01: View Trip Urgency Status
- 02: View Trip Itinerary
- 03: Create Trip with Itinerary
- 04: Search Locations Autocomplete
- 05: View Dynamic Trip Pricing
- 06: View Driver Profile
- 13: Browse Trips Without Registration

**Deliverables**:
- Public landing page
- Trip browsing without login
- Trip creation flow
- Location autocomplete
- Basic trip listing with pricing
- Driver profiles

---

### Gate 2: Core Booking & Driver Portal 🔄 IN PROGRESS
**Timeline**: 8 weeks (Flexible, can be faster)
**Budget**: $1,200 + $300 (admin setup) = $1,500
**30% Milestone**: $420 released after Gate 1 demo

**Stories**:
- B1: Traveler Identity via OTP
- B2: Private Booking (Whole Vehicle)
- B3: Shared Booking Per-Seat
- 07: Register as Passenger
- 09: Pay for Trip Booking (Stripe integration)
- D1: Driver Sign In
- D2: Accept/Decline Booking
- D4: Geofilter Drivers (50km radius)
- 15: Admin Manual Driver Registration
- 16: Driver Mark Trip Complete
- E1: Admin Trip Approval
- F1: PostHog Event Tracking

**Key Features**:
- OTP-based phone registration
- Private vs Shared booking split
- Stripe payment gateway
- Driver dashboard with geofilterin
- Trip acceptance workflow (atomic locking)
- Admin manually registers 100 drivers
- Trip completion tracking

**Admin Setup Tasks** ($300):
- Domain registration (steppergo.com or steppego.com)
- Stripe account setup (requires business registration)
- Twilio account (SMS/WhatsApp)
- PostHog analytics setup
- Supabase database deployment

---

### Gate 3: Advanced Features & Automation ⏳ PLANNED
**Timeline**: TBD (After Gate 2 completion)
**Focus**: Revenue optimization and operational efficiency

**Stories**:
- 10: Join WhatsApp Group
- 11: Manage Trip Settings
- 12: Receive Driver Payouts
- 14: Zone-Based Itinerary & Pricing
- 17: Dynamic Shared Trip Pricing
- 19: Passenger Upgrade or Cancel
- C2: Platform Fees & Ledgers
- E2: Admin Driver Management
- F2: Analytics Funnel Dashboard
- G1: Cancellation & Refunds

**Key Features**:
- Zone-based pricing engine (A/B/C zones)
- Dynamic pricing with auto-refunds
- Passenger pre-departure options (upgrade/cancel)
- Automated driver payouts (weekly batches)
- WhatsApp group coordination
- Advanced analytics dashboards
- Cancellation policies & refund automation

---

### Gate 4: Public Driver Onboarding & Scaling 🔮 FUTURE
**Timeline**: When platform reaches critical mass
**Focus**: Open platform to public drivers

**Stories**:
- 08: Apply as Driver (Self-registration)
- Driver marketplace features
- Multi-language support
- Cross-border payment handling

**Trigger Criteria**:
- >500 trips completed successfully
- >1,000 registered passengers
- Driver acceptance rate >80%
- Platform NPS >50

---

## Removed Stories (Not Relevant to Current Product)
These stories were removed as they don't align with the ride-sharing platform vision:
- ~~02: Share Achievements~~ (Fitness tracking feature)
- ~~03: Set Goals~~ (Goal management feature)
- ~~04: View Progress~~ (Progress tracking feature)
- ~~05: Admin Dashboard~~ (Duplicate, replaced by E1/E2)

---

## Key Product Insights from Transcript

### Business Model
- **Target Market**: Kyrgyzstan, Kazakhstan (Central Asia)
- **Inspiration**: inDriver + BlaBlaCar hybrid
- **Revenue**: 20-25% platform fee on all transactions
- **Current Drivers**: 100 drivers already signed up (from inDriver)

### Critical Requirements
1. **Two Distinct Booking Types**:
   - **Private**: Tourist books entire vehicle, custom pricing
   - **Shared**: Pay per seat, price decreases as more join

2. **No Forced Registration**:
   - Users browse all trips publicly
   - Only required when attempting to book

3. **Driver Manual Onboarding (Gate 2)**:
   - Admin registers drivers initially
   - Builds trust before opening self-registration
   - Have 100 drivers ready to migrate

4. **Geofiltering (Default 50km)**:
   - Drivers see trips near their location
   - Expandable to nationwide
   - Prevents irrelevant trip overload

5. **Trip Completion Tracking**:
   - Drivers must mark trips complete
   - Triggers payout processing
   - Enables passenger rating

6. **Dynamic Pricing Transparency**:
   - Show how price decreases with more passengers
   - Auto-refund if price drops after booking
   - Encourage trip filling

7. **Zone-Based Logic**:
   - Attractions grouped by distance zones (A/B/C)
   - Prevents illogical routing
   - Smart pricing based on zone mix

---

## Success Metrics (from Transcript)

### Customer Metrics
- Conversion from browse → signup: >15%
- Booking completion rate: >70%
- Trip cancellation rate: <10%

### Driver Metrics
- Driver acceptance time: <5 minutes avg
- Driver acceptance rate: >80%
- Driver cancellation rate: <5%
- Avg payout processing time: <7 days

### Platform Health
- Double-booking rate: <2% ⭐ CRITICAL
- Payment processing success: >98%
- Trip completion rate: >95%
- Platform uptime: >99.5%

---

## Tech Stack Decisions

### Core Infrastructure
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS ✅
- **Backend**: Node.js + Next.js API Routes ✅
- **Database**: Supabase (PostgreSQL) with PostGIS ✅
- **Authentication**: OTP via Twilio
- **Payments**: Stripe (2.5% + $0.30 per transaction)
- **Analytics**: PostHog (1M events free/month)
- **File Storage**: AWS S3 or Supabase Storage
- **Deployment**: TBD (Vercel, Railway, or AWS)

### Third-Party Costs (Monthly Estimate)
- **Stripe**: Variable (2.5% + $0.30 per transaction) - No free tier
- **Twilio**: $50/month (SMS/WhatsApp for OTP)
- **PostHog**: Free up to 1M events
- **Domain**: $15/year (~$1.25/month)
- **Supabase**: Free tier (upgrade if needed)
- **Total**: ~$50-75/month base + transaction fees

---

## INVEST Principle Compliance

All stories follow INVEST:
- **Independent**: Can be developed in any order within epic
- **Negotiable**: Details can be refined during backlog grooming
- **Valuable**: Each delivers end-user or business value
- **Estimable**: Clear enough for dev team to estimate effort
- **Small**: Completable within 1-2 week sprint
- **Testable**: Acceptance criteria define "done"

---

## Vertical Slicing Examples

✅ **Good** (End-to-End Value):
- Story B2: "As a traveler, I want to book an entire vehicle privately" → Touches UI (booking form), logic (seat locking), backend (database), payment (Stripe)

❌ **Bad** (Horizontal Layers):
- "Create booking database table" - Infrastructure task, not user story
- "Build Stripe API integration" - Technical task, not user value
- "Design booking UI" - Partial story, no backend

---

## Next Steps

### Immediate (Gate 2 Kickoff)
1. ✅ Approve Gate 1 demo
2. ✅ Release 30% payment ($420)
3. ⏳ Admin completes setup tasks:
   - Register domain
   - Create Stripe business account
   - Set up Twilio for SMS
   - Provide driver data for manual registration
4. ⏳ Begin Gate 2 development (8-week timeline)

### Future Review Points
- **Week 4 of Gate 2**: Mid-sprint demo (booking flows)
- **Week 8 of Gate 2**: Gate 2 completion → 30% payment ($420)
- **Gate 3 Planning**: After Gate 2 deployment

---

## Contact & Collaboration
- **Product Owner**: Ming (business requirements)
- **Stakeholder**: Reese (on-ground operations, Kazakhstan)
- **Technical Lead**: Mahesh (development & delivery)
- **Repository**: [GitHub - StepperGO](https://github.com/sgdataguru/StepperGO)
- **Documentation**: `/docs/implementation-plans/`

## Overview
Mapping existing user stories to new Epic structure from Transcript_4Nov.docx product spec.

**Key Changes:**
- **NEW**: Private vs Shared booking model
- **NEW**: Driver Portal (Epic D)
- **NEW**: Admin Console (Epic E)  
- **NEW**: PostHog Analytics (Epic F)
- **UPDATED**: OTP-based lean registration
- **UPDATED**: Geofilter for drivers
- **UPDATED**: Atomic concurrency locking

---

## Epic A — Trip Discovery & Details (Public, no login)

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 01-view-trip-urgency-status.md | UPDATE | Browse trips with urgency indicators |
| 02-view-trip-itinerary.md | UPDATE | Trip detail page with full itinerary |
| 04-search-locations-autocomplete.md | KEEP | Search locations (autocomplete) |
| 06-view-driver-profile.md | UPDATE | View driver rating placeholder |

**New AC Requirements:**
- Sorted by soonest departure
- Book CTA visible on detail page
- Private trips hidden after acceptance

---

## Epic B — Booking (Private vs Shared) ⭐ MAJOR CHANGE

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 07-register-as-passenger.md | UPDATE → OTP | Traveler identity (OTP verification) |
| - | CREATE NEW | Private booking (whole vehicle) |
| - | CREATE NEW | Shared booking (per-seat) |
| - | CREATE NEW | Soft hold (10-min race protection) |

**New AC Requirements:**
- Private: Locks all seats, hides trip from public
- Shared: Enforces capacity with seat selector
- OTP: 60s delivery, 3-attempt throttle
- Soft hold: 10-minute expiry during checkout

---

## Epic C — Payments (Stripe) (G2)

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 09-pay-for-trip-booking.md | UPDATE | Card checkout via Stripe |
| - | CREATE NEW | Platform fees & ledgers |

**New AC Requirements:**
- Booking status: "paid/pending driver acceptance"
- Platform fee % persisted per booking
- CSV export for driver payouts

---

## Epic D — Driver Portal ⭐ NEW EPIC

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 08-apply-as-driver.md | REFERENCE | (Admin creates drivers - see Epic E) |
| - | CREATE NEW | Driver sign-in (admin-provisioned) |
| - | CREATE NEW | Accept/decline booking (atomic lock) |
| - | CREATE NEW | Mark trip complete |
| - | CREATE NEW | Geofilter (50km default, expandable) |

**New AC Requirements:**
- Role-based access (driver role only)
- One booking per timeslot
- Atomic row-level locking
- Only driver's queue visible

---

## Epic E — Admin Console ⭐ NEW EPIC

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 03-create-trip-with-itinerary.md | MOVE TO ADMIN | Admin creates trip (pending approval) |
| 08-apply-as-driver.md | UPDATE | Admin adds driver with vehicle docs |
| 11-manage-trip-settings.md | UPDATE | Admin trip approval workflow |
| - | CREATE NEW | Approve/reject trips with audit trail |

**New AC Requirements:**
- Trip status: draft → pending → approved/rejected
- Driver management: license, vehicle type, seats, home location
- Audit trail for all admin actions

---

## Epic F — Analytics & Observability (PostHog) ⭐ NEW EPIC

| Old Story | Status | New Story |
|-----------|--------|-----------|
| - | CREATE NEW | PostHog event tracking |
| - | CREATE NEW | Analytics funnel view |

**New AC Requirements:**
- Events: View → Detail → Start Booking → OTP → Pay → Driver Accept
- Anon IDs, no PII sent to PostHog
- Funnel drop-off metrics

---

## Epic G — Policies (Cancellations, No-shows) (G3/4)

| Old Story | Status | New Story |
|-----------|--------|-----------|
| 05-view-dynamic-trip-pricing.md | UPDATE | Dynamic price drop (per-seat) |
| - | CREATE NEW | Cancellation rules & refunds |

**New AC Requirements:**
- Cut-off windows: <24h = 50% fee
- Price decreases in 5-10% steps (never increases)
- Stripe partial refunds

---

## Stories to Remove/Archive

| Story | Reason |
|-------|--------|
| 10-join-whatsapp-group.md | Out of scope for MVP |
| 12-receive-driver-payouts.md | Covered by Epic C platform fees |
| Duplicate files | Clean up duplicates |

---

## Implementation Order (Gates)

**Gate 1 (COMPLETED):**
- ✅ Browse trips
- ✅ View itinerary
- ✅ Basic trip display

**Gate 2 (NEXT):**
- [ ] Epic B: Private/Shared booking
- [ ] Epic C: Stripe payments
- [ ] Epic D: Driver portal (accept/decline)
- [ ] Epic E: Admin console (trip approval, driver mgmt)
- [ ] Epic F: PostHog analytics

**Gate 3/4 (FUTURE):**
- [ ] Epic G: Cancellation policies
- [ ] Epic G: Dynamic pricing

---

## Data Model Impact

**New Tables Required:**
1. `users` - Add: role (traveller/driver/admin), otp_verified_at
2. `drivers` - NEW: license_no, vehicle_type, seat_capacity, home_location
3. `trips` - Add: is_private, status workflow
4. `trip_pricing` - NEW: base_price_per_seat, pricing_mode, min/max
5. `bookings` - Add: type (private/shared), hold_expires_at
6. `payments` - NEW: platform_fee_pct, stripe_payment_intent_id
7. `driver_assignments` - NEW: atomic locking table
8. `events_analytics` - NEW: PostHog tracking

---

**Next Steps:**
1. Update Epic A stories (trip discovery)
2. Create Epic B stories (booking model)
3. Update Epic C stories (payments)
4. Create Epic D stories (driver portal)
5. Create Epic E stories (admin console)
6. Create Epic F stories (analytics)
7. Update Epic G stories (policies)
8. Remove duplicates and outdated stories
