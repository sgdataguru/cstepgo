# User Story: Epic E.2 - Admin Driver Management

**Epic:** E — Admin Console

**As an** admin,
**I want** to add and manage drivers with their vehicle documents,
**so that** only verified drivers can offer trips.

## Acceptance Criteria

### Add Driver Flow
* Admin console page: `/admin/drivers/new`
* Multi-step form:

  **Step 1: Driver Information**
  - Full name (required)
  - Phone number (required, unique)
  - Email (required, unique)
  - Date of birth (required)
  - Home location:
    - City/town autocomplete (Mapbox/Google)
    - Lat/lng auto-populated
  - CTA: "Next"

  **Step 2: Vehicle Information**
  - Vehicle type (dropdown):
    - Sedan (4 seats)
    - SUV (6-7 seats)
    - Van/Minibus (8-12 seats)
    - Bus (13+ seats)
  - Seat capacity (number input, validates against type)
  - License plate number (required)
  - Vehicle make/model (text)
  - Vehicle year (number)
  - CTA: "Next"

  **Step 3: Driver Documents**
  - Driver's license:
    - License number (required)
    - License expiry date (required, must be >30 days future)
    - Upload photo: Front & back
  - Vehicle insurance:
    - Insurance policy number
    - Expiry date (required)
    - Upload certificate
  - Vehicle registration:
    - Registration number
    - Upload document
  - Optional: Background check certificate
  - CTA: "Next"

  **Step 4: Account Setup**
  - Generate temporary password:
    - Display: "Temporary password: [XXXXX]"
    - Copy button
  - Email/SMS credentials:
    - Checkbox: "Send credentials to driver now"
    - Preview message template
  - CTA: "Create Driver Account"

### Driver Creation
* On submit:
  - Create `users` record: `role = 'driver'`
  - Create `drivers` record with all details
  - Hash temporary password (bcrypt)
  - Send credentials email/SMS (if checked)
  - Toast: "Driver [Name] created successfully!"
  - Redirect to driver detail page: `/admin/drivers/[driver-id]`

### Driver List View
* Admin page: `/admin/drivers`
* Table columns:
  - Driver name
  - Phone/email
  - Vehicle type & capacity
  - Home location (city)
  - License expiry
  - Status: Active / Suspended / Documents Expiring Soon
  - Actions: "View" | "Edit" | "Suspend"
* Filters:
  - Status dropdown
  - Vehicle type
  - Home location
  - License expiry (show expiring in <30 days)
* Sorting: Name (A-Z), License expiry (soonest first)

### Driver Detail Page
* URL: `/admin/drivers/[driver-id]`
* Display sections:
  1. **Driver Info**: Name, contact, home location
  2. **Vehicle Info**: Type, capacity, plate, make/model
  3. **Documents**:
     - License: Number, expiry, photo preview
     - Insurance: Policy, expiry, certificate
     - Registration: Number, document
     - Visual alerts: 🔴 Expired / 🟡 Expiring <30 days / 🟢 Valid
  4. **Trip History**:
     - Total trips completed
     - Avg rating (G3)
     - Total earnings
  5. **Account Status**:
     - Active / Suspended toggle
     - Last login date
     - Password reset button

### Edit Driver
* Edit button on detail page → Opens edit form
* All fields editable except:
  - User ID (immutable)
  - Historical trip data
* Save updates:
  - Update `drivers` table
  - Audit log entry: `{admin_id, action: 'driver_updated', changes, timestamp}`
  - Toast: "Driver updated successfully"

### Document Expiry Alerts
* Admin dashboard widget:
  - "⚠️ [N] drivers with expiring documents"
  - Click → List of drivers with documents expiring <30 days
* Email notifications:
  - Weekly digest to admins: "Documents expiring soon"
  - Direct email to driver 30/15/7 days before expiry

### Suspend Driver
* Suspend action:
  - Confirmation modal: "Suspend driver [Name]?"
  - Reason (required): Dropdown + notes field
  - On confirm:
    - `users.status = 'suspended'`
    - Driver cannot log in (blocked at auth middleware)
    - Active trips cancelled (refunds issued - Story G.1)
    - Audit log entry
    - Email to driver: "Account suspended. Contact admin."
  - Reactivate: Admin can unsuspend anytime

## Technical Notes

### Database Schema
* `drivers` table:
  ```sql
  id: UUID
  user_id: UUID FK (users.id)
  license_no: VARCHAR (required)
  license_expiry: DATE (required)
  license_photo_url: VARCHAR
  insurance_policy_no: VARCHAR
  insurance_expiry: DATE (required)
  insurance_doc_url: VARCHAR
  vehicle_registration_no: VARCHAR
  vehicle_registration_doc_url: VARCHAR
  vehicle_type: VARCHAR (Sedan/SUV/Van/Bus)
  seat_capacity: INT (required)
  vehicle_plate: VARCHAR (required)
  vehicle_make_model: VARCHAR
  vehicle_year: INT
  home_location: GEOGRAPHY(POINT, 4326) (required)
  background_check_url: VARCHAR
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  ```

* `users` table additions:
  ```sql
  status: 'active' | 'suspended' | 'pending_verification'
  ```

### Document Upload
* Storage: AWS S3 or Supabase Storage
* File validation:
  - Formats: JPEG, PNG, PDF
  - Max size: 5MB per file
  - Virus scanning (ClamAV)
* URL structure: `drivers/[driver-id]/documents/[filename]`

### PostHog Events
* `admin_driver_created` (driver_id, vehicle_type)
* `admin_driver_updated` (driver_id, fields_changed)
* `admin_driver_suspended` (driver_id, reason)
* `driver_document_expiring` (driver_id, document_type, days_until_expiry)

### Edge Cases
* Duplicate license number → Error: "Driver with this license already exists"
* Expired documents uploaded → Warning: "Document is expired. Verify validity."
* Driver creates trip while suspended → Blocked with error message

## Validation Rules
* License expiry: Must be >30 days in future
* Insurance expiry: Must be >30 days in future
* Seat capacity: Must match vehicle type ranges:
  - Sedan: 3-5
  - SUV: 5-7
  - Van: 7-12
  - Bus: 13+

## Success Metrics
* Driver onboarding time: <10 minutes (admin)
* Document expiry incidents: Zero (proactive alerts)
* Driver account accuracy: 100% (all required fields complete)

## Gate Assignment
**Gate 2** (Full driver management with document tracking)
**Gate 3** (Driver self-service portal for document updates, automated verification)
