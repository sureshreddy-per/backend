#!/bin/bash

# Configuration
API_BASE_URL="https://backend-production-2944.up.railway.app/api"
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
BUYER_MOBILE="+1234567893"
BUYER_NAME="Test Buyer"

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

    print_test_header "Starting Offer Tests"

    # Get authentication tokens
    print_test_header "Setting up FARMER user"
    local register_data="{\"mobile_number\":\"$FARMER_MOBILE\",\"name\":\"$FARMER_NAME\",\"role\":\"FARMER\",\"email\":\"farmer@test.com\"}"
    echo "Registering farmer with data: $register_data"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "${API_BASE_URL}/auth/register" >/dev/null 2>&1 || true

    echo "Requesting OTP for farmer"
    local otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$FARMER_MOBILE\"}" \
        "${API_BASE_URL}/auth/otp/request")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got farmer OTP: $otp"

    echo "Verifying farmer OTP"
    local verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$FARMER_MOBILE\",\"otp\":\"$otp\"}" \
        "${API_BASE_URL}/auth/otp/verify")
    FARMER_TOKEN=$(echo "$verify_response" | jq -r '.token')
    print_success "Got farmer token: ${FARMER_TOKEN:0:20}..."

    print_test_header "Setting up BUYER user"
    local register_data="{\"mobile_number\":\"$BUYER_MOBILE\",\"name\":\"$BUYER_NAME\",\"role\":\"BUYER\",\"email\":\"buyer@test.com\"}"
    echo "Registering buyer with data: $register_data"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "${API_BASE_URL}/auth/register" >/dev/null 2>&1 || true

    echo "Requesting OTP for buyer"
    local otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$BUYER_MOBILE\"}" \
        "${API_BASE_URL}/auth/otp/request")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got buyer OTP: $otp"

    echo "Verifying buyer OTP"
    local verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$BUYER_MOBILE\",\"otp\":\"$otp\"}" \
        "${API_BASE_URL}/auth/otp/verify")
    BUYER_TOKEN=$(echo "$verify_response" | jq -r '.token')
    print_success "Got buyer token: ${BUYER_TOKEN:0:20}..."

    # Test 1: Create produce
    print_test_header "Testing Create Produce"

    # Check if test images exist
    if [ ! -f "small1.jpg" ] || [ ! -f "small2.jpg" ]; then
        print_error "Test images not found in test-scripts directory"
        exit 1
    fi

    PRODUCE_DATA="{
        \"name\": \"Fresh Tomatoes\",
        \"description\": \"Fresh organic tomatoes\",
        \"product_variety\": \"Roma\",
        \"produce_category\": \"VEGETABLES\",
        \"quantity\": 100,
        \"unit\": \"KG\",
        \"price_per_unit\": 50,
        \"location\": \"12.9716,77.5946\",
        \"location_name\": \"Test Farm\",
        \"harvested_at\": \"2024-02-01T00:00:00Z\",
        \"images\": []
    }"

    echo "Creating produce with data: $PRODUCE_DATA"
    PRODUCE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $FARMER_TOKEN" \
        -F "data=$PRODUCE_DATA" \
        -F "images=@small1.jpg;type=image/jpeg" \
        -F "images=@small2.jpg;type=image/jpeg" \
        "${API_BASE_URL}/produce")

    if [ -z "$PRODUCE_RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi

    echo "Response: $PRODUCE_RESPONSE"
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    if [ -n "$PRODUCE_ID" ] && [ "$PRODUCE_ID" != "null" ]; then
        print_success "Successfully created produce listing with ID: $PRODUCE_ID"
    else
        print_error "Failed to create produce listing"
        exit 1
    fi

    # Test 2: Set buyer preferences
    print_test_header "Testing Set Buyer Preferences"

    # Update buyer profile first
    echo "Updating buyer profile"
    BUYER_UPDATE_DATA=$(cat <<EOF
{
    "business_name": "Test Buyer Business",
    "lat_lng": "12.9716,77.5946",
    "location_name": "Bangalore",
    "address": "123 Test Street, Bangalore"
}
EOF
)
    RESPONSE=$(curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "$BUYER_UPDATE_DATA" \
        "${API_BASE_URL}/buyers/me")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    echo "Updated buyer profile: $RESPONSE"

    # Get buyer details
    echo "Getting buyer details"
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        "${API_BASE_URL}/buyers/me")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi

    echo "Buyer details: $RESPONSE"
    BUYER_ID=$(echo "$RESPONSE" | jq -r '.id')
    USER_ID=$(echo "$RESPONSE" | jq -r '.user_id')
    if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
        print_error "Failed to get user ID"
        exit 1
    fi
    print_success "Got user ID: $USER_ID"

    PREFERENCES_DATA=$(cat <<EOF
{
    "produce_names": ["tomato"],
    "notification_enabled": true,
    "notification_methods": ["EMAIL", "SMS"]
}
EOF
)
    echo "Setting buyer preferences with data: $PREFERENCES_DATA"
    RESPONSE=$(curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "$PREFERENCES_DATA" \
        "${API_BASE_URL}/buyer-preferences")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi

    echo "Response: $RESPONSE"
    if [ $? -eq 0 ]; then
        print_success "Successfully set buyer preferences"
    else
        print_error "Failed to set buyer preferences"
        exit 1
    fi

    # Test 3: Create offer
    print_test_header "Creating offer"

    # Extract farmer_id from produce response
    FARMER_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.farmer_id')
    if [ -z "$FARMER_ID" ] || [ "$FARMER_ID" = "null" ]; then
        print_error "Failed to get farmer ID from produce response"
        exit 1
    fi
    print_success "Got farmer ID: $FARMER_ID"

    OFFER_DATA=$(cat <<EOF
{
  "buyer_id": "$USER_ID",
  "farmer_id": "$FARMER_ID",
  "produce_id": "$PRODUCE_ID",
  "price_per_unit": 45,
  "quantity": 50,
  "buyer_min_price": 40,
  "buyer_max_price": 55,
  "quality_grade": 8,
  "distance_km": 10.5,
  "inspection_fee": 25.5,
  "message": "Initial offer for tomatoes"
}
EOF
)

    OFFER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "$OFFER_DATA" \
        "${API_BASE_URL}/offers")

    if [ -z "$OFFER_RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi

    OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.id')
    if [ -z "$OFFER_ID" ] || [ "$OFFER_ID" = "null" ]; then
        print_error "Failed to get offer ID from response: $OFFER_RESPONSE"
        exit 1
    fi
    print_success "Created offer with ID: $OFFER_ID"

    # Test 4: Get offer details
    print_test_header "Getting offer details"
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        "${API_BASE_URL}/offers/$OFFER_ID")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Got offer details"

    # Test 5: Update offer
    print_test_header "Updating offer"
    UPDATE_DATA=$(cat <<EOF
{
  "price_per_unit": 48,
  "quantity": 55,
  "message": "Updated offer for tomatoes"
}
EOF
)

    RESPONSE=$(curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "$UPDATE_DATA" \
        "${API_BASE_URL}/offers/$OFFER_ID")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Updated offer"

    # Test 6: Accept offer
    print_test_header "Accepting offer"
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        -d "{}" \
        "${API_BASE_URL}/offers/$OFFER_ID/approve")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Accepted offer"

    # Test 7: Get offer history
    print_test_header "Getting offer history"
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        "${API_BASE_URL}/offers?page=1&limit=10")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Got offer history"

    # Test 8: Get active offers
    print_test_header "Getting active offers"
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        "${API_BASE_URL}/offers?page=1&limit=10")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Got active offers"

    # Test 9: Get offer analytics
    print_test_header "Getting offer analytics"
    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $BUYER_TOKEN" \
        "${API_BASE_URL}/offers/stats")

    if [ -z "$RESPONSE" ]; then
        print_error "Empty response received"
        exit 1
    fi
    print_success "Got offer analytics"

    print_success "All offer tests completed successfully"
}

# Run the tests
main