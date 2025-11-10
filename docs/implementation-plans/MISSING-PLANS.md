# Missing Implementation Plans

> **Gaps identified between individual implementation plans and Master Plan coverage**

**Last Updated**: November 10, 2025  
**Status**: Documentation Only - Features Covered in Master Plan  

---

## Overview

The [00-GATE2-MASTER-PLAN.md](./00-GATE2-MASTER-PLAN.md) provides comprehensive technical specifications for 9 features that do not have dedicated implementation plan documents. This document tracks these gaps and provides guidance on whether dedicated plans are needed.

---

## Epic B - Booking

### B.2 - Private Booking Flow
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic B - Private Booking  
**Priority**: P0 (Blocker for MVP)

**What's Covered in Master Plan**:
- Complete booking flow (seat locking, visibility rules)
- API endpoints: `POST /api/bookings/private`
- TypeScript interfaces for PrivateBooking
- Database schema updates (Booking model)
- Atomic locking mechanism
- Testing strategy

**Recommendation**: 
✅ **Sufficient detail in master plan** - No separate document needed initially. Can create dedicated plan if complexity requires during implementation.

**Related Plans**:
- [07-register-as-passenger.md](./07-register-as-passenger.md) - Authentication required
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Payment integration

---

### B.3 - Shared Booking with Hold
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic B - Shared Booking  
**Priority**: P0 (Blocker for MVP)

**What's Covered in Master Plan**:
- 10-minute soft hold mechanism
- Capacity check with atomic transaction
- API endpoints: `POST /api/bookings/shared`
- Cron job for expiring holds
- Database schema: `hold_expires_at` field
- Concurrent booking handling

**Recommendation**: 
✅ **Sufficient detail in master plan** - Implementation can proceed with master plan specs. Consider creating dedicated plan if soft-hold logic proves complex.

**Related Plans**:
- [07-register-as-passenger.md](./07-register-as-passenger.md) - Authentication required
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Payment completes hold
- [05-view-dynamic-trip-pricing.md](./05-view-dynamic-trip-pricing.md) - Shows available seats

---

## Epic C - Payments

### C.2 - Platform Fees & Ledger
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic C - Platform Fees  
**Priority**: P1 (Important for Revenue)

**What's Covered in Master Plan**:
- Configurable platform fee (default 15%)
- Payment model with fee tracking
- PlatformSettings model for fee configuration
- Admin API: `POST /api/admin/settings/fees`
- Ledger calculation logic
- Fee distribution to drivers

**Recommendation**: 
⚠️ **May need dedicated plan** - Financial logic is critical and error-prone. Consider creating detailed implementation plan with:
- Comprehensive test cases for fee calculations
- Edge cases (refunds, partial payments)
- Audit logging requirements
- Reconciliation procedures

**Related Plans**:
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Applies platform fees

**Action**: Create GitHub issue to track if dedicated plan is needed.

---

## Epic D - Driver Portal

### D.2 - Accept/Decline Booking with Atomic Locking
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic D.2  
**Priority**: P0 (Blocker for Driver Operations)

**What's Covered in Master Plan**:
- PostgreSQL row-level locking (`FOR UPDATE`)
- Complete SQL transaction example
- API endpoints: `POST /api/driver/accept-booking`, `POST /api/driver/decline-booking`
- DriverAssignment model
- Prevent double-booking logic
- Timeslot conflict checking

**Recommendation**: 
⚠️ **May need dedicated plan** - Atomic locking is complex and critical. Consider creating detailed implementation plan with:
- Detailed locking strategy and edge cases
- Race condition testing scenarios
- Performance under load
- Rollback procedures

**Related Plans**:
- [08-apply-as-driver.md](./08-apply-as-driver.md) - Driver must be approved
- [15-admin-manual-driver-registration.md](./15-admin-manual-driver-registration.md) - Driver access

**Action**: Create GitHub issue to track dedicated plan creation.

---

### D.3 - Mark Trip Complete
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic D.3  
**Priority**: P1 (Important for Trip Lifecycle)

**What's Covered in Master Plan**:
- API endpoint: `POST /api/driver/complete-trip`
- Trip status workflow: LIVE → COMPLETED
- Review prompt trigger
- PostHog event tracking
- Database updates

**Recommendation**: 
✅ **Sufficient detail in master plan** - Straightforward status update. No dedicated plan needed unless review system requires extensive work.

**Related Plans**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Trip creation
- [11-manage-trip-settings.md](./11-manage-trip-settings.md) - Trip management

---

### D.4 - Geofilter with PostGIS
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic D.4  
**Priority**: P1 (Important for Driver UX)

**What's Covered in Master Plan**:
- PostGIS `ST_DWithin` query for 50km radius
- Complete SQL example with geography type
- Driver home location storage
- API endpoint: `GET /api/driver/trips` with geofilter
- Distance calculation and sorting

**Recommendation**: 
⚠️ **May need dedicated plan** - PostGIS integration can be tricky. Consider creating implementation plan with:
- PostGIS setup instructions (enable extension)
- Migration scripts for geography columns
- Index optimization for spatial queries
- Testing with real geographic data

