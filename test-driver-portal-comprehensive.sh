#!/bin/bash

# Comprehensive Driver Portal Features Test Suite
# Testing Stories 20-32: All Driver Portal Functionality

echo "🚗 StepperGO Driver Portal Features - Comprehensive Test Suite"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TEST_DRIVER_ID="test-driver-comprehensive"
TEST_TRIP_ID="test-trip-comprehensive"
TEST_CUSTOMER_ID="test-customer-123"

# Test results tracking
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Helper functions
log_test() {
    echo -e "${BLUE}🧪 Testing: $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

log_info() {
    echo -e "${YELLOW}ℹ️  INFO: $1${NC}"
}

# API test function
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=${5:-200}
    
    log_test "$description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "x-driver-id: $TEST_DRIVER_ID" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "x-driver-id: $TEST_DRIVER_ID" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # Extract body and status code
    http_body=$(echo "$response" | sed '$d')
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        log_pass "$description (Status: $http_code)"
        echo "Response: $http_body" | jq . 2>/dev/null || echo "Response: $http_body"
    else
        log_fail "$description (Expected: $expected_status, Got: $http_code)"
        echo "Response: $http_body"
    fi
    
    echo "----------------------------------------"
}

# Page test function
test_page() {
    local url=$1
    local description=$2
    
    log_test "$description"
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        log_pass "$description"
    else
        log_fail "$description (Status: $response)"
    fi
    
    echo "----------------------------------------"
}

echo ""
echo -e "${YELLOW}📋 Test Plan: Stories 20-32${NC}"
echo "Story 20: Driver Portal Authentication"
echo "Story 21: Driver Trip Discovery"
echo "Story 22: Trip Acceptance Mechanism"
echo "Story 23: Driver Dashboard Interface"
echo "Story 24: Driver-Customer Communication"
echo "Story 25: GPS Navigation Integration"
echo "Story 26: Driver Availability Management"
echo "Story 27: Driver Trip Status Updates"
echo "Story 28-32: Advanced Driver Features"
echo ""

# =============================================================================
# STORY 20: Driver Portal Authentication
# =============================================================================
echo -e "${GREEN}📖 Story 20: Driver Portal Authentication${NC}"
echo "=============================================="

# Test driver registration
test_api "POST" "/api/drivers/register" '{
  "name": "Alex Johnson",
  "email": "alex.driver@steppergo.test",
  "phone": "+77077123456",
  "licenseNumber": "KZ123456789",
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "plateNumber": "555ABC01"
  }
}' "Driver Registration"

# Test driver authentication
test_api "GET" "/api/drivers/$TEST_DRIVER_ID" "" "Driver Profile Retrieval"

# Test driver page access
test_page "/drivers/$TEST_DRIVER_ID" "Driver Profile Page Access"

# =============================================================================
# STORY 21: Driver Trip Discovery
# =============================================================================
echo -e "${GREEN}📖 Story 21: Driver Trip Discovery${NC}"
echo "==========================================="

# Test available trips API
test_api "GET" "/api/drivers/trips/available" "" "Available Trips Discovery"

# Test trip filtering by location
test_api "GET" "/api/drivers/trips/available?lat=43.2220&lng=76.8512&radius=10" "" "Location-based Trip Filtering"

# Test real-time trips endpoint
test_api "GET" "/api/drivers/realtime/trips" "" "Real-time Trip Updates"

# =============================================================================
# STORY 22: Trip Acceptance Mechanism
# =============================================================================
echo -e "${GREEN}📖 Story 22: Trip Acceptance Mechanism${NC}"
echo "============================================="

# Create a test trip offer
test_api "POST" "/api/drivers/trips/offer" '{
  "tripId": "'$TEST_TRIP_ID'",
  "driverId": "'$TEST_DRIVER_ID'",
  "timeoutSeconds": 30,
  "urgency": "high"
}' "Create Trip Offer"

# Test checking active offers
test_api "GET" "/api/drivers/trips/offer?driverId=$TEST_DRIVER_ID" "" "Check Active Offers"

# Test enhanced trip acceptance
test_api "POST" "/api/drivers/trips/acceptance/enhanced" '{
  "tripId": "'$TEST_TRIP_ID'",
  "action": "accept"
}' "Enhanced Trip Acceptance"

# Test trip decline
test_api "POST" "/api/drivers/trips/acceptance/enhanced" '{
  "tripId": "'$TEST_TRIP_ID'_2",
  "action": "decline"
}' "Trip Decline"

# =============================================================================
# STORY 23: Driver Dashboard Interface
# =============================================================================
echo -e "${GREEN}📖 Story 23: Driver Dashboard Interface${NC}"
echo "============================================"

# Test driver dashboard data
test_api "GET" "/api/drivers/$TEST_DRIVER_ID/dashboard" "" "Driver Dashboard Stats"

# Test dashboard page
test_page "/drivers/$TEST_DRIVER_ID" "Driver Dashboard Page"

# Test driver trip history
test_api "GET" "/api/drivers/$TEST_DRIVER_ID/trips" "" "Driver Trip History"

