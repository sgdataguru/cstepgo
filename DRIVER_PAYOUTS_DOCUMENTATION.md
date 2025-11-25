# Driver Automatic Payouts - Implementation Documentation

## Overview

The Driver Automatic Payouts feature automates the payment processing for drivers based on completed, online-paid bookings. This implementation supports multi-tenant architecture and provides a pluggable payout provider system.

## Architecture

### Core Components

1. **Driver Payout Service** (`src/lib/services/driverPayoutService.ts`)
   - Handles payout calculations
   - Manages booking settlement tracking
   - Supports pluggable payout adapters
   - Enforces multi-tenant isolation

2. **Admin API Endpoints** (`src/app/api/admin/payouts/`)
   - Batch payout processing
   - Payout history and reporting
   - Driver-specific payout management

3. **Driver API Endpoints** (`src/app/api/drivers/payouts/`)
   - Driver payout history
   - Pending payout calculations
   - Earnings breakdown

4. **Driver Portal UI** (`src/app/driver/portal/earnings/page.tsx`)
   - Enhanced earnings dashboard
   - Payout history visualization
   - Pending vs. settled earnings

## Database Schema

### Booking Model Extensions

```typescript
model Booking {
  // ... existing fields
  
  // Payout tracking
  payoutId          String?   // Reference to payout
  payoutSettled     Boolean   @default(false)
  settledAt         DateTime?
}
```

### Enhanced Payout Model

```typescript
model Payout {
  id               String       @id @default(cuid())
  driverId         String
  amount           Decimal
  currency         String       @default("KZT")
  status           PayoutStatus @default(PENDING)
  
  // Payment provider details
  payoutMethod     String       @default("MOCK")
  payoutProvider   String       @default("MOCK")
  stripeTransferId String?      @unique
  providerMetadata Json?
  
  // Period and metrics
  periodStart      DateTime
  periodEnd        DateTime
  tripsCount       Int          @default(0)
  bookingsCount    Int          @default(0)
  
  // Multi-tenant support
  tenantId         String?
  
  // Metadata (includes bookingIds, calculations)
  metadata         Json?
  
  // Timestamps and status
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  processedAt      DateTime?
  failedAt         DateTime?
  errorMessage     String?
}
```

## Payout Calculation Logic

### Commission Structure

- **Platform Commission**: 15%
- **Driver Earnings**: 85%

### Formula

```
grossAmount = booking.totalAmount
platformFee = grossAmount × 0.15
driverEarnings = grossAmount - platformFee = grossAmount × 0.85
```

### Example

For a booking of ₸10,000:
- Gross Amount: ₸10,000
- Platform Fee: ₸1,500
- Driver Earnings: ₸8,500

## Payment Methods

### Online Payments (ONLINE)

- Automatically included in driver payouts
- Processed weekly (or configurable period)
- Marked as `payoutSettled` after payout creation
- Tracked via `payoutId` field

### Cash Payments (CASH_TO_DRIVER)

- **NOT** included in automatic payouts
- Collected directly by driver from passenger
- Shown separately in earnings dashboard
- Clearly labeled as "Cash Collected by Driver"

## API Endpoints

### Admin Endpoints

#### POST /api/admin/payouts/run

Process payouts for eligible drivers.

**Request Headers:**
```
x-admin-token: admin_token_here
Content-Type: application/json
```

**Request Body (Batch Payout):**
```json
{
  "periodStart": "2024-11-01T00:00:00Z",
  "periodEnd": "2024-11-25T23:59:59Z",
  "tenantId": "optional_tenant_id"
}
```

**Request Body (Single Driver):**
```json
{
  "driverId": "driver_id_here",
  "periodStart": "2024-11-01T00:00:00Z",
  "periodEnd": "2024-11-25T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processedDrivers": 5,
    "successfulPayouts": 5,
    "failedPayouts": 0,
    "totalAmount": 125000,
    "results": [
      {
        "driverId": "driver_123",
        "success": true,
        "amount": 25000
      }
    ]
  }
}
```

#### GET /api/admin/payouts/run

List all payouts with filtering.

**Query Parameters:**
- `driverId` (optional): Filter by specific driver
- `status` (optional): Filter by status (PENDING, PROCESSING, PAID, FAILED)
- `limit` (default: 20): Number of results
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [...],
    "total": 50,
    "summary": {
      "PAID": { "count": 40, "total": 1000000 },
      "PENDING": { "count": 10, "total": 250000 }
    }
  }
}
```

### Driver Endpoints

#### GET /api/drivers/payouts

Get driver's payout history and pending earnings.

**Request Headers:**
```
x-driver-id: driver_id_here
```

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (default: 50): Number of results
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "lifetimeEarnings": 500000,
      "pendingPayout": 15000,
      "lastPayoutAmount": 25000,
      "lastPayoutDate": "2024-11-18T12:00:00Z",
      "totalPayouts": 20,
      "currency": "KZT"
    },
    "payouts": [...],
    "unpaidBookings": [...]
  }
}
```

