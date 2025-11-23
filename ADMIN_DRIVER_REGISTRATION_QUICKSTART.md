# Admin Driver Registration - Quick Start Guide

## 🚀 Getting Started

Hi Mayu! Here's your quick reference guide for the Admin Driver Registration feature.

---

## ✅ What's Been Built

### Complete End-to-End Flow:
1. **Admin Registration Form** → Create new driver accounts manually
2. **Automatic Credential Generation** → Secure Driver IDs and passwords
3. **Multi-Channel Delivery** → Send credentials via WhatsApp, SMS, and Email
4. **Driver Management** → View, search, and filter all drivers

---

## 📍 How to Access

### Registration Form
Navigate to: `http://localhost:3000/admin/drivers/new`

### Driver List
Navigate to: `http://localhost:3000/admin/drivers`

---

## 📝 How to Register a Driver

### Step 1: Fill Personal Information
- **Full Name:** Driver's full name (required)
- **Phone Number:** International format, e.g., `+77012345678` (required)
- **Email:** Optional - for credential delivery
- **National ID:** Government ID number (required)

### Step 2: Enter Vehicle Information
- **Vehicle Type:** Select from dropdown (Sedan, SUV, Minibus, Van, Bus)
- **Make:** e.g., Toyota (required)
- **Model:** e.g., Camry (required)
- **Year:** Manufacturing year
- **License Plate:** Vehicle registration plate (required)
- **Color:** Vehicle color
- **Seat Capacity:** Number of passenger seats (1-60)

### Step 3: Set Service Area
- **Home City:** Driver's base location (default: Almaty)
- **Service Radius:** Maximum distance from home city in km (default: 50km)
- **Willing to Travel:** Check boxes for:
  - Domestic Travel (within Kazakhstan)
  - Cross-Border (to Kyrgyzstan)

### Step 4: Upload Documents (Optional)
- Driver's License
- Vehicle Registration
- Insurance Certificate
- Profile Photo

All documents can be uploaded now or added later by the driver.

### Step 5: Submit
Click "Register Driver" button. The system will:
1. Validate all inputs
2. Generate unique Driver ID (format: `DRV-20250114-XXXXX`)
3. Generate secure temporary password (8 characters)
4. Create user and driver accounts
5. Send credentials via WhatsApp → SMS fallback → Email

---

## 🎉 Success Modal

After successful registration, you'll see:

### Driver Information
- Driver ID (unique identifier)
- Full Name
- Phone Number
- Status: PENDING

### Login Credentials
- **Driver ID:** Copy button available
- **Temporary Password:** Copy button available  
- **Login URL:** Copy button available

⚠️ Driver must change password on first login

### Delivery Status
- ✅ WhatsApp: SENT/DELIVERED
- 📱 SMS: SENT (fallback)
- 📧 Email: SENT (if provided)

### Actions
- **View Driver List:** Go to driver management page
- **Register Another Driver:** Clear form and register more

---

## 👥 Driver Management

### View All Drivers
Navigate to `/admin/drivers` to see:
- Complete list of all registered drivers
- Status badges (Pending, Approved, Rejected, Suspended)
- "Not logged in" indicator for new drivers
- Vehicle information
- Contact details
- Rating and trip statistics

### Search & Filter
**Search by:**
- Driver name
- Driver ID
- Phone number

**Filter by:**
- Status (All, Pending, Approved, Rejected, Suspended)
- Vehicle Type (All, Sedan, SUV, Minibus, Van, Bus)

### Pagination
- 20 drivers per page
- Previous/Next navigation
- Total count displayed

### Actions
- **View:** See driver profile page
- **Edit:** (Coming soon)

---

## 🔐 Generated Credentials

### Driver ID Format
`DRV-YYYYMMDD-XXXXX`
- `DRV`: Prefix for all drivers
- `YYYYMMDD`: Registration date
- `XXXXX`: Random 5-digit number

Example: `DRV-20250114-47392`

### Temporary Password
- 8 characters long
- Mix of uppercase, lowercase, and numbers
- Excludes confusing characters (I, O, l, 0, 1)
- Example: `AbCd1234`

### Login URL
`http://localhost:3000/login`
(Update for production)

---

## 📱 Credential Delivery

### Priority Order
1. **WhatsApp** (Primary) → Instant messaging
2. **SMS** (Fallback) → If WhatsApp fails
3. **Email** (Optional) → If email provided

### Message Content
```
Welcome to SteppeGo!

Your login credentials:
Driver ID: DRV-20250114-XXXXX
Password: AbCd1234
Login: http://localhost:3000/login

You'll be asked to change your password on first login.

Questions? Contact support.
```

### Delivery Tracking
All deliveries are tracked in the database:
- Channel used (WhatsApp, SMS, Email)
- Status (SENT, DELIVERED, FAILED, READ)
- Timestamp
- Error message (if failed)

---

## 🛠️ Current Configuration

### Database
- PostgreSQL via Prisma ORM
- Models: User, Driver, DriverCredentialDelivery
- Automatic timestamping (createdAt, updatedAt)

### Authentication
- ⚠️ Currently in **DEV MODE**
- All admin requests allowed
- No authentication required
- **Must implement real auth before production**

