#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Buyer Price Preferences Endpoints"

# Get tokens for different roles
BUYER_TOKEN=$(get_auth_token "+1111222269" "BUYER")

# Test 1: Set price alert
print_test_header "Set Price Alert"
ALERT_RESPONSE=$(make_request "POST" "/buyers/price-alerts" "$BUYER_TOKEN" '{
    "produce": "TOMATOES",
    "target_price": 50.00,
    "condition": "BELOW",
    "notification_method": ["EMAIL", "SMS"],
    "expiry_date": "2024-12-31"
}')

ALERT_ID=$(echo $ALERT_RESPONSE | jq -r '.id')

# Test 2: Get price alerts
print_test_header "Get Price Alerts"
make_request "GET" "/buyers/price-alerts" "$BUYER_TOKEN"

# Test 3: Update price alert
print_test_header "Update Price Alert"
make_request "PATCH" "/buyers/price-alerts/$ALERT_ID" "$BUYER_TOKEN" '{
    "target_price": 45.00,
    "notification_method": ["EMAIL", "SMS", "PUSH"]
}'

# Test 4: Delete price alert
print_test_header "Delete Price Alert"
make_request "DELETE" "/buyers/price-alerts/$ALERT_ID" "$BUYER_TOKEN"

# Test 5: Set preferred price range
print_test_header "Set Preferred Price Range"
PREFERENCE_RESPONSE=$(make_request "POST" "/buyers/price-preferences" "$BUYER_TOKEN" '{
    "produce": "POTATOES",
    "min_price": 20.00,
    "max_price": 35.00,
    "quantity": 1000,
    "quantity_unit": "KG",
    "frequency": "WEEKLY"
}')

PREFERENCE_ID=$(echo $PREFERENCE_RESPONSE | jq -r '.id')

# Test 6: Get price preferences
print_test_header "Get Price Preferences"
make_request "GET" "/buyers/price-preferences" "$BUYER_TOKEN"

# Test 7: Update price preference
print_test_header "Update Price Preference"
make_request "PATCH" "/buyers/price-preferences/$PREFERENCE_ID" "$BUYER_TOKEN" '{
    "min_price": 25.00,
    "max_price": 40.00,
    "quantity": 1500
}'

# Test 8: Delete price preference
print_test_header "Delete Price Preference"
make_request "DELETE" "/buyers/price-preferences/$PREFERENCE_ID" "$BUYER_TOKEN"

# Test 9: Get price recommendations
print_test_header "Get Price Recommendations"
make_request "GET" "/buyers/price-recommendations" "$BUYER_TOKEN"

# Test 10: Get price history
print_test_header "Get Price History"
make_request "GET" "/buyers/price-history?produce=TOMATOES&start_date=2024-01-01&end_date=2024-01-31" "$BUYER_TOKEN"

# Test 11: Get price analytics
print_test_header "Get Price Analytics"
make_request "GET" "/buyers/price-analytics" "$BUYER_TOKEN"

# Test 12: Get market insights
print_test_header "Get Market Insights"
make_request "GET" "/buyers/market-insights" "$BUYER_TOKEN"

echo -e "\n${GREEN}Buyer price preferences tests completed!${NC}" 