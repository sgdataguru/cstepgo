# Cash Payment Testing Guide

## Quick Test Scenarios

### Scenario 1: Private Cab Booking (Cash Payment)

**Steps:**
1. Navigate to homepage or `/trips/create`
2. Select "Private Cab" ride type
3. Enter origin (e.g., "Almaty Airport")
4. Enter destination (e.g., "Almaty City Center")
5. Select vehicle type (e.g., "Sedan")
6. Click "Find Private Cab"

**Expected Results:**
- ✅ Redirected to `/trips/private/quote` page
- ✅ See fare estimate (e.g., "₸ 5,000")
- ✅ See prominent "💵 Cash Payment" notice
- ✅ Message: "You will pay the driver in cash at the end of the trip"
- ✅ "Confirm Booking" button (NOT "Proceed to Payment")
- ✅ Driver search animation completes
- ✅ Click "Confirm Booking" creates trip with `paymentMethodType: 'CASH_TO_DRIVER'`
- ✅ Redirected to `/booking/confirmed` page
- ✅ Confirmation page shows:
  - Success checkmark
  - Trip details (route, departure time)
  - Cash payment notice with amount
  - "What's Next" steps

### Scenario 2: Shared Ride Booking (Cash Payment)

**Steps:**
1. Navigate to `/trips/create`
2. Select "Shared Ride" ride type
3. Enter origin (e.g., "Almaty")
4. Enter destination (e.g., "Shymkent")
5. Select departure date (at least 1 hour in future)
6. Select departure time
7. Select vehicle type
8. Click "Create Shared Trip"

**Expected Results:**
- ✅ Trip created with `paymentMethodType: 'CASH_TO_DRIVER'`
- ✅ Booking status is "CONFIRMED" (auto-confirmed)
- ✅ Redirected to `/trips` listing with success message
- ✅ No payment/Stripe UI shown
- ✅ Payment record created with status "PENDING" and type "cash"

### Scenario 3: View Booking Details (Passenger)

**Steps:**
1. Navigate to "My Trips" or `/my-trips`
2. Click on any booking
3. View booking details page

**Expected Results:**
- ✅ "💵 Cash Payment" badge visible
- ✅ Amber-colored cash payment notice box:
  - "Payment Method: Cash at Trip End"
  - Exact amount to pay (e.g., "You will pay ₸ 5,000 to the driver")
  - Helper text about payment at trip end
- ✅ No "Pay Now" or Stripe buttons
- ✅ Trip details clearly displayed

### Scenario 4: Driver Views Active Trip

**As Driver:**
1. Login to driver portal
2. Navigate to dashboard
3. View active trip section

**Expected Results:**
- ✅ "💵 CASH" badge on active trip header
- ✅ Amber-colored cash collection summary box showing:
  - "Cash to Collect: ₸ 5,000" (large, bold text)
  - "2 cash booking passengers"
  - "Collect from passengers at trip end"
- ✅ Total matches sum of all cash bookings

### Scenario 5: Driver Views Trip Details

**As Driver:**
1. Click on active trip
2. View trip details and bookings

**Expected Results:**
- ✅ Payment method indicator section visible
- ✅ Shows "Payment: Cash - Collect at trip end" badge
- ✅ Total cash amount displayed prominently
- ✅ Helper text: "You will collect cash payment from passengers"
- ✅ Per-booking breakdown shows:
  - Passenger name
  - Amount to collect per passenger
  - "Cash" payment method indicator

### Scenario 6: Driver Completes Trip

**As Driver:**
1. Navigate to active trip
2. Update trip status through workflow:
   - "Departed" → "En Route" → "Arrived" → "Completed"

**Expected Results:**
- ✅ Status updates work without payment confirmation
- ✅ No "Confirm Payment" step required
- ✅ Trip completes successfully
- ✅ Cash collection recorded in system
- ✅ Earnings reflect cash collected (when implemented)

