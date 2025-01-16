#!/bin/bash

# Constants
TEST_MOBILE="+1234567890"
TEST_NAME="Test User"
TEST_EMAIL="test@example.com"
TEST_ROLE="BUYER"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Function to make API calls
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local headers="-H 'Content-Type: application/json'"
    if [ ! -z "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi

    local response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        ${data:+-d "$data"} \
        "http://localhost:3000/api$endpoint")

    echo "$response"
}

# Function to extract ID from response
get_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | cut -d'"' -f4
}

# Function to check for errors in response
check_error() {
    if echo "$1" | grep -q '"error":\|"statusCode":[45]'; then
        print_error "API request failed: $1"
    fi
}

# Function to get test token
get_test_token() {
    local role=$1
    local number=${2:-1}
    local mobile="+1234567890${number}"
    local name="Test ${role} ${number}"
    local email="test${role}${number}@example.com"

    # Request OTP
    local otp_response=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\": \"$mobile\"}")
    echo "OTP Response: $otp_response" >&2

    # Extract OTP from response
    local otp=""
    if echo "$otp_response" | grep -q "User not found"; then
        echo "Registering new user..." >&2
        local register_response=$(make_request "POST" "/auth/register" "{
            \"mobile_number\": \"$mobile\",
            \"name\": \"$name\",
            \"email\": \"$email\",
            \"role\": \"$role\"
        }")
        echo "Register Response: $register_response" >&2
        otp=$(echo "$register_response" | grep -o '"OTP sent successfully: [0-9]*"' | grep -o '[0-9]*')
    else
        otp=$(echo "$otp_response" | grep -o '"OTP sent successfully: [0-9]*"' | grep -o '[0-9]*')
    fi

    if [ -z "$otp" ]; then
        echo "Failed to get OTP" >&2
        return 1
    fi
    echo "Got OTP: $otp" >&2

    # Verify OTP and get token
    local verify_response=$(make_request "POST" "/auth/otp/verify" "{
        \"mobile_number\": \"$mobile\",
        \"otp\": \"$otp\"
    }")
    echo "Verify Response: $verify_response" >&2

    local token=$(echo "$verify_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$token" ]; then
        echo "Failed to get token" >&2
        return 1
    fi

    echo "$token"
}

print_step "Starting Farmer and Farm Management Tests"

# Get farmer tokens
print_step "Getting Test Tokens"
FARMER1_TOKEN=$(get_test_token "FARMER" 1)
FARMER2_TOKEN=$(get_test_token "FARMER" 2)
FARMER3_TOKEN=$(get_test_token "FARMER" 3)

if [ -z "$FARMER1_TOKEN" ] || [ -z "$FARMER2_TOKEN" ] || [ -z "$FARMER3_TOKEN" ]; then
    print_error "Failed to get tokens"
    exit 1
fi

# Test 1: Create farmer profiles
print_step "Creating Farmer Profiles"
FARMER1_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER1_TOKEN")
FARMER2_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER2_TOKEN")
FARMER3_RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER3_TOKEN")

# Extract farmer IDs
FARMER1_ID=$(get_id "$FARMER1_RESPONSE")
FARMER2_ID=$(get_id "$FARMER2_RESPONSE")
FARMER3_ID=$(get_id "$FARMER3_RESPONSE")

if [ -z "$FARMER1_ID" ] || [ -z "$FARMER2_ID" ] || [ -z "$FARMER3_ID" ]; then
    print_error "Failed to create farmer profiles"
    exit 1
fi
print_success "Created farmer profiles"

# Test 2: Get farmer profiles
print_step "Getting Farmer Profiles"
PROFILE_RESPONSE=$(make_request "GET" "/farmers/profile" "{}" "$FARMER1_TOKEN")
check_error "$PROFILE_RESPONSE"
print_success "Got farmer profile"

# Test 3: Add farms at different locations
print_step "Adding Farms at Different Locations"

# Farm within 5km radius
FARM1_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Nearby Farm",
    "size_in_acres": 5.5,
    "address": "Plot 1, Farm Road, Rural District",
    "location": "12.9716,77.5946",
    "description": "A farm within 10km radius"
}' "$FARMER1_TOKEN")

