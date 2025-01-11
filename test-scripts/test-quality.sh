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
    local token="$3"
    local data="$4"
    
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

# Get auth token for testing
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local otp_response
    local verify_response
    local otp
    local name="Test ${role}"
    
    # Try to register user first
    local register_data="{\"mobile_number\":\"$mobile\",\"role\":\"$role\",\"name\":\"$name\"}"
    register_response=$(make_request "POST" "/auth/register" "" "$register_data")
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    otp_response=$(make_request "POST" "/auth/otp/request" "" "$otp_data")
    
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
    verify_response=$(make_request "POST" "/auth/otp/verify" "" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    # Return the token
    echo "$verify_response" | jq -r '.token'
    return 0
}

print_test_header "Quality Assessment Endpoints"

# Get tokens for different roles
print_test_header "Getting Admin Token"
ADMIN_TOKEN=$(get_auth_token "+5555555555" "ADMIN")
print_success "Got admin token"

print_test_header "Getting Inspector Token"
INSPECTOR_TOKEN=$(get_auth_token "+6666666666" "INSPECTOR")
print_success "Got inspector token"

print_test_header "Getting Farmer Token"
FARMER_TOKEN=$(get_auth_token "+7777777777" "FARMER")
print_success "Got farmer token"

# Create test produce first
print_test_header "Creating Test Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Quality Test Produce",
    "description": "Test produce for quality assessment",
    "product_variety": "Test Variety",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": ["https://example.com/test-image1.jpg"],
    "harvested_at": "2024-02-01T00:00:00Z"
}')

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
print_success "Created test produce with ID: $PRODUCE_ID"

# Test 1: Create AI assessment (Admin)
print_test_header "Create AI Assessment"
AI_ASSESSMENT_RESPONSE=$(make_request "POST" "/quality/ai-assessment" "$ADMIN_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quality_grade\": 85,
    \"defects\": [\"minor_blemishes\"],
    \"recommendations\": [\"store_in_cool_place\"],
    \"confidence_level\": 0.95,
    \"category_specific_assessment\": {
        \"size\": \"medium\",
        \"color\": \"vibrant\",
        \"ripeness\": \"good\"
    }
}")
print_success "Created AI assessment"

# Test 2: Create inspection assessment (Inspector)
print_test_header "Create Inspection Assessment"
INSPECTION_RESPONSE=$(make_request "POST" "/quality/inspection" "$INSPECTOR_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quality_grade\": 82,
    \"defects\": [\"minor_blemishes\"],
    \"recommendations\": [\"store_in_cool_place\"],
    \"notes\": \"Good quality produce with minor blemishes\",
    \"category_specific_assessment\": {
        \"size\": \"medium\",
        \"color\": \"vibrant\",
        \"ripeness\": \"good\"
    }
}")
print_success "Created inspection assessment"

# Test 3: Get assessments by produce
print_test_header "Get Assessments by Produce"
RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "$FARMER_TOKEN")
print_success "Retrieved assessments by produce"

# Test 4: Get latest assessment
print_test_header "Get Latest Assessment"
RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "$FARMER_TOKEN")
print_success "Retrieved latest assessment"

# Test 5: Get latest manual assessment
print_test_header "Get Latest Manual Assessment"
RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/latest-manual" "$FARMER_TOKEN")
print_success "Retrieved latest manual assessment"

print_success "Quality assessment tests completed!" 