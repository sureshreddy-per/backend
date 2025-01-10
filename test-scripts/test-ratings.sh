#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Rating Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222299" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222200" "BUYER")

# Create test produce
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Rating Test Produce",
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

# Create and complete a test transaction
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

TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$FARMER_TOKEN" "{
    \"offer_id\": \"$OFFER_ID\"
}")

TRANSACTION_ID=$(echo $TRANSACTION_RESPONSE | jq -r '.id')

# Complete the transaction (simplified flow for testing)
make_request "POST" "/transactions/$TRANSACTION_ID/complete" "$FARMER_TOKEN"

# Test 1: Create rating (Buyer rating Farmer)
print_test_header "Create Rating (Buyer -> Farmer)"
RATING_RESPONSE=$(make_request "POST" "/ratings" "$BUYER_TOKEN" "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"rating\": 4,
    \"comment\": \"Good quality produce and timely delivery\",
    \"rating_type\": \"BUYER_TO_FARMER\"
}")

RATING_ID=$(echo $RATING_RESPONSE | jq -r '.id')

# Test 2: Create rating (Farmer rating Buyer)
print_test_header "Create Rating (Farmer -> Buyer)"
make_request "POST" "/ratings" "$FARMER_TOKEN" "{
    \"transaction_id\": \"$TRANSACTION_ID\",
    \"rating\": 5,
    \"comment\": \"Great buyer, smooth transaction\",
    \"rating_type\": \"FARMER_TO_BUYER\"
}"

# Test 3: Get received ratings
print_test_header "Get Received Ratings"
make_request "GET" "/ratings/received" "$FARMER_TOKEN"

# Test 4: Get given ratings
print_test_header "Get Given Ratings"
make_request "GET" "/ratings/given" "$FARMER_TOKEN"

# Test 5: Get rating by ID
print_test_header "Get Rating by ID"
make_request "GET" "/ratings/$RATING_ID" "$BUYER_TOKEN"

# Test 6: Get ratings by transaction
print_test_header "Get Ratings by Transaction"
make_request "GET" "/ratings/transaction/$TRANSACTION_ID" "$FARMER_TOKEN"

# Test 7: Delete rating
print_test_header "Delete Rating"
make_request "DELETE" "/ratings/$RATING_ID" "$BUYER_TOKEN"

echo -e "\n${GREEN}Rating tests completed!${NC}" 