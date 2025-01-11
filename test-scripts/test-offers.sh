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

# Make HTTP request with proper error handling
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local response=""
    local http_code=""
    local headers=""
    local body=""
    
    # Remove /api prefix if present
    endpoint=${endpoint#/api}
    # Remove leading slash if present
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    # Debug output
    >&2 echo "Debug - Request details:"
    >&2 echo "Method: $method"
    >&2 echo "Endpoint: ${full_url}"
    >&2 echo "Data: $data"
    [ -n "$token" ] && >&2 echo "Token: ${token:0:20}..."
    
    # Temporary file for response
    local tmp_file=$(mktemp)
    
    # Build curl command
    local curl_cmd="curl -s -X $method"
    curl_cmd+=" -H 'Content-Type: application/json'"
    
    if [ -n "$token" ]; then
        # Remove any newlines and whitespace from token
        token=$(echo "$token" | tr -d '\n' | tr -d ' ')
        curl_cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        # Properly escape the data
        data=$(echo "$data" | sed 's/"/\\"/g')
        curl_cmd+=" -d \"$data\""
    fi
    
    # Add output handling
    curl_cmd+=" -D '${tmp_file}.headers'"
    curl_cmd+=" -o '${tmp_file}.body'"
    curl_cmd+=" -w '%{http_code}'"
    curl_cmd+=" '${full_url}'"
    curl_cmd+=" > '${tmp_file}.code'"
    
    # Debug the curl command
    >&2 echo "Debug - Curl command:"
    >&2 echo "$curl_cmd"
    
    # Execute the curl command
    eval "$curl_cmd"
    
    # Read status code, headers and body
    http_code=$(cat "${tmp_file}.code")
    headers=$(cat "${tmp_file}.headers")
    body=$(cat "${tmp_file}.body")
    
    # Debug output
    >&2 echo "Debug - HTTP Status Code: $http_code"
    >&2 echo "Debug - Response Headers:"
    >&2 echo "$headers"
    >&2 echo "Debug - Response Body:"
    >&2 echo "$body"
    
    # Cleanup temp files
    rm -f "${tmp_file}" "${tmp_file}.headers" "${tmp_file}.body" "${tmp_file}.code"
    
    # Check if the response is empty
    if [ -z "$body" ] && [ "$http_code" != "204" ]; then
        >&2 echo "Error: Empty response received (Status Code: $http_code)"
        return 1
    fi
    
    # Check if the status code indicates success
    if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
        >&2 echo "Error: Request failed with status code $http_code"
        if [ -n "$body" ]; then
            echo "$body"
        fi
        return 1
    fi
    
    # If we have a body, check if it's valid JSON
    if [ -n "$body" ]; then
        if ! echo "$body" | jq . >/dev/null 2>&1; then
            >&2 echo "Error: Invalid JSON response"
            >&2 echo "Raw response: $body"
            return 1
        fi
        echo "$body"
    fi
    
    return 0
}

