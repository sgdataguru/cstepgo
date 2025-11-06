# User Story Mapping: Old → New Epic Structure

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
