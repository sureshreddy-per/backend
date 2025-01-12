#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:3000/api"

# Test data
MOBILE="+1234567890"
NAME="Test User"
EMAIL="test@example.com"
ROLE="FARMER"

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "${BASE_URL}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}"
    fi
}

# Function to print test headers
print_test() {
    echo -e "\n${GREEN}Testing: $1${NC}"
}

# Function to check response
check_response() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

echo "Starting Authentication Tests..."

# Test 1: Check if mobile number exists
print_test "Check Mobile Number"
response=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$MOBILE\"}")
check_response "$response"

# Extract registration status
is_registered=$(echo "$response" | jq -r '.isRegistered')

if [ "$is_registered" = "false" ]; then
    # Test 2: Register new user
    print_test "Register New User"
    response=$(make_request "POST" "/auth/register" "{
        \"mobile_number\":\"$MOBILE\",
        \"name\":\"$NAME\",
        \"email\":\"$EMAIL\",
        \"role\":\"$ROLE\"
    }")
    check_response "$response"
fi

# Test 3: Request OTP
print_test "Request OTP"
response=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$MOBILE\"}")
check_response "$response"

# Extract OTP from response (in development mode)
otp=$(echo "$response" | grep -o '[0-9]\{6\}')

# Test 4: Verify OTP
print_test "Verify OTP"
response=$(make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\":\"$MOBILE\",
    \"otp\":\"$otp\"
}")
check_response "$response"

# Extract token
token=$(echo "$response" | jq -r '.token')

if [ -z "$token" ] || [ "$token" = "null" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi

# Test 5: Validate token
print_test "Validate Token"
response=$(make_request "GET" "/auth/validate" "{}" "$token")
check_response "$response"

# Test 6: Get user profile
print_test "Get User Profile"
response=$(make_request "GET" "/users/me" "{}" "$token")
check_response "$response"

# Test 7: Update FCM token
print_test "Update FCM Token"
user_id=$(echo "$response" | jq -r '.id')
response=$(make_request "PUT" "/users/$user_id/fcm-token" "{\"fcm_token\":\"test-fcm-token\"}" "$token")
check_response "$response"

# Test 8: Update avatar
print_test "Update Avatar"
response=$(make_request "PUT" "/users/$user_id/avatar" "{\"avatar_url\":\"https://example.com/avatar.jpg\"}" "$token")
check_response "$response"

# Test 9: Get notifications
print_test "Get Notifications"
response=$(make_request "GET" "/notifications?page=1&limit=10" "{}" "$token")
check_response "$response"

# Test 10: Get unread notifications count
print_test "Get Unread Notifications Count"
response=$(make_request "GET" "/notifications/unread-count" "{}" "$token")
check_response "$response"

# Test 11: Logout
print_test "Logout"
response=$(make_request "POST" "/auth/logout" "{}" "$token")
check_response "$response"

# Test 12: Verify token is invalidated
print_test "Verify Token is Invalidated"
response=$(make_request "GET" "/auth/validate" "{}" "$token")
if [[ "$response" == *"Unauthorized"* ]]; then
    echo -e "${GREEN}✓ Token successfully invalidated${NC}"
else
    echo -e "${RED}✗ Token still valid${NC}"
    exit 1
fi

# Optional: Test account deletion
if [ "$1" = "--cleanup" ]; then
    print_test "Delete Account"
    # Request new token for deletion
    response=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$MOBILE\"}")
    otp=$(echo "$response" | grep -o '[0-9]\{6\}')
    response=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"$MOBILE\",\"otp\":\"$otp\"}")
    token=$(echo "$response" | jq -r '.token')
    
    response=$(make_request "DELETE" "/auth/account" "{}" "$token")
    check_response "$response"
fi

echo -e "\n${GREEN}All authentication tests completed successfully!${NC}" 