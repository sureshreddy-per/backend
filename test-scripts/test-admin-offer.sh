#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
ADMIN_MOBILE="+5555555551"
ADMIN_NAME="Test Admin"
BUYER_MOBILE="+5555555552"
BUYER_NAME="Test Buyer"
FARMER_MOBILE="+5555555553"
FARMER_NAME="Test Farmer"

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
    
    # Debug output
    echo "Making $method request to: ${full_url}" >&2
    
    # Format JSON data properly
    if [ -n "$data" ]; then
        # Remove newlines and extra spaces from JSON
        data=$(echo "$data" | jq -c '.')
        echo "Request data: $data" >&2
    fi
    
    # Debug token
    if [ -n "$token" ]; then
        echo "Using auth token: ${token:0:20}..." >&2
    fi
    
    # Make the request
    if [ -n "$token" ]; then
        echo "Sending authenticated request..." >&2
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            ${data:+-d "$data"} \
            "${full_url}" 2>/dev/null)
    else
        echo "Sending unauthenticated request..." >&2
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "${full_url}" 2>/dev/null)
    fi
    
    # Check if the response is empty
    if [ -z "$response" ]; then
        print_error "Empty response received" >&2
        return 1
    fi
    
    # Try to parse response as JSON
    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response: $response" >&2
        return 1
    fi
    
    # Return the response
    echo "$response"
    return 0
}

# Check response
check_response() {
    local response="$1"
    local expected_status="${2:-200}"
    
    if [ -z "$response" ]; then
        print_error "Empty response"
        return 1
    fi
    
    # Try to parse response as JSON
    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response: $response"
        return 1
    fi
    
    # Extract response fields
    local error_msg=$(echo "$response" | jq -r '.message // empty')
    local status_code=$(echo "$response" | jq -r '.statusCode // empty')
    local error=$(echo "$response" | jq -r '.error // empty')
    
    # Special case for expected error messages
    if [ "$error_msg" = "User already exists" ]; then
        print_warning "User already exists, continuing..."
        return 0
    fi
    
    # Check for error message
    if [ -n "$error" ] && [ "$error" != "null" ] && [ "$error" != "false" ]; then
        print_error "$error: $error_msg"
        return 1
    fi
    
    # Check status code if provided in response
    if [ -n "$status_code" ] && [ "$status_code" != "$expected_status" ]; then
        print_error "Unexpected status code: $status_code (expected $expected_status)"
        return 1
    fi
    
    # If we get here, the response is valid
    return 0
}

# Get auth token
get_auth_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$(echo "$role" | tr '[:upper:]' '[:lower:]')@test.com"
    
    # Register user (ignore if already exists)
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}"
    echo "Registering user with data: $register_data"
    local register_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "${API_BASE_URL}/auth/register" 2>/dev/null)
    
    # Check if user exists or was created
    if ! echo "$register_response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response from register: $register_response"
        return 1
    fi
    
    local error_msg=$(echo "$register_response" | jq -r '.message // empty')
    if [[ "$error_msg" != "User already exists" ]] && [[ "$(echo "$register_response" | jq -r '.statusCode // empty')" != "201" ]]; then
        print_error "Failed to register user: $error_msg"
        return 1
    fi
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    echo "Requesting OTP with data: $otp_data"
    local otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$otp_data" \
        "${API_BASE_URL}/auth/otp/request" 2>/dev/null)
    
    if ! echo "$otp_response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response from OTP request: $otp_response"
        return 1
    fi
    
    # Extract OTP from response message
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response: $(echo "$otp_response" | jq -r '.message')"
        return 1
    fi
    
    print_success "Got OTP: $otp"
    
    # Verify OTP and get token
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    echo "Verifying OTP with data: $verify_data"
    local verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$verify_data" \
        "${API_BASE_URL}/auth/otp/verify" 2>/dev/null)
    
    if ! echo "$verify_response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response from OTP verify: $verify_response"
        return 1
    fi
    
    # Extract token
    local token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response: $verify_response"
        return 1
    fi
    
    print_success "Got token: ${token:0:20}..."
    echo "$token"
    return 0
}

# Check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "${API_BASE_URL}/health" > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running. Please start the server first."
        exit 1
    fi
}

