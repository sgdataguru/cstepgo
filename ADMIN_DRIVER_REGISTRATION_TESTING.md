# Admin Driver Registration - Testing Guide

## 🧪 Manual Testing Checklist

### Prerequisites
- [ ] Dev server running on `http://localhost:3000`
- [ ] Database connected and migrations applied
- [ ] Prisma client generated successfully
- [ ] All npm dependencies installed

---

## Test Suite 1: Registration Form Validation

### Test 1.1: Required Fields Validation
**Steps:**
1. Navigate to `/admin/drivers/new`
2. Click "Register Driver" button without filling any fields
3. Observe validation errors

**Expected Results:**
- ❌ Error message: "Please fix the form errors before submitting"
- ❌ Red border around required fields
- ❌ Error messages displayed:
  - "Full name is required"
  - "Phone number is required"
  - "National ID is required"
  - "Vehicle make is required"
  - "Vehicle model is required"
  - "License plate is required"

---

### Test 1.2: Phone Number Validation
**Steps:**
1. Enter invalid phone numbers:
   - `123` (too short)
   - `abcd` (letters)
   - `+1234567890123456789` (too long)
2. Observe error messages

**Expected Results:**
- ❌ Error message: "Invalid phone number format"
- ✅ Valid formats accepted:
  - `+77012345678`
  - `+1234567890`
  - `77012345678`

---

### Test 1.3: Email Validation
**Steps:**
1. Enter invalid emails:
   - `test` (no @)
   - `test@` (no domain)
   - `@example.com` (no local part)
2. Observe error messages

**Expected Results:**
- ❌ Error message: "Invalid email format"
- ✅ Valid formats accepted:
  - `driver@example.com`
  - Empty field (optional)

---

### Test 1.4: Seat Capacity Validation
**Steps:**
1. Enter invalid capacities:
   - `0` (too low)
   - `61` (too high)
   - `-5` (negative)
2. Observe error messages

**Expected Results:**
- ❌ Error message: "Seat capacity must be between 1 and 60"
- ✅ Valid range: 1-60

---

## Test Suite 2: Form Functionality

### Test 2.1: Vehicle Type Selection
**Steps:**
1. Select each vehicle type from dropdown
2. Verify selection updates

**Expected Results:**
- ✅ Dropdown shows: Sedan, SUV, Minibus, Van, Bus
- ✅ Selected value updates form state

---

### Test 2.2: Travel Preferences
**Steps:**
1. Check "Domestic Travel (Within Kazakhstan)"
2. Check "Cross-Border (To Kyrgyzstan)"
3. Uncheck both
4. Verify selections

**Expected Results:**
- ✅ Checkboxes toggle on/off
- ✅ Multiple selections allowed
- ✅ Array updates correctly: `[]`, `["domestic"]`, `["domestic", "cross_border_kz"]`

---

### Test 2.3: Document Upload
**Steps:**
1. Click "Driver's License" upload area
2. Select an image file (< 5MB)
3. Verify upload success
4. Click "Remove" button
5. Verify file removal

**Expected Results:**
- ✅ File upload shows progress indicator
- ✅ Image preview displayed
- ✅ File name shown with green checkmark
- ✅ "Remove" button clears file

---

### Test 2.4: Document Upload - File Size Limit
**Steps:**
1. Attempt to upload file > 5MB
2. Observe error message

**Expected Results:**
- ❌ Error message: "File size must be less than 5MB"
- ✅ File not uploaded

---

### Test 2.5: Document Upload - Drag and Drop
**Steps:**
1. Drag an image file over upload area
2. Drop file
3. Verify upload

**Expected Results:**
- ✅ Upload area highlights on drag over
- ✅ File uploads on drop
- ✅ Preview displayed

---

## Test Suite 3: Registration Flow

