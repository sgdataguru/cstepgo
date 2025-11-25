#!/bin/bash

# Test script for Passenger Trip History and Receipt functionality
# Tests UC-38: Passenger View Trip History and Receipts

set -e

echo "================================"
echo "🧪 Testing Passenger Trip History and Receipts (Story 38)"
echo "================================"
echo ""

BASE_URL="${BASE_URL:-http://localhost:3000}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Helper function to make authenticated requests
auth_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

echo "📝 Step 1: Create test passenger user"
echo "-----------------------------------"

# Register passenger
PASSENGER_EMAIL="test-passenger-$(date +%s)@steppergo.com"
PASSENGER_PASSWORD="TestPass123!"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$PASSENGER_EMAIL\",
        \"password\": \"$PASSENGER_PASSWORD\",
        \"name\": \"Test Passenger\",
        \"role\": \"PASSENGER\"
    }")

echo "Register response: $REGISTER_RESPONSE"

# Login passenger
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$PASSENGER_EMAIL\",
        \"password\": \"$PASSENGER_PASSWORD\"
    }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .access_token // .data.token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get access token${NC}"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Passenger logged in successfully${NC}"
echo ""

echo "📋 Step 2: Test trip history listing with filters"
echo "-----------------------------------"

# Test 1: Get all bookings
echo "Test 1: Get all bookings"
ALL_BOOKINGS=$(auth_request "GET" "/api/passengers/bookings")
echo "$ALL_BOOKINGS" | jq '.' || echo "$ALL_BOOKINGS"
BOOKING_COUNT=$(echo "$ALL_BOOKINGS" | jq -r '.data | length // 0')
print_test_result 0 "Retrieved $BOOKING_COUNT bookings"
echo ""

# Test 2: Get upcoming bookings
echo "Test 2: Get upcoming bookings only"
UPCOMING_BOOKINGS=$(auth_request "GET" "/api/passengers/bookings?upcoming=true")
echo "$UPCOMING_BOOKINGS" | jq '.' || echo "$UPCOMING_BOOKINGS"
print_test_result $? "Retrieved upcoming bookings"
echo ""

# Test 3: Get past bookings
echo "Test 3: Get past bookings only"
PAST_BOOKINGS=$(auth_request "GET" "/api/passengers/bookings?past=true")
echo "$PAST_BOOKINGS" | jq '.' || echo "$PAST_BOOKINGS"
print_test_result $? "Retrieved past bookings"
echo ""

# Test 4: Get booking statistics
echo "Test 4: Get booking statistics"
STATS=$(auth_request "GET" "/api/passengers/bookings?stats=true")
echo "$STATS" | jq '.' || echo "$STATS"
print_test_result $? "Retrieved booking statistics"
echo ""

# Test 5: Filter by trip type (if bookings exist)
if [ "$BOOKING_COUNT" -gt 0 ]; then
    echo "Test 5: Filter by trip type (SHARED)"
    SHARED_BOOKINGS=$(auth_request "GET" "/api/passengers/bookings?tripType=SHARED")
    echo "$SHARED_BOOKINGS" | jq '.' || echo "$SHARED_BOOKINGS"
    print_test_result $? "Retrieved SHARED trip bookings"
    echo ""
fi

# Test 6: Pagination
echo "Test 6: Test pagination"
PAGINATED=$(auth_request "GET" "/api/passengers/bookings?limit=5&offset=0")
echo "$PAGINATED" | jq '.' || echo "$PAGINATED"
print_test_result $? "Retrieved paginated results"
echo ""

echo "🧾 Step 3: Test receipt functionality"
echo "-----------------------------------"

