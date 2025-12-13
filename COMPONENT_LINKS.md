# 🔗 StepperGO - All Component Testing Links

**Current Server**: http://localhost:3002  
**Last Updated**: December 1, 2025  
**Status**: ✅ Server Running

---

## 📱 FRONTEND PAGES (Click to Test)

### 🏠 Public Pages
```
✅ Landing Page
   → http://localhost:3002

✅ Module Overview  
   → http://localhost:3002/module-overview

✅ Navigation Demo
   → http://localhost:3002/navigation/demo
```

---

## 👤 PASSENGER COMPONENTS

### Authentication
```
✅ User Registration
   → http://localhost:3002/auth/register
```

### Trip Management
```
✅ Browse All Trips
   → http://localhost:3002/trips

✅ Create New Trip
   → http://localhost:3002/trips/create

✅ View Trip Detail (Replace {id} with actual trip ID)
   → http://localhost:3002/trips/{id}
   → Example: http://localhost:3002/trips/1
```

### My Bookings
```
✅ My Trips Dashboard
   → http://localhost:3002/my-trips

✅ Booking Detail (Replace {id} with booking ID)
   → http://localhost:3002/my-trips/{id}
   → Example: http://localhost:3002/my-trips/1

✅ Trip Receipt
   → http://localhost:3002/my-trips/{id}/receipt
   → Example: http://localhost:3002/my-trips/1/receipt

✅ Real-Time Driver Tracking
   → http://localhost:3002/my-trips/{id}/track
   → Example: http://localhost:3002/my-trips/1/track
```

---

## 🚗 DRIVER PORTAL COMPONENTS

### Driver Authentication
```
✅ Driver Login Page
   → http://localhost:3002/driver/login
```

### Driver Dashboard Suite
```
✅ Main Dashboard (Old)
   → http://localhost:3002/driver/dashboard

✅ Portal Dashboard (New)
   → http://localhost:3002/driver/portal/dashboard

✅ Earnings & Payouts
   → http://localhost:3002/driver/portal/earnings

✅ Profile Management
   → http://localhost:3002/driver/portal/profile

✅ Ratings & Reviews
   → http://localhost:3002/driver/portal/ratings

✅ Notifications Center
   → http://localhost:3002/driver/portal/notifications

✅ Help Center
   → http://localhost:3002/driver/portal/help
```

### Public Driver Profiles
```
✅ View Driver Profile (Replace {driverId} with ID)
   → http://localhost:3002/drivers/{driverId}
   → Example: http://localhost:3002/drivers/test-driver-123
```

---

## 🎭 ACTIVITY OWNER COMPONENTS

### Authentication
```
✅ Activity Owner Login
   → http://localhost:3002/activity-owners/auth/login

✅ Activity Owner Registration
   → http://localhost:3002/activity-owners/auth/register

✅ Email Verification
   → http://localhost:3002/activity-owners/auth/verify
```

### Dashboard
```
✅ Activity Owner Dashboard (Scaffold)
   → http://localhost:3002/activity-owners/dashboard
```

---

## 🏛️ ADMIN PORTAL COMPONENTS

### Driver Management
```
✅ Drivers List & Approval Queue
   → http://localhost:3002/admin/drivers

✅ Add New Driver
   → http://localhost:3002/admin/drivers/new
```

---

## 🔌 API ENDPOINTS (Test with cURL or Postman)

### 🎯 Trip Management APIs
```bash
# Get All Trips
curl http://localhost:3002/api/trips

# Get Trip by ID
curl http://localhost:3002/api/trips/{id}

# Create New Trip (POST)
curl -X POST http://localhost:3002/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Trip",
    "originName": "Almaty",
    "destName": "Astana",
    "departureTime": "2025-12-02T10:00:00Z",
    "totalSeats": 4,
    "basePrice": 5000,
    "tripType": "PRIVATE"
  }'

# Update Trip
curl -X PUT http://localhost:3002/api/trips/{id}

# Delete Trip
curl -X DELETE http://localhost:3002/api/trips/{id}

# Broadcast Trip Offer to Drivers
curl -X POST http://localhost:3002/api/trips/{id}/broadcast-offer
```