### External Services (Mock)
- **Twilio:** Mock WhatsApp and SMS (console logging only)
- **SendGrid:** Mock email (console logging only)
- **AWS S3:** Mock file upload (base64 encoding)

Replace with real APIs when credentials available.

---

## 📊 Database Records

### User Table
Created for each driver:
```javascript
{
  phone: "+77012345678",
  email: "driver@test.com", // or null
  passwordHash: "<bcrypt hash>",
  role: "DRIVER",
  isFirstLogin: true,
  emailVerified: false,
  phoneVerified: false
}
```

### Driver Table
```javascript
{
  driverId: "DRV-20250114-XXXXX",
  fullName: "Driver Name",
  nationalId: "123456789012",
  vehicleMake: "Toyota",
  vehicleModel: "Camry",
  licensePlate: "ABC123",
  homeCity: "Almaty",
  serviceRadiusKm: 50,
  willingToTravel: ["domestic", "cross_border_kz"],
  status: "PENDING",
  registeredBy: "admin"
}
```

### DriverCredentialDelivery Table
```javascript
{
  driverId: "<driver uuid>",
  channel: "WHATSAPP",
  status: "DELIVERED",
  sentAt: "2025-01-14T10:30:00Z",
  deliveredAt: "2025-01-14T10:30:05Z"
}
```

---

## 🔍 Console Logs

### Credential Generation
```
🔐 Generated credentials for driver
Driver ID: DRV-20250114-12345
Temporary Password: AbCd1234
```

### Message Delivery
```
📱 WhatsApp message sent to +77012345678
Welcome to SteppeGo!
Your login credentials:
Driver ID: DRV-20250114-12345
Password: AbCd1234
...
```

```
📧 Email sent to driver@test.com
Subject: Welcome to SteppeGo - Your Driver Account
```

### Admin Auth (DEV MODE)
```
⚠️  WARNING: Admin auth bypassed (DEV MODE)
This is only for development. Implement proper auth before production.
```

---

## ✅ Validation Rules

### Phone Number
- Must be valid international format
- Examples: `+77012345678`, `+1234567890`
- Must be unique (no duplicates)

### Email
- Optional field
- Must be valid email format if provided
- Example: `driver@example.com`

### License Plate
- Required
- Must be unique (no duplicates)
- Auto-converted to uppercase

### Seat Capacity
- Range: 1-60
- Default: 4

### Service Radius
- Range: 1-1000 km
- Default: 50 km

---

## 🐛 Troubleshooting

### "Phone number already registered"
- The phone number is already in use by another driver
- Use a different phone number

### "License plate already registered"
- The license plate is already in use by another vehicle
- Check for typos or use a different plate

### "Failed to register driver"
- Check console logs for detailed error
- Verify database connection
- Ensure all required fields are filled

### TypeScript Errors
- Run `npx prisma generate` to regenerate Prisma client
- Restart dev server if needed
- Check that schema changes are reflected

### Form Validation Errors
- Red borders indicate invalid fields
- Fix errors before submitting
- All required fields must be filled

---

## 📈 Next Steps

### Immediate Testing
1. Register a test driver with phone only
2. Register a test driver with email
3. Test duplicate phone prevention
4. Test document upload
5. View driver list and filters

### Before Production
1. **Replace Mock Services:**
   - Set up real Twilio account (WhatsApp + SMS)
   - Set up real SendGrid account (Email)
   - Set up AWS S3 bucket (Document storage)

2. **Implement Real Authentication:**
   - Remove DEV MODE from admin middleware
   - Add session/JWT authentication
   - Protect admin routes properly

3. **Security Enhancements:**
   - Add rate limiting
   - Add CSRF protection
   - Audit credential storage
   - Implement password policies

4. **Testing:**
   - Unit tests for credential generation
   - Integration tests for registration flow
   - E2E tests with Playwright
   - Load testing (100+ concurrent registrations)

---

## 📞 Support

### File Locations
- Forms: `/src/app/admin/drivers/new/`
- API: `/src/app/api/admin/drivers/route.ts`
- Utilities: `/src/lib/auth/`, `/src/lib/messaging/`
- Schema: `/prisma/schema.prisma`

### Documentation
- Progress Report: `ADMIN_DRIVER_REGISTRATION_PROGRESS.md`
- Testing Guide: `ADMIN_DRIVER_REGISTRATION_TESTING.md`
- This Quick Start: `ADMIN_DRIVER_REGISTRATION_QUICKSTART.md`

### Common Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Start dev server
npm run dev

# View database
npx prisma studio
```

---

## 🎯 Success Criteria

✅ Admin can register drivers manually  
✅ Credentials auto-generated securely  
✅ Credentials delivered via multiple channels  
✅ Driver list with search and filters  
✅ First login password change enforced  
✅ Documents uploadable (optional)  
✅ Duplicate prevention (phone, license plate)  
✅ Delivery tracking in database  

---

**Status:** Ready for testing (pending Prisma client regeneration)  
**Last Updated:** January 14, 2025  
**Feature:** Story 15 - Admin Manual Driver Registration
