# Passenger Booking Management - Quick Reference

## 🎯 Feature: UC-36 Passenger Manage Upcoming Bookings

### ✅ What's Implemented

#### 📱 My Trips Page (`/my-trips`)
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Statistics Cards                                      │
│  Total: 10  |  Upcoming: 3  |  Completed: 5  | Cancelled: 2
│                                                          │
│ 🔍 Filters: [Upcoming] [Past] [All]                     │
│                                                          │
│ 📋 Booking List                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Almaty to Shymbulak                                  ││
│ │ 📍 Almaty City Center → Shymbulak Ski Resort        ││
│ │ 📅 Jan 25, 2025, 9:00 AM                            ││
│ │                                                      ││
│ │ Badges: [CONFIRMED] [👥 Shared] [💳 Online] [SUCCEEDED]
│ │         [👤 Driver Assigned]                         ││
│ │                                                      ││
│ │ 💰 KZT 15,000         2 seats                       ││
│ │    KZT 7,500 per seat                               ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Visual Badges:**
- Trip Type: `🚗 Private` (blue) | `👥 Shared` (purple)
- Payment: `💳 Online` (emerald) | `💵 Cash` (amber)
- Status: `CONFIRMED` (green) | `PENDING` (yellow) | `CANCELLED` (red) | `COMPLETED` (blue)
- Payment Status: `SUCCEEDED` (green) | `PENDING` (yellow) | `FAILED` (red)

#### 📄 Booking Details Page (`/my-trips/[id]`)
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to My Trips                                       │
│                                                          │
│ Trip Information                                         │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Title: Almaty to Shymbulak                           ││
│ │ Description: Scenic mountain ride                    ││
│ │                                                      ││
│ │ From: Almaty City Center                            ││
│ │       Abay Avenue, Almaty                           ││
│ │                                                      ││
│ │ To: Shymbulak Ski Resort                            ││
│ │     Shymbulak, Almaty                               ││
│ │                                                      ││
│ │ Departure: Jan 25, 2025 | 9:00 AM                   ││
│ │ Return: Jan 25, 2025 | 6:00 PM                      ││
│ │                                                      ││
│ │ Seats: 2        Trip Type: [👥 Shared Ride]         ││
│ │ Price/Seat: KZT 7,500    Available: 2 of 4          ││
│ │ Payment: [💳 Online Payment] Status: [CONFIRMED]    ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Driver Information                                       │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 👤 Azamat Kuanyshev        ⭐ 4.8 (150 reviews)      ││
│ │ 📱 +77012345678                                      ││
│ │                                                      ││
│ │ Vehicle: SUV - Toyota Land Cruiser                   ││
│ │ Color: White    License: ABC 123                    ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Sidebar: Booking Summary                                │
│ ┌──────────────────────────────────────────────────────┐│
│ │ ID: booking_abc123                                   ││
│ │ Status: [CONFIRMED]                                  ││
│ │ Booked: Jan 20, 2025                                ││
│ │ Confirmed: Jan 20, 2025                             ││
│ │                                                      ││
│ │ Total: KZT 15,000                                    ││
│ │        2 seats × KZT 7,500                          ││
│ │                                                      ││
│ │ Payment: [💳 Online Payment]                         ││
│ │ Status: [SUCCEEDED]                                  ││
│ │                                                      ││
│ │ [Cancel Booking] ← if eligible                      ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 🔌 API Endpoints

#### List Bookings
```http
GET /api/passengers/bookings?upcoming=true
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "status": "CONFIRMED",
    "seatsBooked": 2,
    "totalAmount": 15000,
    "paymentMethodType": "ONLINE",
    "trip": {
      "title": "Almaty to Shymbulak",
      "tripType": "SHARED",
      "pricePerSeat": 7500,
      "departureTime": "2025-01-25T09:00:00Z"
    },
    "paymentStatus": "SUCCEEDED"
  }],
  "meta": { "upcomingCount": 3 }
}
```