### Test 3.1: Successful Registration - Phone Only
**Test Data:**
```
Full Name: Test Driver One
Phone: +77012345001
Email: (leave empty)
National ID: 123456789001
Vehicle Make: Toyota
Vehicle Model: Camry
License Plate: ABC001
```

**Steps:**
1. Fill form with test data
2. Click "Register Driver"
3. Observe loading state
4. Wait for success modal

**Expected Results:**
- ✅ Loading spinner shown on submit button
- ✅ Success modal appears
- ✅ Driver information displayed correctly
- ✅ Credentials generated:
  - Driver ID format: `DRV-20250114-XXXXX`
  - Temporary password: 8 characters
  - Login URL: `http://localhost:3000/login`
- ✅ Delivery status:
  - WhatsApp: SENT or DELIVERED
  - SMS: NOT_SENT (used as fallback)
  - Email: NOT_SENT (no email provided)
- ✅ Console logs show:
  - `📱 WhatsApp message sent to +77012345001`
  - Message content with credentials

---

### Test 3.2: Successful Registration - All Channels
**Test Data:**
```
Full Name: Test Driver Two
Phone: +77012345002
Email: driver2@test.com
National ID: 123456789002
Vehicle Make: Honda
Vehicle Model: Accord
License Plate: ABC002
```

**Steps:**
1. Fill form with test data (including email)
2. Submit form
3. Check success modal

**Expected Results:**
- ✅ All three delivery channels attempted:
  - WhatsApp: SENT or DELIVERED
  - SMS: NOT_SENT (fallback not needed)
  - Email: SENT or DELIVERED
- ✅ Console logs show messages for WhatsApp and Email
- ✅ Credentials copyable via copy buttons

---

### Test 3.3: Duplicate Phone Number
**Steps:**
1. Register first driver with phone `+77012345003`
2. Attempt to register second driver with same phone
3. Observe error

**Expected Results:**
- ❌ Error alert displayed: "Phone number already registered"
- ✅ Form data preserved (not cleared)
- ✅ User can modify phone and retry

---

### Test 3.4: Duplicate License Plate
**Steps:**
1. Register first driver with plate `ABC999`
2. Attempt to register second driver with same plate
3. Observe error

**Expected Results:**
- ❌ Error alert displayed: "License plate already registered"
- ✅ Form data preserved
- ✅ User can modify plate and retry

---

### Test 3.5: Cancel Button
**Steps:**
1. Fill form partially
2. Click "Cancel" button
3. Verify navigation

**Expected Results:**
- ✅ Browser navigates back to previous page
- ❌ Form data not saved

---

## Test Suite 4: Success Modal

### Test 4.1: Credential Display
**Steps:**
1. Register a driver successfully
2. Examine success modal

**Expected Results:**
- ✅ Green success icon displayed
- ✅ Driver name shown in header
- ✅ Driver information section shows:
  - Driver ID
  - Full Name
  - Phone
  - Status badge (PENDING)
- ✅ Login credentials section shows:
  - Driver ID (with copy button)
  - Temporary Password (with copy button)
  - Login URL (with copy button)
- ✅ Warning message: "Driver will be required to change password on first login"

---

### Test 4.2: Copy to Clipboard
**Steps:**
1. Click copy button next to Driver ID
2. Paste in notepad
3. Verify copied value
4. Repeat for password and URL

**Expected Results:**
- ✅ Clicking copy button copies value to clipboard
- ✅ All three copy buttons functional
- ✅ Copied values match displayed values

---

### Test 4.3: Delivery Status Icons
**Steps:**
1. Observe delivery status section
2. Verify icon colors

**Expected Results:**
- ✅ SENT/DELIVERED/READ: Green checkmark icon
- ❌ FAILED: Red cross icon
- ⏸️ NOT_SENT: Gray minus icon
- ✅ Status badges color-coded correctly

---

### Test 4.4: Modal Actions
**Steps:**
1. Click "View Driver List" button
2. Verify navigation to `/admin/drivers`

