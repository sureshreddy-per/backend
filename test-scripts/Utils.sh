#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
export BASE_URL="https://backend-production-2944.up.railway.app"

# Print test header
print_test_header() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
}

# Print header
print_header() {
    echo -e "\n${YELLOW}$1${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
    return 1
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Make HTTP request
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

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

    echo "$response"
}

# Get user token
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/api/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/api/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}" | jq -r '.isRegistered')
        if [ "$IS_REGISTERED" != "true" ]; then
            print_error "Failed to register user and user does not exist"
            return 1
        fi
    fi

    # Request OTP
    local OTP_RESPONSE=$(make_request "POST" "/api/auth/otp/request" "{\"mobile_number\":\"$mobile\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    local OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$OTP" ]; then
        print_error "Failed to extract OTP"
        return 1
    fi

    # Verify OTP and get token
    local VERIFY_RESPONSE=$(make_request "POST" "/api/auth/otp/verify" "{\"mobile_number\":\"$mobile\",\"otp\":\"$OTP\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi

    echo "$VERIFY_RESPONSE"
    return 0
}

# Check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "${BASE_URL}/api/health" > /dev/null; then
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
    local message="${2:-}"

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
    local error=$(echo "$response" | jq -r '.error // empty')

    if [ -n "$error" ] && [ "$error" != "null" ]; then
        print_error "$error"
        return 1
    fi

    if [ -n "$message" ]; then
        print_success "$message"
    fi

    return 0
}

# Cleanup function
cleanup() {
    print_header "Cleaning up test data"
}