#!/bin/bash

# Constants
TEST_MOBILE="9019940045"
TEST_NAME="Test User"
TEST_EMAIL="test@example.com"
TEST_ROLE="BUYER"
API_URL="https://backend-production-2944.up.railway.app/api"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

print_debug() {
    echo -e "${YELLOW}DEBUG: $1${NC}"
}

# Function to format phone number to E.164 format
format_phone_number() {
    local number=$1
    # Remove any spaces, dashes, or parentheses
    number=$(echo "$number" | tr -d ' -()' )
    # Remove any leading zeros
    number=$(echo "$number" | sed 's/^0*//')
    # If number starts with +91, keep it as is
    if [[ $number == +91* ]]; then
        echo "$number"
    # If number starts with 91, add +
    elif [[ $number == 91* ]]; then
        echo "+$number"
    # Otherwise, add +91
    else
        echo "+91$number"
    fi
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

    local cmd="curl -s -X $method '$API_URL$endpoint' $headers"
    if [ ! -z "$data" ]; then
        cmd="$cmd -d '$data'"
    fi

    # Add -k flag to ignore SSL certificate verification if needed
    cmd="$cmd -k"

    print_debug "Calling API: $method $API_URL$endpoint"
    if [ ! -z "$data" ]; then
        print_debug "Request body: $data"
    fi

    # Execute and store response
    local response
    response=$(eval $cmd)

    # Check if curl command succeeded
    if [ $? -ne 0 ]; then
        print_error "API call failed: Connection error"
        return 1
    fi

    # Check if response is empty
    if [ -z "$response" ]; then
        print_error "API call failed: Empty response"
        return 1
    fi

    print_debug "Response: $response"
    echo "$response"
}

# Function to extract OTP from response
extract_otp() {
    local response=$1
    # Extract message field from JSON response
    local message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    # Extract exactly 6 digits and ensure only one match
    local otp=$(echo "$message" | grep -o '[0-9]\{6\}' | head -n1 | tr -d '\n')
    echo -n "$otp"
}

# Main test flow
main() {
    print_step "Starting Authentication Tests against $API_URL"

    # Format the test mobile number
    TEST_MOBILE=$(format_phone_number "$TEST_MOBILE")
    print_debug "Using formatted mobile number: $TEST_MOBILE"

    # Request OTP first
    print_step "Testing OTP Request"
    response=$(call_api "POST" "/auth/otp/request" "{\"mobile_number\": \"$TEST_MOBILE\"}")
    if [ $? -ne 0 ]; then
        print_error "OTP request API call failed"
    fi

    # If user doesn't exist, try registration
    if echo "$response" | grep -q "User not found"; then
        print_step "User not found, attempting registration"
        response=$(call_api "POST" "/auth/register" "{\"mobile_number\": \"$TEST_MOBILE\", \"name\": \"$TEST_NAME\", \"email\": \"$TEST_EMAIL\", \"role\": \"$TEST_ROLE\"}")

        # Check for registration errors
        if echo "$response" | grep -q '"error"'; then
            print_error "Registration failed: $response"
        fi
        print_success "Registration successful"

        # Request OTP again after registration
        print_step "Requesting OTP after registration"
        response=$(call_api "POST" "/auth/otp/request" "{\"mobile_number\": \"$TEST_MOBILE\"}")
    fi

    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        print_error "OTP request failed: $response"
    fi

    otp=$(extract_otp "$response")
    if [ -z "$otp" ]; then
        print_error "Failed to extract OTP from response: $response"
    fi
    print_success "OTP request successful"

    # Test 2: Verify OTP
    print_step "Testing OTP Verification"
    print_debug "Using OTP: $otp"
    response=$(call_api "POST" "/auth/otp/verify" "{\"mobile_number\": \"$TEST_MOBILE\", \"otp\": \"$otp\"}")
    if [ $? -ne 0 ]; then
        print_error "OTP verification API call failed"
    fi

    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        print_error "OTP verification failed: $response"
    fi

    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$token" ]; then
        print_error "Failed to extract token from response: $response"
    fi
    print_success "OTP verification successful"

    # Test 3: Validate token
    print_step "Testing Token Validation"
    response=$(call_api "GET" "/auth/validate" "" "$token")
    if [ $? -ne 0 ]; then
        print_error "Token validation API call failed"
    fi

    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        print_error "Token validation failed: $response"
    fi

    if ! echo "$response" | grep -q '"valid":true'; then
        print_error "Token validation failed: $response"
    fi
    print_success "Token validation successful"

    # Test 4: Logout
    print_step "Testing Logout"
    response=$(call_api "POST" "/auth/logout" "" "$token")
    if [ $? -ne 0 ]; then
        print_error "Logout API call failed"
    fi

    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        print_error "Logout failed: $response"
    fi

    if ! echo "$response" | grep -q '"message":"Successfully logged out"'; then
        print_error "Logout failed: $response"
    fi
    print_success "Logout successful"

    # Test 5: Verify token is invalidated
    print_step "Testing Token Invalidation"
    response=$(call_api "GET" "/auth/validate" "" "$token")
    if [ $? -ne 0 ]; then
        print_error "Token invalidation check API call failed"
    fi

    # We expect an error here since token should be invalid
    if ! echo "$response" | grep -q '"message":"Token has been invalidated"'; then
        print_error "Token invalidation check failed: $response"
    fi
    print_success "Token invalidation verified"

    print_step "All Authentication Tests Completed Successfully"
}

main