# Get auth token with proper error handling
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local name="Test ${role}"
    local email="test.$(echo "$role" | tr '[:upper:]' '[:lower:]')@test.com"
    local token=""
    
    # Check mobile number first
    local check_mobile_data="{\"mobile_number\":\"$mobile\"}"
    local check_response=$(make_request "POST" "/auth/check-mobile" "$check_mobile_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Mobile check failed, proceeding with registration"
    fi
    
    # Register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}"
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Registration failed, user might already exist"
    fi
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    
    # Extract OTP from response message
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response"
        return 1
    fi
    
    # Verify OTP and get token
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    local verify_response=$(make_request "POST" "/auth/otp/verify" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    # Extract token from verify response
    token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response"
        return 1
    fi
    
    # Clean and return the token
    echo "$token" | tr -d '\n' | tr -d ' '
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

# Check required commands
check_requirements() {
    local missing_reqs=0
    
    echo "Checking requirements..."
    
    # Check for curl
    if ! command -v curl >/dev/null 2>&1; then
        print_error "curl is required but not installed"
        missing_reqs=1
    fi
    
    # Check for jq
    if ! command -v jq >/dev/null 2>&1; then
        print_error "jq is required but not installed"
        missing_reqs=1
    fi
    
    # Check for tr
    if ! command -v tr >/dev/null 2>&1; then
        print_error "tr is required but not installed"
        missing_reqs=1
    fi
    
    if [ $missing_reqs -eq 1 ]; then
        print_error "Please install missing requirements and try again"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Cleanup function
cleanup() {
    print_header "Cleaning up..."
    # Add any cleanup tasks here if needed
    print_success "Cleanup completed"
}

# Set up trap for cleanup on script exit
trap cleanup EXIT

# Main execution
print_header "Starting Offer Tests"

# Check requirements first
check_requirements

# Check if server is running
check_server || exit 1

print_header "Testing: Offer Endpoints"

# Get tokens for different roles
print_test_header "Getting Farmer Token"
FARMER_TOKEN=""
FARMER_TOKEN_RESPONSE=$(get_auth_token "+1111222233" "FARMER")
if [ $? -eq 0 ]; then
    FARMER_TOKEN="$FARMER_TOKEN_RESPONSE"
    print_success "Got farmer token: ${FARMER_TOKEN:0:20}..."
else
    print_error "Failed to get farmer token"
    exit 1
fi

print_test_header "Getting Buyer Token"
BUYER_TOKEN=""
BUYER_TOKEN_RESPONSE=$(get_auth_token "+1111222244" "BUYER")
if [ $? -eq 0 ]; then
    BUYER_TOKEN="$BUYER_TOKEN_RESPONSE"
    print_success "Got buyer token: ${BUYER_TOKEN:0:20}..."
else
    print_error "Failed to get buyer token"
    exit 1
fi

print_test_header "Getting Admin Token"
ADMIN_TOKEN=""
ADMIN_TOKEN_RESPONSE=$(get_auth_token "+1111222255" "ADMIN")
if [ $? -eq 0 ]; then
    ADMIN_TOKEN="$ADMIN_TOKEN_RESPONSE"
    print_success "Got admin token: ${ADMIN_TOKEN:0:20}..."
else
    print_error "Failed to get admin token"
    exit 1
fi

# Update buyer details
print_test_header "Updating Buyer Details"
BUYER_UPDATE_DATA='{
    "business_name": "Test Buyer Business",
    "lat_lng": "12.9716,77.5946",
    "address": "123 Test Street"
}'
BUYER_UPDATE_RESPONSE=$(make_request "POST" "/buyers/details/update" "$BUYER_UPDATE_DATA" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Updated buyer details"
    echo "Debug - Buyer Update Response: $BUYER_UPDATE_RESPONSE"
else
    print_error "Failed to update buyer details"
    echo "Debug - Error Response: $BUYER_UPDATE_RESPONSE"
fi

# Create test produce
echo -e "\nTesting: Creating Test Produce"
PRODUCE_DATA='{
    "name": "Offer Test Produce",
    "description": "Test produce for offers",
    "product_variety": "Test Variety",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 45.00,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": ["https://example.com/test-image1.jpg"],
    "harvested_at": "2024-02-01T00:00:00Z"
}'

PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
if [ $? -eq 0 ]; then
    echo "✓ Created test produce"
    echo "Debug - Produce Response: $PRODUCE_RESPONSE"
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    echo "Debug - Produce ID: $PRODUCE_ID"
else
    echo "ERROR: Failed to create produce"
    echo "Debug - Error Response: $PRODUCE_RESPONSE"
    cleanup
    exit 1
fi

# Wait for AI assessment and auto-offer generation
echo -e "\nWaiting for AI assessment and auto-offer generation..."
sleep 15  # Increased wait time to ensure AI assessment completes

# Create test offer directly
echo -e "\nTesting: Creating Test Offer"
OFFER_DATA='{
    "produce_id": "'$PRODUCE_ID'",
    "price": 45.00,
    "quantity": 100,
    "message": "Test offer for produce",
    "metadata": {
        "inspection_result": {
            "quality_grade": 6,
            "distance_km": 0,
            "inspection_fee": 60
        }
    }
}'

OFFER_RESPONSE=$(make_request "POST" "/offers" "$OFFER_DATA" "$BUYER_TOKEN")
if [ $? -eq 0 ]; then
    echo "✓ Created test offer"
    echo "Debug - Offer Response: $OFFER_RESPONSE"
    OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.id')
    echo "Debug - Offer ID: $OFFER_ID"
else
    echo "ERROR: Failed to create offer"
    echo "Debug - Error Response: $OFFER_RESPONSE"
    cleanup
    exit 1
fi

# Wait for AI assessment and auto-offer generation
echo -e "\nWaiting for AI assessment and auto-offer generation..."
sleep 15  # Increased wait time to ensure AI assessment completes

# Function to get offers with retry
get_offers_with_retry() {
    local max_attempts=5
    local attempt=1
    local wait_time=5

    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt to get offers..."
        OFFERS_RESPONSE=$(make_request "GET" "/offers" "" "$BUYER_TOKEN")
        if [ $? -eq 0 ]; then
            local total_offers=$(echo "$OFFERS_RESPONSE" | jq -r '.total')
            if [ "$total_offers" -gt 0 ]; then
                echo "✓ Found $total_offers offers"
                echo "Debug - Offers Response: $OFFERS_RESPONSE"
                return 0
            fi
        fi
        echo "No valid offers found, waiting $wait_time seconds before retry..."
        sleep $wait_time
        attempt=$((attempt + 1))
    done
    echo "ERROR: No valid offers found after $max_attempts attempts"
    return 1
}

# Wait for AI assessment and auto-offer generation
echo -e "\nWaiting for AI assessment and auto-offer generation..."
sleep 15  # Increased wait time to ensure AI assessment completes

# Get all offers
echo -e "\nTesting: Getting All Offers"
if ! get_offers_with_retry; then
    echo "ERROR: Failed to get offers"
    cleanup
    exit 1
fi

# Get the first offer ID
OFFER_ID=$(echo "$OFFERS_RESPONSE" | jq -r '.items[0].id')
if [ -z "$OFFER_ID" ] || [ "$OFFER_ID" = "null" ]; then
    echo "ERROR: No valid offer ID found"
    cleanup
    exit 1
fi

# Test rejecting an offer
echo -e "\nTesting: Rejecting Offer"
REJECT_DATA='{
    "reason": "Test rejection"
}'
REJECT_RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/reject" "$REJECT_DATA" "$BUYER_TOKEN")
if [ $? -eq 0 ]; then
    echo "✓ Rejected offer"
    echo "Debug - Reject Response: $REJECT_RESPONSE"
