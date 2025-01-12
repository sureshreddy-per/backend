#!/bin/bash

source "$(dirname "$0")/utils.sh"

print_test_header "Buyer Price Preferences Endpoints"

# Get buyer token
BUYER_TOKEN=$(get_auth_token "+1111222269" "Test Buyer" "BUYER")

# Create buyer profile
print_test_header "Create Buyer Profile"
RESPONSE=$(make_request "POST" "/buyers/profile" '{
    "business_name": "Fresh Foods",
    "address": "123 Market Street, Business District",
    "lat_lng": "12.9716-77.5946"
}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"
echo $RESPONSE

# Test price alerts
print_test_header "Set Price Alert"
RESPONSE=$(make_request "POST" "/buyers/preferences/price-alerts" '{
    "target_price": 50.00,
    "condition": "BELOW",
    "notification_methods": ["EMAIL", "SMS"],
    "expiry_date": "2024-12-31",
    "produce_name": "tomato"
}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"

print_test_header "Get Price Alerts"
RESPONSE=$(make_request "GET" "/buyers/preferences/price-alerts" '{}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"
echo $RESPONSE

ALERT_ID=$(echo $RESPONSE | jq -r '.id')

print_test_header "Update Price Alert"
RESPONSE=$(make_request "PATCH" "/buyers/preferences/price-alerts/$ALERT_ID" '{
    "target_price": 45.00,
    "notification_methods": ["EMAIL", "SMS", "PUSH"]
}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"
echo $RESPONSE

print_test_header "Delete Price Alert"
RESPONSE=$(make_request "DELETE" "/buyers/preferences/price-alerts/$ALERT_ID" '{}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"

# Test price range preferences
print_test_header "Set Preferred Price Range"
RESPONSE=$(make_request "POST" "/buyers/preferences/price-range" '{
    "min_price": 20.00,
    "max_price": 35.00,
    "produce_names": ["tomato", "potato", "onion"]
}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"
echo $RESPONSE

print_test_header "Get Preferences"
RESPONSE=$(make_request "GET" "/buyers/preferences" '{}' "$BUYER_TOKEN")
echo "Response: $RESPONSE"
echo $RESPONSE

echo -e "\n${GREEN}Buyer price preferences tests completed!${NC}" 