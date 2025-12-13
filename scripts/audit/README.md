# StepperGO Audit & Validation Scripts

This directory contains comprehensive validation scripts for testing all aspects of the StepperGO application.

## Available Scripts

### 1. Quick Validation (No Server Required)
```bash
npm run audit:quick
# or
npx tsx scripts/audit/quick-validate.ts
```

This script performs quick checks without requiring the server to be running:
- ✅ Project structure validation
- ✅ Required files check
- ✅ Environment variables verification
- ✅ Database connectivity test
- ✅ Table statistics
- ✅ API route file count
- ✅ Page route file count
- ✅ Component file count

### 2. Full Validation (Server Required)
```bash
npm run audit
# or
npx tsx scripts/audit/validate-app.ts
```

This script performs comprehensive testing including:
- ✅ All quick validation checks
- ✅ API endpoint testing (75+ endpoints)
- ✅ Page route accessibility testing (33+ pages)
- ✅ Trip creation flow validation
- ✅ Driver registration flow validation
- ✅ Booking flow validation
- ✅ Messaging system validation
- ✅ Generates JSON and Markdown reports

### 3. Full Audit with Auto Server Start
```bash
npm run audit:full
# or
./scripts/audit/run-audit.sh
```

This shell script:
- Checks if the server is running
- Automatically starts the dev server if needed
- Runs the full validation
- Stops the server after completion (if it started it)
- Saves detailed reports

## Reports

Reports are saved to `scripts/audit/reports/` in two formats:
- **JSON**: Machine-readable format with all test details
- **Markdown**: Human-readable format for documentation

Example report filename: `audit-report-2025-12-13T10-30-00-000Z.md`

## Test Categories

### API Endpoints Tested
| Category | Endpoints |
|----------|-----------|
| Trips | `/api/trips`, `/api/trips/kazakhstan`, `/api/trips/bundle/*` |
| Drivers | `/api/drivers/*`, `/api/drivers/trips/*`, `/api/drivers/payouts` |
| Bookings | `/api/bookings`, `/api/bookings/shared`, `/api/bookings/[id]` |
| Passengers | `/api/passengers/bookings/*` |
| Activities | `/api/activities`, `/api/activities/owner` |
| Admin | `/api/admin/drivers`, `/api/admin/settings`, `/api/admin/approvals` |
| Auth | `/api/auth/*`, `/api/otp/*` |
| Navigation | `/api/navigation/route`, `/api/navigation/trips/*` |
| Messages | `/api/messages/*` |
| Real-time | `/api/realtime/*` |

### Page Routes Tested
| Category | Routes |
|----------|--------|
| Public | `/`, `/trips`, `/trips/create`, `/trips/kazakhstan` |
| Auth | `/auth/register`, `/driver/login` |
| Driver Portal | `/driver/portal/*` (dashboard, profile, earnings, etc.) |
| Admin | `/admin/drivers`, `/admin/settings` |
| Activity Owners | `/activity-owners/auth/*`, `/activity-owners/dashboard` |
| My Trips | `/my-trips`, `/my-trips/[id]/*` |
| Booking | `/booking/confirmed` |

### Database Tables Checked
- Users
- Trips
- Bookings
- Drivers
- Payments
- Sessions
- Reviews
- Vehicles
- Activities
- Activity Owners
- Activity Bookings
- Payouts
- Messages
- Conversations

## Exit Codes

- `0`: All critical tests passed
- `1`: One or more critical tests failed

## Prerequisites

1. Database connection configured in `.env`
2. Node.js and npm installed
3. Dependencies installed (`npm install`)
4. For full validation: Development server running (`npm run dev`)

## Example Output

```
🔍 StepperGO Application Validation
════════════════════════════════════════════════════════════
Started at: 2025-12-13T10:30:00.000Z
Testing against: http://localhost:3000

📡 Testing API Endpoints...
──────────────────────────────────────────────────
  ✓ List Trips: GET /api/trips - Status 200 (45ms)
  ✓ Kazakhstan Trips: GET /api/trips/kazakhstan - Status 200 (32ms)
  ...

════════════════════════════════════════════════════════════
                    AUDIT REPORT SUMMARY
════════════════════════════════════════════════════════════

📊 Overall Results:
────────────────────────────────────────
  Total Tests:  68
  ✓ Passed:     62
  ✗ Failed:     0
  ○ Skipped:    1
  ⚠ Warnings:   5
  📈 Pass Rate: 91.2%

💡 Recommendations:
────────────────────────────────────────
  ✅ All systems operational - no critical issues found
```

## Troubleshooting

### Database connection failed
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npm run db:migrate` to ensure tables exist

### API endpoints failing
- Ensure dev server is running: `npm run dev`
- Check server logs for errors
- Verify environment variables are set

### Tests timing out
- Increase `TIMEOUT_MS` in the validation script
- Check network connectivity
- Verify server is not overloaded

## Contributing

To add new tests:
1. Add endpoint to `API_ENDPOINTS` array in `validate-app.ts`
2. Add page route to `PAGE_ROUTES` array
3. Add new functionality tests as separate functions
4. Update this README

## License

Part of the StepperGO project.