**Expected Results:**
- ✅ Navigates to driver list page
- ✅ Newly registered driver appears in list

**Steps:**
1. From success modal, click "Register Another Driver"
2. Verify form reset

**Expected Results:**
- ✅ Modal closes
- ✅ Registration form resets to empty state
- ✅ Page remains at `/admin/drivers/new`

---

## Test Suite 5: Driver List Page

### Test 5.1: Driver List Display
**Steps:**
1. Navigate to `/admin/drivers`
2. Observe driver list

**Expected Results:**
- ✅ Table displays all registered drivers
- ✅ Each row shows:
  - Driver initial avatar (circular, teal gradient)
  - Full name and Driver ID
  - Vehicle make/model and license plate
  - Phone and email
  - Status badge
  - "Not logged in" indicator (amber) if `isFirstLogin = true`
  - Rating (star icon) and completed trips count
  - View and Edit action buttons
- ✅ Total driver count shown in header

---

### Test 5.2: Search Functionality
**Steps:**
1. Enter driver name in search box
2. Click search button
3. Verify filtered results

**Test Cases:**
- Search by full name: "Damir"
- Search by Driver ID: "DRV-20250114"
- Search by phone: "+77012345"

**Expected Results:**
- ✅ Results filtered correctly
- ✅ Enter key triggers search
- ✅ "No drivers found" message if no matches

---

### Test 5.3: Status Filter
**Steps:**
1. Select "Pending" from status dropdown
2. Observe filtered list
3. Select "Approved"
4. Select "All Statuses"

**Expected Results:**
- ✅ List updates immediately on selection
- ✅ Only drivers with selected status shown
- ✅ "All Statuses" shows all drivers

---

### Test 5.4: Vehicle Type Filter
**Steps:**
1. Select "Sedan" from vehicle type dropdown
2. Observe filtered list
3. Select "SUV"
4. Select "All Types"

**Expected Results:**
- ✅ List updates immediately on selection
- ✅ Only drivers with selected vehicle type shown
- ✅ "All Types" shows all drivers

---

### Test 5.5: Combined Filters
**Steps:**
1. Set Status = "Pending"
2. Set Vehicle Type = "Sedan"
3. Enter search query
4. Verify results match all filters

**Expected Results:**
- ✅ Results match ALL filter criteria
- ✅ Filters work in combination

---

### Test 5.6: Pagination
**Steps:**
1. Register 21+ drivers (if not already present)
2. Navigate to driver list
3. Observe pagination controls
4. Click "Next" button
5. Click "Previous" button

**Expected Results:**
- ✅ Pagination shown when total > 20 drivers
- ✅ "Showing page X of Y" displayed correctly
- ✅ "Next" button loads next page
- ✅ "Previous" button loads previous page
- ✅ Buttons disabled at first/last page

---

### Test 5.7: Empty State
**Steps:**
1. Clear all drivers from database (or set filters with no matches)
2. Observe empty state

**Expected Results:**
- ✅ "No drivers found" icon and message displayed
- ✅ Helpful message based on context:
  - If filters active: "Try adjusting your filters"
  - If no drivers: "Get started by registering your first driver"

---

### Test 5.8: Register New Driver Button
**Steps:**
1. Click "Register New Driver" button in header
2. Verify navigation

**Expected Results:**
- ✅ Navigates to `/admin/drivers/new`
- ✅ Empty registration form displayed

---

### Test 5.9: View Driver Action
**Steps:**
1. Click "View" button for a driver
2. Verify navigation

**Expected Results:**
- ✅ Navigates to `/driver/{driverId}`
- ✅ Driver profile page displayed (from previous implementation)

---

### Test 5.10: Edit Driver Action
**Steps:**
1. Click "Edit" button for a driver
2. Observe behavior

**Expected Results:**
- ✅ Alert shown: "Edit functionality coming soon"
- ⚠️ Note: Edit feature not yet implemented

---

## Test Suite 6: Database Validation

