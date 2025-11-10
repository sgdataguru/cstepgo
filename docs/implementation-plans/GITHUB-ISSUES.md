# GitHub Issues to Create

> **Recommended issues for tracking missing implementation plans**

Based on the gap analysis in [MISSING-PLANS.md](./MISSING-PLANS.md), these GitHub issues should be created to track the creation of missing implementation plans.

---

## Issue 1: Create Implementation Plan for Cancellation & Refunds (G.1)

**Priority**: High  
**Labels**: `implementation-plan-gap`, `payments`, `high-priority`, `Gate-2`  
**Milestone**: Gate 2 - Week 5  
**Epic**: G - Policies

### Issue Description

```markdown
## Summary
Create a detailed implementation plan for the Cancellation & Refunds feature (Epic G.1) to supplement the master plan specifications.

## Background
The [00-GATE2-MASTER-PLAN.md](./docs/implementation-plans/00-GATE2-MASTER-PLAN.md) includes specifications for cancellation and refund logic, but given the financial and legal criticality of this feature, a dedicated implementation plan is needed.

## Why This Is Needed
- Financial logic is error-prone and requires comprehensive testing
- Legal implications require detailed policy specifications
- Complex edge cases (partial refunds, failed refunds, disputes)
- Requires detailed Stripe refund API integration
- Communication templates needed for users
- Compliance considerations

## What Should Be Included

### Technical Specifications
- Detailed refund calculation algorithm
- Cancellation policy enforcement (48h/24h windows)
- Stripe refund API integration details
- Error handling for failed refunds
- Database schema for refund tracking
- Transaction rollback procedures

### Testing Strategy
- Unit tests for all refund calculation scenarios
- Integration tests with Stripe test mode
- Edge cases: partial bookings, group bookings, promotional codes
- Load testing for concurrent cancellations
- Idempotency testing

### User Experience
- Cancellation flow UI/UX
- Communication templates (email/SMS)
- Confirmation screens
- Refund status tracking

### Compliance
- Terms and conditions alignment
- Refund policy disclosure
- Dispute handling procedures

## Related Plans
- [09-pay-for-trip-booking.md](./docs/implementation-plans/09-pay-for-trip-booking.md) - Original payment
- Booking system

## Acceptance Criteria
- [ ] Implementation plan document created following standard structure
- [ ] All refund calculation scenarios documented with test cases
- [ ] Stripe refund API integration fully specified
- [ ] Error handling for all failure modes
- [ ] Communication templates created
- [ ] Legal/compliance section included
- [ ] Cross-references to related plans added

## Timeline
Target: End of Week 4 (before payment implementation in Week 5)

## References
- [MISSING-PLANS.md](./docs/implementation-plans/MISSING-PLANS.md)
- [00-GATE2-MASTER-PLAN.md](./docs/implementation-plans/00-GATE2-MASTER-PLAN.md) Section: Epic G.1
```

---

## Issue 2: Evaluate Need for Dedicated Implementation Plans (4 Features)

**Priority**: Medium  
**Labels**: `implementation-plan-gap`, `evaluation-needed`, `Gate-2`  
**Milestone**: Gate 2 - Week 1-2  

### Issue Description