### 👤 Passenger Booking APIs
```bash
# Create Private Booking
curl -X POST http://localhost:3002/api/bookings \
  -H "Authorization: Bearer {token}"

# Create Shared Booking
curl -X POST http://localhost:3002/api/bookings/shared \
  -H "Authorization: Bearer {token}"

# Get My Bookings
curl http://localhost:3002/api/passengers/bookings \
  -H "Authorization: Bearer {token}"

# Get Booking Detail
curl http://localhost:3002/api/passengers/bookings/{bookingId} \
  -H "Authorization: Bearer {token}"

# Cancel Booking
curl -X PATCH http://localhost:3002/api/passengers/bookings/{bookingId}/cancel \
  -H "Authorization: Bearer {token}"

# Track Trip (Server-Sent Events)
curl http://localhost:3002/api/passengers/bookings/{bookingId}/track \
  -H "Authorization: Bearer {token}"
```

### 🚗 Driver Portal APIs
```bash
# Driver Login
curl -X POST http://localhost:3002/api/drivers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }'

# Get Dashboard Data
curl http://localhost:3002/api/drivers/dashboard \
  -H "Authorization: Bearer {token}"

# Get Available Trips
curl http://localhost:3002/api/drivers/trips/available \
  -H "Authorization: Bearer {token}"

# Accept Trip
curl -X POST http://localhost:3002/api/drivers/trips/accept/{tripId} \
  -H "Authorization: Bearer {token}"

# Update Trip Status
curl -X PUT http://localhost:3002/api/drivers/trips/{tripId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# Get Driver Profile
curl http://localhost:3002/api/drivers/{id}

# Update Profile
curl -X PUT http://localhost:3002/api/drivers/profile \
  -H "Authorization: Bearer {token}"

# Get Earnings
curl http://localhost:3002/api/drivers/earnings/{driverId} \
  -H "Authorization: Bearer {token}"

# Get Payouts
curl http://localhost:3002/api/drivers/payouts \
  -H "Authorization: Bearer {token}"

# Update Availability
curl -X PUT http://localhost:3002/api/drivers/availability \
  -H "Authorization: Bearer {token}" \
  -d '{"availability": "AVAILABLE"}'

# Get Notifications
curl http://localhost:3002/api/drivers/notifications \
  -H "Authorization: Bearer {token}"

# Mark Notification as Read
curl -X PUT http://localhost:3002/api/drivers/notifications/{id}/read \
  -H "Authorization: Bearer {token}"

# Get Driver Reviews
curl http://localhost:3002/api/drivers/reviews/{driverId}

# Upload Documents
curl -X POST http://localhost:3002/api/drivers/documents \
  -H "Authorization: Bearer {token}"
```

### 🎭 Activity Owner APIs
```bash
# Register Activity Owner
curl -X POST http://localhost:3002/api/activity-owners/register

# Get All Activities
curl http://localhost:3002/api/activities

# Create Activity
curl -X POST http://localhost:3002/api/activities \
  -H "Authorization: Bearer {token}"

# Get Owner's Activities
curl http://localhost:3002/api/activities/owner \
  -H "Authorization: Bearer {token}"

# Get Activity Detail
curl http://localhost:3002/api/activities/{id}

# Update Activity
curl -X PUT http://localhost:3002/api/activities/{id} \
  -H "Authorization: Bearer {token}"

# Delete Activity
curl -X DELETE http://localhost:3002/api/activities/{id} \
  -H "Authorization: Bearer {token}"

# Toggle Activity Status
curl -X PUT http://localhost:3002/api/activities/{id}/toggle-status \
  -H "Authorization: Bearer {token}"

# Get Activity Bookings
curl http://localhost:3002/api/activities/{id}/bookings \
  -H "Authorization: Bearer {token}"
```

