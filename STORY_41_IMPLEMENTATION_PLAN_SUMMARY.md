# Story #41: Passenger Browse and Book Activities - Implementation Plan Summary

## 📋 Document Overview

**Issue**: #41 - Implementation Plan: Passenger Browse and Book Activities  
**Status**: ✅ Enhanced Implementation Plan Complete  
**Location**: `docs/implementation-plans/41-passenger-browse-and-book-activities.md`  
**Version**: 2.0  
**Date**: November 25, 2025

---

## 🎯 What Was Delivered

This task required **creating an enhanced implementation plan document** (not implementing the code). The plan now includes:

1. ✅ Comprehensive dependency analysis of Stories #33-36, #40
2. ✅ Database model decision (Booking vs ActivityBooking)
3. ✅ Dashboard integration strategy with Story #36
4. ✅ Multi-tenant security and visibility rules
5. ✅ Activity Owner API dependency mapping
6. ✅ Complete technical specifications and acceptance criteria

---

## 🔑 Key Decisions Made

### 1. Database Model Strategy

**Decision**: Use **separate ActivityBooking model** (not reuse Booking)

**Rationale**:
- ✅ Clean domain separation (activities ≠ trips)
- ✅ Better type safety without nullable compromises
- ✅ Independent schema evolution
- ✅ Activity-specific features (time slots, participants)
- ✅ Matches Story #40 schema design

**Trade-off**: More complex unified queries, but cleaner architecture

**Implementation**:
```typescript
// Unified booking service abstracts over both types
interface UnifiedBooking {
  type: 'TRIP' | 'ACTIVITY';
  // ... common fields
}

async function getPassengerBookings(userId: string): Promise<UnifiedBooking[]> {
  const [trips, activities] = await Promise.all([
    prisma.booking.findMany({ where: { userId } }),
    prisma.activityBooking.findMany({ where: { passengerId: userId } })
  ]);
  return mergeAndSort(trips, activities);
}
```

---

### 2. Dashboard Integration with Story #36

**Decision**: **Unified list with type badges** (Option A)

**Layout**:
```
My Bookings
├── Filters: [All] [🚗 Trips] [🎯 Activities]
└── Unified List
    ├── Trip Card (blue accent, 🚗 icon)
    ├── Activity Card (purple accent, 🎯 icon)
    └── ...
```

**Rationale**:
- ✅ Users think in terms of "my bookings" not types
- ✅ Extends existing `/app/my-trips/page.tsx` pattern
- ✅ Chronological view of all bookings
- ✅ Filter buttons for focused view

**Implementation Path**:
1. Extend `/app/my-trips/page.tsx` with type filter
2. Create `<ActivityBookingCard>` component
3. Implement unified booking service
4. Add API endpoint: `GET /api/passengers/bookings?type=all|trip|activity`

---

### 3. Multi-Tenant Security Model

**Activity Visibility Rules**:
- ✅ **Public**: Only `status='ACTIVE'` AND `isPublished=true`
- ❌ **Hidden**: DRAFT, PENDING_APPROVAL, INACTIVE, REJECTED
- ✅ **Cross-tenant**: Activities from all tenants discoverable
- ❌ **PII**: Never expose ownerId, owner email/phone

**Enforcement**:
```typescript
// Public activity listing
const activities = await prisma.activity.findMany({
  where: {
    status: 'ACTIVE',
    isPublished: true,
    // Optional tenant filter
  },
  select: {
    // Public fields only (exclude ownerId, etc.)
  }
});
```

**Additional Security**:
- Rate limiting: 100 req/min (browse), 10 req/min (booking)
- Idempotency keys for booking creation
- Redis locks for availability checking
- Input sanitization with Zod schemas

---

## 📊 Dependency Analysis

### Story #40: Activity Owner Manage Activities ⚠️ **BLOCKER**

**Status**: NOT YET IMPLEMENTED

**Required Before Story #41**:
```prisma
// Must implement these models first:
model Activity {
  id              String   @id @default(cuid())
  ownerId         String
  title           String
  description     String   @db.Text
  category        String
  status          String   // DRAFT, PENDING_APPROVAL, ACTIVE, INACTIVE
  pricePerPerson  Int
  maxParticipants Int
  // ...
}

model ActivitySchedule { /* ... */ }
model ActivityPhoto { /* ... */ }
model ActivityBooking { /* ... */ }
```

**Required APIs**:
- `POST /api/activities` - Create activity (owner)
- `GET /api/activities/owner` - List owner activities
- `GET /api/activities/:id` - Get activity detail
- `GET /api/activities/:id/availability` - Get time slots
- `POST /api/activities/photos/upload` - Upload photos

**Can Implement in Parallel**:
- Owner dashboard UI (not needed for passenger browsing)
- Activity creation forms
- Owner analytics

---

### Story #33-36: Passenger Booking Features ✅ **READY**

| Story | Status | Provides |
|-------|--------|----------|
| #33 | ✅ Implemented | Private booking flow patterns |
| #34 | ✅ Implemented | Shared booking + availability checking |
| #35 | ✅ Implemented | Payment infrastructure (mock API) |
| #36 | ✅ Implemented | Booking dashboard at `/app/my-trips` |

