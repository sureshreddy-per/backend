#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Transaction Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222266" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222277" "BUYER")
INSPECTOR_TOKEN=$(get_auth_token "+1111222288" "INSPECTOR")

# Create test produce
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Transaction Test Produce",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    }
}')

PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

# Create test offer
OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 50,
    \"price_per_unit\": 48,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')

# Test 1: Create transaction
print_test_header "Create Transaction"
TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$FARMER_TOKEN" "{
    \"offer_id\": \"$OFFER_ID\"
}")

TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | jq -r '.id')

# Test 2: Get all transactions
print_test_header "Get All Transactions"
make_request "GET" "/transactions" "$FARMER_TOKEN"

# Test 3: Get transaction by ID
print_test_header "Get Transaction by ID"
make_request "GET" "/transactions/$TRANSACTION_ID" "$FARMER_TOKEN"

# Test 4: Start delivery window
print_test_header "Start Delivery Window"
make_request "POST" "/transactions/$TRANSACTION_ID/start-delivery" "$FARMER_TOKEN"

# Test 5: Confirm delivery
print_test_header "Confirm Delivery"
make_request "POST" "/transactions/$TRANSACTION_ID/confirm-delivery" "$BUYER_TOKEN"

# Test 6: Confirm inspection
print_test_header "Confirm Inspection"
make_request "POST" "/transactions/$TRANSACTION_ID/confirm-inspection" "$INSPECTOR_TOKEN" '{
    "inspection_notes": "Quality matches description",
    "quality_score": 90
}'

# Test 7: Complete transaction
print_test_header "Complete Transaction"
make_request "POST" "/transactions/$TRANSACTION_ID/complete" "$FARMER_TOKEN"

# Create another transaction for reactivation test
OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 30,
    \"price_per_unit\": 49,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')
TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$FARMER_TOKEN" "{
    \"offer_id\": \"$OFFER_ID\"
}")
TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | jq -r '.id')

# Test 8: Reactivate expired transaction
print_test_header "Reactivate Expired Transaction"
make_request "POST" "/transactions/$TRANSACTION_ID/reactivate" "$FARMER_TOKEN"

# Create another transaction for cancellation test
OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 20,
    \"price_per_unit\": 47,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')
TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$FARMER_TOKEN" "{
    \"offer_id\": \"$OFFER_ID\"
}")
TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | jq -r '.id')

# Test 9: Cancel transaction
print_test_header "Cancel Transaction"
make_request "POST" "/transactions/$TRANSACTION_ID/cancel" "$FARMER_TOKEN" '{
    "cancellation_reason": "Unable to fulfill order"
}'

echo -e "\n${GREEN}Transaction tests completed!${NC}" 