# Extract farm1 ID for later tests
FARM1_ID=$(get_id "$FARM1_RESPONSE")
if [ -z "$FARM1_ID" ]; then
    print_error "Failed to create first farm"
    exit 1
fi
print_success "Created first farm"

# Farm just outside 10km radius
FARM2_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Far Farm",
    "size_in_acres": 3.2,
    "address": "Plot 2, Farm Road, Rural District",
    "location": "13.0716,77.5946",
    "description": "A farm outside 10km radius"
}' "$FARMER2_TOKEN")
check_error "$FARM2_RESPONSE"
print_success "Created second farm"

# Farm at exactly 10km radius
FARM3_RESPONSE=$(make_request "POST" "/farmers/farms" '{
    "name": "Border Farm",
    "size_in_acres": 4.8,
    "address": "Plot 3, Farm Road, Rural District",
    "location": "12.9716,77.6946",
    "description": "A farm at 10km radius"
}' "$FARMER3_TOKEN")
check_error "$FARM3_RESPONSE"
print_success "Created third farm"

# Test 4: Get farm details
print_step "Getting Farm Details"
FARM_DETAILS=$(make_request "GET" "/farmers/farms/$FARM1_ID" "{}" "$FARMER1_TOKEN")
check_error "$FARM_DETAILS"
print_success "Got farm details"

# Test 5: Update farm details
print_step "Updating Farm Details"
UPDATE_RESPONSE=$(make_request "PATCH" "/farmers/farms/$FARM1_ID" '{
    "name": "Green Valley Farm - Updated",
    "description": "Updated farm description",
    "size_in_acres": 6.0,
    "location": "12.9816,77.5946"
}' "$FARMER1_TOKEN")
check_error "$UPDATE_RESPONSE"
print_success "Updated farm details"

# Bank Account Tests
print_step "Testing Bank Account Management"

# Add bank account
print_step "Adding bank account"
ADD_BANK_RESPONSE=$(make_request "POST" "/farmers/bank-accounts" '{
    "account_name": "Test Account",
    "account_number": "1234567890",
    "bank_name": "Test Bank",
    "branch_code": "TEST001",
    "is_primary": true
}' "$FARMER1_TOKEN")

BANK_ID=$(get_id "$ADD_BANK_RESPONSE")
if [ -z "$BANK_ID" ]; then
    print_error "Failed to add bank account"
    exit 1
fi
print_success "Added bank account"

# Get bank account details
print_step "Getting bank account details"
GET_BANK_RESPONSE=$(make_request "GET" "/farmers/bank-accounts/$BANK_ID" "{}" "$FARMER1_TOKEN")
check_error "$GET_BANK_RESPONSE"
print_success "Got bank account details"

# Update bank account
print_step "Updating bank account"
UPDATE_BANK_RESPONSE=$(make_request "PATCH" "/farmers/bank-accounts/$BANK_ID" '{
    "account_name": "Updated Test Account",
    "is_primary": false
}' "$FARMER1_TOKEN")
check_error "$UPDATE_BANK_RESPONSE"
print_success "Updated bank account"

# Update user details
print_step "Updating User Details"
UPDATE_USER_RESPONSE=$(make_request "PATCH" "/farmers/profile/user-details" '{
    "name": "Updated Farmer Name",
    "email": "updated.farmer@example.com"
}' "$FARMER1_TOKEN")
check_error "$UPDATE_USER_RESPONSE"
print_success "Updated user details"

# Test 6: Test nearby farmers search with different radiuses
print_step "Testing Nearby Farmers Search"

print_step "Testing 5km radius"
NEARBY_5KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=5" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_5KM"
print_success "Tested 5km radius search"

print_step "Testing 10km radius"
NEARBY_10KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=10" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_10KM"
print_success "Tested 10km radius search"

print_step "Testing 15km radius"
NEARBY_15KM=$(make_request "GET" "/farmers/nearby?lat=12.9716&lng=77.5946&radius=15" "{}" "$FARMER1_TOKEN")
check_error "$NEARBY_15KM"
print_success "Tested 15km radius search"

print_success "All Farmer and Farm Management Tests Completed Successfully"