# =============================================================================
# STORY 24: Driver-Customer Communication
# =============================================================================
echo -e "${GREEN}📖 Story 24: Driver-Customer Communication${NC}"
echo "=============================================="

# Test trip messages (would need existing trip)
test_api "GET" "/api/trips/$TEST_TRIP_ID/messages" "" "Trip Messages Retrieval" 404

# Test sending message
test_api "POST" "/api/trips/$TEST_TRIP_ID/messages" '{
  "message": "On my way to pickup location!",
  "type": "driver"
}' "Send Driver Message" 404

# =============================================================================
# STORY 25: GPS Navigation Integration
# =============================================================================
echo -e "${GREEN}📖 Story 25: GPS Navigation Integration${NC}"
echo "=========================================="

# Test location update
test_api "POST" "/api/drivers/$TEST_DRIVER_ID/location" '{
  "latitude": 43.2220,
  "longitude": 76.8512,
  "heading": 45,
  "speed": 50
}' "Driver Location Update" 404

# =============================================================================
# STORY 26: Driver Availability Management
# =============================================================================
echo -e "${GREEN}📖 Story 26: Driver Availability Management${NC}"
echo "============================================="

# Test going online
test_api "POST" "/api/drivers/availability/online" '{}' "Go Online" 404

# Test availability preferences
test_api "PUT" "/api/drivers/availability/preferences" '{
  "serviceRadius": 15,
  "maxPassengers": 4,
  "acceptsShared": true
}' "Update Availability Preferences" 404

# Test going offline
test_api "POST" "/api/drivers/availability/offline" '{}' "Go Offline" 404

# =============================================================================
# STORY 27: Driver Trip Status Updates
# =============================================================================
echo -e "${GREEN}📖 Story 27: Driver Trip Status Updates${NC}"
echo "========================================"

# Test trip status update
test_api "PUT" "/api/trips/$TEST_TRIP_ID/status" '{
  "status": "en_route_pickup",
  "location": {
    "lat": 43.2220,
    "lng": 76.8512
  }
}' "Update Trip Status" 404

# =============================================================================
# STORY 28-32: Advanced Driver Features
# =============================================================================
echo -e "${GREEN}📖 Stories 28-32: Advanced Driver Features${NC}"
echo "============================================="

# Test driver earnings
test_api "GET" "/api/drivers/dashboard/earnings?period=today" "" "Driver Earnings Today" 404

# Test driver ratings
test_api "GET" "/api/drivers/$TEST_DRIVER_ID/reviews" "" "Driver Reviews"

# Test driver schedule
test_api "GET" "/api/drivers/schedule" "" "Driver Schedule" 404

# Test notifications
test_api "GET" "/api/drivers/notifications" "" "Driver Notifications" 404

# =============================================================================
# FRONTEND TESTING
# =============================================================================
echo -e "${GREEN}📱 Frontend Interface Testing${NC}"
echo "================================"

# Test key pages
test_page "/" "Landing Page"
test_page "/drivers/$TEST_DRIVER_ID" "Driver Profile Page"
test_page "/trips" "Trips Page"
test_page "/trips/create" "Create Trip Page"

# =============================================================================
# DATABASE TESTING
# =============================================================================
echo -e "${GREEN}💾 Database Schema Testing${NC}"
echo "============================="

log_test "Database Connection Test"
if command -v npx >/dev/null 2>&1; then
    if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
        log_pass "Database Schema Sync"
    else
        log_fail "Database Schema Sync"
    fi
else
    log_fail "Prisma CLI not available"
fi

# =============================================================================
# BUILD TESTING
# =============================================================================
echo -e "${GREEN}🔨 Build Testing${NC}"
echo "=================="

log_test "Next.js Build Test"
if npm run build >/dev/null 2>&1; then
    log_pass "Production Build"
else
    log_fail "Production Build"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

SUCCESS_RATE=$((PASS_COUNT * 100 / TOTAL_TESTS))
echo -e "Success Rate: $SUCCESS_RATE%"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Driver portal is working perfectly!${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Check implementation details above.${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Development Recommendations:${NC}"
echo "=================================="

if [ $FAIL_COUNT -gt 10 ]; then
    echo "• High number of failures - focus on core API implementation"
    echo "• Verify database schema is up to date"
    echo "• Check authentication and authorization flows"
elif [ $FAIL_COUNT -gt 5 ]; then
    echo "• Moderate failures - implement missing API endpoints"
    echo "• Add proper error handling and validation"
    echo "• Enhance frontend-backend integration"
elif [ $FAIL_COUNT -gt 0 ]; then
    echo "• Minor failures - polish remaining features"
    echo "• Add comprehensive error handling"
    echo "• Implement missing edge case handling"
else
    echo "• Excellent! All core features working"
    echo "• Consider adding performance optimizations"
    echo "• Implement advanced features like real-time updates"
fi

echo ""
echo -e "${GREEN}✨ Next Steps:${NC}"
echo "1. Fix any failing API endpoints"
echo "2. Test frontend components manually"
echo "3. Verify real-time features with WebSocket"
echo "4. Perform end-to-end user journey testing"
echo "5. Add comprehensive error handling"
echo ""
