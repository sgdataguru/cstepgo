#!/bin/bash

# Gate 1 MVP Test Script
# Tests all core functionality end-to-end

set -e  # Exit on error

echo "🧪 Starting Gate 1 MVP Tests..."
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Wait for server to be ready
wait_for_server() {
    info "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/trips > /dev/null 2>&1; then
            pass "Server is ready"
            return 0
        fi
        sleep 1
    done
    fail "Server failed to start"
    exit 1
}

echo "Test 1: API Endpoints"
echo "---------------------"

# Test 1.1: GET /api/trips
info "Testing GET /api/trips..."
RESPONSE=$(curl -s http://localhost:3000/api/trips)
if echo "$RESPONSE" | grep -q '"success":true'; then
    pass "GET /api/trips returns success"
    
    # Check if trips are returned
    if echo "$RESPONSE" | grep -q '"data":\['; then
        pass "GET /api/trips returns data array"
        
        # Count trips
        TRIP_COUNT=$(echo "$RESPONSE" | grep -o '"id":"' | wc -l)
        info "Found $TRIP_COUNT trips in database"
    else
        fail "GET /api/trips missing data array"
    fi
else
    fail "GET /api/trips failed"
    echo "$RESPONSE"
fi

# Test 1.2: GET /api/trips with filters
info "Testing GET /api/trips with origin filter..."
RESPONSE=$(curl -s "http://localhost:3000/api/trips?origin=Almaty")
if echo "$RESPONSE" | grep -q '"success":true'; then
    pass "GET /api/trips with origin filter works"
else
    fail "GET /api/trips with origin filter failed"
fi

# Test 1.3: POST /api/trips (Create trip)
info "Testing POST /api/trips..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Trip - Automated",
    "description": "This is a test trip created by automation",
    "origin": "Test City A",
    "destination": "Test City B",
    "departureDate": "2025-11-10T08:00:00Z",
    "departureTime": "08:00",
    "returnDate": "2025-11-10T20:00:00Z",
    "returnTime": "20:00",
    "totalSeats": 4,
    "basePrice": 5000,
    "vehicleType": "sedan"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    pass "POST /api/trips successfully creates trip"
    
    # Extract trip ID
    TRIP_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    info "Created trip with ID: $TRIP_ID"
    
    # Test 1.4: GET /api/trips/[id]
    if [ ! -z "$TRIP_ID" ]; then
        info "Testing GET /api/trips/$TRIP_ID..."
        DETAIL_RESPONSE=$(curl -s "http://localhost:3000/api/trips/$TRIP_ID")
        if echo "$DETAIL_RESPONSE" | grep -q '"success":true'; then
            pass "GET /api/trips/[id] returns trip details"
        else
            fail "GET /api/trips/[id] failed"
        fi
        
        # Test 1.5: PATCH /api/trips/[id] (Publish)
        info "Testing PATCH /api/trips/$TRIP_ID (publish)..."
        PUBLISH_RESPONSE=$(curl -s -X PATCH "http://localhost:3000/api/trips/$TRIP_ID" \
          -H "Content-Type: application/json" \
          -d '{"action": "publish"}')
        if echo "$PUBLISH_RESPONSE" | grep -q '"success":true'; then
            pass "PATCH /api/trips/[id] successfully publishes trip"
        else
            fail "PATCH /api/trips/[id] publish failed"
        fi
        
        # Test 1.6: DELETE /api/trips/[id]
        info "Testing DELETE /api/trips/$TRIP_ID..."
        DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/trips/$TRIP_ID")
        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            pass "DELETE /api/trips/[id] successfully deletes trip"
        else
            fail "DELETE /api/trips/[id] failed"
        fi
    fi
else
    fail "POST /api/trips failed to create trip"
    echo "$CREATE_RESPONSE"
fi

echo ""
echo "Test 2: Database Integration"
echo "----------------------------"

# Check if database has seed data
info "Checking database seed data..."
DB_RESPONSE=$(curl -s http://localhost:3000/api/trips)
TRIP_COUNT=$(echo "$DB_RESPONSE" | grep -o '"id":"' | wc -l)

if [ "$TRIP_COUNT" -gt 0 ]; then
    pass "Database contains $TRIP_COUNT trips"
else
    fail "Database is empty - seed data may not have loaded"
fi

echo ""
echo "Test 3: Frontend Compilation"
echo "-----------------------------"

# Check if TypeScript files compile without errors
info "Checking for TypeScript errors..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    fail "TypeScript compilation has errors"
else
    pass "TypeScript compiles without errors"
fi

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Gate 1 MVP is ready for demo!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
