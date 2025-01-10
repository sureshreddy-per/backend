#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_header "Testing Authentication Endpoints"

# Test mobile number check
print_test_header "Check Mobile Number"
response=$(make_request "POST" "/auth/check-mobile" '{"mobile_number":"+1234567890"}')
check_response "$response"

# Check if user is registered
is_registered=$(echo "$response" | jq -r '.isRegistered')

if [ "$is_registered" = "false" ]; then
    # Test registration for new user
    print_test_header "Register User"
    response=$(make_request "POST" "/auth/register" '{"mobile_number":"+1234567890","name":"Test User","role":"FARMER"}')
    check_response "$response"
fi

# Test OTP request
print_test_header "Request OTP"
response=$(make_request "POST" "/auth/otp/request" '{"mobile_number":"+1234567890"}')
check_response "$response"

# Extract OTP from response
otp=$(echo "$response" | grep -o '[0-9]\{6\}')

# Test OTP verification
print_test_header "Verify OTP"
response=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"+1234567890\",\"otp\":\"$otp\"}")
check_response "$response"

# Extract token for further tests
token=$(echo "$response" | jq -r '.token')

# Test token validation
print_test_header "Validate Token"
response=$(make_request "GET" "/auth/validate" "{}" "$token")
check_response "$response"

# Test logout
print_test_header "Logout"
response=$(make_request "POST" "/auth/logout" "{}" "$token")
check_response "$response"

print_success "Authentication tests completed!"

# Cleanup
cleanup 