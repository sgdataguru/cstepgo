# Driver Availability Management - Testing Guide

## Manual Testing Checklist

### Prerequisites
- Local development environment running
- Database migrated with latest schema
- At least one approved driver account
- Admin account for admin testing

## Quick Test Scenarios

### 1. Availability Status Toggle

✅ **Go Online**: Click "Go Online" → Verify green status indicator
✅ **Go Busy**: Click "Busy" → Verify yellow status indicator  
✅ **Go Offline**: Click "Go Offline" → Verify gray status indicator
✅ **Persistence**: Refresh page → Verify status persists

### 2. Availability Preferences

✅ **Service Radius**: Adjust slider → Verify value saves → Refresh → Verify persists
✅ **Trip Types**: Toggle checkboxes → Verify saves → Test trip matching

### 3. Break Scheduling

✅ **Create Schedule**: Add break → Verify appears in list
✅ **Active Schedule**: Create schedule starting now → Verify status changes to BUSY
✅ **Expired Schedule**: Wait for end time → Verify status returns to AVAILABLE
✅ **Delete Schedule**: Delete active schedule → Verify status updates

### 4. Auto-Offline

✅ **Inactivity**: Go online → Wait until `autoOfflineMinutes` (default: 120 min / 2 hours) → Trigger cron → Verify offline
✅ **Heartbeat**: Go online → Keep portal tab open → Verify heartbeat refreshes `lastActivityAt` every 5 minutes
✅ **Custom Timeout**: Set custom `autoOfflineMinutes` (60-240 min range) → Verify timeout applies correctly

### 5. Admin Monitoring

✅ **Dashboard**: View statistics → Filter by status → View recent changes

## API Testing

```bash
# Get availability
curl -X GET http://localhost:3000/api/drivers/availability \
  -H "x-driver-id: <driver-id>"

# Update status
curl -X PUT http://localhost:3000/api/drivers/availability \
  -H "x-driver-id: <driver-id>" \
  -H "Content-Type: application/json" \
  -d '{"availability": "AVAILABLE", "serviceRadiusKm": 50}'

# Create schedule
curl -X POST http://localhost:3000/api/drivers/availability/schedule \
  -H "x-driver-id: <driver-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2024-11-23T12:00:00Z",
    "endTime": "2024-11-23T13:00:00Z",
    "scheduleType": "break",
    "reason": "Lunch"
  }'

# Trigger cron job
curl http://localhost:3000/api/cron/availability
```

## Database Verification

```sql
-- Verify new tables
SELECT * FROM driver_availability_schedules LIMIT 5;
SELECT * FROM driver_availability_history LIMIT 5;

-- Check availability distribution
SELECT availability, COUNT(*) 
FROM "Driver" 
WHERE status = 'APPROVED' 
GROUP BY availability;
```

## Expected Results

All tests should pass with:
- ✅ Status changes reflected immediately
- ✅ Preferences saved and persisted
- ✅ Schedules activate/deactivate automatically
- ✅ History entries created for all changes
- ✅ Admin dashboard shows accurate data
- ✅ No errors in console/logs

See full testing documentation for detailed test cases and edge case testing.
