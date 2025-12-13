# StepperGO - Complete Testing Links Guide

**Base URL**: `http://localhost:3000` (Development)  
**Last Updated**: November 25, 2025  
**Status**: Ready for Testing

---

## 🏠 Public Pages

### Landing & Discovery
- **Home Page**: http://localhost:3000
- **Module Overview**: http://localhost:3000/module-overview
- **Navigation Demo**: http://localhost:3000/navigation/demo

---

## 👤 Passenger Features (Stories 33-38)

### Authentication
- **User Registration**: http://localhost:3000/auth/register

### Trip Booking
- **Browse Trips**: http://localhost:3000/trips
- **Create Trip (Private)**: http://localhost:3000/trips/create
- **Trip Details**: http://localhost:3000/trips/[id]
  - Example: http://localhost:3000/trips/1

### My Trips Management
- **My Trips Dashboard**: http://localhost:3000/my-trips
- **Trip Detail**: http://localhost:3000/my-trips/[id]
  - Example: http://localhost:3000/my-trips/1
- **Trip Receipt**: http://localhost:3000/my-trips/[id]/receipt
  - Example: http://localhost:3000/my-trips/1/receipt
- **Real-Time Tracking**: http://localhost:3000/my-trips/[id]/track
  - Example: http://localhost:3000/my-trips/1/track

### API Endpoints (Passengers)
- **Create Booking**: `POST /api/bookings`
- **Get My Bookings**: `GET /api/passengers/bookings`
- **Get Booking Detail**: `GET /api/passengers/bookings/[bookingId]`
- **Cancel Booking**: `POST /api/passengers/bookings/[bookingId]/cancel`
- **Track Trip**: `GET /api/passengers/bookings/[bookingId]/track`
- **Shared Ride Booking**: `POST /api/bookings/shared`
- **Get Receipt**: `GET /api/receipts/[bookingId]`

---

## 🚗 Driver Portal (Stories 39, Driver Management)

### Driver Authentication
- **Driver Login**: http://localhost:3000/driver/login
- **Driver Registration**: `POST /api/drivers/register`

### Driver Dashboard
- **Main Dashboard**: http://localhost:3000/driver/dashboard
- **Portal Dashboard**: http://localhost:3000/driver/portal/dashboard
- **Earnings Dashboard**: http://localhost:3000/driver/portal/earnings
- **Profile Management**: http://localhost:3000/driver/portal/profile
- **Ratings & Reviews**: http://localhost:3000/driver/portal/ratings
- **Notifications**: http://localhost:3000/driver/portal/notifications
- **Help Center**: http://localhost:3000/driver/portal/help

### Driver Profile Pages
- **View Driver Profile**: http://localhost:3000/drivers/[driverId]
  - Example: http://localhost:3000/drivers/test-driver-123
  - Test Driver: http://localhost:3000/drivers/clxxx-driver-id

### API Endpoints (Drivers)

#### Authentication & Profile
- **Driver Login**: `POST /api/drivers/login`
- **Driver Registration**: `POST /api/drivers/register`
- **Get Driver Profile**: `GET /api/drivers/[id]`
- **Update Driver Profile**: `PUT /api/drivers/profile`

#### Dashboard & Stats
- **Get Dashboard Data**: `GET /api/drivers/dashboard`
- **Get Driver Dashboard**: `GET /api/drivers/[id]/dashboard`
- **Get Driver Trips**: `GET /api/drivers/[id]/trips`
- **Get Driver Earnings**: `GET /api/drivers/earnings/[driverId]`

#### Trip Management
- **Get Available Trips**: `GET /api/drivers/trips/available`
- **Accept Trip**: `POST /api/drivers/trips/accept/[tripId]`
- **Update Trip Status**: `PUT /api/drivers/trips/[tripId]/status`
- **Get Trip Bookings**: `GET /api/drivers/trips/[tripId]/bookings`
- **Get Real-time Trips**: `GET /api/drivers/realtime/trips`

#### Trip Offers & Acceptance
- **Get Trip Offers**: `GET /api/drivers/trips/offer`
- **Accept Offer**: `POST /api/drivers/trips/acceptance/offer`
- **Enhanced Acceptance**: `POST /api/drivers/trips/acceptance/enhanced`

#### Availability Management
- **Get Availability**: `GET /api/drivers/availability`
- **Update Availability**: `PUT /api/drivers/availability`
- **Get Schedule**: `GET /api/drivers/availability/schedule`
- **Create Schedule**: `POST /api/drivers/availability/schedule`
- **Update Schedule**: `PUT /api/drivers/availability/schedule/[scheduleId]`
- **Delete Schedule**: `DELETE /api/drivers/availability/schedule/[scheduleId]`
- **Update Location**: `POST /api/drivers/location`

#### Reviews & Ratings
- **Get Driver Reviews**: `GET /api/drivers/reviews/[driverId]`
- **Respond to Review**: `POST /api/drivers/reviews/[driverId]/[reviewId]/respond`

