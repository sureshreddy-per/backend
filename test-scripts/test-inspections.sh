#!/bin/bash

# Source common test utilities
source "$(dirname "$0")/test-common.sh"

# Register admin
print_test_header "Register Admin"
make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222255\",
    \"role\": \"ADMIN\",
    \"name\": \"Test Admin\"
}" ""

# Request OTP for admin
print_test_header "Request OTP for Admin"
make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222255\"
}" ""

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for admin
print_test_header "Verify OTP for Admin"
make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222255\",
    \"otp\": \"$OTP\"
}" ""

ADMIN_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    print_error "Could not extract token from response"
    exit 1
fi

# Register farmer
print_test_header "Register Farmer"
make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222256\",
    \"role\": \"FARMER\",
    \"name\": \"Test Farmer\"
}" ""

# Request OTP for farmer
print_test_header "Request OTP for Farmer"
make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222256\"
}" ""

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for farmer
print_test_header "Verify OTP for Farmer"
make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222256\",
    \"otp\": \"$OTP\"
}" ""

FARMER_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
    print_error "Could not extract token from response"
    exit 1
fi

# Register inspector
print_test_header "Register Inspector"
make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222258\",
    \"role\": \"INSPECTOR\",
    \"name\": \"Test Inspector\"
}" ""

# Request OTP for inspector
print_test_header "Request OTP for Inspector"
make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222258\"
}" ""

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for inspector
print_test_header "Verify OTP for Inspector"
make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222258\",
    \"otp\": \"$OTP\"
}" ""

INSPECTOR_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ -z "$INSPECTOR_TOKEN" ] || [ "$INSPECTOR_TOKEN" = "null" ]; then
    print_error "Could not extract token from response"
    exit 1
fi

# Update inspector location
print_test_header "Update Inspector Location"
INSPECTOR_ID=$(echo "$RESPONSE" | jq -r '.user.id')
if [ -z "$INSPECTOR_ID" ] || [ "$INSPECTOR_ID" = "null" ]; then
    print_error "Could not extract inspector ID from response"
    exit 1
fi

make_request "PATCH" "/inspectors/$INSPECTOR_ID" "{
    \"location\": \"12.9716,77.5946\"
}" "$INSPECTOR_TOKEN"
check_error "Failed to update inspector location"

print_success "Updated inspector location"

# Get inspector ID from response
INSPECTOR_ID=$(echo "$RESPONSE" | jq -r '.id')
if [ -z "$INSPECTOR_ID" ] || [ "$INSPECTOR_ID" = "null" ]; then
    print_error "Could not extract inspector ID from response"
    exit 1
fi
print_success "Got inspector ID: $INSPECTOR_ID"

# Remove inspector profile creation since it's handled during registration
INSPECTOR_ID=$(echo "$RESPONSE" | jq -r '.user.inspector.id')
if [ -z "$INSPECTOR_ID" ] || [ "$INSPECTOR_ID" = "null" ]; then
    print_error "Could not extract inspector ID from response"
    exit 1
fi
print_success "Got inspector ID: $INSPECTOR_ID"

# Create farmer profile
print_test_header "Creating farmer profile"
make_request "POST" "/farmers" "{}" "$FARMER_TOKEN"
check_error "Failed to create farmer profile"
FARMER_ID=$(get_id)
print_success "Created farmer profile with ID: $FARMER_ID"

# Create test produce
print_test_header "Creating test produce"
make_request "POST" "/produce" "{
    \"name\": \"Test Tomatoes\",
    \"description\": \"Fresh tomatoes for inspection testing\",
    \"product_variety\": \"Roma\",
    \"produce_category\": \"VEGETABLES\",
    \"quantity\": 100,
    \"unit\": \"kg\",
    \"price_per_unit\": 50.00,
    \"location\": \"12.9716,77.5946\",
    \"location_name\": \"Test Farm\",
    \"images\": [\"https://example.com/tomatoes1.jpg\"],
    \"video_url\": \"https://example.com/tomatoes-video.mp4\",
    \"harvested_at\": \"2024-02-01T00:00:00Z\"
}" "$FARMER_TOKEN"
check_error "Failed to create test produce"
PRODUCE_ID=$(get_id)
print_success "Created test produce with ID: $PRODUCE_ID"

# Wait for AI assessment
print_test_header "Waiting for AI assessment"
sleep 2

# Get latest AI assessment
print_test_header "Get Latest AI Assessment"
make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "{}" "$FARMER_TOKEN"

# Test manual inspection flow
print_test_header "Testing Manual Inspection Flow"

# Request inspection
print_test_header "Request Inspection"
make_request "POST" "/quality/inspection/request" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"location\": \"12.9716,77.5946\"
}" "$FARMER_TOKEN"
check_error "Failed to create inspection request"
INSPECTION_ID=$(get_id)
print_success "Created inspection request with ID: $INSPECTION_ID"

# Get inspections by produce
print_test_header "Get Inspections by Produce"
make_request "GET" "/quality/inspection/by-produce/$PRODUCE_ID" "{}" "$FARMER_TOKEN"

# Get inspections by requester
print_test_header "Get Inspections by Requester"
make_request "GET" "/quality/inspection/by-requester" "{}" "$FARMER_TOKEN"

# Get inspections by inspector
print_test_header "Get Inspections by Inspector"
make_request "GET" "/quality/inspection/by-inspector" "{}" "$INSPECTOR_TOKEN"

# Assign inspector
print_test_header "Assign Inspector"
make_request "PUT" "/quality/inspection/$INSPECTION_ID/assign" "{}" "$INSPECTOR_TOKEN"

# Submit inspection result
print_test_header "Submit Inspection Result"
make_request "PUT" "/quality/inspection/$INSPECTION_ID/submit-result" "{
    \"quality_grade\": 8,
    \"defects\": [\"minor_blemishes\"],
    \"recommendations\": [\"store_in_cool_place\"],
    \"images\": [\"https://example.com/inspection1.jpg\"],
    \"notes\": \"Good quality produce with minor issues\",
    \"category_specific_assessment\": {
        \"size\": \"medium\",
        \"color\": \"vibrant\",
        \"ripeness\": \"good\",
        \"sweetness\": \"medium\",
        \"brix_value\": 15,
        \"skin_condition\": \"smooth\"
    }
}" "$INSPECTOR_TOKEN"

# Testing Inspection Fee Configuration
print_test_header "Get Base Fee Config"
make_request "GET" "/config/inspection-fees/base" "{}" "$ADMIN_TOKEN"

print_test_header "Update Base Fee Config"
make_request "PUT" "/config/inspection-fees/base" "{
    \"produce_category\": \"VEGETABLES\",
    \"base_fee\": 50
}" "$ADMIN_TOKEN"

print_test_header "Get Distance Fee Config"
make_request "GET" "/config/inspection-fees/distance" "{}" "$ADMIN_TOKEN"

print_test_header "Update Distance Fee Config"
make_request "PUT" "/config/inspection-fees/distance" "{
    \"fee_per_km\": 5,
    \"max_fee\": 500
}" "$ADMIN_TOKEN"

print_success "All inspection tests completed successfully!" 