### 🏛️ Admin APIs
```bash
# Get All Drivers
curl http://localhost:3002/api/admin/drivers \
  -H "Authorization: Bearer {admin_token}"

# Create Driver
curl -X POST http://localhost:3002/api/admin/drivers \
  -H "Authorization: Bearer {admin_token}"

# Update Driver Availability
curl -X PUT http://localhost:3002/api/admin/drivers/availability \
  -H "Authorization: Bearer {admin_token}"

# Get Approval Queue
curl http://localhost:3002/api/admin/approvals \
  -H "Authorization: Bearer {admin_token}"

# Approve Driver
curl -X POST http://localhost:3002/api/admin/approvals/driver \
  -H "Authorization: Bearer {admin_token}"

# Get Documents for Verification
curl http://localhost:3002/api/admin/documents \
  -H "Authorization: Bearer {admin_token}"

# Run Payouts
curl -X POST http://localhost:3002/api/admin/payouts/run \
  -H "Authorization: Bearer {admin_token}"
```

### 🚀 Real-time & Navigation APIs
```bash
# WebSocket Connection
# Connect to: ws://localhost:3002

# Socket.IO Endpoint
curl http://localhost:3002/api/socket

# Real-time Trip Status (SSE)
curl http://localhost:3002/api/realtime/trip-status/{tripId}

# Get Route Directions
curl -X POST http://localhost:3002/api/navigation/route

# Start Trip Navigation
curl -X POST http://localhost:3002/api/navigation/trips/{tripId}/start

# Update Driver Location
curl -X PUT http://localhost:3002/api/navigation/trips/{tripId}/location
```

### 💬 Chat & Messaging APIs
```bash
# Send Message
curl -X POST http://localhost:3002/api/messages/send

# Get Trip Messages
curl http://localhost:3002/api/messages/{tripId}

# Mark Messages as Read
curl -X PUT http://localhost:3002/api/messages/read

# Report Message
curl -X POST http://localhost:3002/api/messages/report
```

### 🔧 Utility APIs
```bash
# Location Autocomplete
curl "http://localhost:3002/api/locations/autocomplete?input=almaty"

# Refresh Auth Token
curl -X POST http://localhost:3002/api/auth/refresh

# Send OTP
curl -X POST http://localhost:3002/api/otp/send

# Verify OTP
curl -X POST http://localhost:3002/api/otp/verify

# Upload File
curl -X POST http://localhost:3002/api/upload

# Mock Payment Success (Dev Only)
curl -X POST http://localhost:3002/api/payments/mock-success

# Debug Endpoint
curl http://localhost:3002/api/debug

# Cron - Availability Cleanup
curl http://localhost:3002/api/cron/availability
```

### 📄 Receipt APIs
```bash
# Get Receipt for Booking
curl http://localhost:3002/api/receipts/{bookingId} \
  -H "Authorization: Bearer {token}"
```

---

## 🧪 QUICK TEST SCENARIOS

### Scenario 1: Test Passenger Flow
```bash
# 1. Open browser
open http://localhost:3002

# 2. Register
open http://localhost:3002/auth/register

# 3. Browse trips
open http://localhost:3002/trips

# 4. Create trip
open http://localhost:3002/trips/create

# 5. View my trips
open http://localhost:3002/my-trips
```

### Scenario 2: Test Driver Flow
```bash
# 1. Driver login
open http://localhost:3002/driver/login

# 2. Dashboard
open http://localhost:3002/driver/portal/dashboard

# 3. Check earnings
open http://localhost:3002/driver/portal/earnings

# 4. View profile
open http://localhost:3002/driver/portal/profile
```

### Scenario 3: Test Admin Flow
```bash
# 1. Admin drivers page
open http://localhost:3002/admin/drivers

# 2. Add new driver
open http://localhost:3002/admin/drivers/new
```

---

## 🎨 UI COMPONENT LOCATIONS

### Landing Page Components
```
File: src/app/page.tsx
Components:
  - HeroSection
  - SearchWidget
  - FeaturesSection
  - TestimonialsSection
```

### Trip Components
```
File: src/app/trips/page.tsx
Components:
  - TripList
  - TripCard
  - TripFilters
  - SearchBar

File: src/app/trips/create/page.tsx
Components:
  - CreateTripForm
  - LocationInput (Autocomplete)
  - DateTimePicker
  - ItineraryBuilder
  - PricingCalculator
```

