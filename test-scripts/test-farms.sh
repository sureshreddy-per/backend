#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Farm Management Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222268" "Test Farmer" "FARMER")

# Test 1: Create farm
print_test_header "Create Farm"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Green Valley Farm",
    "size": 10.5,
    "address": "123 Farm Road, Rural District",
    "lat_lng": "12.9716-77.5946",
    "image": "https://example.com/farm1.jpg"
}' "$FARMER_TOKEN")

FARM_ID=$(echo $FARM_RESPONSE | jq -r '.id')

# Test 2: Get farm details
print_test_header "Get Farm Details"
make_request "GET" "/farmers/farms/$FARM_ID" "{}" "$FARMER_TOKEN"

# Test 3: Update farm details
print_test_header "Update Farm Details"
make_request "PATCH" "/farmers/farms/$FARM_ID" '{
    "name": "Green Valley Farm - Updated",
    "lat_lng": "12.9720-77.5950"
}' "$FARMER_TOKEN"

echo -e "\n${GREEN}Farm management tests completed!${NC}" 