#### Notifications
- **Get Notifications**: `GET /api/drivers/notifications`
- **Get Notification**: `GET /api/drivers/notifications/[notificationId]`
- **Mark as Read**: `PUT /api/drivers/notifications/[notificationId]/read`

#### Documents & Payouts
- **Upload Documents**: `POST /api/drivers/documents`
- **Get Documents**: `GET /api/drivers/documents`
- **Get Payouts**: `GET /api/drivers/payouts`

---

## 🏛️ Admin Portal

### Driver Management
- **Admin Drivers List**: http://localhost:3000/admin/drivers
- **Add New Driver**: http://localhost:3000/admin/drivers/new

### API Endpoints (Admin)

#### Driver Management
- **Get All Drivers**: `GET /api/admin/drivers`
- **Create Driver**: `POST /api/admin/drivers`
- **Update Driver Availability**: `PUT /api/admin/drivers/availability`

#### Approvals & Documents
- **Get Approvals**: `GET /api/admin/approvals`
- **Approve Driver**: `POST /api/admin/approvals/driver`
- **Get Documents**: `GET /api/admin/documents`
- **Verify Document**: `POST /api/documents/verify`

#### Payouts
- **Run Payouts**: `POST /api/admin/payouts/run`

---

## 🎭 Activity Owners Portal (Stories 40-41)

### Authentication
- **Owner Login**: http://localhost:3000/activity-owners/auth/login
- **Owner Registration**: http://localhost:3000/activity-owners/auth/register
- **Email Verification**: http://localhost:3000/activity-owners/auth/verify

### Dashboard
- **Owner Dashboard**: http://localhost:3000/activity-owners/dashboard

### API Endpoints (Activities)
- **Register Activity Owner**: `POST /api/activity-owners/register`
- **Get Activities**: `GET /api/activities`
- **Create Activity**: `POST /api/activities`
- **Get Owner Activities**: `GET /api/activities/owner`
- **Get Activity Detail**: `GET /api/activities/[id]`
- **Update Activity**: `PUT /api/activities/[id]`
- **Delete Activity**: `DELETE /api/activities/[id]`
- **Toggle Activity Status**: `PUT /api/activities/[id]/toggle-status`
- **Get Activity Bookings**: `GET /api/activities/[id]/bookings`

---

## 🚀 Real-time Features (Story 37)

### WebSocket Connection
- **Socket.IO Endpoint**: `GET /api/socket`

### Real-time Tracking
- **Trip Status Updates**: `GET /api/realtime/trip-status/[tripId]`

### Navigation Features
- **Get Route**: `POST /api/navigation/route`
- **Start Trip Navigation**: `POST /api/navigation/trips/[tripId]/start`
- **Update Location**: `PUT /api/navigation/trips/[tripId]/location`

---

## 💬 Chat & Messaging

### API Endpoints
- **Send Message**: `POST /api/messages/send`
- **Get Messages**: `GET /api/messages/[tripId]`
- **Mark as Read**: `PUT /api/messages/read`
- **Report Message**: `POST /api/messages/report`

---

## 🔧 Utility Endpoints

### Location Services
- **Autocomplete**: `GET /api/locations/autocomplete?input={query}`

### Authentication
- **Refresh Token**: `POST /api/auth/refresh`

### OTP Services
- **Send OTP**: `POST /api/otp/send`
- **Verify OTP**: `POST /api/otp/verify`

### File Upload
- **Upload File**: `POST /api/upload`

### Mock Payments (Development)
- **Mock Payment Success**: `POST /api/payments/mock-success`

### Cron Jobs
- **Availability Cleanup**: `GET /api/cron/availability`

### Debug
- **Debug Endpoint**: `GET /api/debug`

---

## 🧪 Testing Scenarios

### End-to-End Flow 1: Complete Trip Booking (Story 33)
1. Register as passenger: http://localhost:3000/auth/register
2. Browse trips: http://localhost:3000/trips
3. Create new trip: http://localhost:3000/trips/create
4. View trip details: http://localhost:3000/trips/[id]
5. Book the trip via API: `POST /api/bookings`
6. View in My Trips: http://localhost:3000/my-trips

### End-to-End Flow 2: Driver Accepting Trip
1. Login as driver: http://localhost:3000/driver/login
2. View dashboard: http://localhost:3000/driver/portal/dashboard
3. Check available trips: `GET /api/drivers/trips/available`
4. Accept trip: `POST /api/drivers/trips/accept/[tripId]`
5. Update trip status: `PUT /api/drivers/trips/[tripId]/status`

### End-to-End Flow 3: Real-time Tracking (Story 37)
1. Passenger books trip (Flow 1)
2. Driver accepts trip (Flow 2)
3. Driver starts trip: `POST /api/navigation/trips/[tripId]/start`
4. Passenger tracks: http://localhost:3000/my-trips/[id]/track
5. Driver updates location: `PUT /api/navigation/trips/[tripId]/location`
6. Real-time updates via WebSocket

