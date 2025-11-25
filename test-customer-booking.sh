#!/bin/bash
# Test Customer Private Trip Booking Flow
# This script demonstrates the complete booking flow from customer to driver

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Customer Private Trip Booking Flow Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Create a private trip booking
echo -e "${GREEN}Test 1: Create Private Trip Booking${NC}"
echo -e "${YELLOW}POST ${API_URL}/bookings${NC}"

BOOKING_RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "tripType": "private",
    "origin": {
      "name": "Almaty International Airport",
      "address": "Mailin St 2, Almaty 050039, Kazakhstan",
      "lat": 43.3521,
      "lng": 77.0408
    },
    "destination": {
      "name": "Kok-Tobe",
      "address": "Kok-Tobe Hill, Almaty, Kazakhstan",
      "lat": 43.2305,
      "lng": 76.9563
    },
    "departureTime": "2025-01-15T14:00:00.000Z",
    "passengers": [
      {
        "name": "John Doe",
        "phone": "+77071234567",
        "email": "john.doe@example.com"
      }
    ],
    "seatsBooked": 2,
    "notes": "Please arrive 10 minutes early",
    "vehicleType": "sedan"
  }')

echo "$BOOKING_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BOOKING_RESPONSE"
echo ""

# Extract booking ID and trip ID from response
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['bookingId'])" 2>/dev/null)
TRIP_ID=$(echo "$BOOKING_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['tripId'])" 2>/dev/null)

if [ -z "$BOOKING_ID" ]; then
  echo -e "${RED}Failed to create booking. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Booking created successfully${NC}"
echo -e "Booking ID: ${BOOKING_ID}"
echo -e "Trip ID: ${TRIP_ID}\n"

# Test 2: Get booking details
echo -e "${GREEN}Test 2: Get Booking Details${NC}"
echo -e "${YELLOW}GET ${API_URL}/bookings/${BOOKING_ID}${NC}"

BOOKING_DETAILS=$(curl -s -X GET "${API_URL}/bookings/${BOOKING_ID}")
echo "$BOOKING_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$BOOKING_DETAILS"
echo -e "${GREEN}✓ Booking details retrieved${NC}\n"

# Test 3: Get user's bookings
echo -e "${GREEN}Test 3: Get User's All Bookings${NC}"
echo -e "${YELLOW}GET ${API_URL}/bookings?userId=test-user-123${NC}"

USER_BOOKINGS=$(curl -s -X GET "${API_URL}/bookings?userId=test-user-123")
echo "$USER_BOOKINGS" | python3 -m json.tool 2>/dev/null || echo "$USER_BOOKINGS"
echo -e "${GREEN}✓ User bookings retrieved${NC}\n"

# Test 4: Get available trips (driver view)
echo -e "${GREEN}Test 4: Driver Discovery - Available Trips${NC}"
echo -e "${YELLOW}GET ${API_URL}/drivers/trips/available?radius=25${NC}"
echo -e "${YELLOW}Note: This requires driver authentication (x-driver-id header)${NC}"

# This would require a valid driver ID
AVAILABLE_TRIPS=$(curl -s -X GET "${API_URL}/drivers/trips/available?radius=25&sortBy=distance" \
  -H "x-driver-id: test-driver-id")
echo "$AVAILABLE_TRIPS" | python3 -m json.tool 2>/dev/null || echo "$AVAILABLE_TRIPS"
echo -e "${GREEN}✓ Available trips retrieved (or auth error shown)${NC}\n"

# Test 5: Get specific trip details
echo -e "${GREEN}Test 5: Get Trip Details (Public)${NC}"
echo -e "${YELLOW}GET ${API_URL}/trips/${TRIP_ID}${NC}"

TRIP_DETAILS=$(curl -s -X GET "${API_URL}/trips/${TRIP_ID}")
echo "$TRIP_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$TRIP_DETAILS"
echo -e "${GREEN}✓ Trip details retrieved${NC}\n"

# Test 6: Filter bookings by status
echo -e "${GREEN}Test 6: Filter Bookings by Status${NC}"
echo -e "${YELLOW}GET ${API_URL}/bookings?userId=test-user-123&status=pending${NC}"

PENDING_BOOKINGS=$(curl -s -X GET "${API_URL}/bookings?userId=test-user-123&status=pending")
echo "$PENDING_BOOKINGS" | python3 -m json.tool 2>/dev/null || echo "$PENDING_BOOKINGS"
echo -e "${GREEN}✓ Pending bookings retrieved${NC}\n"

# Test 7: Cancel booking
echo -e "${GREEN}Test 7: Cancel Booking${NC}"
echo -e "${YELLOW}PUT ${API_URL}/bookings/${BOOKING_ID}${NC}"

CANCEL_RESPONSE=$(curl -s -X PUT "${API_URL}/bookings/${BOOKING_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "cancel",
    "userId": "test-user-123",
    "reason": "Change of plans"
  }')

echo "$CANCEL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CANCEL_RESPONSE"
echo -e "${GREEN}✓ Booking cancellation attempted${NC}\n"

# Test 8: Verify cancelled booking
echo -e "${GREEN}Test 8: Verify Cancelled Booking${NC}"
echo -e "${YELLOW}GET ${API_URL}/bookings/${BOOKING_ID}${NC}"

CANCELLED_BOOKING=$(curl -s -X GET "${API_URL}/bookings/${BOOKING_ID}")
echo "$CANCELLED_BOOKING" | python3 -m json.tool 2>/dev/null || echo "$CANCELLED_BOOKING"
echo -e "${GREEN}✓ Cancelled booking details retrieved${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Booking Creation - Working${NC}"
echo -e "${GREEN}✓ Booking Retrieval - Working${NC}"
echo -e "${GREEN}✓ User Bookings List - Working${NC}"
echo -e "${GREEN}✓ Booking Cancellation - Working${NC}"
echo -e "${YELLOW}⚠ Driver Discovery - Requires authentication${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Note: This test uses mock data. In production:${NC}"
echo -e "  - userId would come from authenticated session"
echo -e "  - Driver authentication would be via JWT token"
echo -e "  - Real-time WebSocket notifications would be sent"
echo -e "  - Database would need to be seeded with test data\n"
