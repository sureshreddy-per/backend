#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# API Configuration
BASE_URL="https://backend-production-2944.up.railway.app/api"

# Test variables
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
TEST_LOCATION="12.9716,77.5946"
TEST_FARM_NAME="Test Farm"

# Utility functions
print_step() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

print_debug() {
    echo -e "${BLUE}DEBUG: $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_error() {
    local response=$1
    local error_message=$2

    if echo "$response" | grep -q '"error"'; then
        print_error "$error_message"
    fi
}

get_id() {
    echo $1 | grep -o '"id":"[^"]*' | cut -d'"' -f4
}

make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4

    print_debug "Making $method request to $endpoint"
    local response=""
    if [ -n "$data" ]; then
        print_debug "Request data: $data"
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "$BASE_URL$endpoint")
    fi
    echo "$response"
}

print_step "Starting Produce Tests"

# Register test farmer
print_step "Registering test farmer"
print_debug "Registering farmer with mobile: $FARMER_MOBILE"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$FARMER_MOBILE\",\"name\":\"$FARMER_NAME\",\"role\":\"FARMER\"}")

print_debug "Registration Response: $REGISTER_RESPONSE"

# Check if user exists and request OTP instead
if echo "$REGISTER_RESPONSE" | grep -q "User already exists"; then
    print_debug "User exists, requesting OTP instead"
    OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/request" \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$FARMER_MOBILE\"}")
    print_debug "OTP Response: $OTP_RESPONSE"
    OTP=$(echo $OTP_RESPONSE | grep -o 'OTP: [0-9]*' | grep -o '[0-9]*')
else
    OTP=$(echo $REGISTER_RESPONSE | grep -o 'OTP: [0-9]*' | grep -o '[0-9]*')
fi

if [ -z "$OTP" ]; then
    print_error "Failed to get test farmer OTP"
fi
print_debug "Test farmer OTP: $OTP"

# Get farmer token
print_step "Getting farmer token"
print_debug "Verifying test farmer OTP"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/verify" \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$FARMER_MOBILE\",\"otp\":\"$OTP\"}")

print_debug "Verify Response: $VERIFY_RESPONSE"
FARMER_TOKEN=$(echo $VERIFY_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$FARMER_TOKEN" ]; then
    print_error "Failed to get farmer token"
fi
print_debug "Farmer token obtained"

# Check if test images exist
if [ ! -f "small1.jpg" ] || [ ! -f "small2.jpg" ]; then
    print_error "Test images not found in test-scripts directory"
fi

# Create test produce with images
print_step "Creating test produce with images"
PRODUCE_DATA="{
    \"name\":\"Test Tomatoes\",
    \"description\":\"Fresh organic tomatoes\",
    \"product_variety\":\"Roma\",
    \"produce_category\":\"VEGETABLES\",
    \"quantity\":100,
    \"unit\":\"KG\",
    \"price_per_unit\":50.00,
    \"location\":\"$TEST_LOCATION\",
    \"location_name\":\"$TEST_FARM_NAME\",
    \"harvested_at\":\"2024-02-01T00:00:00Z\",
    \"images\":[]
}"

PRODUCE_RESPONSE=$(curl -s -X POST "$BASE_URL/produce" \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -F "data=$PRODUCE_DATA" \
    -F "images=@small1.jpg;type=image/jpeg" \
    -F "images=@small2.jpg;type=image/jpeg")

print_debug "Produce creation response: $PRODUCE_RESPONSE"
check_error "$PRODUCE_RESPONSE" "Failed to create produce"
PRODUCE_ID=$(get_id "$PRODUCE_RESPONSE")
print_success "Created produce with ID: $PRODUCE_ID"

# Get produce details
print_step "Getting produce details"
DETAILS_RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "$FARMER_TOKEN")
print_debug "Produce details response: $DETAILS_RESPONSE"
check_error "$DETAILS_RESPONSE" "Failed to get produce details"

# Verify images were uploaded
IMAGE_COUNT=$(echo "$DETAILS_RESPONSE" | grep -o '"images":\[[^]]*\]' | grep -o 'http' | wc -l)
if [ "$IMAGE_COUNT" -ne 2 ]; then
    print_error "Expected 2 images, but got $IMAGE_COUNT"
fi
print_success "Got produce details with $IMAGE_COUNT images"

# Update produce
print_step "Updating produce"
UPDATE_RESPONSE=$(make_request "PATCH" "/produce/$PRODUCE_ID" "$FARMER_TOKEN" "{
    \"price_per_unit\":55.00,
    \"quantity\":90
}")
print_debug "Produce update response: $UPDATE_RESPONSE"
check_error "$UPDATE_RESPONSE" "Failed to update produce"
print_success "Updated produce"

# Get nearby produce
print_step "Finding nearby produce"
NEARBY_RESPONSE=$(make_request "GET" "/produce/nearby?lat=12.9716&lon=77.5946&radius=10" "$FARMER_TOKEN")
print_debug "Nearby produce response: $NEARBY_RESPONSE"
check_error "$NEARBY_RESPONSE" "Failed to find nearby produce"
print_success "Found nearby produce"

echo -e "\n${GREEN}✓ All Produce Tests Completed Successfully${NC}"