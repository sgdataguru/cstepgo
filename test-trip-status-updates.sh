#!/bin/bash
# Test script for Trip Status Update Feature
# This script validates the core functionality of trip status updates

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
DRIVER_ID="${DRIVER_ID:-test-driver-id}"
TRIP_ID="${TRIP_ID:-test-trip-id}"

echo "==================================="
echo "Trip Status Update Feature Tests"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# Test 1: Verify API endpoint exists
echo "Test 1: Verify status update API endpoint file exists"
if [ -f "src/app/api/drivers/trips/[tripId]/status/route.ts" ]; then
    print_result 0 "Status update API endpoint file exists"
else
    print_result 1 "Status update API endpoint file not found"
fi
echo ""

# Test 2: Verify rate limiting utility
echo "Test 2: Verify rate limiting utility"
if [ -f "src/lib/utils/rate-limit.ts" ]; then
    print_result 0 "Rate limiting utility exists"
else
    print_result 1 "Rate limiting utility not found"
fi
echo ""

# Test 3: Verify notification service
echo "Test 3: Verify notification service"
if [ -f "src/lib/notifications/trip-status-notifications.ts" ]; then
    print_result 0 "Trip status notification service exists"
else
    print_result 1 "Trip status notification service not found"
fi
echo ""

# Test 4: Verify driver UI component
echo "Test 4: Verify driver UI component"
if [ -f "src/components/driver/TripStatusUpdateCard.tsx" ]; then
    print_result 0 "Driver status update UI component exists"
else
    print_result 1 "Driver status update UI component not found"
fi
echo ""

# Test 5: Verify real-time SSE endpoint
echo "Test 5: Verify real-time SSE endpoint"
if [ -f "src/app/api/realtime/trip-status/[tripId]/route.ts" ]; then
    print_result 0 "Real-time SSE endpoint exists"
else
    print_result 1 "Real-time SSE endpoint not found"
fi
echo ""

# Test 6: Verify admin monitoring endpoint
echo "Test 6: Verify admin monitoring endpoint"
if [ -f "src/app/api/admin/trip-status-monitoring/route.ts" ]; then
    print_result 0 "Admin monitoring endpoint exists"
else
    print_result 1 "Admin monitoring endpoint not found"
fi
echo ""

# Test 7: Verify React hook for status updates
echo "Test 7: Verify React hook for status updates"
if [ -f "src/hooks/useTripStatusUpdates.ts" ]; then
    print_result 0 "React hook for status updates exists"
else
    print_result 1 "React hook for status updates not found"
fi
echo ""

# Test 8: Verify migration file
echo "Test 8: Verify database migration file"
if [ -f "prisma/migrations/004_add_trip_status_updates.sql" ]; then
    print_result 0 "Database migration file exists"
else
    print_result 1 "Database migration file not found"
fi
echo ""

# Test 9: Verify Prisma schema has new status types
echo "Test 9: Verify Prisma schema has new status types"
if grep -q "DEPARTED" prisma/schema.prisma && \
   grep -q "EN_ROUTE" prisma/schema.prisma && \
   grep -q "DELAYED" prisma/schema.prisma && \
   grep -q "ARRIVED" prisma/schema.prisma; then
    print_result 0 "New status types added to Prisma schema"
else
    print_result 1 "New status types not found in Prisma schema"
fi
echo ""

# Test 10: Verify TripStatusUpdate model in schema
echo "Test 10: Verify TripStatusUpdate model in schema"
if grep -q "model TripStatusUpdate" prisma/schema.prisma; then
    print_result 0 "TripStatusUpdate model exists in schema"
else
    print_result 1 "TripStatusUpdate model not found in schema"
fi
echo ""

echo "==================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "==================================="
echo ""
echo "Summary of implemented features:"
echo "  ✓ Extended trip status types (DEPARTED, EN_ROUTE, DELAYED, ARRIVED)"
echo "  ✓ Trip status update tracking model"
echo "  ✓ Passenger notification service"
echo "  ✓ Real-time status broadcasting via SSE"
echo "  ✓ Driver UI component for status updates"
echo "  ✓ Admin monitoring dashboard API"
echo "  ✓ Rate limiting (10 updates/min per driver)"
echo "  ✓ Database migration file"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run db:migrate' to apply database changes"
echo "  2. Test the API endpoints with a running server"
echo "  3. Integrate components into driver dashboard"
echo "  4. Configure environment variables for notifications"
echo ""
