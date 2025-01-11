#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Produce Endpoints"

# Get farmer token and extract user ID
FARMER_AUTH_RESPONSE=$(get_auth_token "+3333333333" "FARMER")
FARMER_TOKEN=$(echo "$FARMER_AUTH_RESPONSE" | jq -r '.token')
FARMER_ID=$(echo "$FARMER_AUTH_RESPONSE" | jq -r '.user.id')

if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
    print_error "Failed to get farmer token"
    exit 1
fi

print_success "Got farmer token and ID: $FARMER_ID"

# Test 1: Create produce listing
print_test_header "Create Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Fresh Tomatoes",
    "description": "Fresh, ripe tomatoes from our farm",
    "product_variety": "Roma",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "kg",
    "price_per_unit": 50.00,
    "location": "12.9716,77.5946",
    "location_name": "Bangalore",
    "images": ["https://example.com/tomatoes1.jpg", "https://example.com/tomatoes2.jpg"],
    "video_url": "https://example.com/tomatoes-video.mp4",
    "harvested_at": "2024-01-20T10:00:00Z"
}')

# Check if produce creation was successful
if [ $? -ne 0 ]; then
    print_error "Failed to create produce"
    exit 1
fi

# Extract produce ID and check if it's valid
PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')
if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
    print_error "Failed to get produce ID from response"
    echo "Response was: $PRODUCE_RESPONSE"
    exit 1
fi

print_success "Created produce with ID: $PRODUCE_ID"

# Test 2: Get all produce with filters
print_test_header "Get All Produce"
make_request "GET" "/produce?page=1&limit=10&category=VEGETABLES&status=PENDING_AI_ASSESSMENT" "$FARMER_TOKEN"

# Test 3: Get my produce
print_test_header "Get My Produce"
make_request "GET" "/produce/my?page=1&limit=10&status=PENDING_AI_ASSESSMENT" "$FARMER_TOKEN"

# Test 3.1: Request AI verification for produce
print_test_header "Request AI Verification"
if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
    make_request "POST" "/produce/request-ai-verification" "$FARMER_TOKEN" "{
        \"produce_id\": \"$PRODUCE_ID\"
    }"
else
    print_warning "Skipping AI verification test - no valid produce ID"
fi

# Test 4: Find nearby produce
print_test_header "Find Nearby Produce"
make_request "GET" "/produce/nearby?lat=12.9716&lon=77.5946&radius=10" "$FARMER_TOKEN"

# Test 5: Get produce by ID
print_test_header "Get Produce by ID"
if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
    make_request "GET" "/produce/$PRODUCE_ID" "$FARMER_TOKEN"
else
    print_warning "Skipping get by ID test - no valid produce ID"
fi

# Test 6: Update produce
print_test_header "Update Produce"
if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
    make_request "PATCH" "/produce/$PRODUCE_ID" "$FARMER_TOKEN" '{
        "quantity": 90,
        "status": "AVAILABLE",
        "images": ["https://example.com/tomatoes1-updated.jpg"],
        "video_url": "https://example.com/tomatoes-video-updated.mp4"
    }'
else
    print_warning "Skipping update test - no valid produce ID"
fi

# Test 7: Delete produce
print_test_header "Delete Produce"
if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
    make_request "DELETE" "/produce/$PRODUCE_ID" "$FARMER_TOKEN"
else
    print_warning "Skipping delete test - no valid produce ID"
fi

echo -e "\n${GREEN}Produce tests completed!${NC}" 