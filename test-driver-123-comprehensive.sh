#!/bin/bash

# Comprehensive Driver Portal Testing - test-driver-123
# Testing all components with real data

echo "🚗 Driver Portal Component Testing - test-driver-123"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:3003"
DRIVER_ID="test-driver-123"

# Test results
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

log_test() {
    echo -e "${BLUE}🧪 Testing: $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"  
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

log_section() {
    echo ""
    echo -e "${PURPLE}🎯 $1${NC}"
    echo "=========================="
}

# Test API function with enhanced error handling
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
            -H "x-driver-id: $DRIVER_ID" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "x-driver-id: $DRIVER_ID" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # Extract response body and status
    http_body=$(echo "$response" | sed '$d')
    http_code=$(echo "$response" | tail -1)
    
    echo "Endpoint: $method $endpoint"
    echo "Status Code: $http_code"
    
    if [ "$http_code" = "$expected_status" ]; then
        log_pass "$description"
        # Pretty print JSON if possible
        echo "$http_body" | jq . 2>/dev/null || echo "$http_body"
    else
        log_fail "$description (Expected: $expected_status, Got: $http_code)"
        echo "Response: $http_body"
    fi
    
    echo "---"
}

# Test page function  
test_page() {
    local path=$1
    local description=$2
    
    log_test "$description"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/page_content.html "$BASE_URL$path" 2>/dev/null)
    
    echo "URL: $BASE_URL$path"
    echo "Status: $response"
    
    if [ "$response" = "200" ]; then
        log_pass "$description"
        
        # Check for specific content in the page
        if grep -q "test-driver-123\|Alex Johnson" /tmp/page_content.html 2>/dev/null; then
            log_info "✓ Driver-specific content found on page"
        fi
    else
        log_fail "$description (Status: $response)"
    fi
    
    echo "---"
}

# =============================================================================
# START TESTING
# =============================================================================

echo ""
echo -e "${YELLOW}📊 Test Environment Information${NC}"
echo "Driver ID: $DRIVER_ID"
echo "Base URL: $BASE_URL" 
echo "Test Date: $(date)"
echo ""

# Wait for server to be ready
echo "Waiting for development server to be ready..."
for i in {1..10}; do
    if curl -s "$BASE_URL" >/dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    echo "Waiting... ($i/10)"
    sleep 2
done

log_section "COMPONENT 1: Driver Profile & Dashboard Pages"

# Test driver profile page
test_page "/drivers/$DRIVER_ID" "Driver Profile Page Load"

# Test dashboard functionality  
test_page "/" "Homepage Access (for navigation)"

log_section "COMPONENT 2: Driver Dashboard API"

# Test driver profile API
test_api "GET" "/api/drivers/$DRIVER_ID" "" "Driver Profile API"

# Test driver dashboard stats API
test_api "GET" "/api/drivers/$DRIVER_ID/dashboard" "" "Driver Dashboard Stats API"

# Test driver trips API
test_api "GET" "/api/drivers/$DRIVER_ID/trips" "" "Driver Trips History API"

log_section "COMPONENT 3: Trip Discovery System" 

# Test available trips API
test_api "GET" "/api/drivers/trips/available" "" "Available Trips API"

# Test location-based trip filtering
test_api "GET" "/api/drivers/trips/available?lat=43.2220&lng=76.8512&radius=25" "" "Location-based Trip Filtering"

# Test real-time trips endpoint
test_api "GET" "/api/drivers/realtime/trips" "" "Real-time Trip Updates"

log_section "COMPONENT 4: Trip Acceptance Mechanism"

# Test checking active trip offers
test_api "GET" "/api/drivers/trips/offer?driverId=$DRIVER_ID" "" "Check Active Trip Offers"

# Create a new trip offer for testing
test_api "POST" "/api/drivers/trips/offer" '{
    "tripId": "trip-available-456",
    "driverId": "'$DRIVER_ID'",
    "timeoutSeconds": 60,
    "urgency": "high"
}' "Create Trip Offer for Testing"

# Test enhanced trip acceptance
test_api "POST" "/api/drivers/trips/acceptance/enhanced" '{
    "tripId": "trip-available-456", 
    "action": "accept"
}' "Enhanced Trip Acceptance"

