#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Farmer Endpoints"

# Get farmer token
FARMER_TOKEN=$(get_auth_token "+1111222257" "Test Farmer" "FARMER")

# Test 1: Create farmer profile
print_test_header "Create Farmer Profile"
FARMER_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER_TOKEN")

# Test 2: Get farmer profile
print_test_header "Get Farmer Profile"
FARMER_PROFILE=$(make_request "GET" "/farmers/profile" "{}" "$FARMER_TOKEN")
FARMER_ID=$(echo $FARMER_PROFILE | jq -r '.id')

# Test 3: Find nearby farmers
print_test_header "Find Nearby Farmers"
make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=10" "{}" "$FARMER_TOKEN"

# Test 4: Add farm
print_test_header "Add Farm"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Green Valley Plot 1",
    "size": 5.5,
    "address": "Plot 1, Farm Road, Rural District",
    "lat_lng": "12.9720-77.5950",
    "image": "https://example.com/farm1.jpg"
}' "$FARMER_TOKEN")

FARM_ID=$(echo $FARM_RESPONSE | jq -r '.id')

# Test 5: Update farm
print_test_header "Update Farm"
make_request "PATCH" "/farmers/farms/$FARM_ID" '{
    "name": "Green Valley Plot 1 - Updated",
    "lat_lng": "12.9720-77.5950"
}' "$FARMER_TOKEN"

# Test 6: Add another farm
print_test_header "Add Another Farm"
make_request "POST" "/farmers/farms" '{
    "name": "Green Valley Plot 2",
    "size": 3.2,
    "address": "Plot 2, Farm Road, Rural District",
    "lat_lng": "12.9725-77.5955"
}' "$FARMER_TOKEN"

# Test 7: Add bank account
print_test_header "Add Bank Account"
make_request "POST" "/farmers/bank-accounts" '{
    "account_name": "John Doe",
    "account_number": "1234567890",
    "bank_name": "Test Bank",
    "branch_code": "001",
    "is_primary": true
}' "$FARMER_TOKEN"

echo -e "\n${GREEN}Farmer tests completed!${NC}" 