#!/bin/bash

# Test script for trip booking flow
# Tests both private cab and shared ride creation with various scenarios

echo "================================================"
echo "Testing Trip Booking Flow Refactoring"
echo "================================================"
echo ""

API_URL="http://localhost:3000/api"
TRIPS_ENDPOINT="$API_URL/trips"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# Helper function to call API
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -s -X $method "$endpoint" \
      -H "Content-Type: application/json"
  else
    curl -s -X $method "$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data"
  fi
}

echo "Test 1: Create Private Cab Trip (Immediate Departure)"
echo "------------------------------------------------------"
PRIVATE_TRIP_DATA="{
  \"title\": \"Almaty to Astana\",
  \"description\": \"Private cab from Almaty to Astana\",
  \"origin\": {
    \"name\": \"Almaty\",
    \"address\": \"Almaty, Kazakhstan\",
    \"coordinates\": {\"lat\": 43.2220, \"lng\": 76.8512}
  },
  \"destination\": {
    \"name\": \"Astana\",
    \"address\": \"Astana, Kazakhstan\",
    \"coordinates\": {\"lat\": 51.1694, \"lng\": 71.4491}
  },
  \"departureDate\": \"$(date +%Y-%m-%d)\",
  \"departureTime\": \"$(date +%H:%M)\",
  \"tripType\": \"PRIVATE\",
  \"vehicleType\": \"sedan\"
}"

PRIVATE_RESPONSE=$(call_api POST "$TRIPS_ENDPOINT" "$PRIVATE_TRIP_DATA")
echo "Response: $PRIVATE_RESPONSE"

if echo "$PRIVATE_RESPONSE" | grep -q '"success":true'; then
  TRIP_ID=$(echo "$PRIVATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  print_result 0 "Private cab trip created successfully (ID: $TRIP_ID)"
else
  print_result 1 "Failed to create private cab trip"
  echo "Error: $PRIVATE_RESPONSE"
fi

echo ""
echo "Test 2: Create Shared Ride Trip (Future Departure)"
echo "---------------------------------------------------"
# Calculate 2 hours from now
FUTURE_DATE=$(date -d "+2 hours" +%Y-%m-%d)
FUTURE_TIME=$(date -d "+2 hours" +%H:%M)

SHARED_TRIP_DATA="{
  \"title\": \"Shymkent to Turkistan\",
  \"description\": \"Shared ride from Shymkent to Turkistan\",
  \"origin\": {
    \"name\": \"Shymkent\",
    \"address\": \"Shymkent, Kazakhstan\",
    \"coordinates\": {\"lat\": 42.3417, \"lng\": 69.5901}
  },
  \"destination\": {
    \"name\": \"Turkistan\",
    \"address\": \"Turkistan, Kazakhstan\",
    \"coordinates\": {\"lat\": 43.2978, \"lng\": 68.2517}
  },
  \"departureDate\": \"$FUTURE_DATE\",
  \"departureTime\": \"$FUTURE_TIME\",
  \"tripType\": \"SHARED\",
  \"vehicleType\": \"suv\"
}"

SHARED_RESPONSE=$(call_api POST "$TRIPS_ENDPOINT" "$SHARED_TRIP_DATA")
echo "Response: $SHARED_RESPONSE"

if echo "$SHARED_RESPONSE" | grep -q '"success":true'; then
  TRIP_ID=$(echo "$SHARED_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  print_result 0 "Shared ride trip created successfully (ID: $TRIP_ID)"
else
  print_result 1 "Failed to create shared ride trip"
  echo "Error: $SHARED_RESPONSE"
fi

echo ""
echo "Test 3: Shared Ride with Invalid Time (Less than 1 hour)"
echo "----------------------------------------------------------"
# Use current time (should fail validation)
INVALID_SHARED_DATA="{
  \"title\": \"Invalid Time Test\",
  \"description\": \"This should fail validation\",
  \"origin\": {
    \"name\": \"Almaty\",
    \"address\": \"Almaty, Kazakhstan\",
    \"coordinates\": {\"lat\": 43.2220, \"lng\": 76.8512}
  },
  \"destination\": {
    \"name\": \"Shymkent\",
    \"address\": \"Shymkent, Kazakhstan\",
    \"coordinates\": {\"lat\": 42.3417, \"lng\": 69.5901}
  },
  \"departureDate\": \"$(date +%Y-%m-%d)\",
  \"departureTime\": \"$(date +%H:%M)\",
  \"tripType\": \"SHARED\",
  \"vehicleType\": \"sedan\"
}"

INVALID_RESPONSE=$(call_api POST "$TRIPS_ENDPOINT" "$INVALID_SHARED_DATA")
echo "Response: $INVALID_RESPONSE"

if echo "$INVALID_RESPONSE" | grep -q 'at least 1 hour in advance'; then
  print_result 0 "Validation correctly rejected shared ride with invalid time"
else
  print_result 1 "Validation did not catch invalid shared ride time"
  echo "Error: Expected validation error but got: $INVALID_RESPONSE"
fi

echo ""
echo "Test 4: Missing Required Fields"
echo "--------------------------------"
MISSING_FIELDS_DATA='{
  "title": "Incomplete Trip"
}'

MISSING_RESPONSE=$(call_api POST "$TRIPS_ENDPOINT" "$MISSING_FIELDS_DATA")
echo "Response: $MISSING_RESPONSE"

if echo "$MISSING_RESPONSE" | grep -q '"success":false'; then
  print_result 0 "Missing required fields correctly rejected"
else
  print_result 1 "Missing required fields not properly validated"
fi

echo ""
echo "Test 5: Trip Creation Without Driver (Graceful Handling)"
echo "---------------------------------------------------------"
echo "Note: This test assumes the database may not have drivers."
echo "The API should handle this gracefully without exposing seed script errors."

# Use same data as Test 1 but check for graceful handling
NO_DRIVER_RESPONSE=$(call_api POST "$TRIPS_ENDPOINT" "$PRIVATE_TRIP_DATA")
echo "Response: $NO_DRIVER_RESPONSE"

if echo "$NO_DRIVER_RESPONSE" | grep -q 'run seed script'; then
  print_result 1 "API exposed seed script error message to user"
  echo "Error: Should not expose 'run seed script' messages"
elif echo "$NO_DRIVER_RESPONSE" | grep -q '"success":true'; then
  print_result 0 "Trip created successfully even without drivers"
else
  # Could be other error, but as long as no seed script message
  if ! echo "$NO_DRIVER_RESPONSE" | grep -q 'seed'; then
    print_result 0 "No seed script errors exposed (graceful failure)"
  else
    print_result 1 "Seed-related error exposed"
  fi
fi

echo ""
echo "================================================"
echo "Test Summary"
echo "================================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