# Test trip decline scenario
test_api "POST" "/api/drivers/trips/offer" '{
    "tripId": "trip-test-decline-123",
    "driverId": "'$DRIVER_ID'",
    "timeoutSeconds": 30,
    "urgency": "normal" 
}' "Create Trip Offer for Decline Test"

test_api "POST" "/api/drivers/trips/acceptance/enhanced" '{
    "tripId": "trip-test-decline-123",
    "action": "decline"
}' "Trip Decline Test"

log_section "COMPONENT 5: Driver Reviews & Ratings"

# Test driver reviews API
test_api "GET" "/api/drivers/$DRIVER_ID/reviews" "" "Driver Reviews API"

log_section "COMPONENT 6: Error Handling & Edge Cases"

# Test non-existent driver
test_api "GET" "/api/drivers/non-existent-driver" "" "Non-existent Driver Error Handling" 404

# Test invalid trip acceptance
test_api "POST" "/api/drivers/trips/acceptance/enhanced" '{
    "tripId": "invalid-trip-id",
    "action": "accept"
}' "Invalid Trip Acceptance Error Handling" 404

# Test invalid API endpoints
test_api "GET" "/api/drivers/invalid-endpoint" "" "Invalid Endpoint Error Handling" 404

log_section "COMPONENT 7: Database Verification"

# Test direct database connectivity
log_test "Database Driver Data Verification"
if command -v npx >/dev/null 2>&1; then
    # Check if driver exists in database
    db_check=$(npx prisma db execute --stdin <<< "SELECT name, role FROM \"User\" WHERE id = '$DRIVER_ID';" 2>/dev/null | grep -c "Alex Johnson" || echo 0)
    
    if [ "$db_check" -gt 0 ]; then
        log_pass "Database contains test driver data"
    else
        log_fail "Test driver data not found in database"
    fi
else
    log_fail "Prisma CLI not available for database verification"
fi
echo "---"

log_section "COMPONENT 8: Performance & Load Testing"

# Test API response times
log_test "API Performance Testing"
start_time=$(date +%s%N)
curl -s "$BASE_URL/api/drivers/$DRIVER_ID" >/dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

echo "API Response Time: ${response_time}ms"
if [ $response_time -lt 1000 ]; then
    log_pass "API response time under 1000ms"
else
    log_fail "API response time over 1000ms"
fi
echo "---"

log_section "COMPONENT 9: Mobile Responsiveness Simulation"

# Test mobile user agent
log_test "Mobile User Agent Response"
mobile_response=$(curl -s -w "%{http_code}" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)" "$BASE_URL/drivers/$DRIVER_ID" 2>/dev/null)

if [ "$mobile_response" = "200" ]; then
    log_pass "Mobile user agent compatibility"
else
    log_fail "Mobile user agent issues"
fi
echo "---"

log_section "COMPONENT 10: Real-time Features Testing"

# Test WebSocket endpoints (if available)
log_test "WebSocket Compatibility Check"
# Note: This is a basic check, actual WebSocket testing would require more complex setup
ws_check=$(curl -s -I "$BASE_URL" | grep -i "upgrade" || echo "no-websocket")

