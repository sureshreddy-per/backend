#!/bin/bash

# Set API base URL
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

print_header() {
    echo -e "\n${GREEN}$1${NC}"
}

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make HTTP request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local response=""
    
    # Remove /api prefix if present
    endpoint=${endpoint#/api}
    # Remove leading slash if present
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    # Debug output to stderr
    >&2 echo "Debug - Request details:"
    >&2 echo "Method: $method"
    >&2 echo "Endpoint: ${full_url}"
    >&2 echo "Data: $data"
    [ -n "$token" ] && >&2 echo "Token: ${token:0:20}..."
    
    # Make the request
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
    
    # Debug output to stderr
    >&2 echo "Debug - Raw response: $response"
    
    # Check if the response is empty
    if [ -z "$response" ]; then
        >&2 echo "Error: Empty response received"
        return 1
    fi
    
    # Check if the response is valid JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        >&2 echo "Error: Invalid JSON response"
        >&2 echo "Raw response: $response"
        return 1
    fi
    
    echo "$response"
    return 0
}

# Get auth token
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local name="Test $role"
    local token=""
    
    # Check mobile number first
    local check_mobile_data="{\"mobile_number\":\"$mobile\"}"
    local check_response=$(make_request "POST" "/auth/check-mobile" "$check_mobile_data")
    local is_registered=$(echo "$check_response" | jq -r '.isRegistered')
    
    if [ "$is_registered" != "true" ]; then
        # Register user
        local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"test${role,,}@example.com\"}"
        local register_response=$(make_request "POST" "/auth/register" "$register_data")
        
        if [ $? -ne 0 ]; then
            print_error "Registration failed: $register_response"
            return 1
        fi
    fi
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    
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
    local verify_response=$(make_request "POST" "/auth/otp/verify" "$verify_data")
    
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