#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Buyer Endpoints"

# Get buyer token
BUYER_TOKEN=$(get_auth_token "+1111222258" "Test Buyer" "BUYER")

# Test 1: Create buyer profile
print_test_header "Create Buyer Profile"
BUYER_RESPONSE=$(make_request "POST" "/buyers/profile" '{
    "business_name": "Fresh Mart",
    "address": "45 Market Street, Business District",
    "lat_lng": "12.9716-77.5946"
}' "$BUYER_TOKEN")

# Test 2: Get buyer profile
print_test_header "Get Buyer Profile"
make_request "GET" "/buyers/profile" "{}" "$BUYER_TOKEN"

# Test 3: Get buyer by ID
print_test_header "Get Buyer by ID"
BUYER_ID=$(make_request "GET" "/buyers/profile" "{}" "$BUYER_TOKEN" | jq -r '.id')
make_request "GET" "/buyers/$BUYER_ID" "{}" "$BUYER_TOKEN"

# Test 4: Find nearby buyers
print_test_header "Find Nearby Buyers"
make_request "GET" "/buyers/nearby?lat=12.9716&lng=77.5946&radius=10" "{}" "$BUYER_TOKEN"

# Test 5: Update buyer preferences
print_test_header "Update Buyer Preferences"
make_request "PUT" "/buyers/profile/preferences" '{
    "min_price": 40,
    "max_price": 60,
    "categories": ["VEGETABLES", "FRUITS"],
    "notification_enabled": true
}' "$BUYER_TOKEN"

echo -e "\n${GREEN}Buyer tests completed!${NC}" 