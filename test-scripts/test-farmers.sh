#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Farmer Endpoints"

# Get farmer tokens for different farmers
FARMER1_TOKEN=$(get_auth_token "+1111222257" "Test Farmer 1" "FARMER")
FARMER2_TOKEN=$(get_auth_token "+1111222258" "Test Farmer 2" "FARMER")
FARMER3_TOKEN=$(get_auth_token "+1111222259" "Test Farmer 3" "FARMER")

# Test 1: Create farmer profiles
print_test_header "Create Farmer Profiles"
FARMER1_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER1_TOKEN")
FARMER2_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER2_TOKEN")
FARMER3_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER3_TOKEN")

# Test 2: Add farms at different locations
print_test_header "Add Farms at Different Locations"

# Farm within 10km radius (about 5km away)
FARM1_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Nearby Farm",
    "size_in_acres": 5.5,
    "address": "Plot 1, Farm Road, Rural District",
    "location": "12.9716,77.5946",
    "description": "A farm within 10km radius"
}' "$FARMER1_TOKEN")

# Farm just outside 10km radius (about 12km away)
FARM2_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Far Farm",
    "size_in_acres": 3.2,
    "address": "Plot 2, Farm Road, Rural District",
    "location": "13.0716,77.5946",
    "description": "A farm outside 10km radius"
}' "$FARMER2_TOKEN")

# Farm at exactly 10km radius (about 10km away)
FARM3_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Border Farm",
    "size_in_acres": 4.8,
    "address": "Plot 3, Farm Road, Rural District",
    "location": "13.0616,77.5946",
    "description": "A farm at 10km radius"
}' "$FARMER3_TOKEN")

# Test 3: Test nearby farmers search with different radiuses
print_test_header "Find Nearby Farmers - 5km radius"
make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=5" "{}" "$FARMER1_TOKEN"

print_test_header "Find Nearby Farmers - 10km radius"
make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=10" "{}" "$FARMER1_TOKEN"

print_test_header "Find Nearby Farmers - 15km radius"
make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=15" "{}" "$FARMER1_TOKEN"

# Test 4: Add bank account
print_test_header "Add Bank Account"
make_request "POST" "/farmers/bank-accounts" '{
    "account_name": "John Doe",
    "account_number": "1234567890",
    "bank_name": "Test Bank",
    "branch_code": "001",
    "is_primary": true
}' "$FARMER1_TOKEN"

echo -e "\n${GREEN}Farmer tests completed!${NC}" 