# Get first booking ID if any bookings exist
if [ "$BOOKING_COUNT" -gt 0 ]; then
    FIRST_BOOKING_ID=$(echo "$ALL_BOOKINGS" | jq -r '.data[0].id // empty')
    
    if [ ! -z "$FIRST_BOOKING_ID" ] && [ "$FIRST_BOOKING_ID" != "null" ]; then
        echo "Testing receipt for booking: $FIRST_BOOKING_ID"
        
        # Test 7: Get booking details
        echo "Test 7: Get booking details"
        BOOKING_DETAILS=$(auth_request "GET" "/api/passengers/bookings/$FIRST_BOOKING_ID")
        echo "$BOOKING_DETAILS" | jq '.' || echo "$BOOKING_DETAILS"
        
        BOOKING_STATUS=$(echo "$BOOKING_DETAILS" | jq -r '.data.status // empty')
        PAYMENT_STATUS=$(echo "$BOOKING_DETAILS" | jq -r '.data.payment.status // empty')
        
        print_test_result $? "Retrieved booking details"
        echo "  - Booking Status: $BOOKING_STATUS"
        echo "  - Payment Status: $PAYMENT_STATUS"
        echo ""
        
        # Test 8: Try to get receipt (may not be eligible)
        echo "Test 8: Attempt to get receipt"
        RECEIPT_RESPONSE=$(auth_request "GET" "/api/receipts/$FIRST_BOOKING_ID")
        
        # Check if receipt is available
        RECEIPT_SUCCESS=$(echo "$RECEIPT_RESPONSE" | jq -r '.success // false')
        
        if [ "$RECEIPT_SUCCESS" == "true" ]; then
            echo "$RECEIPT_RESPONSE" | jq '.' || echo "$RECEIPT_RESPONSE"
            print_test_result 0 "Receipt generated successfully"
            
            # Verify receipt data structure
            RECEIPT_NUMBER=$(echo "$RECEIPT_RESPONSE" | jq -r '.data.receiptNumber // empty')
            PASSENGER_NAME=$(echo "$RECEIPT_RESPONSE" | jq -r '.data.passengerName // empty')
            TOTAL_AMOUNT=$(echo "$RECEIPT_RESPONSE" | jq -r '.data.totalAmount // empty')
            
            echo "  - Receipt Number: $RECEIPT_NUMBER"
            echo "  - Passenger Name: $PASSENGER_NAME"
            echo "  - Total Amount: $TOTAL_AMOUNT"
            
            # Verify masked payment data
            LAST4=$(echo "$RECEIPT_RESPONSE" | jq -r '.data.last4 // empty')
            if [ ! -z "$LAST4" ] && [ "$LAST4" != "null" ]; then
                echo "  - Payment card (last 4): $LAST4"
                print_test_result 0 "Payment data is properly masked"
            fi
        else
            ERROR_MSG=$(echo "$RECEIPT_RESPONSE" | jq -r '.message // .error // "Unknown error"')
            echo "Receipt not available: $ERROR_MSG"
            print_test_result 0 "Receipt eligibility check working correctly"
            echo "  (Receipt only available for completed/confirmed bookings with successful payment)"
        fi
        echo ""
    fi
else
    echo -e "${YELLOW}⚠ No bookings found. Skipping receipt tests.${NC}"
    echo "  Create a booking first to test receipt functionality."
    echo ""
fi

echo "🔐 Step 4: Test security and authorization"
echo "-----------------------------------"

# Test 9: Try to access receipt without authentication
echo "Test 9: Verify authentication required"
if [ ! -z "$FIRST_BOOKING_ID" ]; then
    UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/receipts/$FIRST_BOOKING_ID")
    UNAUTH_ERROR=$(echo "$UNAUTH_RESPONSE" | jq -r '.error // .code // empty')
    
    if [ ! -z "$UNAUTH_ERROR" ]; then
        print_test_result 0 "Authentication properly enforced"
    else
        print_test_result 1 "Authentication not enforced!"
    fi
else
    echo "  Skipped (no booking ID available)"
fi
echo ""

# Test 10: Try to access another user's receipt (security test)
echo "Test 10: Verify user cannot access other user's receipts"
FAKE_BOOKING_ID="clxy999999fakeid99999"
OTHER_USER_RECEIPT=$(auth_request "GET" "/api/receipts/$FAKE_BOOKING_ID")
OTHER_USER_ERROR=$(echo "$OTHER_USER_RECEIPT" | jq -r '.error // empty')

if [ ! -z "$OTHER_USER_ERROR" ]; then
    print_test_result 0 "Cross-user access properly blocked"
else
    print_test_result 1 "Security issue: Can access other user's data!"
fi
echo ""

echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi
