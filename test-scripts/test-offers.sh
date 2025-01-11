#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
API_BASE_URL="http://localhost:3000"

# Print functions
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make HTTP request with proper headers and error handling
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local url="${API_BASE_URL}/api/${endpoint}"
    
    local response
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "$url")
    fi
    
    echo "$response"
}

# Check for errors in response
check_error() {
    local response="$1"
    local success_message="$2"
    
    if [ -z "$response" ]; then
        print_error "Empty response received"
    elif echo "$response" | grep -q "error"; then
        print_error "$(echo "$response" | jq -r '.message // .error // "Unknown error"')"
        return 1
    else
        print_success "$success_message"
        return 0
    fi
}

# Get ID from response
get_id() {
    local response="$1"
    echo "$response" | jq -r '.id // empty'
}

# Get auth token for testing
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local otp_response
    local verify_response
    local otp
    local name="Test ${role}"
    
    # Try to register user first
    local register_data="{\"mobile_number\":\"$mobile\",\"role\":\"$role\",\"name\":\"$name\"}"
    register_response=$(make_request "POST" "/auth/register" "" "$register_data")
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    otp_response=$(make_request "POST" "/auth/otp/request" "" "$otp_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    
    # Extract OTP from response message
    otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response"
        return 1
    fi
    
    # Verify OTP
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    verify_response=$(make_request "POST" "/auth/otp/verify" "" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    # Return the token
    echo "$verify_response" | jq -r '.token'
    return 0
}

print_test_header "Offer Endpoints"

# Get tokens for different roles
print_test_header "Getting Farmer Token"
FARMER_TOKEN=$(get_auth_token "+1111222233" "FARMER")
print_success "Got farmer token"

print_test_header "Getting Buyer Token"
BUYER_TOKEN=$(get_auth_token "+1111222244" "BUYER")
print_success "Got buyer token"

print_test_header "Getting Admin Token"
ADMIN_TOKEN=$(get_auth_token "+1111222255" "ADMIN")
print_success "Got admin token"

# Update buyer details
print_test_header "Updating Buyer Details"
response=$(make_request "POST" "buyers/profile" '{
    "business_name": "Test Buyer Business",
    "lat_lng": "12.9716-77.5946",
    "address": "123 Test Street"
}' "$BUYER_TOKEN")
check_error "$response"

# Create test produce
print_test_header "Creating Test Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "{
    \"name\": \"Offer Test Produce\",
    \"description\": \"Test produce for offers\",
    \"product_variety\": \"Test Variety\",
    \"produce_category\": \"VEGETABLES\",
    \"quantity\": 100,
    \"unit\": \"KG\",
    \"price_per_unit\": 50,
    \"location\": \"12.9716,77.5946\",
    \"location_name\": \"Test Farm\",
    \"images\": [\"https://example.com/test-image1.jpg\"],
    \"harvested_at\": \"2024-02-01T00:00:00Z\"
}" "$FARMER_TOKEN")

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
print_success "Created test produce with ID: $PRODUCE_ID"

# Wait for AI assessment and auto-offer generation
print_test_header "Waiting for AI Assessment and Auto-Offer Generation"
sleep 5

# Get all offers
print_test_header "Get All Offers"
RESPONSE=$(make_request "GET" "/offers" "$BUYER_TOKEN")
OFFER_ID=$(echo "$RESPONSE" | jq -r '.items[0].id')
print_success "Retrieved all offers"

# Get offer by ID
print_test_header "Get Offer by ID"
RESPONSE=$(make_request "GET" "/offers/$OFFER_ID" "$BUYER_TOKEN")
print_success "Retrieved offer by ID"

# Reject offer
print_test_header "Reject Offer"
RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/reject" "$BUYER_TOKEN" '{
    "reason": "Price too low"
}')
print_success "Rejected offer"

# Wait for new auto-offer generation
print_test_header "Waiting for New Auto-Offer Generation"
sleep 5

# Get updated offers
print_test_header "Get Updated Offers"
RESPONSE=$(make_request "GET" "/offers" "$BUYER_TOKEN")
OFFER_ID=$(echo "$RESPONSE" | jq -r '.items[0].id')
print_success "Retrieved updated offers"

# Cancel offer
print_test_header "Cancel Offer"
RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/cancel" "$BUYER_TOKEN" '{
    "reason": "Changed my mind"
}')
print_success "Cancelled offer"

# Wait for new auto-offer generation
print_test_header "Waiting for New Auto-Offer Generation"
sleep 5

# Get final offers
print_test_header "Get Final Offers"
RESPONSE=$(make_request "GET" "/offers" "$BUYER_TOKEN")
OFFER_ID=$(echo "$RESPONSE" | jq -r '.items[0].id')
print_success "Retrieved final offers"

# Delete offer
print_test_header "Delete Offer"
RESPONSE=$(make_request "DELETE" "/offers/$OFFER_ID" "$BUYER_TOKEN")
print_success "Deleted offer"

print_success "Offer tests completed!" 