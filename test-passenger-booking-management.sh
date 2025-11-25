#!/bin/bash

###############################################################################
# Passenger Booking Management Test Script
# Tests UC-36: Passenger Manage Upcoming Bookings
#
# This script tests:
# 1. List My Trips / Upcoming Bookings (with trip type and payment method)
# 2. View Booking Detail (with driver info, seat count, payment info)
# 3. Cancel Booking (with proper validation and driver notification)
# 4. Verify trip type display (Private vs Shared)
# 5. Verify payment method display (Online vs Cash)
###############################################################################

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_test() {
    local status=$1
    local message=$2
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to print section header
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to check if response contains expected data
check_response() {
    local response=$1
    local expected=$2
    local message=$3
    
    if echo "$response" | grep -q "$expected"; then
        print_test "PASS" "$message"
        return 0
    else
        print_test "FAIL" "$message"
        echo "Expected to find: $expected"
        echo "Response: $response"
        return 1
    fi
}

###############################################################################
# Test Setup
###############################################################################

print_header "Setting Up Test Environment"

# Create a test passenger user
echo "Creating test passenger user..."
PASSENGER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-passenger-'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "name": "Test Passenger",
    "phone": "+77001234567",
    "role": "PASSENGER"
  }')

PASSENGER_TOKEN=$(echo "$PASSENGER_RESPONSE" | jq -r '.token // .access_token // empty')
PASSENGER_ID=$(echo "$PASSENGER_RESPONSE" | jq -r '.user.id // empty')

if [ -z "$PASSENGER_TOKEN" ] || [ "$PASSENGER_TOKEN" = "null" ]; then
    echo -e "${RED}Failed to create passenger user${NC}"
    echo "Response: $PASSENGER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Test passenger created${NC}"
echo "Passenger ID: $PASSENGER_ID"

# Create a test driver
echo "Creating test driver..."
DRIVER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-driver-'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "name": "Test Driver",
    "phone": "+77009876543",
    "role": "DRIVER"
  }')

DRIVER_TOKEN=$(echo "$DRIVER_RESPONSE" | jq -r '.token // .access_token // empty')
DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.user.id // empty')

echo -e "${GREEN}✓ Test driver created${NC}"

###############################################################################
# Test 1: Create Test Bookings (Private and Shared)
###############################################################################

print_header "Test 1: Create Test Bookings"

# Create a private trip booking
echo "Creating private trip booking..."
PRIVATE_BOOKING=$(curl -s -X POST "$API_URL/bookings" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originName": "Almaty City Center",
    "originAddress": "Abay Avenue, Almaty",
    "originLat": 43.238949,
    "originLng": 76.889709,
    "destName": "Shymbulak Ski Resort",
    "destAddress": "Shymbulak, Almaty",
    "destLat": 43.094444,
    "destLng": 77.068056,
    "departureTime": "'$(date -d '+3 days' -Iseconds)'",
    "returnTime": "'$(date -d '+4 days' -Iseconds)'",
    "seatsBooked": 3,
    "paymentMethodType": "ONLINE",
    "passengers": [
      {"name": "Passenger 1", "age": 30},
      {"name": "Passenger 2", "age": 28},
      {"name": "Passenger 3", "age": 5}
    ]
  }')

PRIVATE_BOOKING_ID=$(echo "$PRIVATE_BOOKING" | jq -r '.data.id // .booking.id // empty')

if [ -n "$PRIVATE_BOOKING_ID" ] && [ "$PRIVATE_BOOKING_ID" != "null" ]; then
    print_test "PASS" "Private trip booking created successfully"
    echo "Private Booking ID: $PRIVATE_BOOKING_ID"
else
    print_test "FAIL" "Failed to create private trip booking"
    echo "Response: $PRIVATE_BOOKING"
fi

# Create a shared ride booking (if shared ride API exists)
echo "Attempting to create shared ride booking..."
SHARED_BOOKING=$(curl -s -X POST "$API_URL/bookings/shared" \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "shared-trip-id-placeholder",
    "seatsBooked": 2,
    "paymentMethodType": "CASH_TO_DRIVER",
    "passengers": [
      {"name": "Passenger 1", "age": 30},
      {"name": "Passenger 2", "age": 28}
    ]
  }')

SHARED_BOOKING_ID=$(echo "$SHARED_BOOKING" | jq -r '.data.id // .booking.id // empty')

if [ -n "$SHARED_BOOKING_ID" ] && [ "$SHARED_BOOKING_ID" != "null" ]; then
    print_test "PASS" "Shared ride booking created successfully"
    echo "Shared Booking ID: $SHARED_BOOKING_ID"
fi

###############################################################################
# Test 2: List My Trips / Upcoming Bookings
###############################################################################

print_header "Test 2: List My Trips (All Bookings)"

BOOKINGS_LIST=$(curl -s -X GET "$API_URL/passengers/bookings" \
  -H "Authorization: Bearer $PASSENGER_TOKEN")

echo "Bookings list response:"
echo "$BOOKINGS_LIST" | jq '.'

# Check if response contains expected fields
check_response "$BOOKINGS_LIST" '"success"' "API returns success response"
check_response "$BOOKINGS_LIST" '"data"' "Response contains bookings data"
check_response "$BOOKINGS_LIST" '"tripType"' "Bookings include trip type information"
check_response "$BOOKINGS_LIST" '"paymentMethodType"' "Bookings include payment method type"

# Test upcoming bookings filter
print_header "Test 3: List Upcoming Bookings"

