#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test variables
TEST_MOBILE="+1234567890"
TEST_BUSINESS="Test Business"
TEST_ADDRESS="123 Test St"
TEST_LOCATION="12.9716,77.5946"

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
            "http://localhost:3000/api$endpoint")
    else
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "http://localhost:3000/api$endpoint")
    fi
    echo "$response"
}

print_step "Starting Buyer Tests"

# Register test user as BUYER
print_step "Registering test user"
print_debug "Registering test user with mobile: $TEST_MOBILE"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$TEST_MOBILE\",\"name\":\"Test User\",\"role\":\"BUYER\"}")

print_debug "Registration Response: $REGISTER_RESPONSE"

# Check if user exists and request OTP instead
if echo "$REGISTER_RESPONSE" | grep -q "User already exists"; then
    print_debug "User exists, requesting OTP instead"
    OTP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/request \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$TEST_MOBILE\"}")
    print_debug "OTP Response: $OTP_RESPONSE"
    OTP=$(echo $OTP_RESPONSE | grep -o 'OTP sent successfully: [0-9]*' | grep -o '[0-9]*')
else
    OTP=$(echo $REGISTER_RESPONSE | grep -o 'OTP sent: [0-9]*' | grep -o '[0-9]*')
fi

if [ -z "$OTP" ]; then
    print_error "Failed to get test user OTP"
fi
print_debug "Test user OTP: $OTP"

# Get buyer token
print_step "Getting buyer token"
print_debug "Verifying test user OTP"
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/verify \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$TEST_MOBILE\",\"otp\":\"$OTP\"}")

print_debug "Verify Response: $VERIFY_RESPONSE"
BUYER_TOKEN=$(echo $VERIFY_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$BUYER_TOKEN" ]; then
    print_error "Failed to get buyer token"
fi
print_debug "Buyer token obtained"

# Get initial buyer details
print_step "Getting initial buyer details"
INITIAL_DETAILS_RESPONSE=$(make_request "GET" "/buyers/me" "$BUYER_TOKEN")
print_debug "Initial buyer details response: $INITIAL_DETAILS_RESPONSE"
check_error "$INITIAL_DETAILS_RESPONSE" "Failed to get initial buyer details"
print_success "Got initial buyer details"

# Update buyer profile
print_step "Updating buyer profile"
UPDATE_RESPONSE=$(make_request "PUT" "/buyers/me" "$BUYER_TOKEN" \
    "{\"business_name\":\"$TEST_BUSINESS\",\"address\":\"$TEST_ADDRESS\",\"location\":\"$TEST_LOCATION\"}")
print_debug "Update profile response: $UPDATE_RESPONSE"
check_error "$UPDATE_RESPONSE" "Failed to update buyer profile"

# Get updated buyer details
print_step "Getting updated buyer details"
DETAILS_RESPONSE=$(make_request "GET" "/buyers/me" "$BUYER_TOKEN")
print_debug "Updated buyer details response: $DETAILS_RESPONSE"
check_error "$DETAILS_RESPONSE" "Failed to get updated buyer details"
print_success "Got updated buyer details"

# Update buyer preferences
print_step "Updating buyer preferences"
PREFS_RESPONSE=$(make_request "PUT" "/buyer-preferences" "$BUYER_TOKEN" \
    "{\"produce_names\":[\"Tomato\",\"Potato\"],\"notification_enabled\":true,\"notification_methods\":[\"EMAIL\"]}")
print_debug "Update preferences response: $PREFS_RESPONSE"
check_error "$PREFS_RESPONSE" "Failed to update preferences"

# Get buyer preferences
print_step "Getting buyer preferences"
PREFS_GET_RESPONSE=$(make_request "GET" "/buyer-preferences" "$BUYER_TOKEN")
print_debug "Get preferences response: $PREFS_GET_RESPONSE"
check_error "$PREFS_GET_RESPONSE" "Failed to get preferences"

# Find nearby buyers
print_step "Finding nearby buyers"
NEARBY_RESPONSE=$(make_request "GET" "/buyers/nearby?lat=12.9716&lng=77.5946&radius=10" "$BUYER_TOKEN")
print_debug "Nearby buyers response: $NEARBY_RESPONSE"
check_error "$NEARBY_RESPONSE" "Failed to find nearby buyers"

echo -e "\n${GREEN}✓ All Buyer Tests Completed Successfully${NC}"