### Driver Portal Components
```
File: src/app/driver/portal/dashboard/page.tsx
Components:
  - DriverDashboard
  - AvailabilityToggle
  - TripsList
  - EarningsCard
  - StatsCards

File: src/app/driver/portal/earnings/page.tsx
Components:
  - EarningsDashboard
  - PayoutHistory
  - EarningsChart
  - PayoutSchedule

File: src/app/driver/portal/profile/page.tsx
Components:
  - DriverProfileForm
  - DocumentUploader
  - VehicleInfo
  - VerificationBadges
```

### Tracking Components
```
File: src/components/tracking/LiveTrackingMap.tsx
Components:
  - LiveTrackingMap
  - DriverMarker
  - RoutePolyline
  - ETADisplay
```

### Receipt Components
```
File: src/components/receipts/Receipt.tsx
Components:
  - Receipt
  - ReceiptHeader
  - ReceiptItems
  - ReceiptFooter
```

---

## 🗂️ COMPONENT FILE STRUCTURE

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── trips/
│   │   ├── page.tsx                      # Trip listing
│   │   ├── create/page.tsx               # Create trip
│   │   └── [id]/page.tsx                 # Trip detail
│   ├── my-trips/
│   │   ├── page.tsx                      # My bookings
│   │   ├── [id]/page.tsx                 # Booking detail
│   │   ├── [id]/track/page.tsx           # Live tracking
│   │   └── [id]/receipt/page.tsx         # Receipt
│   ├── driver/
│   │   ├── login/page.tsx                # Driver login
│   │   └── portal/
│   │       ├── dashboard/page.tsx        # Main dashboard
│   │       ├── earnings/page.tsx         # Earnings
│   │       ├── profile/page.tsx          # Profile
│   │       ├── ratings/page.tsx          # Reviews
│   │       ├── notifications/page.tsx    # Notifications
│   │       └── help/page.tsx             # Help center
│   ├── drivers/
│   │   └── [driverId]/page.tsx           # Public profile
│   ├── activity-owners/
│   │   ├── auth/
│   │   │   ├── login/page.tsx            # AO login
│   │   │   ├── register/page.tsx         # AO register
│   │   │   └── verify/page.tsx           # Email verify
│   │   └── dashboard/page.tsx            # AO dashboard
│   └── admin/
│       └── drivers/
│           ├── page.tsx                  # Drivers list
│           └── new/page.tsx              # Add driver
│
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── SearchWidget.tsx
│   │   └── LocationInput.tsx
│   ├── tracking/
│   │   └── LiveTrackingMap.tsx
│   ├── receipts/
│   │   └── Receipt.tsx
│   ├── driver/
│   │   ├── DriverDashboard.tsx
│   │   └── AvailabilityToggle.tsx
│   └── ui/
│       └── [shared components]
│
└── api/
    ├── trips/route.ts
    ├── bookings/route.ts
    ├── drivers/
    │   ├── login/route.ts
    │   ├── dashboard/route.ts
    │   └── [50+ more endpoints]
    └── [other API routes]
```

---

## 🔗 QUICK ACCESS LINKS

### Most Used Components
1. **Landing:** http://localhost:3002
2. **Create Trip:** http://localhost:3002/trips/create
3. **Driver Dashboard:** http://localhost:3002/driver/portal/dashboard
4. **My Trips:** http://localhost:3002/my-trips
5. **Admin Panel:** http://localhost:3002/admin/drivers

### Database Tools
- **Prisma Studio:** `npm run db:studio` → http://localhost:5555

### Testing Tools
- **Automated Tests:** `./test-app.sh`
- **Manual Testing:** Use links above
- **API Testing:** Use cURL commands provided

---

## 📞 SUPPORT

### Documentation Files
- **This File:** COMPONENT_LINKS.md
- **Test Links:** TEST_LINKS.md
- **Developer Guide:** docs/onboarding/developer-guide.md
- **Testing Guide:** TESTING_GUIDE.md

### Quick Commands
```bash
# Start server
npm run dev

# Open database
npm run db:studio

# Run tests
./test-app.sh

# Fix Prisma
npm run db:generate
```

---

**Total Components:** 40+ Pages, 100+ API Endpoints  
**Server Status:** 🟢 Running on http://localhost:3002  
**Last Updated:** December 1, 2025

**Ready to test! 🚀**
