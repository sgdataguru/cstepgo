# Driver Payout API Testing Guide

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure database is set up with test data (drivers, trips, bookings)

## Test Data Setup

### Create Test Driver

```sql
-- Insert test driver
INSERT INTO "User" (id, email, name, "passwordHash", role)
VALUES ('test_driver_user_1', 'driver1@test.com', 'Test Driver 1', 'hash', 'DRIVER');

INSERT INTO "Driver" (id, "userId", "vehicleType", "vehicleModel", "vehicleMake", "vehicleYear", 
                      "licensePlate", "licenseNumber", "licenseExpiry", "documentsUrl", "driverId")
VALUES ('test_driver_1', 'test_driver_user_1', 'SUV', 'Fortuner', 'Toyota', 2023, 
        'A123BC', 'DL123456', NOW() + INTERVAL '1 year', '{}', 'DRV-20241125-00001');
```

### Create Test Bookings (Online-Paid)

```sql
-- Insert test trip
INSERT INTO "Trip" (id, title, description, "organizerId", "driverId", 
                    "departureTime", "returnTime", "originName", "originAddress", 
                    "originLat", "originLng", "destName", "destAddress", "destLat", 
                    "destLng", "totalSeats", "availableSeats", "basePrice", "platformFee", 
                    "itinerary", status)
VALUES ('test_trip_1', 'Test Trip', 'Test Description', 'test_passenger_1', 'test_driver_1',
        NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 
        'Almaty', 'Almaty City Center', 43.2566, 76.9286,
        'Astana', 'Astana Downtown', 51.1694, 71.4491,
        4, 3, 10000, 1500, '[]', 'COMPLETED');

-- Insert booking with online payment
INSERT INTO "Booking" (id, "tripId", "userId", status, "seatsBooked", "totalAmount", 
                       passengers, "paymentMethodType", "confirmedAt")
VALUES ('test_booking_1', 'test_trip_1', 'test_passenger_1', 'COMPLETED', 1, 10000,
        '[{"name": "John Doe"}]', 'ONLINE', NOW() - INTERVAL '1 day');

-- Insert successful payment
INSERT INTO "Payment" (id, "bookingId", amount, status, "succeededAt")
VALUES ('test_payment_1', 'test_booking_1', 10000, 'SUCCEEDED', NOW() - INTERVAL '1 day');
```

## API Testing with cURL

### 1. Admin - List All Payouts

```bash
curl -X GET "http://localhost:3000/api/admin/payouts/run?limit=10&offset=0" \
  -H "x-admin-token: test_admin_token_12345" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [],
    "total": 0,
    "limit": 10,
    "offset": 0,
    "summary": {}
  }
}
```

### 2. Admin - Filter Payouts by Status

```bash
curl -X GET "http://localhost:3000/api/admin/payouts/run?status=PAID" \
  -H "x-admin-token: test_admin_token_12345" \
  -H "Content-Type: application/json"
```

### 3. Admin - Run Batch Payout

```bash
curl -X POST "http://localhost:3000/api/admin/payouts/run" \
  -H "x-admin-token: test_admin_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2024-11-01T00:00:00Z",
    "periodEnd": "2024-11-25T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "processedDrivers": 1,
    "successfulPayouts": 1,
    "failedPayouts": 0,
    "totalAmount": 8500,
    "results": [
      {
        "driverId": "test_driver_1",
        "success": true,
        "amount": 8500
      }
    ]
  }
}
```

### 4. Admin - Process Single Driver Payout

```bash
curl -X POST "http://localhost:3000/api/admin/payouts/run" \
  -H "x-admin-token: test_admin_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "test_driver_1",
    "periodStart": "2024-11-01T00:00:00Z",
    "periodEnd": "2024-11-25T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "driverId": "test_driver_1",
    "payoutId": "clxxx...",
    "amount": 8500,
    "bookingsCount": 1
  }
}
```