**Integration Points**:
- Reuse booking flow UI components from #33, #34
- Extend payment API from #35 for activities
- Extend dashboard from #36 with activity bookings

---

## 🏗️ Implementation Phases

### Phase 1: Complete Story #40 Dependencies (1-2 weeks)
- [ ] Implement Activity models and Prisma migrations
- [ ] Build activity CRUD APIs
- [ ] Create availability system
- [ ] Implement photo upload service

### Phase 2: Activity Discovery (Week 1)
- [ ] Build `/activities` listing page with filters
- [ ] Create activity card components
- [ ] Implement search functionality
- [ ] Add sort options

### Phase 3: Activity Detail & Booking (Week 2)
- [ ] Build `/activities/[id]` detail page
- [ ] Create booking widget (date/time/participants)
- [ ] Implement availability checking
- [ ] Build booking modal with payment

### Phase 4: Dashboard Integration (Week 3)
- [ ] Extend `/app/my-trips` with unified bookings
- [ ] Create unified booking service
- [ ] Add filter buttons for trips vs activities
- [ ] Implement activity booking cards

### Phase 5: Testing & Polish (Week 3)
- [ ] E2E booking flow testing
- [ ] Concurrent booking prevention tests
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

## 📈 Success Metrics

### Must Have (Critical)
- ✅ Zero double-booking incidents (availability locking)
- ✅ >95% payment success rate
- ✅ Seamless dashboard integration
- ✅ Strict multi-tenant isolation

### Important (High Priority)
- ✅ >15% booking conversion rate
- ✅ <2 second page load times
- ✅ Mobile-responsive design
- ✅ Email confirmations working

### Nice to Have (Future)
- Activity recommendations
- Review system integration
- Social sharing features

---

## 🔐 Security Checklist

- [x] Only show ACTIVE + isPublished activities to passengers
- [x] Hide all owner PII except business name
- [x] Validate user authentication on all booking endpoints
- [x] Prevent activity owners from booking their own activities
- [x] Rate limiting per endpoint type
- [x] Idempotency keys for booking creation
- [x] Redis locks for availability checking
- [x] Input sanitization with Zod
- [x] XSS protection on activity descriptions
- [x] GDPR/privacy compliance notes

---

## 📦 Deliverables

### Documentation
- ✅ Enhanced implementation plan: `docs/implementation-plans/41-passenger-browse-and-book-activities.md`
- ✅ Dependency analysis and API specifications
- ✅ Security model documentation
- ✅ Integration strategy with existing features

### Database Changes (Future PR)
- ActivityBooking model enhancements
- Multi-tenant fields (tenantId)
- Status and publishing fields

### API Endpoints (Future PR)
```
Passenger-Facing:
GET    /api/activities                    # Browse activities
GET    /api/activities/:id                # Activity detail
GET    /api/activities/:id/availability   # Available slots
POST   /api/activities/:id/book           # Create booking
GET    /api/passengers/bookings           # Unified bookings (extended)
```

### UI Components (Future PR)
```
src/app/activities/
├── page.tsx                   # Listing with filters
├── [id]/page.tsx             # Activity detail
└── components/
    ├── ActivityCard.tsx
    ├── BookingWidget.tsx
    └── FilterSidebar.tsx

src/app/my-trips/
└── page.tsx                  # Extended with activities
```

---

## ⏱️ Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Story #40 Dependencies | 1-2 weeks | Blocker - must complete first |
| Activity Discovery | 1 week | Parallel with booking flow |
| Booking Flow | 1 week | Includes payment integration |
| Dashboard Integration | 1 week | Extends existing UI |
| Testing & Polish | 3-4 days | QA and performance |
| **Total** | **4-5 weeks** | Assumes 1 developer |

---

## 🚀 Next Steps

### Immediate Actions
1. ✅ Implementation plan document complete
2. ⬜ Product team review and approval
3. ⬜ Technical design session for Story #40
4. ⬜ Sprint planning for Story #40 + #41

### Development Order
1. **First**: Implement Story #40 (Activity Owner features)
2. **Second**: Implement Story #41 (Passenger browse and book)
3. **Third**: Integration testing across both stories

### Risk Mitigation
- Start Story #40 immediately (blocker for #41)
- Consider splitting #41 into smaller PRs (browse, detail, booking)
- Plan for load testing (concurrent bookings)
- Set up monitoring for double-booking prevention

---

## 📞 Questions or Concerns?

If you have questions about:
- **Dependencies**: Check Story #40 status first
- **Dashboard Integration**: See "Integration with Story #36" section in plan
- **Security**: Review "Multi-Tenant Security" section
- **Timeline**: Consider implementing Story #40 and #41 sequentially

---

**Document Created**: November 25, 2025  
**Plan Status**: ✅ Ready for Implementation  
**Blocker**: Story #40 must be implemented first  
**Estimated Total Effort**: 4-5 weeks (1 developer)