### Test 6.1: User Record Creation
**Steps:**
1. Register a new driver
2. Check database `User` table

**Expected Results:**
- ✅ New user record created with:
  - `role = 'DRIVER'`
  - `phone = <entered phone>`
  - `email = <entered email or null>`
  - `passwordHash = <bcrypt hash>`
  - `isFirstLogin = true`
  - `emailVerified = false`
  - `phoneVerified = false`

---

### Test 6.2: Driver Record Creation
**Steps:**
1. Register a new driver
2. Check database `Driver` table

**Expected Results:**
- ✅ New driver record created with:
  - `driverId = DRV-YYYYMMDD-XXXXX` (unique)
  - `fullName = <entered name>`
  - `nationalId = <entered ID>`
  - `vehicleMake/Model/Year/etc = <entered values>`
  - `status = 'PENDING'`
  - `registeredBy = 'admin'`
  - All admin fields populated correctly

---

### Test 6.3: Credential Delivery Tracking
**Steps:**
1. Register a driver with email
2. Check database `DriverCredentialDelivery` table

**Expected Results:**
- ✅ Multiple records created (one per channel attempted):
  - WhatsApp delivery record: `channel = 'WHATSAPP'`, `status = 'SENT' or 'DELIVERED'`
  - Email delivery record: `channel = 'EMAIL'`, `status = 'SENT' or 'DELIVERED'`
- ✅ `sentAt` timestamp set
- ✅ `errorMessage` null if successful

---

## Test Suite 7: API Endpoint Testing

### Test 7.1: POST /api/admin/drivers - Success
**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "API Test Driver",
    "phone": "+77012345999",
    "email": "api@test.com",
    "nationalId": "999888777666",
    "vehicleMake": "Tesla",
    "vehicleModel": "Model 3",
    "vehicleYear": 2024,
    "licensePlate": "API999",
    "vehicleColor": "Red",
    "seatCapacity": 5,
    "homeCity": "Almaty",
    "serviceRadiusKm": 100,
    "willingToTravel": ["domestic", "cross_border_kz"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "driver": {
    "id": "<uuid>",
    "driverId": "DRV-20250114-XXXXX",
    "fullName": "API Test Driver",
    "phone": "+77012345999",
    "status": "PENDING"
  },
  "credentials": {
    "driverId": "DRV-20250114-XXXXX",
    "tempPassword": "<8-char-password>",
    "loginUrl": "http://localhost:3000/login"
  },
  "delivery": {
    "whatsapp": "SENT",
    "sms": "NOT_SENT",
    "email": "SENT"
  }
}
```

---

### Test 7.2: POST /api/admin/drivers - Missing Fields
**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Incomplete Driver"
  }'
```

**Expected Response:**
```json
{
  "error": "Missing required fields"
}
```
**Status Code:** 400

---

### Test 7.3: POST /api/admin/drivers - Duplicate Phone
**cURL Command:**
```bash
# First registration
curl -X POST http://localhost:3000/api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{...phone: "+77777777777"...}'

# Duplicate phone
curl -X POST http://localhost:3000/api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{...phone: "+77777777777"...}'
```

**Expected Response:**
```json
{
  "error": "Phone number already registered"
}
```
**Status Code:** 409

---

### Test 7.4: GET /api/admin/drivers - All Drivers
**cURL Command:**
```bash
curl http://localhost:3000/api/admin/drivers
```

**Expected Response:**
```json
{
  "drivers": [
    {
      "id": "<uuid>",
      "driverId": "DRV-20250114-00001",
      "fullName": "Driver Name",
      "status": "PENDING",
      ...
      "user": {
        "phone": "+77012345678",
        "email": "driver@test.com",
        "isFirstLogin": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### Test 7.5: GET /api/admin/drivers - With Filters
**cURL Commands:**
```bash
# Filter by status
curl 'http://localhost:3000/api/admin/drivers?status=PENDING'

