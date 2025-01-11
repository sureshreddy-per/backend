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

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make an HTTP request to the API
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    
    # Add /api prefix if not already present
    if [[ ! "$endpoint" =~ ^/api ]]; then
        endpoint="/api${endpoint}"
    fi
    
    local url="${API_BASE_URL}${endpoint}"
    local response
    local status_code

    # Build curl command
    local curl_cmd="curl -s -X $method"
    
    # Add headers
    curl_cmd+=" -H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        curl_cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    # Add data if present and method is not GET
    if [ -n "$data" ] && [ "$method" != "GET" ]; then
        curl_cmd+=" -d '$data'"
    fi
    
    # Add URL
    curl_cmd+=" '$url'"
    
    # Execute curl command and capture response
    response=$(eval "$curl_cmd")
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
    
    # Return response
    echo "$response"
    return 0
}

# Check response for errors
check_error() {
    local message="$1"
    if [ $? -ne 0 ]; then
        print_error "$message"
        exit 1
    fi
}

# Get ID from response
get_id() {
    echo "$RESPONSE" | jq -r '.id'
}

# Register admin
print_test_header "Register Admin"
RESPONSE=$(make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222255\",
    \"role\": \"ADMIN\",
    \"name\": \"Test Admin\"
}")

# Request OTP for admin
print_test_header "Request OTP for Admin"
RESPONSE=$(make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222255\"
}")

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for admin
print_test_header "Verify OTP for Admin"
RESPONSE=$(make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222255\",
    \"otp\": \"$OTP\"
}")

ADMIN_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    print_error "Could not extract token from response"
    exit 1
fi

# Register farmer
print_test_header "Register Farmer"
RESPONSE=$(make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222256\",
    \"role\": \"FARMER\",
    \"name\": \"Test Farmer\"
}")

# Request OTP for farmer
print_test_header "Request OTP for Farmer"
RESPONSE=$(make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222256\"
}")

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for farmer
print_test_header "Verify OTP for Farmer"
RESPONSE=$(make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222256\",
    \"otp\": \"$OTP\"
}")

FARMER_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
    print_error "Could not extract token from response"
    exit 1
fi

# Register inspector
print_test_header "Register Inspector"
RESPONSE=$(make_request "POST" "/auth/register" "{
    \"mobile_number\": \"+1111222258\",
    \"role\": \"INSPECTOR\",
    \"name\": \"Test Inspector\"
}")

# Request OTP for inspector
print_test_header "Request OTP for Inspector"
RESPONSE=$(make_request "POST" "/auth/otp/request" "{
    \"mobile_number\": \"+1111222258\"
}")

# Extract OTP from response
OTP=$(echo "$RESPONSE" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
if [ -z "$OTP" ]; then
    print_error "Could not extract OTP from response"
    exit 1
fi

# Verify OTP for inspector
print_test_header "Verify OTP for Inspector"
RESPONSE=$(make_request "POST" "/auth/otp/verify" "{
    \"mobile_number\": \"+1111222258\",
    \"otp\": \"$OTP\"
}")

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

RESPONSE=$(make_request "PATCH" "/inspectors/$INSPECTOR_ID" "{
    \"location\": \"12.9716,77.5946\"
}" "$INSPECTOR_TOKEN")
check_error "Failed to update inspector location"

print_success "Updated inspector location"

# Create farmer profile
print_test_header "Creating farmer profile"
RESPONSE=$(make_request "POST" "/farmers" "{}" "$FARMER_TOKEN")
check_error "Failed to create farmer profile"
FARMER_ID=$(get_id)
print_success "Created farmer profile with ID: $FARMER_ID"

# Create test produce
print_test_header "Creating test produce"
RESPONSE=$(make_request "POST" "/produce" "{
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
}" "$FARMER_TOKEN")
check_error "Failed to create test produce"
PRODUCE_ID=$(get_id)
print_success "Created test produce with ID: $PRODUCE_ID"

# Wait for AI assessment
print_test_header "Waiting for AI assessment"
sleep 2

# Get latest AI assessment
print_test_header "Get Latest AI Assessment"
RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "{}" "$FARMER_TOKEN")

# Test manual inspection flow
print_test_header "Testing Manual Inspection Flow"

# Request inspection
print_test_header "Request Inspection"
RESPONSE=$(make_request "POST" "/quality/inspection/request" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"location\": \"12.9716,77.5946\"
}" "$FARMER_TOKEN")
check_error "Failed to create inspection request"
INSPECTION_ID=$(get_id)
print_success "Created inspection request with ID: $INSPECTION_ID"

# Get inspections by produce
print_test_header "Get Inspections by Produce"
RESPONSE=$(make_request "GET" "/quality/inspection/by-produce/$PRODUCE_ID" "{}" "$FARMER_TOKEN")

# Get inspections by requester
print_test_header "Get Inspections by Requester"
RESPONSE=$(make_request "GET" "/quality/inspection/by-requester" "{}" "$FARMER_TOKEN")

# Get inspections by inspector
print_test_header "Get Inspections by Inspector"
RESPONSE=$(make_request "GET" "/quality/inspection/by-inspector" "{}" "$INSPECTOR_TOKEN")

# Assign inspector
print_test_header "Assign Inspector"
RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/assign" "{}" "$INSPECTOR_TOKEN")

# Submit inspection result
print_test_header "Submit Inspection Result"
RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/submit-result" "{
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
}" "$INSPECTOR_TOKEN")

# Testing Inspection Fee Configuration
print_test_header "Get Base Fee Config"
RESPONSE=$(make_request "GET" "/config/inspection-fees/base" "{}" "$ADMIN_TOKEN")

print_test_header "Update Base Fee Config"
RESPONSE=$(make_request "PUT" "/config/inspection-fees/base" "{
    \"produce_category\": \"VEGETABLES\",
    \"base_fee\": 50
}" "$ADMIN_TOKEN")

print_test_header "Get Distance Fee Config"
RESPONSE=$(make_request "GET" "/config/inspection-fees/distance" "{}" "$ADMIN_TOKEN")

print_test_header "Update Distance Fee Config"
RESPONSE=$(make_request "PUT" "/config/inspection-fees/distance" "{
    \"fee_per_km\": 5,
    \"max_fee\": 500
}" "$ADMIN_TOKEN")

print_success "All inspection tests completed successfully!" 