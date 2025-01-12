#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
BUYER_MOBILE="+1234567892"
BUYER_NAME="Test Buyer"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Utility functions
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Make HTTP request with proper error handling
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    
    endpoint=${endpoint#/api}
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    local response=""
    if [ -n "$token" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "${full_url}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${full_url}")
    fi
    
    echo "$response"
}

# Authentication function
authenticate() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    
    print_header "Authenticating $role"
    
    # Register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"${role,,}@test.com\"}"
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    
    if [ -z "$otp" ]; then
        print_error "Failed to get OTP"
        exit 1
    fi
    
    # Verify OTP
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    local verify_response=$(make_request "POST" "/auth/otp/verify" "$verify_data")
    local token=$(echo "$verify_response" | jq -r '.token')
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Failed to get authentication token"
        exit 1
    fi
    
    echo "$token"
}

# Main test execution
main() {
    print_header "Starting Offer Tests"
    
    # Get authentication tokens
    FARMER_TOKEN=$(authenticate "$FARMER_MOBILE" "$FARMER_NAME" "FARMER")
    BUYER_TOKEN=$(authenticate "$BUYER_MOBILE" "$BUYER_NAME" "BUYER")
    
    # Test 1: Create farm
    print_header "Testing Create Farm"
    FARM_DATA='{
        "name": "Offer Test Farm",
        "location": {
            "type": "Point",
            "coordinates": [73.123456, 18.123456]
        },
        "address": "Test Farm Address",
        "size": 10.5,
        "size_unit": "ACRES"
    }'
    RESPONSE=$(make_request "POST" "/farms" "$FARM_DATA" "$FARMER_TOKEN")
    FARM_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$FARM_ID" ] && [ "$FARM_ID" != "null" ]; then
        print_success "Successfully created farm"
    else
        print_error "Failed to create farm"
        exit 1
    fi
    
    # Test 2: Create produce listing
    print_header "Testing Create Produce"
    PRODUCE_DATA='{
        "farm_id": "'$FARM_ID'",
        "name": "Fresh Tomatoes",
        "variety": "Roma",
        "quantity": 100,
        "unit": "KG",
        "price_per_unit": 50,
        "harvest_date": "'$(date -v+1d +%Y-%m-%d)'",
        "description": "Fresh organic tomatoes",
        "images": ["https://example.com/tomato.jpg"],
        "certification": "ORGANIC",
        "growing_method": "NATURAL"
    }'
    RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
    PRODUCE_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
        print_success "Successfully created produce listing"
    else
        print_error "Failed to create produce listing"
        exit 1
    fi
    
    # Test 3: Set buyer preferences
    print_header "Testing Set Buyer Preferences"
    PREFERENCES_DATA='{
        "produce_names": ["tomato"],
        "notification_enabled": true,
        "notification_methods": ["EMAIL", "SMS"],
        "preferred_delivery_time": "MORNING",
        "preferred_payment_method": "ONLINE",
        "max_price": 60,
        "min_quantity": 50,
        "delivery_radius": 50
    }'
    RESPONSE=$(make_request "PUT" "/buyers/preferences" "$PREFERENCES_DATA" "$BUYER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully set buyer preferences"
    else
        print_error "Failed to set buyer preferences"
    fi
    
    # Test 4: Create offer
    print_header "Testing Create Offer"
    OFFER_DATA='{
        "produce_id": "'$PRODUCE_ID'",
        "quantity": 50,
        "price_per_unit": 45,
        "delivery_date": "'$(date -v+3d +%Y-%m-%d)'",
        "delivery_location": {
            "type": "Point",
            "coordinates": [73.123456, 18.123456]
        },
        "delivery_address": "Buyer Address, Test City",
        "notes": "Test offer for fresh tomatoes"
    }'
    RESPONSE=$(make_request "POST" "/offers" "$OFFER_DATA" "$BUYER_TOKEN")
    OFFER_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$OFFER_ID" ] && [ "$OFFER_ID" != "null" ]; then
        print_success "Successfully created offer"
    else
        print_error "Failed to create offer"
    fi
    
    # Test 5: Get offer details
    print_header "Testing Get Offer Details"
    RESPONSE=$(make_request "GET" "/offers/$OFFER_ID" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved offer details"
    else
        print_error "Failed to get offer details"
    fi
    
    # Test 6: Update offer
    print_header "Testing Update Offer"
    UPDATE_DATA='{
        "price_per_unit": 48,
        "notes": "Updated offer notes"
    }'
    RESPONSE=$(make_request "PATCH" "/offers/$OFFER_ID" "$UPDATE_DATA" "$BUYER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated offer"
    else
        print_error "Failed to update offer"
    fi
    
    # Test 7: Accept offer
    print_header "Testing Accept Offer"
    RESPONSE=$(make_request "PUT" "/offers/$OFFER_ID/accept" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully accepted offer"
    else
        print_error "Failed to accept offer"
    fi
    
    # Test 8: Get offer history
    print_header "Testing Get Offer History"
    RESPONSE=$(make_request "GET" "/offers/history?page=1&limit=10" "" "$BUYER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved offer history"
    else
        print_error "Failed to get offer history"
    fi
    
    # Test 9: Get active offers
    print_header "Testing Get Active Offers"
    RESPONSE=$(make_request "GET" "/offers/active?page=1&limit=10" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved active offers"
    else
        print_error "Failed to get active offers"
    fi
    
    # Test 10: Get offer analytics
    print_header "Testing Get Offer Analytics"
    RESPONSE=$(make_request "GET" "/offers/analytics" "" "$BUYER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved offer analytics"
    else
        print_error "Failed to get offer analytics"
    fi
    
    print_header "Offer Tests Completed"
}

# Run the tests
main 