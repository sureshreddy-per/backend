#!/bin/bash

# Source common test utilities
source "$(dirname "$0")/test-common.sh"

print_test_header "Farm Management Endpoints"

# Get farmer token
FARMER_TOKEN=$(get_test_token "FARMER")
if [ $? -ne 0 ]; then
    print_error "Failed to get farmer token"
    exit 1
fi

# Test 1: Create farm
print_test_header "Create Farm"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" "$TEST_FARM_DATA" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to create farm"
    exit 1
fi

# Extract farm ID
FARM_ID=$(get_response_id "$FARM_RESPONSE")
if [ $? -ne 0 ]; then
    print_error "Failed to get farm ID"
    exit 1
fi

# Test 2: Get farm details
print_test_header "Get Farm Details"
FARM_DETAILS=$(make_request "GET" "/farmers/farms/$FARM_ID" "{}" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get farm details"
    exit 1
fi

# Test 3: Update farm details
print_test_header "Update Farm Details"
UPDATE_RESPONSE=$(make_request "PATCH" "/farmers/farms/$FARM_ID" '{
    "name": "Green Valley Farm - Updated",
    "location": "12.9720,77.5950"
}' "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to update farm"
    exit 1
fi

print_success "Farm management tests completed!" 