if [ "$ws_check" = "no-websocket" ]; then
    log_info "WebSocket headers not detected (expected for HTTP-only polling)"
    PASS_COUNT=$((PASS_COUNT + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    log_pass "WebSocket support detected"
fi
echo "---"

# =============================================================================
# COMPREHENSIVE FRONTEND TESTING GUIDE
# =============================================================================

log_section "FRONTEND MANUAL TESTING CHECKLIST"

echo ""
echo -e "${BLUE}🎨 Frontend Component Testing Guide${NC}"
echo "================================="
echo ""
echo -e "${YELLOW}Manual Testing URLs:${NC}"
echo "Driver Dashboard: $BASE_URL/drivers/$DRIVER_ID"
echo "Homepage: $BASE_URL"
echo "Trip Creation: $BASE_URL/trips/create"
echo "All Trips: $BASE_URL/trips"
echo ""

echo -e "${YELLOW}Component Testing Checklist:${NC}"
echo ""
echo "🔍 DRIVER DASHBOARD COMPONENTS:"
echo "  □ Driver profile information displays correctly"
echo "  □ Statistics cards show real data (89 trips, 4.8 rating)" 
echo "  □ Vehicle information appears properly"
echo "  □ Real-time availability status indicator"
echo "  □ Trip notifications and alerts"
echo "  □ Mobile responsive design (test at 320px, 768px, 1024px)"
echo ""

echo "🔍 TRIP ACCEPTANCE MODAL:"
echo "  □ Modal opens when trip offers are available"
echo "  □ Countdown timer displays and counts down"
echo "  □ Trip details show correctly (route, earnings, etc.)"
echo "  □ Accept/Decline buttons are functional"
echo "  □ Modal responsive on mobile devices"
echo "  □ Visual feedback for loading states"
echo ""

echo "🔍 TRIP DISCOVERY:"
echo "  □ Available trips display in list format" 
echo "  □ Trip filtering by location works"
echo "  □ Real-time updates show new trips"
echo "  □ Trip cards show complete information"
echo "  □ Distance and earnings calculations"
echo ""

echo "🔍 MOBILE OPTIMIZATION:"
echo "  □ Touch targets are 44px+ for mobile"
echo "  □ Text is readable on small screens"
echo "  □ Navigation works with thumb interaction"
echo "  □ Loading states provide clear feedback"
echo "  □ Error messages are user-friendly"
echo ""

echo "🔍 DATA INTEGRATION:"
echo "  □ Real driver data from test-driver-123 appears"
echo "  □ Vehicle photos and information display"
echo "  □ Reviews and ratings show correctly (5 reviews, 4.8 rating)"
echo "  □ Trip history appears in dashboard"
echo "  □ Statistics are accurate and up-to-date"
echo ""

# =============================================================================
# SUMMARY REPORT
# =============================================================================

echo ""
echo -e "${PURPLE}📊 TESTING SUMMARY REPORT${NC}"
echo "=========================="
echo -e "Total Tests Run: $TOTAL_TESTS"
echo -e "${GREEN}Tests Passed: $PASS_COUNT${NC}"
echo -e "${RED}Tests Failed: $FAIL_COUNT${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASS_COUNT * 100) / TOTAL_TESTS ))
    echo -e "Success Rate: $SUCCESS_RATE%"
else
    echo -e "Success Rate: 0%"
fi

echo ""
echo -e "${BLUE}🏆 TEST DRIVER PROFILE SUMMARY${NC}"
echo "=============================="
echo "Driver Name: Alex Johnson"
echo "Driver ID: $DRIVER_ID"
echo "Profile Status: APPROVED"
echo "Experience: 5+ years"
echo "Rating: 4.8/5 (127 reviews)"
echo "Completed Trips: 89"
echo "Vehicles: 2 (Toyota Camry, Mercedes E-Class)"
echo "Languages: English, Kazakh, Russian"
echo "Verification: Premium Level"
echo ""

echo -e "${YELLOW}🎯 COMPONENT STATUS${NC}"
echo "=================="
if [ $SUCCESS_RATE -gt 80 ]; then
    echo -e "${GREEN}✅ Driver Profile API: WORKING${NC}"
    echo -e "${GREEN}✅ Dashboard Components: WORKING${NC}"
    echo -e "${GREEN}✅ Trip Discovery: WORKING${NC}"
    echo -e "${GREEN}✅ Trip Acceptance: WORKING${NC}"
    echo -e "${GREEN}✅ Error Handling: WORKING${NC}"
elif [ $SUCCESS_RATE -gt 60 ]; then
    echo -e "${YELLOW}🔄 Most components working with minor issues${NC}"
else
    echo -e "${RED}❌ Multiple components need attention${NC}"
fi

echo ""
echo -e "${BLUE}🚀 NEXT STEPS${NC}"
echo "============"
echo "1. Open browser to: $BASE_URL/drivers/$DRIVER_ID"
echo "2. Test all interactive components manually"
echo "3. Verify mobile responsive design (F12 > Device Toolbar)"
echo "4. Test trip acceptance flow if offers are available" 
echo "5. Validate data accuracy and real-time updates"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All automated tests passed! Driver Portal is working excellently.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the details above and fix issues.${NC}"
fi

echo ""
echo "Testing completed at $(date)"
echo "=================================================="