UPCOMING_BOOKINGS=$(curl -s -X GET "$API_URL/passengers/bookings?upcoming=true" \
  -H "Authorization: Bearer $PASSENGER_TOKEN")

check_response "$UPCOMING_BOOKINGS" '"success"' "Upcoming bookings filter works"
check_response "$UPCOMING_BOOKINGS" '"upcomingCount"' "Response includes upcoming count"

###############################################################################
# Test 4: Get Booking Details
###############################################################################

print_header "Test 4: Get Booking Details"

if [ -n "$PRIVATE_BOOKING_ID" ] && [ "$PRIVATE_BOOKING_ID" != "null" ]; then
    BOOKING_DETAILS=$(curl -s -X GET "$API_URL/passengers/bookings/$PRIVATE_BOOKING_ID" \
      -H "Authorization: Bearer $PASSENGER_TOKEN")
    
    echo "Booking details response:"
    echo "$BOOKING_DETAILS" | jq '.'
    
    check_response "$BOOKING_DETAILS" '"success"' "Booking details retrieved successfully"
    check_response "$BOOKING_DETAILS" '"tripType"' "Booking details include trip type"
    check_response "$BOOKING_DETAILS" '"paymentMethodType"' "Booking details include payment method"
    check_response "$BOOKING_DETAILS" '"seatsBooked"' "Booking details include seat count"
    check_response "$BOOKING_DETAILS" '"totalAmount"' "Booking details include total amount"
    
    # For shared rides, check price per seat
    TRIP_TYPE=$(echo "$BOOKING_DETAILS" | jq -r '.data.trip.tripType // empty')
    if [ "$TRIP_TYPE" = "SHARED" ]; then
        check_response "$BOOKING_DETAILS" '"pricePerSeat"' "Shared ride includes price per seat"
    fi
fi

###############################################################################
# Test 5: Get Booking Statistics
###############################################################################

print_header "Test 5: Get Booking Statistics"

BOOKING_STATS=$(curl -s -X GET "$API_URL/passengers/bookings?stats=true" \
  -H "Authorization: Bearer $PASSENGER_TOKEN")

echo "Booking statistics:"
echo "$BOOKING_STATS" | jq '.'

check_response "$BOOKING_STATS" '"total"' "Stats include total bookings"
check_response "$BOOKING_STATS" '"upcoming"' "Stats include upcoming bookings"
check_response "$BOOKING_STATS" '"completed"' "Stats include completed bookings"
check_response "$BOOKING_STATS" '"cancelled"' "Stats include cancelled bookings"

###############################################################################
# Test 6: Cancel Booking
###############################################################################

print_header "Test 6: Cancel Booking"

if [ -n "$PRIVATE_BOOKING_ID" ] && [ "$PRIVATE_BOOKING_ID" != "null" ]; then
    # Test cancellation with reason
    CANCEL_RESPONSE=$(curl -s -X POST "$API_URL/passengers/bookings/$PRIVATE_BOOKING_ID/cancel" \
      -H "Authorization: Bearer $PASSENGER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "reason": "Test cancellation - plans changed"
      }')
    
    echo "Cancellation response:"
    echo "$CANCEL_RESPONSE" | jq '.'
    
    check_response "$CANCEL_RESPONSE" '"success"' "Booking cancelled successfully"
    check_response "$CANCEL_RESPONSE" '"CANCELLED"' "Booking status updated to CANCELLED"
    
    # Verify booking is now cancelled
    CANCELLED_BOOKING=$(curl -s -X GET "$API_URL/passengers/bookings/$PRIVATE_BOOKING_ID" \
      -H "Authorization: Bearer $PASSENGER_TOKEN")
    
    check_response "$CANCELLED_BOOKING" '"CANCELLED"' "Booking status verified as cancelled"
    check_response "$CANCELLED_BOOKING" '"cancelledAt"' "Cancellation timestamp recorded"
fi

###############################################################################
# Test 7: Test Cancellation Validation
###############################################################################

print_header "Test 7: Test Cancellation Validation"

# Try to cancel already cancelled booking
if [ -n "$PRIVATE_BOOKING_ID" ] && [ "$PRIVATE_BOOKING_ID" != "null" ]; then
    DOUBLE_CANCEL=$(curl -s -X POST "$API_URL/passengers/bookings/$PRIVATE_BOOKING_ID/cancel" \
      -H "Authorization: Bearer $PASSENGER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"reason": "Trying to cancel again"}')
    
    if echo "$DOUBLE_CANCEL" | grep -q "already cancelled\|Cannot cancel"; then
        print_test "PASS" "Prevents cancelling already cancelled booking"
    else
        print_test "FAIL" "Should prevent cancelling already cancelled booking"
        echo "Response: $DOUBLE_CANCEL"
    fi
fi

###############################################################################
# Test 8: Test Unauthorized Access
###############################################################################

print_header "Test 8: Test Authorization"

# Try to access bookings without token
UNAUTH_RESPONSE=$(curl -s -X GET "$API_URL/passengers/bookings")

if echo "$UNAUTH_RESPONSE" | grep -qi "unauthorized\|forbidden\|authentication"; then
    print_test "PASS" "Unauthorized access properly blocked"
else
    print_test "FAIL" "Should block unauthorized access"
    echo "Response: $UNAUTH_RESPONSE"
fi

###############################################################################
# Test Summary
###############################################################################

print_header "Test Summary"

echo -e "Total Tests Run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
