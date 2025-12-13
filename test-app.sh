#!/bin/bash

# StepperGO Automated Testing Script
# Run this to test all major features

echo "🚀 StepperGO Comprehensive Testing Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3002"

# Test counter
PASSED=0
FAILED=0

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAILED++))
    fi
}

# Function to check if page loads
test_page() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name page... "
    
    response=$(curl -s -L -I "$url" | head -n 1)
    
    if [[ $response == *"200"* ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo "🌐 Testing Public Pages"
echo "----------------------"
test_page "Landing Page" "$BASE_URL/"
test_page "Trip Listing" "$BASE_URL/trips"
test_page "Create Trip" "$BASE_URL/trips/create"
test_page "Auth Register" "$BASE_URL/auth/register"
test_page "Driver Login" "$BASE_URL/driver/login"
test_page "Module Overview" "$BASE_URL/module-overview"
echo ""

echo "🔌 Testing Public API Endpoints"
echo "-------------------------------"
test_endpoint "Trip API" "$BASE_URL/api/trips"
test_endpoint "Location Autocomplete" "$BASE_URL/api/locations/autocomplete?input=almaty"
test_endpoint "Debug Endpoint" "$BASE_URL/api/debug"
echo ""

echo "🚗 Testing Driver Portal Pages (No Auth)"
echo "----------------------------------------"
test_page "Driver Dashboard" "$BASE_URL/driver/portal/dashboard" 
test_page "Driver Earnings" "$BASE_URL/driver/portal/earnings"
test_page "Driver Profile" "$BASE_URL/driver/portal/profile"
test_page "Driver Notifications" "$BASE_URL/driver/portal/notifications"
echo ""

echo "🎭 Testing Activity Owner Pages"
echo "-------------------------------"
test_page "Activity Owner Login" "$BASE_URL/activity-owners/auth/login"
test_page "Activity Owner Register" "$BASE_URL/activity-owners/auth/register"
test_page "Activity Owner Dashboard" "$BASE_URL/activity-owners/dashboard"
echo ""

echo "🏛️ Testing Admin Pages"
echo "----------------------"
test_page "Admin Drivers List" "$BASE_URL/admin/drivers"
test_page "Admin Add Driver" "$BASE_URL/admin/drivers/new"
echo ""

echo "📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check the output above.${NC}"
    exit 1
fi
