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

# Function to extract OTP from response
extract_otp() {
    local response=$1
    echo "$response" | grep -o 'Development mode - OTP: [0-9]*' | grep -o '[0-9]*'
}

# Main test flow
main() {
    print_step "Starting Authentication Tests"

    # Test 1: Check if mobile number exists
    print_step "Testing Check Mobile Number"
    response=$(call_api "POST" "/auth/check-mobile" "{\"mobile_number\": \"$TEST_MOBILE\"}")
    is_registered=$(echo "$response" | grep -o '"isRegistered":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    
    if [ "$is_registered" = "false" ]; then
        # Register new user if not exists
        print_step "Testing User Registration"
        response=$(call_api "POST" "/auth/register" "{\"mobile_number\": \"$TEST_MOBILE\", \"name\": \"$TEST_NAME\", \"email\": \"$TEST_EMAIL\", \"role\": \"$TEST_ROLE\"}")
        otp=$(extract_otp "$response")
        if [ -z "$otp" ]; then
            print_error "Registration failed: $response"
        fi
        print_success "Registration successful"
    else
        print_success "User already exists"
        # Request OTP for existing user
        print_step "Testing OTP Request"
        response=$(call_api "POST" "/auth/otp/request" "{\"mobile_number\": \"$TEST_MOBILE\"}")
        otp=$(extract_otp "$response")
        if [ -z "$otp" ]; then
            print_error "OTP request failed: $response"
        fi
        print_success "OTP request successful"
    fi

    # Test 2: Verify OTP
    print_step "Testing OTP Verification"
    response=$(call_api "POST" "/auth/otp/verify" "{\"mobile_number\": \"$TEST_MOBILE\", \"otp\": \"$otp\"}")
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$token" ]; then
        print_error "OTP verification failed: $response"
    fi
    print_success "OTP verification successful"

    # Test 3: Validate token
    print_step "Testing Token Validation"
    response=$(call_api "GET" "/auth/validate" "" "$token")
    if ! echo "$response" | grep -q '"valid":true'; then
        print_error "Token validation failed: $response"
    fi
    print_success "Token validation successful"

    # Test 4: Logout
    print_step "Testing Logout"
    response=$(call_api "POST" "/auth/logout" "" "$token")
    if ! echo "$response" | grep -q '"message":"Successfully logged out"'; then
        print_error "Logout failed: $response"
    fi
    print_success "Logout successful"

    # Test 5: Verify token is invalidated
    print_step "Testing Token Invalidation"
    response=$(call_api "GET" "/auth/validate" "" "$token")
    if ! echo "$response" | grep -q '"message":"Token has been invalidated"'; then
        print_error "Token invalidation check failed: $response"
    fi
    print_success "Token invalidation verified"

    print_step "All Authentication Tests Completed Successfully"
}

main 