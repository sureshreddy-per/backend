#!/bin/bash

# Set API base URL
API_BASE_URL="http://localhost:3000/api"

# Enable debug output
DEBUG=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_header() {
    echo -e "\n${BLUE}$1${NC}"
}

print_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "Debug - $1" >&2
    fi
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

    # Remove /api prefix if present
    endpoint=${endpoint#/api}
    # Remove leading slash if present
    endpoint=${endpoint#/}

    local curl_cmd="curl -s -X $method"
    curl_cmd+=" -H 'Content-Type: application/json'"
    curl_cmd+=" -H 'Accept: application/json'"
    
    if [ -n "$token" ]; then
        curl_cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        # Write data to a temporary file to avoid escaping issues
        local data_file=$(mktemp)
        echo "$data" > "$data_file"
        curl_cmd+=" --data-binary @$data_file"
    fi

    local headers_file=$(mktemp)
    local body_file=$(mktemp)
    local url="$API_BASE_URL/$endpoint"
    
    # Execute curl command and save response
    eval "$curl_cmd -o '$body_file' '$url'"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        ${data:+--data-binary @"$data_file"} \
        "$url")
    
    print_debug "Request details:"
    print_debug "Method: $method"
    print_debug "Endpoint: $url"
    if [ -n "$data" ]; then
        print_debug "Data: $data"
    fi
    if [ -n "$token" ]; then
        print_debug "Token: $token"
    fi
    print_debug "Curl command:"
    print_debug "$curl_cmd -o '$body_file' '$url'"
    
    print_debug "HTTP Status Code: $status_code"
    print_debug "Response Body:"
    cat "$body_file"
    
    # Clean up data file if it exists
    if [ -n "$data" ]; then
        rm -f "$data_file"
    fi
    
    if [ "$status_code" -lt 200 ] || [ "$status_code" -ge 300 ]; then
        print_error "Request failed with status code $status_code"
        return 1
    fi
    
    # Check if response is empty
    if [ ! -s "$body_file" ]; then
        print_error "Empty response received"
        return 1
    fi
    
    # Validate JSON response
    local response
    response=$(cat "$body_file")
    if ! echo "$response" | jq '.' >/dev/null 2>&1; then
        print_error "Invalid JSON response"
        print_debug "Raw response: $response"
        return 1
    fi
    
    cat "$body_file"
    return 0
}

# Get auth token with proper error handling
get_auth_token() {
    local mobile_number="$1"
    local name="$2"
    local role="$3"
    local email="$4"
    
    # Step 1: Check if mobile number is registered
    local check_response
    check_response=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile_number\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to check mobile number"
        return 1
    fi
    
    local is_registered
    is_registered=$(echo "$check_response" | jq -r '.isRegistered // false')
    
    # Step 2: Register if not registered
    if [ "$is_registered" = "false" ]; then
        local register_data="{\"mobile_number\":\"$mobile_number\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}"
        local register_response
        register_response=$(make_request "POST" "/auth/register" "$register_data")
        if [ $? -ne 0 ]; then
            print_error "Failed to register user"
            return 1
        fi
    fi
    
    # Step 3: Request OTP
    local otp_response
    otp_response=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$mobile_number\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    
    local otp
    otp=$(echo "$otp_response" | jq -r '.message' | sed -n 's/.*OTP sent successfully: \([0-9]\{6\}\).*/\1/p')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response"
        print_debug "OTP Response: $otp_response"
        return 1
    fi
    
    # Step 4: Verify OTP
    local verify_response
    verify_response=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"$mobile_number\",\"otp\":\"$otp\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    local token
    token=$(echo "$verify_response" | jq -r '.token // empty')
    if [ -z "$token" ]; then
        print_error "Could not extract token from response"
        print_debug "Verify Response: $verify_response"
        return 1
    fi
    
    print_success "Got $role token: ${token:0:20}..."
    echo "$verify_response"
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
FARMER_TOKEN_RESPONSE=$(get_auth_token "+1111222233" "Test FARMER" "FARMER" "test.farmer@test.com")
if [ $? -eq 0 ]; then
    FARMER_TOKEN="$FARMER_TOKEN_RESPONSE"
    print_success "Got farmer token"
else
    print_error "Failed to get farmer token"
    exit 1
fi

print_test_header "Getting Buyer Token"
BUYER_TOKEN=""
BUYER_TOKEN_RESPONSE=$(get_auth_token "+1111222244" "Test BUYER" "BUYER" "test.buyer@test.com")
if [ $? -eq 0 ]; then
    BUYER_TOKEN="$BUYER_TOKEN_RESPONSE"
    print_success "Got buyer token"
else
    print_error "Failed to get buyer token"
    exit 1
fi

print_test_header "Getting Admin Token"
ADMIN_TOKEN=""
ADMIN_TOKEN_RESPONSE=$(get_auth_token "+1111222255" "Test ADMIN" "ADMIN" "test.admin@test.com")
if [ $? -eq 0 ]; then
    ADMIN_TOKEN="$ADMIN_TOKEN_RESPONSE"
    print_success "Got admin token"
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

# Testing: Creating Test Produce
print_header "Creating Test Produce"
PRODUCE_DATA='{
    "name": "Notification Test Produce",
    "description": "Test produce for notifications",
    "product_variety": "Test Variety",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": ["https://example.com/test-image1.jpg"],
    "harvested_at": "2024-02-01T00:00:00Z"
}'

PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
if [ $? -eq 0 ]; then
    print_success "Created test produce"
    print_debug "Produce Response: $PRODUCE_RESPONSE"
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    print_debug "Produce ID: $PRODUCE_ID"
else
    print_error "Failed to create test produce"
    exit 1
fi

print_header "Waiting for AI Assessment and Auto-Offer Generation"
print_info "Waiting 15 seconds for AI assessment and auto-offer generation..."
sleep 15

print_header "Getting All Offers"
get_offers_with_retry() {
    local max_attempts=5
    local attempt=1
    local wait_time=5
    
    while [ $attempt -le $max_attempts ]; do
        print_debug "Attempt $attempt to get offers"
        OFFERS_RESPONSE=$(make_request "GET" "/offers" "" "$BUYER_TOKEN")
        if [ $? -eq 0 ]; then
            local total_offers=$(echo "$OFFERS_RESPONSE" | jq -r '.total')
            if [ "$total_offers" -gt 0 ]; then
                echo "$OFFERS_RESPONSE"
                return 0
            fi
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            print_info "No offers found yet, waiting $wait_time seconds before retry..."
            sleep $wait_time
        fi
        attempt=$((attempt + 1))
    done
    
    return 1
}

OFFERS_RESPONSE=$(get_offers_with_retry)
if [ $? -eq 0 ]; then
    print_success "Got offers"
    print_debug "Offers Response: $OFFERS_RESPONSE"
    OFFER_ID=$(echo "$OFFERS_RESPONSE" | jq -r '.items[0].id')
    if [ -n "$OFFER_ID" ] && [ "$OFFER_ID" != "null" ]; then
        print_debug "First Offer ID: $OFFER_ID"
    else
        print_error "No valid offer ID found"
        exit 1
    fi
else
    print_error "Failed to get offers"
    exit 1
fi

# Test: Reject Offer
print_header "Rejecting Offer"
REJECT_DATA="{\"reason\":\"Test rejection\"}"
REJECT_RESPONSE=$(make_request "POST" "/offers/$OFFER_ID/reject" "$BUYER_TOKEN" "$REJECT_DATA")
if [ $? -eq 0 ]; then
    print_success "Offer rejected successfully"
else
    print_error "Failed to reject offer"
    echo "Debug - Error Response: $REJECT_RESPONSE"
fi

# Wait for new auto-offer generation
echo "Waiting 10 seconds for new auto-offer generation..."
sleep 10

# Get all offers again
OFFERS_RESPONSE=$(get_offers_with_retry)
if [ $? -ne 0 ]; then
    print_error "Failed to get offers after rejection"
    exit 1
fi

# Extract the new offer ID
NEW_OFFER_ID=$(echo "$OFFERS_RESPONSE" | jq -r '.items[0].id')
if [ -z "$NEW_OFFER_ID" ] || [ "$NEW_OFFER_ID" = "null" ]; then
    print_error "No valid offer ID found after rejection"
    exit 1
fi

# Test: Cancel Offer
print_header "Cancelling Offer"
CANCEL_DATA="{\"reason\":\"Test cancellation\"}"
CANCEL_RESPONSE=$(make_request "POST" "/offers/$NEW_OFFER_ID/cancel" "$BUYER_TOKEN" "$CANCEL_DATA")
if [ $? -eq 0 ]; then
    print_success "Offer cancelled successfully"
else
    print_error "Failed to cancel offer"
    echo "Debug - Error Response: $CANCEL_RESPONSE"
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