# Filter by vehicle type
curl 'http://localhost:3000/api/admin/drivers?vehicleType=SEDAN'

# Search
curl 'http://localhost:3000/api/admin/drivers?search=Damir'

# Pagination
curl 'http://localhost:3000/api/admin/drivers?page=2&limit=10'

# Combined
curl 'http://localhost:3000/api/admin/drivers?status=PENDING&vehicleType=SEDAN&search=Test&page=1'
```

**Expected Results:**
- ✅ Filtered results returned
- ✅ Pagination metadata correct
- ✅ Empty array if no matches

---

## Test Suite 8: Console Output Validation

### Test 8.1: Credential Generation Logs
**Steps:**
1. Register a driver
2. Check server console logs

**Expected Logs:**
```
🔐 Generated credentials for driver
Driver ID: DRV-20250114-XXXXX
Temporary Password: AbcD1234
```

---

### Test 8.2: WhatsApp Delivery Logs
**Expected Logs:**
```
📱 WhatsApp message sent to +77012345678
Welcome to SteppeGo!

Your login credentials:
Driver ID: DRV-20250114-XXXXX
Password: AbcD1234
Login: http://localhost:3000/login

Change your password on first login.
Questions? Contact support.
```

---

### Test 8.3: Email Delivery Logs
**Expected Logs:**
```
📧 Email sent to driver@test.com
Subject: Welcome to SteppeGo - Your Driver Account
```

---

## 🐛 Known Issues & Limitations

1. **Admin Authentication:** Currently in DEV MODE (bypassed)
   - All requests allowed without authentication
   - WARNING logged to console

2. **Document Storage:** Files stored as base64 strings
   - Not production-ready
   - Replace with S3 upload in production

3. **Message Delivery:** Mock implementations
   - Console logging only
   - No actual WhatsApp/SMS/Email sent
   - Replace with real Twilio/SendGrid APIs

4. **TypeScript Warnings:** Route type issues (cosmetic)
   - Won't affect functionality
   - Can be ignored for now

5. **Edit Driver:** Not yet implemented
   - Shows alert placeholder
   - Planned for future phase

---

## ✅ Testing Completion Checklist

### Form Validation
- [ ] All required field validations working
- [ ] Phone number format validation
- [ ] Email format validation
- [ ] Seat capacity range validation

### Form Functionality
- [ ] Vehicle type dropdown working
- [ ] Travel preferences checkboxes working
- [ ] Document upload working
- [ ] File size limit enforced
- [ ] Drag-and-drop upload working
- [ ] Document removal working

### Registration Flow
- [ ] Successful registration (phone only)
- [ ] Successful registration (with email)
- [ ] Duplicate phone prevention
- [ ] Duplicate license plate prevention
- [ ] Cancel button working
- [ ] Loading states showing

### Success Modal
- [ ] All credentials displayed correctly
- [ ] Copy buttons working
- [ ] Delivery status indicators correct
- [ ] "View Driver List" navigation working
- [ ] "Register Another" resets form

### Driver List
- [ ] All drivers displayed
- [ ] Search functionality working
- [ ] Status filter working
- [ ] Vehicle type filter working
- [ ] Combined filters working
- [ ] Pagination working
- [ ] Empty state displaying
- [ ] "Register New Driver" button working
- [ ] "View" action working

### Database
- [ ] User records created correctly
- [ ] Driver records created correctly
- [ ] Credential delivery tracked
- [ ] Unique constraints enforced

### API Endpoints
- [ ] POST /api/admin/drivers working
- [ ] GET /api/admin/drivers working
- [ ] Filters and pagination working
- [ ] Error responses correct

### Console Logs
- [ ] Credential generation logged
- [ ] Message delivery logged
- [ ] No unexpected errors

---

**Testing Status:** ⏸️ Pending Prisma client regeneration
**Next Action:** Run through all test suites once Prisma errors resolved
