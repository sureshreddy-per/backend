#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Admin user details
ADMIN_MOBILE="+1111111111"

# Utility functions
print_step() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

check_error() {
    if [[ $1 != 2* ]]; then
        print_error "$2"
    fi
}

print_step "Logging in Admin User"

# Request OTP
print_step "Requesting OTP"
OTP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/request \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$ADMIN_MOBILE\"}")

echo "OTP Response: $OTP_RESPONSE"

# Extract OTP from response
OTP=$(echo $OTP_RESPONSE | grep -o 'OTP sent successfully: [0-9]*' | grep -o '[0-9]*')

if [ -z "$OTP" ]; then
    print_error "Failed to get OTP"
fi

print_step "Verifying OTP"
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/verify \
    -H "Content-Type: application/json" \
    -d "{\"mobile_number\":\"$ADMIN_MOBILE\",\"otp\":\"$OTP\"}")

echo "Verify Response: $VERIFY_RESPONSE"

TOKEN=$(echo $VERIFY_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Failed to verify OTP"
fi

echo -e "\n${GREEN}✓ Admin User Logged In Successfully${NC}" 