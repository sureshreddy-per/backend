#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Daily Prices Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222255" "ADMIN")

# Test 1: Create daily price
print_test_header "Create Daily Price"
PRICE_RESPONSE=$(make_request "POST" "/daily-prices" "$ADMIN_TOKEN" '{
    "produce_category": "VEGETABLES",
    "produce_name": "Tomatoes",
    "min_price": 40,
    "max_price": 60,
    "average_price": 50,
    "market_location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    },
    "market_name": "Central Market",
    "date": "2024-01-10"
}')

PRICE_ID=$(echo $PRICE_RESPONSE | jq -r '.id')

# Test 2: Get active prices
print_test_header "Get Active Prices"
make_request "GET" "/daily-prices/active" "$ADMIN_TOKEN"

# Test 3: Get active price by category
print_test_header "Get Active Price by Category"
make_request "GET" "/daily-prices/active/VEGETABLES" "$ADMIN_TOKEN"

# Test 4: Update daily price
print_test_header "Update Daily Price"
make_request "PUT" "/daily-prices/$PRICE_ID" "$ADMIN_TOKEN" '{
    "min_price": 45,
    "max_price": 65,
    "average_price": 55
}'

# Test 5: Deactivate daily price
print_test_header "Deactivate Daily Price"
make_request "DELETE" "/daily-prices/$PRICE_ID" "$ADMIN_TOKEN"

echo -e "\n${GREEN}Daily prices tests completed!${NC}" 