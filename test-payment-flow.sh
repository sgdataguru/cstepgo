#!/bin/bash

# Test Payment Flow Implementation
# This script tests the booking and payment APIs

API_BASE="http://localhost:3000/api"

echo "=== Payment Flow Test Script ==="
echo ""

# Test 1: Check Mock Payment API Info
echo "Test 1: Mock Payment API Info"
echo "GET /api/payments/mock-success"
curl -s "${API_BASE}/payments/mock-success" | jq .
echo ""
echo "---"
echo ""

# Test 2: Create a booking with CASH_TO_DRIVER payment method
# Note: This requires a valid trip ID and user auth token
echo "Test 2: Create Booking with Cash Payment"
echo "POST /api/bookings"
echo "Requires: Valid auth token and trip ID"
echo "(Skipping - requires authentication)"
echo ""
echo "---"
echo ""

# Test 3: Create a booking with ONLINE payment method
echo "Test 3: Create Booking with Online Payment"
echo "POST /api/bookings"
echo "Requires: Valid auth token and trip ID"
echo "(Skipping - requires authentication)"
echo ""
echo "---"
echo ""

# Test 4: Process mock payment
echo "Test 4: Mock Payment Processing"
echo "POST /api/payments/mock-success"
echo "Requires: Valid booking ID"
echo "(Skipping - requires booking ID)"
echo ""
echo "---"
echo ""

echo "=== Test Script Complete ==="
echo ""
echo "To test the APIs properly, you need to:"
echo "1. Start the development server: npm run dev"
echo "2. Create test users and authenticate to get tokens"
echo "3. Create test trips"
echo "4. Use the tokens and trip IDs in the API requests"
echo ""
echo "Example authenticated request:"
echo 'curl -X POST http://localhost:3000/api/bookings \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "tripId": "TRIP_ID",'
echo '    "seatsBooked": 1,'
echo '    "passengers": [{"name": "John Doe"}],'
echo '    "paymentMethodType": "CASH_TO_DRIVER"'
echo '  }'"'"
echo ""

