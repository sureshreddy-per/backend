#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Make HTTP request
make_request() {
    local method="$1"
    local endpoint="$2"
    local token="$3"
    local data="$4"
    local response=""
    
    # Remove /api prefix if present
    endpoint=${endpoint#/api}
    # Remove leading slash if present
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    # Debug output
    echo "Debug - Request details:"
    echo "Method: $method"
    echo "Endpoint: ${full_url}"
    [ -n "$data" ] && echo "Data: $data"
    [ -n "$token" ] && echo "Token: ${token:0:20}..."
    
    # Make the request
    if [ -n "$token" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            ${data:+-d "$data"} \
            "${full_url}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "${full_url}")
    fi
    
    # Debug output
    echo "Debug - Raw response: $response"
    
    # Check if the response is empty
    if [ -z "$response" ]; then
        echo "Error: Empty response received"
        return 1
    fi
    
    # Check if the response is valid JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        echo "Error: Invalid JSON response"
        echo "Raw response: $response"
        return 1
    fi
    
    echo "$response"
    return 0
}

# Get auth token
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local token=""
    
    # Check mobile number first
    local check_mobile_data="{\"mobile_number\":\"$mobile\"}"
    local check_response=$(make_request "POST" "/auth/check-mobile" "" "$check_mobile_data")
    local is_registered=$(echo "$check_response" | jq -r '.isRegistered')
    
    if [ "$is_registered" != "true" ]; then
        # Register user
        local email="test.$(echo "$role" | tr '[:upper:]' '[:lower:]' | tr -d ' ')_$(date +%s)@example.com"
        local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"Test $role\",\"role\":\"$role\",\"email\":\"$email\"}"
        local register_response=$(make_request "POST" "/auth/register" "" "$register_data")
        
        if [ $? -ne 0 ]; then
            print_error "Registration failed: $register_response"
            return 1
        fi
    fi
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "" "$otp_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP: $otp_response"
        return 1
    fi
    
    # Extract OTP from response message
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response: $otp_response"
        return 1
    fi
    
    print_success "Got OTP: $otp"
    
    # Verify OTP and get token
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    local verify_response=$(make_request "POST" "/auth/otp/verify" "" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP: $verify_response"
        return 1
    fi
    
    # Extract token from verify response
    token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response: $verify_response"
        return 1
    fi
    
    print_success "Got token for $role"
    echo "$token"
    return 0
}

# Check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "${API_BASE_URL}/health" > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running"
        return 1
    fi
}

# Main test execution
print_test_header "User Management Endpoints"

# Check if server is running
check_server || exit 1

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111111111" "ADMIN")

# Get test user token and ID
USER_TOKEN=$(get_auth_token "+2222222222" "FARMER")
USER_PROFILE=$(make_request "GET" "/auth/profile" "$USER_TOKEN")
USER_ID=$(echo "$USER_PROFILE" | jq -r '.id')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
    print_error "Failed to get user ID"
    exit 1
fi

print_success "Got user ID: $USER_ID"

# Test 1: Get all users (Admin)
print_test_header "Get All Users"
make_request "GET" "/users" "$ADMIN_TOKEN"

# Test 2: Get user by ID (Admin)
print_test_header "Get User by ID"
make_request "GET" "/users/$USER_ID" "$ADMIN_TOKEN"

# Test 3: Get users by role (Admin)
print_test_header "Get Users by Role"
make_request "GET" "/users/role/FARMER" "$ADMIN_TOKEN"

# Test 4: Update user (Admin)
print_test_header "Update User"
UPDATE_DATA='{
    "name": "Updated Test User",
    "email": "updated@test.com"
}'
make_request "PUT" "/users/$USER_ID" "$ADMIN_TOKEN" "$UPDATE_DATA"

# Test 5: Verify user (Admin)
print_test_header "Verify User"
make_request "PUT" "/users/$USER_ID/verify" "$ADMIN_TOKEN"

# Test 6: Block user (Admin)
print_test_header "Block User"
make_request "POST" "/users/$USER_ID/block" "$ADMIN_TOKEN"

# Test 7: Unblock user (Admin)
print_test_header "Unblock User"
make_request "POST" "/users/$USER_ID/unblock" "$ADMIN_TOKEN"

# Test 8: Schedule user deletion (Admin)
print_test_header "Schedule User Deletion"
make_request "POST" "/users/$USER_ID/schedule-deletion" "$ADMIN_TOKEN"

# Test 9: Cancel scheduled deletion (Admin)
print_test_header "Cancel Scheduled Deletion"
make_request "POST" "/users/$USER_ID/cancel-deletion" "$ADMIN_TOKEN"

# Test 10: Update FCM token
print_test_header "Update FCM Token"
FCM_DATA='{
    "fcm_token": "sample-fcm-token-123"
}'
make_request "PUT" "/users/$USER_ID/fcm-token" "$USER_TOKEN" "$FCM_DATA"

# Test 11: Update avatar
print_test_header "Update Avatar"
AVATAR_DATA='{
    "avatar_url": "https://example.com/avatar.jpg"
}'
make_request "PUT" "/users/$USER_ID/avatar" "$USER_TOKEN" "$AVATAR_DATA"

print_success "User management tests completed!" 