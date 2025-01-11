#!/bin/bash

# Source common test utilities
source "$(dirname "$0")/test-common.sh"

print_test_header "Farmer Endpoints"

# Get farmer tokens for different farmers
FARMER1_TOKEN=$(get_test_token "FARMER" 1)
FARMER2_TOKEN=$(get_test_token "FARMER" 2)
FARMER3_TOKEN=$(get_test_token "FARMER" 3)

if [ -z "$FARMER1_TOKEN" ] || [ -z "$FARMER2_TOKEN" ] || [ -z "$FARMER3_TOKEN" ]; then
    print_error "Failed to get farmer tokens"
    exit 1
fi

# Test 1: Create farmer profiles
print_test_header "Create Farmer Profiles"
FARMER1_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER1_TOKEN")
FARMER2_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER2_TOKEN")
FARMER3_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER3_TOKEN")

# Extract farmer IDs
FARMER1_ID=$(get_response_id "$FARMER1_RESPONSE")
FARMER2_ID=$(get_response_id "$FARMER2_RESPONSE")
FARMER3_ID=$(get_response_id "$FARMER3_RESPONSE")

if [ -z "$FARMER1_ID" ] || [ -z "$FARMER2_ID" ] || [ -z "$FARMER3_ID" ]; then
    print_error "Failed to create farmer profiles"
    exit 1
fi

# Test 2: Add farms at different locations
print_test_header "Add Farms at Different Locations"

# Farm within 10km radius (about 5km away)
CENTRAL_LOCATION=$(get_test_location "Central")
NORTH_LOCATION=$(get_test_location "North")
EAST_LOCATION=$(get_test_location "East")

# Farm within 5km radius
FARM1_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Nearby Farm",
    "size_in_acres": 5.5,
    "address": "Plot 1, Farm Road, Rural District",
    "location": "'$CENTRAL_LOCATION'",
    "description": "A farm within 10km radius"
}' "$FARMER1_TOKEN")

# Farm just outside 10km radius
FARM2_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Far Farm",
    "size_in_acres": 3.2,
    "address": "Plot 2, Farm Road, Rural District",
    "location": "'$NORTH_LOCATION'",
    "description": "A farm outside 10km radius"
}' "$FARMER2_TOKEN")

# Farm at exactly 10km radius
FARM3_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Border Farm",
    "size_in_acres": 4.8,
    "address": "Plot 3, Farm Road, Rural District",
    "location": "'$EAST_LOCATION'",
    "description": "A farm at 10km radius"
}' "$FARMER3_TOKEN")

# Test 3: Test nearby farmers search with different radiuses
print_test_header "Find Nearby Farmers - 5km radius"
NEARBY_5KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=5" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_5KM"

print_test_header "Find Nearby Farmers - 10km radius"
NEARBY_10KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=10" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_10KM"

print_test_header "Find Nearby Farmers - 15km radius"
NEARBY_15KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=15" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_15KM"

# Test 4: Add bank account
print_test_header "Add Bank Account"
BANK_RESPONSE=$(make_request "POST" "/farmers/bank-accounts" '{
    "account_name": "John Doe",
    "account_number": "1234567890",
    "bank_name": "Test Bank",
    "branch_code": "001",
    "is_primary": true
}' "$FARMER1_TOKEN")

check_error "$BANK_RESPONSE"
print_success "Farmer tests completed!" 