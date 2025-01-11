#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Daily Prices Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222255" "Test Admin" "ADMIN")

# Create a buyer first to get buyer_id
print_test_header "Create Buyer Profile"
BUYER_RESPONSE=$(make_request "POST" "/buyers/profile" '{
    "business_name": "Test Buyer Business",
    "address": "123 Test Street",
    "lat_lng": "12.9716-77.5946"
}' "$ADMIN_TOKEN")

BUYER_ID=$(echo $BUYER_RESPONSE | jq -r '.id')

# Test 1: Create daily price
print_test_header "Create Daily Price"
PRICE_RESPONSE=$(make_request "POST" "/daily-prices" '{
    "buyer_id": "'$BUYER_ID'",
    "produce_category": "VEGETABLES",
    "min_price": 40,
    "max_price": 60,
    "minimum_quantity": 100,
    "valid_days": 7
}' "$ADMIN_TOKEN")

PRICE_ID=$(echo $PRICE_RESPONSE | jq -r '.id')

# Test 2: Get active prices
print_test_header "Get Active Prices"
make_request "GET" "/daily-prices/active?buyer_id=$BUYER_ID" '{}' "$ADMIN_TOKEN"

# Test 3: Get active price by category
print_test_header "Get Active Price by Category"
make_request "GET" "/daily-prices/active/VEGETABLES?buyer_id=$BUYER_ID" '{}' "$ADMIN_TOKEN"

# Test 4: Update daily price
print_test_header "Update Daily Price"
make_request "PUT" "/daily-prices/$PRICE_ID" '{
    "min_price": 45,
    "max_price": 65,
    "minimum_quantity": 120,
    "valid_days": 10
}' "$ADMIN_TOKEN"

# Test 5: Deactivate daily price
print_test_header "Deactivate Daily Price"
make_request "DELETE" "/daily-prices/$PRICE_ID" '{}' "$ADMIN_TOKEN"

echo -e "\n${GREEN}Daily prices tests completed!${NC}" 