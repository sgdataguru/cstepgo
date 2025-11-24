#!/bin/bash

# Quick Driver Portal Test - test-driver-123
# Simple endpoint testing to verify component functionality

echo "🚗 Quick Driver Portal Test"
echo "==========================="
echo ""

BASE_URL="http://localhost:3003"
DRIVER_ID="test-driver-123"

# Test basic connectivity
echo "1. Testing server connectivity..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/"

echo ""
echo "2. Testing driver API endpoint..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$BASE_URL/api/drivers/$DRIVER_ID")
http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "Status Code: $http_status"
if [ "$http_status" = "200" ]; then
    echo "✅ Driver API working!"
    echo "Response sample:"
    echo "$body" | jq -r '.driver.personalInfo.name // "Unable to parse name"' 2>/dev/null || echo "$body" | head -3
else
    echo "❌ Driver API failed"
    echo "Response: $body"
fi

echo ""
echo "3. Testing available trips API..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$BASE_URL/api/drivers/trips/available")
http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)

echo "Status Code: $http_status"
if [ "$http_status" = "200" ]; then
    echo "✅ Available trips API working!"
else
    echo "❌ Available trips API failed"
fi

echo ""
echo "4. Testing dashboard API..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$BASE_URL/api/drivers/$DRIVER_ID/dashboard")
http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)

echo "Status Code: $http_status"
if [ "$http_status" = "200" ]; then
    echo "✅ Dashboard API working!"
else
    echo "❌ Dashboard API failed"
fi

echo ""
echo "5. Testing page accessibility..."
page_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$BASE_URL/drivers/$DRIVER_ID")
page_status=$(echo "$page_response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)

echo "Driver Profile Page Status: $page_status"
if [ "$page_status" = "200" ]; then
    echo "✅ Driver profile page accessible!"
else
    echo "❌ Driver profile page failed"
fi

echo ""
echo "📊 QUICK SUMMARY"
echo "================"
echo "Driver ID: $DRIVER_ID"
echo "Base URL: $BASE_URL"
echo ""
echo "📋 MANUAL TESTING CHECKLIST"
echo "=============================="
echo ""
echo "1. Open: $BASE_URL/drivers/$DRIVER_ID"
echo "   □ Check driver profile loads"
echo "   □ Verify driver information displays"
echo "   □ Test responsive design"
echo ""
echo "2. Open: $BASE_URL/"
echo "   □ Check homepage navigation"
echo "   □ Look for driver-related components"
echo ""
echo "3. Open: $BASE_URL/trips"
echo "   □ Check trip listings"
echo "   □ Look for driver trip discovery features"
echo ""
echo "Testing completed at $(date)"