#### Get Booking Details
```http
GET /api/passengers/bookings/{bookingId}
Authorization: Bearer {token}
```

#### Cancel Booking
```http
POST /api/passengers/bookings/{bookingId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Plans changed"
}
```

### 🔄 Real-Time Events

#### Booking Cancellation (Driver-Only)
```javascript
// Driver receives
socket.on('booking.cancelled', (data) => {
  // data: { bookingId, tripId, seatsReleased, reason, timestamp }
  // Update driver's active trips
});
```

#### Trip Availability Update (Public)
```javascript
// All trip listeners receive
socket.on('trip.availability.updated', (data) => {
  // data: { tripId, seatsReleased, timestamp }
  // Update seat availability display
});
```

### 📋 Cancellation Rules

**✅ Can Cancel:**
- Status: PENDING or CONFIRMED
- Time: > 2 hours before departure
- Trip: Not started/completed

**❌ Cannot Cancel:**
- Status: CANCELLED or COMPLETED
- Time: < 2 hours before departure
- Trip: Already started or past

### 🧪 Testing

Run comprehensive tests:
```bash
./test-passenger-booking-management.sh
```

**Test Coverage:**
- ✅ Create bookings (private & shared)
- ✅ List bookings with filters
- ✅ Get booking details
- ✅ Cancel booking
- ✅ Validation checks
- ✅ Authorization

### 📁 Files Changed

```
src/lib/services/
  ├── bookingService.ts           (Enhanced)
  └── realtimeBroadcastService.ts (Enhanced)

src/app/my-trips/
  ├── page.tsx                    (Enhanced)
  └── [id]/page.tsx               (Enhanced)

tests/
  └── test-passenger-booking-management.sh (New)

docs/
  ├── PASSENGER_BOOKING_MANAGEMENT_IMPLEMENTATION.md (New)
  └── PASSENGER_BOOKING_MANAGEMENT_SUMMARY.md        (New)
```

### 🎨 UI Design Pattern

**Badge System:**
```typescript
// Trip Type
<span className="bg-purple-100 text-purple-800">👥 Shared</span>
<span className="bg-blue-100 text-blue-800">🚗 Private</span>

// Payment Method
<span className="bg-emerald-100 text-emerald-800">💳 Online</span>
<span className="bg-amber-100 text-amber-800">💵 Cash</span>

// Status
<span className="bg-green-100 text-green-800">CONFIRMED</span>
<span className="bg-yellow-100 text-yellow-800">PENDING</span>
<span className="bg-red-100 text-red-800">CANCELLED</span>
```

### 🔒 Security

- ✅ JWT authentication required
- ✅ User ownership verification
- ✅ Role-based access (PASSENGER only)
- ✅ Input validation
- ✅ Non-sensitive data in public broadcasts

### 🚀 Performance

- ✅ Optimized DB queries with indexes
- ✅ Selective field inclusion
- ✅ Currency formatting utility
- ✅ Transaction support
- ✅ Non-blocking broadcasts

### 📊 Integration Points

| System | Integration |
|--------|-------------|
| Private Trip (UC-33) | Uses booking APIs |
| Shared Ride (UC-34) | Displays seat pricing |
| Payment (UC-35) | Shows payment status |
| Driver Discovery (UC-21) | Real-time updates |

---

## 💡 Quick Tips

### For Developers
- Use `BookingSummary` for list views
- Use `BookingWithDetails` for detail views
- Always check cancellation eligibility with `canCancelBooking()`
- Use `formatCurrency()` utility for consistent formatting

### For Testers
- Test with both PRIVATE and SHARED trip types
- Test with both ONLINE and CASH_TO_DRIVER payment methods
- Verify 2-hour cancellation window
- Check real-time driver notifications

### For Product
- Badge colors follow consistent design system
- Emoji icons improve scannability
- Clear cancellation feedback
- Mobile-responsive design

---

**Status:** ✅ PRODUCTION READY  
**Last Updated:** November 25, 2025  
**Related Issues:** #37, #39, #41, #21