### End-to-End Flow 4: Trip History & Receipt (Story 38)
1. Complete trip (Flows 1-3)
2. View trip history: http://localhost:3000/my-trips
3. View specific trip: http://localhost:3000/my-trips/[id]
4. Download receipt: http://localhost:3000/my-trips/[id]/receipt
5. Get receipt via API: `GET /api/receipts/[bookingId]`

### End-to-End Flow 5: Driver Earnings (Story 39)
1. Driver completes multiple trips
2. View earnings dashboard: http://localhost:3000/driver/portal/earnings
3. Check payout status: `GET /api/drivers/payouts`
4. Admin triggers payout: `POST /api/admin/payouts/run`

### End-to-End Flow 6: Activity Owner Portal (Story 40)
1. Register as activity owner: http://localhost:3000/activity-owners/auth/register
2. Verify email: http://localhost:3000/activity-owners/auth/verify
3. Login: http://localhost:3000/activity-owners/auth/login
4. Access dashboard: http://localhost:3000/activity-owners/dashboard
5. Create activity: `POST /api/activities`
6. Manage activities: `GET /api/activities/owner`

---

## 📊 Testing with Test Data

### Test Driver Account
- **Driver ID**: `test-driver-123`
- **Profile URL**: http://localhost:3000/drivers/test-driver-123
- **Dashboard**: http://localhost:3000/driver/portal/dashboard

### Creating Test Data
Run the seed scripts to populate test data:
```bash
npm run db:seed
```

Or run specific seed files:
```bash
npx tsx prisma/seed-driver.ts
```

---

## 🔍 API Testing with cURL

### Example: Get Available Trips
```bash
curl http://localhost:3000/api/drivers/trips/available \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example: Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tripId": "trip-id-here",
    "passengers": 2,
    "pickupLocation": "123 Main St",
    "dropoffLocation": "456 Oak Ave"
  }'
```

### Example: Update Trip Status
```bash
curl -X PUT http://localhost:3000/api/drivers/trips/TRIP_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

---

## 🔐 Authentication Notes

Most API endpoints require authentication. To test:

1. **Login/Register** to get JWT token
2. **Include token** in Authorization header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

3. **Test endpoints** with tools like:
   - Postman
   - Insomnia
   - cURL
   - Browser Dev Tools

---

## ⚠️ Development Notes

### Prerequisites
- Server running: `npm run dev`
- Database seeded: `npm run db:seed`
- Environment variables configured (`.env`)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication
- `GOOGLE_MAPS_API_KEY` - For maps/location features
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_PUBLISHABLE_KEY` - For client-side Stripe
- `NEXT_PUBLIC_APP_URL` - Application URL

### WebSocket Testing
For real-time features, ensure WebSocket connection is established:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
```

---

## 📝 Testing Checklist

### Story 33: Private Trip Booking ✅
- [ ] Browse trips page loads
- [ ] Create trip form works
- [ ] Trip details display correctly
- [ ] Booking API creates booking
- [ ] My Trips shows booked trips

### Story 34: Shared Ride Booking ⬜
- [ ] Shared booking API works
- [ ] Seat availability displays
- [ ] Multiple passengers can book

### Story 35: Online Payment ⬜
- [ ] Payment flow initiates
- [ ] Stripe integration works
- [ ] Payment success/failure handled

### Story 36: Trip Management ✅
- [ ] My Trips dashboard loads
- [ ] Trip cancellation works
- [ ] Refund process triggers

### Story 37: Real-time Tracking ✅
- [ ] Tracking page loads
- [ ] Map displays correctly
- [ ] Driver location updates
- [ ] WebSocket connection stable

### Story 38: Trip History & Receipts ✅
- [ ] Trip history displays
- [ ] Receipt page loads
- [ ] PDF generation works
- [ ] Receipt download works

### Story 39: Driver Payouts ✅
- [ ] Earnings dashboard loads
- [ ] Payout history displays
- [ ] Payout calculations correct
- [ ] Admin can trigger payouts

### Story 40: Activity Owner Portal ✅
- [ ] Owner registration works
- [ ] Dashboard accessible
- [ ] Activity creation works
- [ ] Activity management works

### Story 41: Activity Marketplace ⬜
- [ ] Activities listing loads
- [ ] Activity details display
- [ ] Booking flow works
- [ ] Availability checking works

---

## 🚨 Known Issues & Limitations

1. **Mock Payment**: Currently using mock payment endpoint for development
2. **WebSocket**: Requires active server connection for real-time updates
3. **Maps**: Requires valid Google Maps API key
4. **Email**: May need email service configuration for notifications

---

## 📞 Support

For testing issues or questions:
- Check logs: `npm run dev` output
- Database UI: `npm run db:studio` (Prisma Studio)
- Review implementation docs: `/docs/implementation-plans/`

---

**Happy Testing! 🎉**
