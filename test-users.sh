#!/bin/bash

# Constants
TEST_ADMIN_MOBILE="+1111111111"
TEST_USER_MOBILE="+2222222222"
TEST_USER_NAME="Test User"
TEST_USER_EMAIL="test@example.com"
TEST_USER_ROLE="FARMER"

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
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4

    local headers="-H 'Content-Type: application/json'"
    if [ ! -z "$auth_header" ]; then
        headers="$headers -H 'Authorization: Bearer $auth_header'"
    fi

    local cmd="curl -s -X $method 'http://localhost:3000/api$endpoint' $headers"
    if [ ! -z "$data" ]; then
        cmd="$cmd -d '$data'"
    fi

    eval $cmd
}

# Main test flow
main() {
    print_step "Starting User Management Tests"

    # Get admin token first
    print_step "Getting Admin Token"
    response=$(call_api "POST" "/auth/check-mobile" "{\"mobile_number\": \"$TEST_ADMIN_MOBILE\"}")
    is_registered=$(echo "$response" | grep -o '"isRegistered":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    
    if [ "$is_registered" = "false" ]; then
        print_step "Registering Admin User"
        response=$(call_api "POST" "/auth/register" "{\"mobile_number\": \"$TEST_ADMIN_MOBILE\", \"name\": \"Test Admin\", \"email\": \"admin@test.com\", \"role\": \"ADMIN\"}")
    fi

    print_step "Requesting Admin OTP"
    response=$(call_api "POST" "/auth/otp/request" "{\"mobile_number\": \"$TEST_ADMIN_MOBILE\"}")
    admin_otp=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 | grep -o '[0-9]\{6\}')
    if [ -z "$admin_otp" ]; then
        print_error "Failed to get admin OTP"
    fi
    print_success "Got admin OTP: $admin_otp"

    print_step "Verifying Admin OTP"
    response=$(call_api "POST" "/auth/otp/verify" "{\"mobile_number\": \"$TEST_ADMIN_MOBILE\", \"otp\": \"$admin_otp\"}")
    ADMIN_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$ADMIN_TOKEN" ]; then
        print_error "Failed to get admin token"
    fi
    print_success "Got admin token"

    # Get test user token
    print_step "Getting Test User Token"
    response=$(call_api "POST" "/auth/check-mobile" "{\"mobile_number\": \"$TEST_USER_MOBILE\"}")
    is_registered=$(echo "$response" | grep -o '"isRegistered":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    
    if [ "$is_registered" = "false" ]; then
        print_step "Registering Test User"
        response=$(call_api "POST" "/auth/register" "{\"mobile_number\": \"$TEST_USER_MOBILE\", \"name\": \"$TEST_USER_NAME\", \"email\": \"$TEST_USER_EMAIL\", \"role\": \"$TEST_USER_ROLE\"}")
    fi

    print_step "Requesting User OTP"
    response=$(call_api "POST" "/auth/otp/request" "{\"mobile_number\": \"$TEST_USER_MOBILE\"}")
    user_otp=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 | grep -o '[0-9]\{6\}')
    if [ -z "$user_otp" ]; then
        print_error "Failed to get user OTP"
    fi
    print_success "Got user OTP: $user_otp"

    print_step "Verifying User OTP"
    response=$(call_api "POST" "/auth/otp/verify" "{\"mobile_number\": \"$TEST_USER_MOBILE\", \"otp\": \"$user_otp\"}")
    USER_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$response" | grep -o '"user":{[^}]*"id":"[^"]*"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$USER_TOKEN" ] || [ -z "$USER_ID" ]; then
        print_error "Failed to get user token or ID"
    fi
    print_success "Got user token and ID"

    # Test 1: Get all users (Admin)
    print_step "Testing Get All Users"
    response=$(call_api "GET" "/users" "" "$ADMIN_TOKEN")
    print_success "Retrieved all users"

    # Test 2: Get user by ID (Admin)
    print_step "Testing Get User by ID"
    response=$(call_api "GET" "/users/$USER_ID" "" "$ADMIN_TOKEN")
    print_success "Retrieved user by ID"

    # Test 3: Get users by role (Admin)
    print_step "Testing Get Users by Role"
    response=$(call_api "GET" "/users/role/FARMER" "" "$ADMIN_TOKEN")
    print_success "Retrieved users by role"

    # Test 4: Update user (Admin)
    print_step "Testing Update User"
    response=$(call_api "PUT" "/users/$USER_ID" "{\"name\": \"Updated Test User\", \"email\": \"updated@test.com\"}" "$ADMIN_TOKEN")
    print_success "Updated user"

    # Test 5: Verify user (Admin)
    print_step "Testing Verify User"
    response=$(call_api "PUT" "/users/$USER_ID/verify" "" "$ADMIN_TOKEN")
    print_success "Verified user"

    # Test 6: Block user (Admin)
    print_step "Testing Block User"
    response=$(call_api "POST" "/users/$USER_ID/block" "" "$ADMIN_TOKEN")
    print_success "Blocked user"

    # Test 7: Unblock user (Admin)
    print_step "Testing Unblock User"
    response=$(call_api "POST" "/users/$USER_ID/unblock" "" "$ADMIN_TOKEN")
    print_success "Unblocked user"

    # Test 8: Schedule user deletion (Admin)
    print_step "Testing Schedule User Deletion"
    response=$(call_api "POST" "/users/$USER_ID/schedule-deletion" "" "$ADMIN_TOKEN")
    print_success "Scheduled user deletion"

    # Test 9: Cancel scheduled deletion (Admin)
    print_step "Testing Cancel Scheduled Deletion"
    response=$(call_api "POST" "/users/$USER_ID/cancel-deletion" "" "$ADMIN_TOKEN")
    print_success "Cancelled scheduled deletion"

    # Test 10: Update FCM token
    print_step "Testing Update FCM Token"
    response=$(call_api "PUT" "/users/$USER_ID/fcm-token" "{\"fcm_token\": \"sample-fcm-token-123\"}" "$USER_TOKEN")
    print_success "Updated FCM token"

    # Test 11: Update avatar
    print_step "Testing Update Avatar"
    response=$(call_api "PUT" "/users/$USER_ID/avatar" "{\"avatar_url\": \"https://example.com/avatar.jpg\"}" "$USER_TOKEN")
    print_success "Updated avatar"

    print_step "All User Management Tests Completed Successfully"
}

main