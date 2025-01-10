#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
API_BASE_URL="http://localhost:3000"

# Print functions
print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_header() {
    echo -e "\n=== $1 ==="
}

print_test() {
    echo -e "\n-> $1"
}

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make an HTTP request to the API
make_request() {
    local method="$1"
    local endpoint="$2"
    local param3="$3"
    local param4="$4"
    local data=""
    local token=""
    
    # Determine which parameter is the token and which is the data
    if [[ "$param3" == *"Bearer"* || "$param3" == "" ]]; then
        token="$param3"
        data="$param4"
    else
        data="$param3"
        token="$param4"
    fi
    
    # Add /api prefix if not already present
    if [[ ! "$endpoint" =~ ^/api ]]; then
        endpoint="/api${endpoint}"
    fi
    
    local url="${API_BASE_URL}${endpoint}"
    local response
    local status_code

    # Build curl command with verbose output
    local curl_cmd="curl -v -X $method"
    
    # Add headers
    curl_cmd+=" -H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        # Remove any newlines from the token
        token=$(echo "$token" | tr -d '\n')
        curl_cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    # Add data if present
    if [ -n "$data" ]; then
        curl_cmd+=" -d '$data'"
    fi
    
    # Add URL
    curl_cmd+=" '$url'"
    
    # Print the curl command for debugging
    echo "Executing: $curl_cmd" >&2
    
    # Execute curl command and capture response
    response=$(eval "$curl_cmd" 2>/dev/null)
    status_code=$?
    
    # Check if curl command failed
    if [ $status_code -ne 0 ]; then
        print_error "Failed to make request to $url (status code: $status_code)"
        return 1
    fi
    
    # Check if response is empty
    if [ -z "$response" ]; then
        print_error "Empty response received"
        return 1
    fi
    
    # Print response for debugging
    echo "Response: $response" >&2
    
    # Return response
    echo "$response"
    return 0
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

# Get auth token for testing
get_auth_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local otp_response
    local verify_response
    local otp
    
    # Try to register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\"}"
    register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    # Request OTP regardless of registration (user might already exist)
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    
    # Extract OTP from response message
    otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response"
        return 1
    fi
    
    # Verify OTP
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    verify_response=$(make_request "POST" "/auth/otp/verify" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    # Extract token from response
    local token=$(echo "$verify_response" | jq -r '.token')
    if [ "$token" = "null" ] || [ -z "$token" ]; then
        print_error "No token found in response"
        return 1
    fi
    
    print_success "Got token for $mobile" >&2
    echo "$token"
    return 0
}

# Cleanup function
cleanup() {
    print_header "Cleaning up test data"
} 