# Quick Reference: Stories 33-42

## 📦 Passenger Booking Journey

### Story 33: Book Private Trip
```
Landing Page → Search Widget → Select Route → Choose Date/Time → Confirm Booking → Payment
```
**Key Endpoints:** `/api/bookings/create-private`

### Story 34: Book Shared Seat
```
Browse Shared Trips → Select Trip → Choose Seats → Confirm Booking → Payment
```
**Key Endpoints:** `/api/bookings/create-shared`

### Story 35: Online Payment
```
Booking Created → Checkout Screen → Stripe Payment → Webhook Confirmation → Booking Confirmed
```
**Key Endpoints:** `/api/payments/initiate`, `/api/payments/webhook`

### Story 36: Manage Bookings
```
My Trips Dashboard → View Details → Cancel (if eligible) → Refund Processing
```
**Key Endpoints:** `/api/bookings/upcoming`, `/api/bookings/:id/cancel`

### Story 37: Track Driver Live
```
Active Booking → Track Driver → Live Map → ETA Updates → Driver Nearby Alert
```
**Key Endpoints:** `/api/tracking/driver/:id/live` (WebSocket)

### Story 38: Trip History & Receipts
```
Trip History → View Past Trips → Download Receipt → Email Receipt
```
**Key Endpoints:** `/api/bookings/history`, `/api/receipts/:id/download`

---

## 💰 Driver & Financial Features

### Story 39: Driver Payouts
```
Complete Trips → Earnings Calculated → Scheduled Payout → Stripe Connect Transfer → Paid
```
**Key Endpoints:** `/api/payouts/schedule`, `/api/payouts/history`

---

## 🎯 Activity Marketplace

### Story 40: Activity Owner Portal
```
Owner Login → Create Activity → Upload Photos → Set Schedule → Publish → Manage Bookings
```
**Key Endpoints:** `/api/activities/create`, `/api/activities/:id/edit`

### Story 41: Browse & Book Activities
```
Activities Section → Filter/Search → View Details → Select Date/Slot → Book → Payment
```
**Key Endpoints:** `/api/activities/search`, `/api/activities/:id/book`

---

## 🎛️ Admin Operations

### Story 42: Admin Dashboard
```
Admin Login → Dashboard → Active Trips Monitor → Bookings Table → Revenue Metrics
```
**Key Endpoints:** `/api/admin/dashboard/metrics`, `/api/admin/bookings/search`

---

## 🔑 Key Models

### Booking
```typescript
{
  id: string
  userId: string
  tripId: string
  bookingType: 'PRIVATE' | 'SHARED' | 'ACTIVITY'
  seatsBooked: number
  totalAmount: number
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Payment
```typescript
{
  id: string
  bookingId: string
  amount: number
  currency: string
  provider: 'STRIPE'
  paymentIntentId: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  webhookSignature: string
  createdAt: DateTime
}
```

### Payout
```typescript
{
  id: string
  driverId: string
  amount: number
  platformFee: number
  netAmount: number
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
  payoutDate: DateTime
  stripePayoutId: string
}
```

### Activity
```typescript
{
  id: string
  ownerId: string
  title: string
  description: string
  location: string
  category: string
  duration: number
  capacity: number
  price: number
  schedule: string
  isActive: boolean
  createdAt: DateTime
}
```

---

## 🚀 Implementation Priority

1. **Week 1-2:** Stories 33-34 (Booking foundation)
2. **Week 3-4:** Story 35 (Payment integration)
3. **Week 5-6:** Stories 36-38 (Booking management)
4. **Week 7-9:** Stories 39-41 (Marketplace features)
5. **Week 10:** Story 42 (Admin dashboard)

---

## 📱 UI Components Needed

### Passenger Components
- `BookingWidget` - Landing page search
- `TripSelector` - Private vs shared trip selection
- `SeatSelector` - Shared ride seat picker
- `CheckoutForm` - Payment processing
- `MyTripsGrid` - Upcoming bookings display
- `TripCard` - Individual trip details
- `LiveTrackingMap` - Real-time driver tracking
- `TripHistoryTable` - Past trips list
- `ReceiptDownload` - PDF generation button

### Driver Components
- `EarningsDashboard` - Earnings overview
- `PayoutHistory` - Past payouts table
- `PayoutAccountSetup` - Bank account configuration

### Activity Components
- `ActivityForm` - Create/edit activity
- `ActivityCard` - Activity listing card
- `ActivityDetailPage` - Full activity information
- `ActivityBookingForm` - Date/slot selection

### Admin Components
- `AdminDashboard` - Metrics overview
- `ActiveTripsTable` - Live trips monitoring
- `BookingsTable` - All bookings view
- `RevenueCharts` - Financial analytics

---

## 🔐 Security Considerations

- **Payment Security:** PCI DSS compliance via Stripe
- **Data Privacy:** Mask sensitive payment info
- **Access Control:** Role-based permissions for all endpoints
- **Webhook Verification:** Stripe signature validation
- **Location Privacy:** Restrict driver location access to authorized users
- **Receipt Security:** Generate PDFs server-side, no client-side data exposure

---

## ✅ Testing Checklist per Story

- [ ] Unit tests for all API endpoints
- [ ] Integration tests for payment flow
- [ ] E2E tests for booking journey
- [ ] Concurrency tests for seat booking
- [ ] Load tests for real-time tracking
- [ ] Security audit for payment handling
- [ ] Mobile responsive testing
- [ ] Cross-browser compatibility
- [ ] Accessibility (WCAG 2.1 AA)

---

**Quick Start Command:**
```bash
# Create all story files
npm run create-stories-33-42

# Run tests for passenger booking stories
npm test -- stories/33-38

# Start development with hot reload
npm run dev
```
