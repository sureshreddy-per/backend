#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
FARMER_EMAIL="farmer@test.com"

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

# Authentication function for farmer
authenticate_farmer() {
    print_header "Authenticating farmer"
    
    # Register farmer
    local register_data="{\"mobile_number\":\"$FARMER_MOBILE\",\"name\":\"$FARMER_NAME\",\"role\":\"FARMER\",\"email\":\"$FARMER_EMAIL\"}"
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$FARMER_MOBILE\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    
    if [ -z "$otp" ]; then
        print_error "Failed to get OTP"
        exit 1
    fi
    
    # Verify OTP
    local verify_data="{\"mobile_number\":\"$FARMER_MOBILE\",\"otp\":\"$otp\"}"
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
    print_header "Starting Produce Tests"
    
    # Get authentication token
    TOKEN=$(authenticate_farmer)
    if [ -z "$TOKEN" ]; then
        print_error "Authentication failed"
        exit 1
    fi
    print_success "Authentication successful"
    
    # Test 1: Create farm
    print_header "Testing Create Farm"
    FARM_DATA='{
        "name": "Test Farm",
        "location": {
            "type": "Point",
            "coordinates": [73.123456, 18.123456]
        },
        "address": "Test Farm Address",
        "size": 10.5,
        "size_unit": "ACRES"
    }'
    RESPONSE=$(make_request "POST" "/farms" "$FARM_DATA" "$TOKEN")
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
        "name": "Tomatoes",
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
    RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$TOKEN")
    PRODUCE_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
        print_success "Successfully created produce listing"
    else
        print_error "Failed to create produce listing"
        exit 1
    fi
    
    # Test 3: Get produce listing
    print_header "Testing Get Produce"
    RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved produce listing"
    else
        print_error "Failed to get produce listing"
    fi
    
    # Test 4: Update produce listing
    print_header "Testing Update Produce"
    UPDATE_DATA='{
        "quantity": 90,
        "price_per_unit": 55,
        "description": "Updated description for fresh organic tomatoes"
    }'
    RESPONSE=$(make_request "PATCH" "/produce/$PRODUCE_ID" "$UPDATE_DATA" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated produce listing"
    else
        print_error "Failed to update produce listing"
    fi
    
    # Test 5: List all produce
    print_header "Testing List All Produce"
    RESPONSE=$(make_request "GET" "/produce?page=1&limit=10" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved produce listings"
    else
        print_error "Failed to get produce listings"
    fi
    
    # Test 6: Search produce
    print_header "Testing Search Produce"
    RESPONSE=$(make_request "GET" "/produce/search?query=tomato&page=1&limit=10" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully searched produce"
    else
        print_error "Failed to search produce"
    fi
    
    # Test 7: Get produce by farm
    print_header "Testing Get Produce by Farm"
    RESPONSE=$(make_request "GET" "/farms/$FARM_ID/produce?page=1&limit=10" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved farm produce"
    else
        print_error "Failed to get farm produce"
    fi
    
    # Test 8: Delete produce listing
    print_header "Testing Delete Produce"
    RESPONSE=$(make_request "DELETE" "/produce/$PRODUCE_ID" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully deleted produce listing"
    else
        print_error "Failed to delete produce listing"
    fi
    
    print_header "Produce Tests Completed"
}

# Run the tests
main 