### Scenario 7: Driver Views Trip Offers

**As Driver:**
1. Navigate to dashboard "Trip Offers" tab
2. View available trip offers

**Expected Results:**
- ✅ Each offer card shows payment notice
- ✅ "💵 Payment: May include cash collection from passengers"
- ✅ Amber color scheme for consistency
- ✅ Drivers know upfront about cash collection

## API Testing

### Test API Endpoint: Create Booking

**Request:**
```bash
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "tripId": "clxxx...",
  "seatsBooked": 2,
  "passengers": [
    {"name": "John Doe"},
    {"name": "Jane Doe"}
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clyyy...",
      "status": "CONFIRMED",
      "paymentMethodType": "CASH_TO_DRIVER",
      "totalAmount": 10000,
      "currency": "KZT",
      "confirmedAt": "2025-12-04T..."
    },
    "message": "Booking confirmed. Payment will be collected by driver.",
    "requiresPayment": false
  }
}
```

**Assertions:**
- ✅ `status` is "CONFIRMED" (not "PENDING")
- ✅ `paymentMethodType` is "CASH_TO_DRIVER"
- ✅ `requiresPayment` is `false`
- ✅ `confirmedAt` is populated immediately

### Test API Endpoint: Get Driver Trip Bookings

**Request:**
```bash
GET /api/drivers/trips/{tripId}/bookings
Authorization: Bearer {driverToken}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "clzzz...",
        "paymentMethod": "CASH_TO_DRIVER",
        "paymentInfo": {
          "isPrepaid": false,
          "isCashCollection": true,
          "amountToCollect": 5000
        },
        "totalAmount": 5000
      }
    ],
    "paymentSummary": {
      "totalCashToCollect": 10000,
      "cashCollectionBookings": 2,
      "prepaidBookings": 0
    }
  }
}
```

**Assertions:**
- ✅ `paymentInfo.isCashCollection` is `true`
- ✅ `paymentInfo.amountToCollect` matches `totalAmount`
- ✅ `paymentSummary.totalCashToCollect` is sum of all cash bookings

## Negative Test Cases

### Case 1: No Stripe UI Should Appear
**Test:** Navigate through entire passenger booking flow
**Expected:** NO Stripe checkout, payment form, or card input fields anywhere

### Case 2: Booking Without Payment
**Test:** Create booking and verify it's confirmed without payment
**Expected:** Booking status is CONFIRMED immediately, not PENDING

### Case 3: Driver Trip Completion
**Test:** Complete trip without online payment
**Expected:** No payment validation blocks trip completion

## Visual Verification Checklist

- [ ] 💵 emoji appears consistently for cash indicators
- [ ] Amber color (#F59E0B) used for all cash payment elements
- [ ] Currency amounts formatted with ₸ symbol
- [ ] Helper text is clear and concise
- [ ] Badges are appropriately sized (not too large)
- [ ] Mobile responsive (cash notices visible on small screens)
- [ ] Dark mode compatible (if applicable)

## Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Testing

- [ ] Page load times not affected by changes
- [ ] No console errors in browser
- [ ] No 404 errors for missing assets
- [ ] API response times remain acceptable

## Security Testing

- [ ] Cash bookings auto-confirmed securely
- [ ] Payment records created for audit trail
- [ ] Driver can only see their own bookings
- [ ] Passenger can only see their own bookings
- [ ] No sensitive payment data exposed

## Reporting Issues

If you encounter any issues during testing:

1. **Describe the issue clearly**
   - What you were trying to do
   - What you expected to happen
   - What actually happened

2. **Include details**
   - Browser and version
   - User role (passenger/driver)
   - Trip ID or booking ID
   - Screenshots if applicable

3. **Steps to reproduce**
   - Exact steps to recreate the issue
   - Any error messages from console

4. **Report to**
   - Create GitHub issue with label `cash-payment`
   - Reference implementation PR
   - Tag relevant team members