### 5. Admin - Multi-Tenant Payout

```bash
curl -X POST "http://localhost:3000/api/admin/payouts/run" \
  -H "x-admin-token: test_admin_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_org_1",
    "periodStart": "2024-11-01T00:00:00Z",
    "periodEnd": "2024-11-25T23:59:59Z"
  }'
```

### 6. Driver - Get Payout History

```bash
curl -X GET "http://localhost:3000/api/drivers/payouts?limit=20" \
  -H "x-driver-id: test_driver_1" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "lifetimeEarnings": 8500,
      "pendingPayout": 0,
      "lastPayoutAmount": 8500,
      "lastPayoutDate": "2024-11-25T12:00:00Z",
      "totalPayouts": 1,
      "currency": "KZT"
    },
    "payouts": [
      {
        "id": "clxxx...",
        "amount": 8500,
        "currency": "KZT",
        "status": "PAID",
        "payoutMethod": "MOCK",
        "periodStart": "2024-11-18T00:00:00Z",
        "periodEnd": "2024-11-25T00:00:00Z",
        "tripsCount": 1,
        "bookingsCount": 1,
        "createdAt": "2024-11-25T12:00:00Z",
        "processedAt": "2024-11-25T12:00:01Z"
      }
    ],
    "unpaidBookings": []
  }
}
```

### 7. Driver - Filter by Status

```bash
curl -X GET "http://localhost:3000/api/drivers/payouts?status=PENDING" \
  -H "x-driver-id: test_driver_1" \
  -H "Content-Type: application/json"
```

## Postman Collection

### Setup

1. Create new Postman collection: "Driver Payouts API"
2. Add environment variables:
   - `BASE_URL`: `http://localhost:3000`
   - `ADMIN_TOKEN`: `test_admin_token_12345`
   - `DRIVER_ID`: `test_driver_1`

### Requests

#### 1. Admin: List Payouts
- **Method**: GET
- **URL**: `{{BASE_URL}}/api/admin/payouts/run`
- **Headers**:
  - `x-admin-token`: `{{ADMIN_TOKEN}}`
