#!/bin/bash

# Test Trip Acceptance Mechanism
# Usage: ./test-trip-acceptance.sh

echo "🚗 Testing Trip Acceptance Mechanism"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:3000"

# Test Data
DRIVER_ID="test-driver-123"
TRIP_ID="test-trip-456"

echo -e "${YELLOW}📋 Test Plan:${NC}"
echo "1. Create a trip offer to driver"
echo "2. Check active offers"
echo "3. Test trip acceptance"
echo "4. Test trip decline"
echo "5. Test timeout scenarios"
echo ""

# Function to make API call and show response
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "x-driver-id: $DRIVER_ID" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "x-driver-id: $DRIVER_ID" \
            "$BASE_URL$endpoint")
    fi
    
    # Check if response is valid JSON
    if echo "$response" | jq . > /dev/null 2>&1; then
        echo "Response:"
        echo "$response" | jq .
        
        # Check success status
        success=$(echo "$response" | jq -r '.success // false')
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}✅ Success${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
        fi
    else
        echo -e "${RED}❌ Invalid JSON response:${NC}"
        echo "$response"
    fi
    
    echo "----------------------------------------"
    echo ""
}

# Test 1: Create a trip offer
echo -e "${GREEN}Test 1: Creating Trip Offer${NC}"
offer_data='{
  "tripId": "'$TRIP_ID'",
  "driverId": "'$DRIVER_ID'",
  "timeoutSeconds": 30,
  "urgency": "high"
}'

api_call "POST" "/api/drivers/trips/offer" "$offer_data" "Create trip offer"

# Test 2: Check active offers
echo -e "${GREEN}Test 2: Check Active Offers${NC}"
api_call "GET" "/api/drivers/trips/offer?driverId=$DRIVER_ID" "" "Get active offers for driver"

# Test 3: Test trip acceptance
echo -e "${GREEN}Test 3: Accept Trip${NC}"
accept_data='{
  "tripId": "'$TRIP_ID'",
  "action": "accept"
}'

api_call "POST" "/api/drivers/trips/acceptance/enhanced" "$accept_data" "Accept trip offer"

# Test 4: Create another offer for decline test
echo -e "${GREEN}Test 4: Create Second Offer for Decline Test${NC}"
TRIP_ID_2="test-trip-789"
offer_data_2='{
  "tripId": "'$TRIP_ID_2'",
  "driverId": "'$DRIVER_ID'",
  "timeoutSeconds": 60,
  "urgency": "normal"
}'

api_call "POST" "/api/drivers/trips/offer" "$offer_data_2" "Create second trip offer"

# Test 5: Test trip decline
echo -e "${GREEN}Test 5: Decline Trip${NC}"
decline_data='{
  "tripId": "'$TRIP_ID_2'",
  "action": "decline"
}'

api_call "POST" "/api/drivers/trips/acceptance/enhanced" "$decline_data" "Decline trip offer"

# Test 6: Driver Dashboard
echo -e "${GREEN}Test 6: Driver Dashboard${NC}"
api_call "GET" "/api/drivers/$DRIVER_ID/dashboard" "" "Get driver dashboard stats"

# Test 7: Race Condition Test (Multiple rapid requests)
echo -e "${GREEN}Test 7: Race Condition Test${NC}"
TRIP_ID_3="test-trip-race-123"
offer_data_3='{
  "tripId": "'$TRIP_ID_3'",
  "driverId": "'$DRIVER_ID'",
  "timeoutSeconds": 15,
  "urgency": "critical"
}'

# Create offer
api_call "POST" "/api/drivers/trips/offer" "$offer_data_3" "Create trip offer for race condition test"

# Rapid accept attempts
echo -e "${YELLOW}Making rapid accept attempts...${NC}"
for i in {1..3}; do
    echo "Attempt $i:"
    accept_data_race='{
      "tripId": "'$TRIP_ID_3'",
      "action": "accept"
    }'
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-driver-id: $DRIVER_ID" \
        -d "$accept_data_race" \
        "$BASE_URL/api/drivers/trips/acceptance/enhanced" | jq . &
done

wait
echo ""

echo -e "${GREEN}🏁 Test Summary Complete!${NC}"
echo "======================================"
echo "Check the responses above for:"
echo "• ✅ Successful operations"
echo "• ❌ Failed operations"
echo "• Race condition handling"
echo "• Timeout management"
echo "• Proper error responses"
echo ""
echo "Next steps:"
echo "1. Test the frontend UI at /drivers/$DRIVER_ID"
echo "2. Verify real-time notifications"
echo "3. Test mobile responsiveness"
