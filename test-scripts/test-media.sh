#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Media Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222211" "FARMER")

# Create a test image file
echo "Test image content" > test-image.jpg

# Test 1: Upload media file
print_test_header "Upload Media"
MEDIA_RESPONSE=$(make_request "POST" "/media/upload" "$FARMER_TOKEN" \
    "@test-image.jpg" "multipart/form-data")

MEDIA_ID=$(echo $MEDIA_RESPONSE | jq -r '.id')

# Test 2: Get media by ID
print_test_header "Get Media by ID"
make_request "GET" "/media/$MEDIA_ID" "$FARMER_TOKEN"

# Create test produce with media
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" "{
    \"name\": \"Media Test Produce\",
    \"category\": \"VEGETABLES\",
    \"quantity\": 100,
    \"unit\": \"KG\",
    \"price_per_unit\": 50,
    \"location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"media_ids\": [\"$MEDIA_ID\"]
}")

PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

# Test 3: Get media by entity
print_test_header "Get Media by Entity"
make_request "GET" "/media/by-entity/$PRODUCE_ID" "$FARMER_TOKEN"

# Test 4: Get media by category
print_test_header "Get Media by Category"
make_request "GET" "/media/by-category/PRODUCE_IMAGES" "$FARMER_TOKEN"

# Test 5: Delete media
print_test_header "Delete Media"
make_request "DELETE" "/media/$MEDIA_ID" "$FARMER_TOKEN"

# Cleanup test file
rm -f test-image.jpg

echo -e "\n${GREEN}Media tests completed!${NC}" 