**Related Plans**:
- [14-zone-based-itinerary-pricing.md](./14-zone-based-itinerary-pricing.md) - Also uses PostGIS

**Action**: Create GitHub issue to track if dedicated plan is needed.

---

## Epic E - Admin Console

### E.1 - Trip Approval Workflow
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic E.1  
**Priority**: P1 (Important for Quality Control)

**What's Covered in Master Plan**:
- Trip status workflow: PENDING → APPROVED/REJECTED
- API endpoint: `POST /api/admin/trips/approve`
- TripAuditLog model for tracking
- Admin authentication requirements
- Rejection reason tracking

**Recommendation**: 
⚠️ **May need dedicated plan** - Admin workflows are critical for operations. Consider creating implementation plan with:
- Complete admin UI mockups
- Approval criteria and validation rules
- Notification system for drivers
- Audit trail requirements

**Related Plans**:
- [03-create-trip-with-itinerary.md](./03-create-trip-with-itinerary.md) - Creates trips needing approval
- [15-admin-manual-driver-registration.md](./15-admin-manual-driver-registration.md) - Admin interface patterns

**Action**: Create GitHub issue to track dedicated plan creation.

---

## Epic F - Analytics

### F.1 - PostHog Event Tracking
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic F.1  
**Priority**: P1 (Important for Product Insights)

**What's Covered in Master Plan**:
- PostHog SDK integration (client + server)
- Event tracking specifications
- No PII policy
- Auto-capture configuration
- Server-side event tracking function

**Recommendation**: 
✅ **Sufficient detail in master plan** - PostHog integration is well-documented by vendor. No dedicated plan needed unless custom analytics dashboard required.

**Related Plans**:
- All features - Analytics should be integrated throughout

---

### F.2 - Funnel Dashboard & Metrics
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic F.2  
**Priority**: P1 (Important for Product Insights)

**What's Covered in Master Plan**:
- Funnel analysis specifications
- Key metrics tracking
- PostHog dashboard configuration
- Conversion rate calculations

**Recommendation**: 
✅ **Sufficient detail in master plan** - Dashboard can be configured in PostHog UI. No dedicated plan needed unless custom implementation required.

**Related Plans**:
- [13-browse-trips-without-registration.md](./13-browse-trips-without-registration.md) - Top of funnel

---

## Epic G - Policies

### G.1 - Cancellation & Refund Rules
**Status**: ⚠️ No Dedicated Plan  
**Coverage**: Detailed in Master Plan Section: Epic G.1  
**Priority**: P1 (Important for User Trust)

**What's Covered in Master Plan**:
- Cancellation policy (48h/24h windows)
- Refund calculation logic (100%/50%/0%)
- API endpoint: `POST /api/bookings/cancel`
- Stripe refund integration
- Database schema: refund tracking fields

**Recommendation**: 
⚠️ **Should create dedicated plan** - Refund logic is financially critical and has legal implications. Create detailed implementation plan with:
- Complete refund calculation logic and edge cases
- Stripe refund API integration details
- Error handling for failed refunds
- Testing strategy for all scenarios
- Communication templates for users
- Compliance considerations

**Related Plans**:
- [09-pay-for-trip-booking.md](./09-pay-for-trip-booking.md) - Original payment
- Booking system

**Action**: **HIGH PRIORITY** - Create GitHub issue for dedicated plan creation.

---

## Summary

### By Action Required

**✅ No Action Needed (5)**: Sufficient detail in master plan
- B.2 - Private Booking
- B.3 - Shared Booking  
- D.3 - Mark Trip Complete
- F.1 - PostHog Event Tracking
- F.2 - Funnel Dashboard

**⚠️ Consider Creating Plan (4)**: Complex or critical features
- C.2 - Platform Fees & Ledger
- D.2 - Accept/Decline with Atomic Locking
- D.4 - Geofilter with PostGIS
- E.1 - Trip Approval Workflow

**🚨 Should Create Plan (1)**: Financially critical
- G.1 - Cancellation & Refund Rules

### GitHub Issues to Create

1. **Issue: Create Implementation Plan for Cancellation & Refunds (G.1)**
   - Priority: P1
   - Label: `implementation-plan-gap`, `payments`, `high-priority`
   - Epic: G - Policies
   - Rationale: Financial logic requires detailed specifications

2. **Issue: Evaluate Need for Dedicated Plans (4 features)**
   - Priority: P2
   - Label: `implementation-plan-gap`, `evaluation-needed`
   - Features: C.2, D.2, D.4, E.1
   - Rationale: Complex features that may benefit from dedicated plans during implementation

---

## Next Steps

### Week 0 (Planning Phase)
1. Create GitHub issues for missing plans
2. Prioritize G.1 (Cancellation & Refunds) for immediate creation
3. Schedule evaluation of 4 "consider" items during sprint planning

### During Implementation
- Revisit "sufficient detail" assessments as team begins work
- Create dedicated plans if complexity emerges
- Update this document as new gaps identified

---

**Document Owner**: Development Team  
**Maintained By**: Tech Lead  
**Review Frequency**: Weekly during Gate 2 development