```markdown
## Summary
Evaluate whether dedicated implementation plans are needed for 4 complex features currently only documented in the master plan.

## Background
The following features have detailed specifications in [00-GATE2-MASTER-PLAN.md](./docs/implementation-plans/00-GATE2-MASTER-PLAN.md) but no dedicated implementation plan documents. During sprint planning, the team should assess whether the master plan detail is sufficient or if dedicated plans would be beneficial.

## Features to Evaluate

### 1. C.2 - Platform Fees & Ledger
**Epic**: C - Payments  
**Priority**: P1  
**Complexity**: Medium-High  

**Reason for Evaluation**: Financial logic is critical and error-prone. Consider creating dedicated plan with:
- Comprehensive test cases for fee calculations
- Edge cases (refunds, partial payments)
- Audit logging requirements
- Reconciliation procedures

**Decision Criteria**:
- ✅ Create plan if: Fee calculation has >3 different scenarios or requires complex audit trail
- ⛔ Skip if: Simple percentage-based fee with straightforward implementation

---

### 2. D.2 - Accept/Decline Booking with Atomic Locking
**Epic**: D - Driver Portal  
**Priority**: P0  
**Complexity**: High  

**Reason for Evaluation**: Database locking is complex and critical for preventing double-bookings. Consider creating dedicated plan with:
- Detailed locking strategy and edge cases
- Race condition testing scenarios
- Performance under load
- Rollback procedures

**Decision Criteria**:
- ✅ Create plan if: Team is not experienced with PostgreSQL row-level locking or if stress testing reveals issues
- ⛔ Skip if: Database team confirms master plan specs are sufficient

---

### 3. D.4 - Geofilter with PostGIS
**Epic**: D - Driver Portal  
**Priority**: P1  
**Complexity**: Medium-High  

**Reason for Evaluation**: PostGIS integration can be tricky and requires database extension setup. Consider creating dedicated plan with:
- PostGIS setup instructions (enable extension)
- Migration scripts for geography columns
- Index optimization for spatial queries
- Testing with real geographic data

**Decision Criteria**:
- ✅ Create plan if: Team has no prior PostGIS experience or if performance testing reveals issues
- ⛔ Skip if: Database already has PostGIS enabled and team is familiar with spatial queries

---

### 4. E.1 - Trip Approval Workflow
**Epic**: E - Admin Console  
**Priority**: P1  
**Complexity**: Medium  

**Reason for Evaluation**: Admin workflows are critical for operations. Consider creating dedicated plan with:
- Complete admin UI mockups
- Approval criteria and validation rules
- Notification system for drivers
- Audit trail requirements

**Decision Criteria**:
- ✅ Create plan if: Approval workflow requires multiple approval stages or complex validation
- ⛔ Skip if: Simple approve/reject with reason is sufficient

---

## Task Breakdown

### Week 1
- [ ] Review master plan specs for each feature
- [ ] Assess team experience with relevant technologies (PostGIS, row locking, etc.)
- [ ] Identify potential complexity/risk areas
- [ ] Make decision for each feature

### Week 2
- [ ] Create dedicated plans for features where decision = "Create"
- [ ] Document rationale in [MISSING-PLANS.md](./docs/implementation-plans/MISSING-PLANS.md)
- [ ] Update [IMPLEMENTATION-STATUS.md](./docs/implementation-plans/IMPLEMENTATION-STATUS.md)

## Acceptance Criteria
- [ ] Decision made for each of 4 features (Create plan vs. Use master plan)
- [ ] Rationale documented for each decision
- [ ] If "Create plan" - dedicated implementation plan created
- [ ] If "Use master plan" - confirmation that specs are sufficient

## References
- [MISSING-PLANS.md](./docs/implementation-plans/MISSING-PLANS.md)
- [00-GATE2-MASTER-PLAN.md](./docs/implementation-plans/00-GATE2-MASTER-PLAN.md)
```

---

## Issue 3: Document Archived Implementation Plans

**Priority**: Low  
**Labels**: `documentation`, `cleanup`  
**Milestone**: Gate 2 - Week 1  

### Issue Description

```markdown
## Summary
Add archival notices to implementation plans 10 and 12 to clarify they are no longer active.

## Background
Two implementation plans have been archived but do not have clear archival notices:
- 10-join-whatsapp-group.md - Replaced by in-app chat
- 12-receive-driver-payouts.md - Deferred to Gate 3

## Task
Add prominent archival notice to the top of each file:

```markdown
> **⚠️ ARCHIVED**  
> This implementation plan has been archived and is no longer active.  
> **Reason**: [Replaced by in-app chat / Deferred to Gate 3]  
> **Archived Date**: October 2025  
> **See**: [README.md](./README.md) for current active plans
```

## Acceptance Criteria
- [ ] Archival notice added to 10-join-whatsapp-group.md
- [ ] Archival notice added to 12-receive-driver-payouts.md
- [ ] README.md already documents archived status ✅

## References
- [README.md](./docs/implementation-plans/README.md) - Archived Features section
```

---

## How to Create These Issues

1. Go to repository: https://github.com/sgdataguru/cstepgo/issues
2. Click "New Issue"
3. Copy/paste the issue description from above
4. Add appropriate labels, milestone, assignees
5. Create issue

---

**Created By**: AI Assistant  
**Date**: November 10, 2025  
**Status**: Ready to create in GitHub