else
    echo "ERROR: Failed to reject offer"
    echo "Debug - Error Response: $REJECT_RESPONSE"
    cleanup
    exit 1
fi

# Wait for new auto-offer generation
echo -e "\nWaiting for new auto-offer generation..."
sleep 15

# Get all offers again
echo -e "\nTesting: Getting All Offers Again"
if ! get_offers_with_retry; then
    echo "ERROR: Failed to get offers"
    cleanup
    exit 1
fi

# Get the first offer ID
OFFER_ID=$(echo "$OFFERS_RESPONSE" | jq -r '.items[0].id')
if [ -z "$OFFER_ID" ] || [ "$OFFER_ID" = "null" ]; then
    echo "ERROR: No valid offer ID found"
    cleanup
    exit 1
fi

# Test cancelling an offer
echo -e "\nTesting: Cancelling Offer"
CANCEL_DATA='{
    "reason": "Test cancellation"
}'
CANCEL_RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/cancel" "$CANCEL_DATA" "$BUYER_TOKEN")
if [ $? -eq 0 ]; then
    echo "✓ Cancelled offer"
    echo "Debug - Cancel Response: $CANCEL_RESPONSE"
else
    echo "ERROR: Failed to cancel offer"
    echo "Debug - Error Response: $CANCEL_RESPONSE"
    cleanup
    exit 1
fi

# Get offer by ID
print_test_header "Get Offer by ID"
OFFER_RESPONSE=$(make_request "GET" "/offers/$OFFER_ID" "" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Retrieved offer by ID"
    echo "Debug - Offer Response: $OFFER_RESPONSE"
else
    print_error "Failed to get offer by ID"
    echo "Debug - Error Response: $OFFER_RESPONSE"
fi

# Reject offer
print_test_header "Reject Offer"
REJECT_DATA='{
    "reason": "Price too low"
}'
REJECT_RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/reject" "$REJECT_DATA" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Rejected offer"
    echo "Debug - Reject Response: $REJECT_RESPONSE"
else
    print_error "Failed to reject offer"
    echo "Debug - Error Response: $REJECT_RESPONSE"
fi

# Wait for new auto-offer generation
print_test_header "Waiting for New Auto-Offer Generation"
sleep 5

# Get updated offers
print_test_header "Get Updated Offers"
UPDATED_OFFERS_RESPONSE=$(make_request "GET" "/offers" "" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Retrieved updated offers"
    echo "Debug - Updated Offers Response: $UPDATED_OFFERS_RESPONSE"
    NEW_OFFER_ID=$(echo "$UPDATED_OFFERS_RESPONSE" | jq -r '.items[0].id')
    if [ -n "$NEW_OFFER_ID" ] && [ "$NEW_OFFER_ID" != "null" ]; then
        print_success "Got new offer ID: $NEW_OFFER_ID"
        OFFER_ID=$NEW_OFFER_ID
    else
        print_warning "No new offers found"
    fi
else
    print_error "Failed to get updated offers"
    echo "Debug - Error Response: $UPDATED_OFFERS_RESPONSE"
fi

# Cancel offer
print_test_header "Cancel Offer"
CANCEL_DATA='{
    "reason": "Changed my mind"
}'
CANCEL_RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/cancel" "$CANCEL_DATA" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Cancelled offer"
    echo "Debug - Cancel Response: $CANCEL_RESPONSE"
else
    print_error "Failed to cancel offer"
    echo "Debug - Error Response: $CANCEL_RESPONSE"
fi

# Delete offer
print_test_header "Delete Offer"
DELETE_RESPONSE=$(make_request "DELETE" "/offers/$OFFER_ID" "" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Deleted offer"
    echo "Debug - Delete Response: $DELETE_RESPONSE"
else
    print_error "Failed to delete offer"
    echo "Debug - Error Response: $DELETE_RESPONSE"
fi

print_success "Offer tests completed!" 