# Main test execution
main() {
    check_server
    
    print_test_header "Starting Admin Offer Tests"
    
    # Get authentication tokens
    print_test_header "Setting up ADMIN user"
    ADMIN_RESPONSE=$(make_request "POST" "auth/register" "{\"mobile_number\":\"$ADMIN_MOBILE\",\"name\":\"$ADMIN_NAME\",\"role\":\"ADMIN\",\"email\":\"admin@test.com\"}")
    if [ $? -ne 0 ]; then
        print_warning "Admin user might already exist, continuing..."
    fi
    
    OTP_RESPONSE=$(make_request "POST" "auth/otp/request" "{\"mobile_number\":\"$ADMIN_MOBILE\"}")
    OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got ADMIN OTP: $OTP"
    
    VERIFY_RESPONSE=$(make_request "POST" "auth/otp/verify" "{\"mobile_number\":\"$ADMIN_MOBILE\",\"otp\":\"$OTP\"}")
    ADMIN_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
    if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
        print_error "Failed to get ADMIN token"
        exit 1
    fi
    print_success "Got ADMIN token"
    
    # Setup BUYER
    print_test_header "Setting up BUYER user"
    BUYER_RESPONSE=$(make_request "POST" "auth/register" "{\"mobile_number\":\"$BUYER_MOBILE\",\"name\":\"$BUYER_NAME\",\"role\":\"BUYER\",\"email\":\"buyer@test.com\"}")
    if [ $? -ne 0 ]; then
        print_warning "Buyer user might already exist, continuing..."
    fi
    
    OTP_RESPONSE=$(make_request "POST" "auth/otp/request" "{\"mobile_number\":\"$BUYER_MOBILE\"}")
    OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got BUYER OTP: $OTP"
    
    VERIFY_RESPONSE=$(make_request "POST" "auth/otp/verify" "{\"mobile_number\":\"$BUYER_MOBILE\",\"otp\":\"$OTP\"}")
    BUYER_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
    BUYER_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.user.id')
    if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" = "null" ]; then
        print_error "Failed to get BUYER token"
        exit 1
    fi
    print_success "Got BUYER token"
    
    # Setup FARMER
    print_test_header "Setting up FARMER user"
    FARMER_RESPONSE=$(make_request "POST" "auth/register" "{\"mobile_number\":\"$FARMER_MOBILE\",\"name\":\"$FARMER_NAME\",\"role\":\"FARMER\",\"email\":\"farmer@test.com\"}")
    if [ $? -ne 0 ]; then
        print_warning "Farmer user might already exist, continuing..."
    fi
    
    OTP_RESPONSE=$(make_request "POST" "auth/otp/request" "{\"mobile_number\":\"$FARMER_MOBILE\"}")
    OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got FARMER OTP: $OTP"
    
    VERIFY_RESPONSE=$(make_request "POST" "auth/otp/verify" "{\"mobile_number\":\"$FARMER_MOBILE\",\"otp\":\"$OTP\"}")
    FARMER_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
    FARMER_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.user.id')
    if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
        print_error "Failed to get FARMER token"
        exit 1
    fi
    print_success "Got FARMER token"
    
    # Create buyer profile
    print_test_header "Creating buyer profile"
    BUYER_PROFILE_DATA='{
        "business_name": "Test Buyer Business",
        "address": "123 Test Street, Test City",
        "lat_lng": "12.9716,77.5946"
    }'
    
    BUYER_PROFILE_RESPONSE=$(make_request "POST" "buyers" "$BUYER_PROFILE_DATA" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_warning "Buyer profile might already exist, continuing..."
    else
        print_success "Created buyer profile"
    fi
    
    # Create test produce
    print_test_header "Creating test produce"
    PRODUCE_DATA='{
        "name": "Test Produce",
        "description": "Test produce for admin offer",
        "product_variety": "Test Variety",
        "produce_category": "VEGETABLES",
        "quantity": 100,
        "unit": "KG",
        "price_per_unit": 50,
        "location": "12.9716,77.5946",
        "location_name": "Test Farm",
        "images": ["https://example.com/test.jpg"]
    }'
    
    PRODUCE_RESPONSE=$(make_request "POST" "produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to create produce"
        exit 1
    fi
    
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
        print_error "Failed to get produce ID"
        exit 1
    fi
    print_success "Created produce with ID: $PRODUCE_ID"
    
    FARMER_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.farmer_id')
    if [ -z "$FARMER_ID" ] || [ "$FARMER_ID" = "null" ]; then
        print_error "Failed to get farmer ID from produce response"
        exit 1
    fi
    print_success "Got farmer ID: $FARMER_ID"
    
    # Create admin offer
    print_test_header "Creating admin offer"
    OFFER_DATA="{
        \"buyer_id\": \"$BUYER_ID\",
        \"farmer_id\": \"$FARMER_ID\",
        \"produce_id\": \"$PRODUCE_ID\",
        \"price_per_unit\": 55,
        \"quantity\": 50,
        \"message\": \"Test admin offer\"
    }"
    
    echo "Creating admin offer with data: $OFFER_DATA"
    OFFER_RESPONSE=$(make_request "POST" "/offers/admin" "$OFFER_DATA" "$ADMIN_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to create admin offer"
        exit 1
    fi
    
    echo "Admin offer response: $OFFER_RESPONSE"
    OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.id')
    if [ -z "$OFFER_ID" ] || [ "$OFFER_ID" = "null" ]; then
        print_error "Failed to get offer ID from response: $OFFER_RESPONSE"
        exit 1
    fi
    print_success "Created admin offer with ID: $OFFER_ID"
    
    print_success "All admin offer tests completed successfully"
}

# Run the tests
main 