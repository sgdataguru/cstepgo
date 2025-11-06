# User Story: Epic C.2 - Configure Platform Fees & Ledgers

**Epic:** C — Payments (Stripe)

**As an** admin,
**I want** to configure platform fees and view financial ledgers,
**so that** I can manage revenue and driver payouts transparently.

## Acceptance Criteria

### Platform Fee Configuration
* Admin console settings page: `/admin/settings/fees`
* Configure platform fee percentage:
  - Input field: Default 15%
  - Range: 5% - 30%
  - Validation: Must be numeric, positive
  - Save confirmation: "Fee updated successfully"
* Fee applies to all new bookings
* Historical bookings retain original fee %

### Payment Ledger View
* Admin console page: `/admin/payments`
* Table display with columns:
  - Booking ID (clickable → booking details)
  - Trip: Origin → Destination
  - Traveler name
  - Driver name
  - Booking date
  - Total paid ($)
  - Platform fee ($ and %)
  - Driver payout ($)
  - Status: Paid / Completed / Refunded
* Filters:
  - Date range picker
  - Driver dropdown
  - Status filter
* Sorting: By date (newest first), amount

### Driver Payout Calculation
* Per booking:
  ```
  Total Paid = Subtotal + Platform Fee
  Platform Fee = Subtotal × Platform Fee %
  Driver Payout = Subtotal = Total Paid - Platform Fee
  ```
* Example:
  - Trip price: $100 (2 seats @ $50)
  - Platform fee: 15%
  - Subtotal: $100
  - Platform fee amount: $15
  - Driver payout: $85

### CSV Export
* Export button: "Export to CSV"
* Includes all filtered results
* CSV columns:
  - Booking ID, Trip ID, Traveler Name, Driver Name
  - Booking Date, Trip Date
  - Total Paid, Platform Fee %, Platform Fee $, Driver Payout $
  - Status
* Filename format: `payouts_[YYYY-MM-DD].csv`

### Driver Payout Summary
* Admin view: `/admin/drivers/[driver-id]/payouts`
* Driver-specific payout summary:
  - Total trips completed
  - Total earnings (sum of driver payouts)
  - Avg payout per trip
  - Pending payouts (trips completed but not paid out)
* Payout action: "Mark as Paid" → Manual confirmation of bank transfer

## Technical Notes

### Database Schema
* `payments` table:
  ```sql
  id: UUID
  booking_id: UUID FK
  stripe_payment_intent_id: VARCHAR
  total_amount: DECIMAL
  platform_fee_pct: DECIMAL (e.g., 15.00)
  platform_fee_amount: DECIMAL
  driver_payout_amount: DECIMAL
  status: 'pending' | 'completed' | 'refunded'
  created_at: TIMESTAMP
  ```

* `platform_settings` table:
  ```sql
  key: VARCHAR (e.g., 'platform_fee_pct')
  value: VARCHAR (e.g., '15.00')
  updated_at: TIMESTAMP
  updated_by: UUID (admin user)
  ```

### Ledger Query
```sql
SELECT 
  b.id AS booking_id,
  t.origin, t.destination,
  u_traveler.name AS traveler_name,
  u_driver.name AS driver_name,
  p.total_amount,
  p.platform_fee_pct,
  p.platform_fee_amount,
  p.driver_payout_amount,
  p.status
FROM payments p
JOIN bookings b ON p.booking_id = b.id
JOIN trips t ON b.trip_id = t.id
JOIN users u_traveler ON b.user_id = u_traveler.id
JOIN driver_assignments da ON t.id = da.trip_id
JOIN drivers d ON da.driver_id = d.id
JOIN users u_driver ON d.user_id = u_driver.id
WHERE p.created_at BETWEEN $1 AND $2
ORDER BY p.created_at DESC;
```

### PostHog Events
* `admin_fee_updated` (old_fee_pct, new_fee_pct)
* `ledger_exported` (row_count, date_range)

### Edge Cases
* Fee change during hold period → Use fee % at time of booking creation
* Refunds → Deduct platform fee from driver payout (see Story G.1)
* Manual payouts → Admin notes field for tracking

## Access Control
* Role required: `admin`
* Audit log: All fee changes logged with admin ID + timestamp

## Success Metrics
* Fee configuration updates: Logged and auditable
* CSV export usage: Track frequency
* Payout accuracy: 100% (automated calculation)

## Gate Assignment
**Gate 2** (Platform fee config, basic ledger)
**Gate 3** (Advanced reporting, automated payouts via Stripe Connect)
