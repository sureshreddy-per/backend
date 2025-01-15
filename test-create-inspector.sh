#!/bin/bash

BASE_URL="http://localhost:3000/api"

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    if [ -n "$token" ]; then
        curl -s -X "$method" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "${BASE_URL}${endpoint}"
    else
        curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "${BASE_URL}${endpoint}"
    fi
    echo
}

echo "1. Registering new inspector..."
REGISTER_RESPONSE=$(make_request "POST" "/auth/register" '{
    "mobile_number": "+1234567890",
    "role": "INSPECTOR",
    "name": "Test Inspector"
}')
echo "Register response: $REGISTER_RESPONSE"

echo -e "\n2. Requesting OTP..."
OTP_RESPONSE=$(make_request "POST" "/auth/otp/request" '{
    "mobile_number": "+1234567890"
}')
echo "OTP response: $OTP_RESPONSE"

OTP=$(echo "$OTP_RESPONSE" | grep -o '[0-9]\{6\}')
if [ -z "$OTP" ]; then
    echo "Could not extract OTP from response. Please check the response format."
    exit 1
fi

echo -e "\n3. Verifying OTP..."
VERIFY_RESPONSE=$(make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1234567890\",
    \"otp\": \"$OTP\"
}")
echo "Verify response: $VERIFY_RESPONSE"

TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo "Could not extract token from response"
    exit 1
fi

echo -e "\n4. Getting inspector profile..."
PROFILE_RESPONSE=$(make_request "GET" "/inspectors/profile" "" "$TOKEN")
echo "Profile response: $PROFILE_RESPONSE"

INSPECTOR_ID=$(echo "$PROFILE_RESPONSE" | jq -r '.id')
if [ "$INSPECTOR_ID" = "null" ] || [ -z "$INSPECTOR_ID" ]; then
    echo "Could not extract inspector ID from profile response"
    exit 1
fi

echo -e "\n5. Updating inspector location..."
UPDATE_RESPONSE=$(make_request "PATCH" "/inspectors/$INSPECTOR_ID" '{
    "location": "12.9716,77.5946"
}' "$TOKEN")
echo "Update response: $UPDATE_RESPONSE"

echo -e "\n6. Verifying updated profile..."
FINAL_PROFILE=$(make_request "GET" "/inspectors/profile" "" "$TOKEN")
echo "Final profile: $FINAL_PROFILE"

echo "Test completed successfully!"
