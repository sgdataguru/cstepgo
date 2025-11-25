#!/bin/bash

# Test script for Passenger Track Driver feature
# Tests the real-time tracking API, WebSocket integration, and UI

set -e

echo "======================================"
echo "Testing Passenger Track Driver Feature"
echo "======================================"

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to print section header
print_section() {
    echo ""
    echo "======================================"
    echo "$1"
    echo "======================================"
}

# Check if server is running
echo "Checking if server is running at $BASE_URL..."
if curl -s -f "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}Server is running${NC}"
else
    echo -e "${RED}Server is not running. Please start the server first.${NC}"
    exit 1
fi

# Test 1: Passenger Login
print_section "Test 1: Passenger Authentication"

PASSENGER_EMAIL="test-passenger@example.com"
PASSENGER_PASSWORD="password123"

echo "Logging in as passenger: $PASSENGER_EMAIL"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PASSENGER_EMAIL\",\"password\":\"$PASSENGER_PASSWORD\"}")

PASSENGER_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$PASSENGER_TOKEN" ]; then
    print_result 0 "Passenger login successful"
    echo "Token: ${PASSENGER_TOKEN:0:20}..."
else
    print_result 1 "Passenger login failed"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 2: Get Passenger Bookings
print_section "Test 2: Fetch Active Bookings"

if [ -n "$PASSENGER_TOKEN" ]; then
    BOOKINGS_RESPONSE=$(curl -s -X GET "$API_URL/passengers/bookings" \
        -H "Authorization: Bearer $PASSENGER_TOKEN")
    
    echo "Bookings Response: $BOOKINGS_RESPONSE"
    
    BOOKING_ID=$(echo $BOOKINGS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$BOOKING_ID" ]; then
        print_result 0 "Retrieved active bookings"
        echo "Booking ID: $BOOKING_ID"
    else
        print_result 1 "No active bookings found"
        echo "Note: Create a booking first to test tracking"
    fi
fi

# Test 3: Test Tracking API Endpoint
print_section "Test 3: Track Driver API Endpoint"

if [ -n "$PASSENGER_TOKEN" ] && [ -n "$BOOKING_ID" ]; then
    echo "Testing tracking endpoint for booking: $BOOKING_ID"
    
    TRACKING_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        "$API_URL/passengers/bookings/$BOOKING_ID/track" \
        -H "Authorization: Bearer $PASSENGER_TOKEN")
    
    HTTP_CODE=$(echo "$TRACKING_RESPONSE" | tail -n1)
    TRACKING_DATA=$(echo "$TRACKING_RESPONSE" | head -n-1)
    
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $TRACKING_DATA"
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Track driver API endpoint accessible"
        
        # Check if response has required fields
        if echo "$TRACKING_DATA" | grep -q "canTrack"; then
            print_result 0 "Response contains canTrack field"
        else
            print_result 1 "Response missing canTrack field"
        fi
        
        if echo "$TRACKING_DATA" | grep -q "trip"; then
            print_result 0 "Response contains trip information"
        else
            print_result 1 "Response missing trip information"
        fi
        
        CAN_TRACK=$(echo "$TRACKING_DATA" | grep -o '"canTrack":[^,}]*' | cut -d':' -f2)
        
        if [ "$CAN_TRACK" = "true" ]; then
            echo -e "${GREEN}✓${NC} Tracking is enabled for this booking"
            
            # Check driver location if available
            if echo "$TRACKING_DATA" | grep -q "driverLocation"; then
                print_result 0 "Driver location available"
            else
                echo -e "${YELLOW}⚠${NC} Driver location not yet available"
            fi
            
            # Check ETA if available
            if echo "$TRACKING_DATA" | grep -q "eta"; then
                print_result 0 "ETA information available"
            else
                echo -e "${YELLOW}⚠${NC} ETA not yet available"
            fi
        else
            echo -e "${YELLOW}⚠${NC} Tracking not enabled (trip may not have started yet)"
        fi
    else
        print_result 1 "Track driver API returned error code: $HTTP_CODE"
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipping tracking API test (no booking available)"
fi

# Test 4: Unauthorized Access Check
print_section "Test 4: Authorization Security Test"

if [ -n "$BOOKING_ID" ]; then
    echo "Testing unauthorized access to tracking endpoint..."
    
    UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        "$API_URL/passengers/bookings/$BOOKING_ID/track")
    
    UNAUTH_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
    
    if [ "$UNAUTH_CODE" = "401" ]; then
        print_result 0 "Unauthorized access properly blocked"
    else
        print_result 1 "Unauthorized access not properly blocked (code: $UNAUTH_CODE)"
    fi
fi

# Test 5: WebSocket Connection Test
print_section "Test 5: WebSocket Infrastructure"

# Check if Socket.IO endpoint exists
SOCKET_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/socket.io/")

if [ "$SOCKET_CHECK" = "200" ] || [ "$SOCKET_CHECK" = "400" ]; then
    print_result 0 "WebSocket server endpoint accessible"
else
    print_result 1 "WebSocket server endpoint not accessible (code: $SOCKET_CHECK)"
fi

# Test 6: Frontend Page Accessibility
print_section "Test 6: Frontend Pages"

if [ -n "$BOOKING_ID" ]; then
    TRACK_PAGE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/my-trips/$BOOKING_ID/track")
    
    if [ "$TRACK_PAGE_CHECK" = "200" ]; then
        print_result 0 "Track driver page accessible"
    else
        print_result 1 "Track driver page not accessible (code: $TRACK_PAGE_CHECK)"
    fi
fi

BOOKINGS_PAGE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/my-trips")

if [ "$BOOKINGS_PAGE_CHECK" = "200" ]; then
    print_result 0 "My trips page accessible"
else
    print_result 1 "My trips page not accessible (code: $BOOKINGS_PAGE_CHECK)"
fi

# Test Summary
print_section "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
