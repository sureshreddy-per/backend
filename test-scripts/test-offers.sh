#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Offer Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222233" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222244" "BUYER")

# Create test produce first
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Offer Test Produce",
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

# Test 1: Create offer
print_test_header "Create Offer"
OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 50,
    \"price_per_unit\": 45,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')

# Test 2: Get all offers
print_test_header "Get All Offers"
make_request "GET" "/offers" "$FARMER_TOKEN"

# Test 3: Get offer by ID
print_test_header "Get Offer by ID"
make_request "GET" "/offers/$OFFER_ID" "$FARMER_TOKEN"

# Test 4: Reject offer
print_test_header "Reject Offer"
make_request "POST" "/offers/$OFFER_ID/reject" "$FARMER_TOKEN" '{
    "rejection_reason": "Price too low"
}'

# Create another offer for cancel test
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

# Test 5: Cancel offer
print_test_header "Cancel Offer"
make_request "POST" "/offers/$OFFER_ID/cancel" "$BUYER_TOKEN" '{
    "cancellation_reason": "Changed my mind"
}'

# Create another offer for delete test
OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 50,
    \"price_per_unit\": 49,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

OFFER_ID=$(echo $OFFER_RESPONSE | jq -r '.id')

# Test 6: Delete offer
print_test_header "Delete Offer"
make_request "DELETE" "/offers/$OFFER_ID" "$BUYER_TOKEN"

echo -e "\n${GREEN}Offer tests completed!${NC}" 