## Multi-Tenant Support

The payout system fully supports multi-tenant architecture:

1. **Tenant Isolation**: All queries filter by `tenantId` when provided
2. **Tenant-Specific Payouts**: Each tenant can have separate payout schedules
3. **Tenant Tracking**: Payouts include `tenantId` for reporting and auditing

## Payout Adapters

The system uses a pluggable adapter pattern for payment processing.

### Mock Adapter (Default)

- Used for POC and development
- Always succeeds immediately
- No actual money transfer

```typescript
export class MockPayoutAdapter implements PayoutAdapter {
  name = 'MOCK';
  
  async processPayout(params) {
    return {
      success: true,
      providerId: `mock_payout_${Date.now()}`
    };
  }
}
```

### Future: Stripe Connect Adapter

```typescript
export class StripeConnectAdapter implements PayoutAdapter {
  name = 'STRIPE_CONNECT';
  
  async processPayout(params) {
    // Implementation with actual Stripe API calls
    // Transfer funds to driver's connected account
  }
}
```

## Security Considerations

1. **Admin Authentication**: All admin endpoints require `x-admin-token` header
2. **Driver Authentication**: Driver endpoints require `x-driver-id` header
3. **Tenant Isolation**: All queries enforce tenant boundaries
4. **Double Payout Prevention**: `payoutSettled` flag prevents duplicate payouts
5. **Audit Trail**: All payout actions are logged with metadata

## Testing

### Run Tests

```bash
# Start the development server
npm run dev

# In another terminal, run the test script
./test-driver-payouts.sh
```

### Manual Testing

1. **Create test bookings** with ONLINE payment method
2. **Complete the trips** and mark bookings as COMPLETED
3. **Ensure payments are SUCCEEDED**
4. **Run payout processing** via admin API
5. **Verify in driver portal** that payouts appear

### Test Scenarios

- ✅ Single driver payout processing
- ✅ Batch payout for all eligible drivers
- ✅ Multi-tenant payout isolation
- ✅ Cash vs. online payment distinction
- ✅ Double payout prevention
- ✅ Failed payout handling
- ✅ Payout history display

## UI Features

### Driver Portal - Earnings Page

1. **Summary Cards**:
   - Today's earnings
   - This week's earnings
   - This month's earnings
   - **Pending payout** (awaiting settlement)
   - All-time earnings

2. **Payment Method Indicators**:
   - 💳 Blue badge: "Online-Paid = Auto Payout"
   - 💵 Gray badge: "Cash = Direct Collection"

3. **Payout History Table**:
   - Period covered
   - Number of bookings
   - Payout amount
   - Payment method
   - Status (PAID, PENDING, PROCESSING, FAILED)
   - Processing date

4. **Earnings Chart**:
   - Last 30 days visualization
   - Daily earnings breakdown

## Configuration

### Business Rules

Located in `src/lib/services/driverPayoutService.ts`:

```typescript
export const PLATFORM_COMMISSION_RATE = 0.15; // 15%
export const DRIVER_EARNINGS_RATE = 0.85;      // 85%
```

### Payout Schedule

Default: Last 7 days (configurable per call)

```typescript
periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
periodEnd = new Date()
```

## Future Enhancements

1. **Stripe Connect Integration**: Replace mock adapter with real payments
2. **Scheduled Payouts**: Cron job for weekly automatic processing
3. **Email Notifications**: Notify drivers when payouts are processed
4. **Detailed Payout Reports**: PDF generation for accounting
5. **Dispute Management**: Handle payout disputes and adjustments
6. **Tax Reporting**: Generate tax documents for drivers
7. **Multi-Currency Support**: Handle different currencies per tenant

## Troubleshooting

### Payout Not Created

1. Check if bookings are marked as COMPLETED
2. Verify payment status is SUCCEEDED
3. Ensure paymentMethodType is ONLINE (not CASH_TO_DRIVER)
4. Check if bookings are already settled (payoutSettled = true)

### Driver Not Seeing Pending Payout

1. Verify driver has completed bookings
2. Check if bookings are within the payout period
3. Ensure payment was successful
4. Review booking status (must be COMPLETED)

### Admin API Returns 401

1. Verify `x-admin-token` header is present
2. Check token value (temporary solution until proper auth)

## Support

For issues or questions:
- Check the test script output
- Review server logs for errors
- Verify database schema matches expectations
- Ensure all migrations are applied

## Version History

- **v1.0.0** (2024-11-25): Initial implementation
  - Core payout service
  - Mock adapter
  - Admin and driver APIs
  - Enhanced driver portal UI
  - Multi-tenant support