- **Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    pm.expect(pm.response.json()).to.have.property('success');
});
```

#### 2. Admin: Run Batch Payout
- **Method**: POST
- **URL**: `{{BASE_URL}}/api/admin/payouts/run`
- **Headers**:
  - `x-admin-token`: `{{ADMIN_TOKEN}}`
  - `Content-Type`: `application/json`
- **Body** (JSON):
```json
{
  "periodStart": "2024-11-01T00:00:00Z",
  "periodEnd": "2024-11-25T23:59:59Z"
}
```
- **Tests**:
```javascript
pm.test("Batch payout successful", function () {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data).to.have.property('processedDrivers');
});
```

#### 3. Driver: Get Payouts
- **Method**: GET
- **URL**: `{{BASE_URL}}/api/drivers/payouts`
- **Headers**:
  - `x-driver-id`: `{{DRIVER_ID}}`
- **Tests**:
```javascript
pm.test("Driver payout data retrieved", function () {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data.summary).to.exist;
    pm.expect(response.data.payouts).to.be.an('array');
});
```

## Test Scenarios

### Scenario 1: First-Time Payout

1. Create driver with no prior payouts
2. Create completed booking with online payment
3. Run batch payout
4. Verify payout created with correct amount (85% of booking)
5. Verify booking marked as `payoutSettled=true`
6. Check driver portal shows payout in history

### Scenario 2: Multiple Bookings in Period

1. Create 3 completed bookings for same driver
2. All bookings with online payment (₸10,000 each)
3. Run single driver payout
4. Verify payout amount = ₸25,500 (8,500 × 3)
5. Verify all 3 bookings marked as settled

### Scenario 3: Cash vs. Online Payment

1. Create 2 bookings for driver:
   - Booking 1: ₸10,000 ONLINE
   - Booking 2: ₸15,000 CASH_TO_DRIVER
2. Run payout
3. Verify payout only includes ONLINE booking
4. Verify payout amount = ₸8,500 (not ₸21,250)
5. Check driver portal shows cash booking separately

### Scenario 4: Multi-Tenant Isolation

1. Create 2 drivers in different tenants
2. Create bookings for both
3. Run payout with `tenantId` filter
4. Verify only drivers from specified tenant are processed
5. Verify payout records have correct `tenantId`

### Scenario 5: Already Settled Bookings

1. Create booking and process payout
2. Try to run payout again for same period
3. Verify no new payout created
4. Verify `bookingsCount = 0` in response

### Scenario 6: Failed Payment Status

1. Create booking with FAILED payment status
2. Run payout
3. Verify booking NOT included in payout
4. Verify `bookingsCount = 0`

## Validation Checklist

- [ ] Platform commission is 15%
- [ ] Driver earnings are 85%
- [ ] Only ONLINE payments included
- [ ] CASH_TO_DRIVER bookings excluded
- [ ] `payoutSettled` flag prevents double payouts
- [ ] Multi-tenant filtering works correctly
- [ ] Payout metadata includes booking IDs
- [ ] Mock adapter always succeeds
- [ ] Admin endpoints require authentication
- [ ] Driver endpoints require driver ID
- [ ] Pagination works correctly
- [ ] Status filtering works
- [ ] Date range filtering works
- [ ] Summary calculations are accurate

## Common Issues

### Issue: Payout Amount is 0

**Cause**: No eligible bookings in period
**Solution**: 
- Check booking status (must be COMPLETED)
- Check payment status (must be SUCCEEDED)
- Verify payment method (must be ONLINE)
- Check date range includes booking dates

### Issue: 401 Unauthorized

**Cause**: Missing or invalid authentication
**Solution**:
- Add `x-admin-token` header for admin endpoints
- Add `x-driver-id` header for driver endpoints

### Issue: Double Payout Created

**Cause**: `payoutSettled` flag not set
**Solution**:
- Check database migration applied correctly
- Verify booking update transaction succeeded

### Issue: Wrong Payout Amount

**Cause**: Commission calculation error
**Solution**:
- Verify `DRIVER_EARNINGS_RATE = 0.85`
- Check if platform fee already deducted from booking amount
- Review calculation in `calculateDriverEarnings` function

## Performance Testing

### Load Test Script

```bash
# Run 100 batch payout requests
for i in {1..100}; do
  curl -X POST "http://localhost:3000/api/admin/payouts/run" \
    -H "x-admin-token: test_admin_token_12345" \
    -H "Content-Type: application/json" \
    -d '{"periodStart": "2024-11-01T00:00:00Z", "periodEnd": "2024-11-25T23:59:59Z"}' &
done
wait
```

### Expected Performance

- Single driver payout: < 100ms
- Batch payout (10 drivers): < 500ms
- Batch payout (100 drivers): < 5s

## Monitoring

### Key Metrics to Track

1. **Payout Success Rate**: `(successful payouts / total payouts) × 100%`
2. **Average Processing Time**: Time from API call to payout marked as PAID
3. **Failed Payout Rate**: Percentage of payouts with FAILED status
4. **Double Payout Incidents**: Should be 0
5. **Average Payout Amount**: Monitor for anomalies

### Database Queries for Monitoring

```sql
-- Payouts by status
SELECT status, COUNT(*), SUM(amount) 
FROM "Payout" 
GROUP BY status;

-- Payouts in last 7 days
SELECT DATE("createdAt") as date, COUNT(*), SUM(amount)
FROM "Payout"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt");

-- Unsettled bookings
SELECT COUNT(*), SUM("totalAmount")
FROM "Booking"
WHERE status = 'COMPLETED'
  AND "paymentMethodType" = 'ONLINE'
  AND "payoutSettled" = false;
```
