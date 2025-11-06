# User Story: Epic E.1 - Admin Trip Approval Workflow

**Epic:** E — Admin Console

**As an** admin/operator,
**I want** to review and approve trips before they go live,
**so that** I can ensure quality and prevent fraudulent/inappropriate listings.

## Acceptance Criteria

### Trip Submission Flow
* When driver/admin creates trip (Story E.3):
  - Initial status: `draft`
  - Admin submits for review: `draft` → `pending`
  - Notification to admin team: "New trip pending approval"

### Admin Review Queue
* Admin console page: `/admin/trips/pending`
* List view showing pending trips:
  - Trip ID
  - Origin → Destination
  - Departure date/time
  - Driver name
  - Vehicle type & capacity
  - Price per seat
  - Submitted date
  - "Review" button
* Filters:
  - Submitted date range
  - Driver dropdown
* Sorting: Oldest first (FIFO)

### Trip Review Page
* URL: `/admin/trips/[trip-id]/review`
* Display full trip details:
  - Route: Origin → Destination
  - Departure/arrival times
  - Full itinerary (day-by-day)
  - Vehicle details: Type, capacity, license plate
  - Driver: Name, license #, rating
  - Pricing: Per-seat price, private price (if applicable)
  - Photos (if uploaded)

### Approval Actions
* Two primary actions:
  1. **Approve**:
     - Confirmation modal: "Approve this trip for public listing?"
     - On confirm:
       - Trip status: `pending` → `approved` → `live`
       - Trip becomes visible in public list (Story A.1)
       - Driver notified: "Your trip is now live!"
       - Audit log entry: `{admin_id, action: 'approved', timestamp}`
     - Toast: "Trip approved and published"
  
  2. **Reject**:
     - Rejection modal:
       - Required: Reason dropdown:
         - "Incomplete information"
         - "Vehicle doesn't meet standards"
         - "Pricing issue"
         - "Route not supported"
         - "Other" (with text field)
       - Optional: Admin notes (internal)
     - On confirm:
       - Trip status: `pending` → `rejected`
       - Driver notified: "Trip rejected. Reason: [X]"
       - Audit log entry: `{admin_id, action: 'rejected', reason, timestamp}`
       - Driver can resubmit after edits
     - Toast: "Trip rejected. Driver notified."

### Audit Trail
* Every approval/rejection logged in `trip_audit_log`:
  - trip_id
  - admin_id
  - action: 'approved' | 'rejected'
  - reason (if rejected)
  - timestamp
  - notes (optional admin comments)

### Admin Dashboard Widget
* Trip approval stats:
  - Pending review: [N] trips
  - Approved this week: [N]
  - Rejected this week: [N]
  - Avg review time: [X] hours

## Technical Notes

### Trip Status Workflow
```
draft → pending → approved → live → completed
                ↓
              rejected (can resubmit)
```

### Database Schema
* `trips` table:
  ```sql
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'live' | 'completed' | 'cancelled'
  submitted_at: TIMESTAMP (when pending)
  reviewed_at: TIMESTAMP (when approved/rejected)
  reviewed_by: UUID (admin_id FK)
  rejection_reason: VARCHAR
  ```

* `trip_audit_log` table:
  ```sql
  id: UUID
  trip_id: UUID FK
  admin_id: UUID FK
  action: VARCHAR ('approved' | 'rejected' | 'edited' | 'cancelled')
  reason: VARCHAR
  notes: TEXT
  timestamp: TIMESTAMP
  ```

### Auto-Approval Rules (G3 - Future)
* Trusted drivers (>50 trips, 4.8+ rating):
  - Auto-approve if trip matches standard template
  - Admin notified but no manual review needed

### PostHog Events
* `admin_trip_reviewed` (trip_id, decision: approved/rejected, review_time_minutes)
* `trip_approved` (trip_id, admin_id)
* `trip_rejected` (trip_id, admin_id, reason)

### Edge Cases
* Multiple admins try to review same trip → First approval/rejection wins
* Driver edits trip while pending review → Reset to `draft`, requires resubmission
* Trip departure date passes during review → Auto-reject with reason: "expired"

## Admin Role Permissions
* Required role: `admin` or `operator`
* Read-only admins: Can view pending trips but not approve/reject
* Super admins: Can override rejections

## Success Metrics
* Avg review time: <24 hours
* Approval rate: >80% (indicates clear guidelines for drivers)
* Zero fraudulent trips published

## Gate Assignment
**Gate 2** (Manual approval workflow with audit trail)
**Gate 3** (Auto-approval for trusted drivers, ML-assisted fraud detection)
