# User Story: 15 - Admin Manual Driver Registration

**As an** admin,
**I want** to manually register drivers on their behalf,
**so that** I can onboard drivers quickly without requiring them to go through self-registration (trust-building phase).

## Acceptance Criteria

### Admin Driver Registration Portal
* URL: `/admin/drivers/new`
* Form fields (all required):
  - **Personal Information**:
    - Full Name
    - Phone Number (with country code, e.g., +996 XXX XXX XXX)
    - Email Address (optional for drivers who don't have email)
    - National ID / Driver's License Number
  
  - **Vehicle Information**:
    - Vehicle Type: Dropdown (Sedan, Van, Mini-bus, SUV)
    - Vehicle Make: Text (e.g., Toyota, Hyundai)
    - Vehicle Model: Text (e.g., Camry, Starex)
    - Vehicle Year: Number (e.g., 2018)
    - License Plate: Text (e.g., 01KG123ABC)
    - Vehicle Color: Text
    - Seat Capacity: Number (4, 6, 12, 15, etc.)
  
  - **Service Area**:
    - Home Location (City/Region): Dropdown
    - Service Radius (km): Default 50km, adjustable
    - Willing to Travel: Checkbox options (Domestic only, Cross-border: Kyrgyzstan-Kazakhstan, etc.)
  
  - **Documents Upload**:
    - Driver's License (photo/scan)
    - Vehicle Registration (photo/scan)
    - Insurance Certificate (photo/scan)
    - Profile Photo (optional)

* Validation:
  - Phone number must be unique (prevent duplicate driver accounts)
  - License plate must be unique
  - All file uploads < 5MB

### Auto-Generated Credentials
* Upon form submission, system generates:
  - **Driver ID**: Unique alphanumeric (e.g., DRV-20251106-AB123)
  - **Temporary Password**: Random 8-character string (e.g., Kgz2024!)
* Admin sees success message:
  ```
  Driver registered successfully!
  
  Driver ID: DRV-20251106-AB123
  Temporary Password: Kgz2024!
  
  Please share these credentials with [Driver Name] via:
  - WhatsApp: [Send Message] (pre-populated)
  - SMS: [Send SMS] (auto-send)
  - Email: [Send Email] (if provided)
  ```

### Driver Credential Delivery
* **WhatsApp Template** (preferred):
  ```
  Welcome to StepperGO! 🚗
  
  Your driver account has been created:
  
  Login URL: https://steppergo.com/driver/login
  Driver ID: DRV-20251106-AB123
  Temporary Password: Kgz2024!
  
  Please change your password after first login.
  
  Support: +996 XXX XXX XXX
  ```

* **SMS Fallback** (if WhatsApp not available):
  - Same content, plain text

* **Email** (if provided):
  - HTML formatted with logo and branding

### Driver List View
* URL: `/admin/drivers`
* Table columns:
  - Driver ID
  - Name
  - Phone
  - Vehicle Type
  - Status: Badge (Active, Inactive, Pending Approval)
  - Registered On: Date
  - Last Login: Timestamp
  - Actions: [Edit] [View Trips] [Deactivate]

* Filters:
  - Status: All / Active / Inactive
  - Vehicle Type: All / Sedan / Van / Mini-bus
  - Registration Date Range
  - Search: By name, phone, or Driver ID

### Bulk Driver Import (Optional - Gate 3)
* CSV upload for existing driver list
* Template CSV with all required fields
* Validation report before bulk insert
* Use case: Migrating 100 existing drivers from inDriver

## Technical Notes

### Database Schema
* `drivers` table:
  ```sql
  id: UUID (primary key)
  driver_id: STRING UNIQUE (e.g., DRV-20251106-AB123)
  user_id: UUID FK (links to users table)
  vehicle_type: ENUM
  vehicle_make: STRING
  vehicle_model: STRING
  vehicle_year: INT
  license_plate: STRING UNIQUE
  seat_capacity: INT
  home_location: GEOGRAPHY (PostGIS point)
  service_radius_km: INT DEFAULT 50
  documents_url: JSONB {license, registration, insurance}
  status: ENUM ('pending', 'active', 'inactive', 'suspended')
  registered_by: UUID FK (admin user ID)
  registered_at: TIMESTAMP
  last_login_at: TIMESTAMP
  ```

* `users` table (driver's login credentials):
  ```sql
  id: UUID
  phone: STRING UNIQUE
  email: STRING NULLABLE
  password_hash: STRING
  role: ENUM ('driver', 'passenger', 'admin')
  is_first_login: BOOLEAN DEFAULT true
  ```

### Credential Generation
```javascript
function generateDriverCredentials() {
  const driverID = `DRV-${formatDate(new Date(), 'YYYYMMDD')}-${randomAlpha(5)}`;
  const tempPassword = generateSecurePassword(8); // Mix of uppercase, lowercase, numbers
  return { driverID, tempPassword };
}
```

### WhatsApp Integration
* Use Twilio API for WhatsApp Business messaging
* Store template message in config
* Track delivery status: Sent, Delivered, Read

### PostHog Events
* `admin_driver_registered` (registration_method: manual, admin_id)
* `driver_credentials_sent` (channel: whatsapp/sms/email, delivered: boolean)
* `driver_first_login` (days_since_registration)

### Edge Cases
* Admin enters duplicate phone number → Show error: "Driver with this phone already exists: [DRV-ID]"
* WhatsApp delivery fails → Automatically fallback to SMS
* Driver never logs in after 7 days → Send reminder WhatsApp message
* Admin makes typo in phone number → Allow edit before sending credentials

## Security Considerations
* Admin access restricted: Only users with `role = 'admin'`
* Temporary passwords expire after 30 days (force password reset on first login)
* Log all admin actions: Who registered which driver, when
* Driver documents stored encrypted (S3 with encryption at rest)

## Success Metrics
* Avg driver onboarding time: <5 minutes (admin side)
* Driver first login rate: >90% within 48 hours
* Credential delivery success rate: >95%
* Number of drivers manually registered: Track to know when to enable self-registration

## Gate Assignment
**Gate 2** (Manual registration to quickly onboard existing 100 drivers)
**Gate 4** (Self-registration portal for public when platform is established)

## Notes from Transcript
* Ming: "We gonna at the first we're gonna manually sign up from our own company like the drivers and then we forward the trips to the driver but later sometime when the platform gets a bit popular and then we will make it auto registration from driver"
* Reese: "Driver never had any trip from us and there's a trust issue that I don't trust don't want to register their ID card anything like that so we gonna at the first we're gonna manually sign up from our own company"
* Business Context: Currently have 100 drivers signed up from inDriver, need to migrate them quickly
* Trust-building phase: Manual registration builds relationship before opening public sign-up
