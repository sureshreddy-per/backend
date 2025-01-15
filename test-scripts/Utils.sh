#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
export BASE_URL="http://localhost:3000"

# Print test header
print_test_header() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
}

# Make HTTP request
make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4

    echo "Debug - Request details:"
    echo "Method: $method"
    echo "Endpoint: ${BASE_URL}${endpoint}"
    echo "Data: $data"

    local response
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "${BASE_URL}${endpoint}")
    fi

    echo "Debug - Raw response: $response"
    echo "$response"
}

# Get authentication token
get_auth_token() {
    local mobile=$1
    local role=$2
    local name="Test $role"
    local email="test.${role,,}@example.com"

    # Check if user exists
    local check_response=$(make_request "POST" "/api/auth/check-mobile" "" "{\"mobile_number\":\"$mobile\"}")
    local is_registered=$(echo "$check_response" | jq -r '.isRegistered')

    if [ "$is_registered" = "false" ]; then
        # Register user
        make_request "POST" "/api/auth/register" "" "{
            \"mobile_number\": \"$mobile\",
            \"name\": \"$name\",
            \"role\": \"$role\",
            \"email\": \"$email\"
        }"
    fi

    # Request OTP
    make_request "POST" "/api/auth/request-otp" "" "{\"mobile_number\":\"$mobile\"}"

    # Get OTP from response (in real scenario, this would come from SMS)
    local otp="123456"

    # Verify OTP and get token
    local token_response=$(make_request "POST" "/api/auth/verify-otp" "" "{
        \"mobile_number\": \"$mobile\",
        \"otp\": \"$otp\"
    }")

    echo "$token_response" | jq -r '.access_token'
}

# Check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "http://localhost:3000/api/health" > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running"
        return 1
    fi
}

# Check response for errors
check_response() {
    local response="$1"
    local expected_status="${2:-200}"

    # Check if response is empty
    if [ -z "$response" ]; then
        print_error "Empty response"
        return 1
    fi

    # Try to parse response as JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        print_error "Invalid JSON response: $response"
        return 1
    fi

    # Check for error message
    local error_msg=$(echo "$response" | jq -r '.message // empty')
    local status_code=$(echo "$response" | jq -r '.statusCode // empty')
    local error=$(echo "$response" | jq -r '.error // empty')

    if [ -n "$error_msg" ] || [ -n "$error" ]; then
        if [[ "$error_msg" =~ "success" ]] || [[ "$error_msg" =~ "OTP sent" ]]; then
            print_success "$error_msg"
            return 0
        fi
        if [ -n "$error" ] && [[ "$error" != "null" ]]; then
            print_error "$error"
            return 1
        fi
    fi

    if [ -n "$status_code" ] && [ "$status_code" != "$expected_status" ]; then
        print_error "Unexpected status code: $status_code (expected $expected_status)"
        return 1
    fi

    return 0
}

# Cleanup function
cleanup() {
    print_header "Cleaning up test data"
}