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
    
    return 0
}

# Get auth token
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}" | jq -r '.isRegistered')
        if [ "$IS_REGISTERED" != "true" ]; then
            print_error "Failed to register user and user does not exist"
            return 1
        fi
    fi

    # Request OTP
    local OTP_RESPONSE=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$mobile\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    local OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$OTP" ]; then
        print_error "Failed to extract OTP"
        return 1
    fi

    # Verify OTP and get token
    local VERIFY_RESPONSE=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"$mobile\",\"otp\":\"$OTP\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    local TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        print_error "Failed to extract token"
        return 1
    fi

    echo "$VERIFY_RESPONSE"
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
    
    print_test_header "Starting Transaction Tests"
    
    # Get tokens for different roles
    print_test_header "Setting up FARMER user"
    FARMER_RESPONSE=$(get_user_token "+1111222266" "Test Farmer" "FARMER" "farmer_$(date +%s)@test.com")
    if [ $? -ne 0 ]; then
        print_error "Failed to setup FARMER user"
        exit 1
    fi
    FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')
    
    print_test_header "Setting up BUYER user"
    BUYER_RESPONSE=$(get_user_token "+1111222277" "Test Buyer" "BUYER" "buyer_$(date +%s)@test.com")
    if [ $? -ne 0 ]; then
        print_error "Failed to setup BUYER user"
        exit 1
    fi
    BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | jq -r '.token')
    
    print_test_header "Setting up INSPECTOR user"
    INSPECTOR_RESPONSE=$(get_user_token "+1111222288" "Test Inspector" "INSPECTOR" "inspector_$(date +%s)@test.com")
    if [ $? -ne 0 ]; then
        print_error "Failed to setup INSPECTOR user"
        exit 1
    fi
    INSPECTOR_TOKEN=$(echo "$INSPECTOR_RESPONSE" | jq -r '.token')
    INSPECTOR_ID=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.id')
    
    # Verify we have all tokens
    if [ -z "$FARMER_TOKEN" ] || [ -z "$BUYER_TOKEN" ] || [ -z "$INSPECTOR_TOKEN" ]; then
        print_error "Failed to get all required tokens"
        exit 1
    fi
    print_success "Got all required tokens"
    
    # Create test produce
    print_test_header "Creating Test Produce"
    PRODUCE_DATA='{
        "name": "Transaction Test Produce",
        "description": "Test produce for transaction",
        "produce_category": "VEGETABLES",
        "quantity": 100,
        "unit": "KG",
        "price_per_unit": 50,
        "location": "12.9716,77.5946",
        "images": ["https://example.com/image1.jpg"]
    }'
    
    PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to create produce"
        exit 1
    fi
    check_response "$PRODUCE_RESPONSE" 201
    
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
        print_error "Failed to get produce ID"
        exit 1
    fi
    print_success "Created produce with ID: $PRODUCE_ID"
    
    # Create test offer
    print_test_header "Creating Test Offer"
    
    # Get farmer ID from produce response
    FARMER_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.farmer_id')
    if [ -z "$FARMER_ID" ] || [ "$FARMER_ID" = "null" ]; then
        print_error "Failed to get farmer ID from produce response"
        exit 1
    fi
    print_success "Got farmer ID: $FARMER_ID"
    
    # Get buyer ID from response
    BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.user.id')
    if [ -z "$BUYER_ID" ] || [ "$BUYER_ID" = "null" ]; then
        print_error "Failed to get buyer ID"
        exit 1
    fi
    print_success "Got buyer ID: $BUYER_ID"
    
    OFFER_DATA=$(cat <<EOF
{
    "produce_id": "$PRODUCE_ID",
    "buyer_id": "$BUYER_ID",
    "farmer_id": "$FARMER_ID",
    "quantity": 50,
    "price_per_unit": 48,
    "buyer_min_price": 45,
    "buyer_max_price": 50,
    "quality_grade": 8,
    "distance_km": 10,
    "inspection_fee": 100,
    "message": "Test offer for transaction"
}
EOF
)
    
    OFFER_RESPONSE=$(make_request "POST" "/offers" "$OFFER_DATA" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to create offer"
        exit 1
    fi
    check_response "$OFFER_RESPONSE" 201
    
    OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.id')
    if [ -z "$OFFER_ID" ] || [ "$OFFER_ID" = "null" ]; then
        print_error "Failed to get offer ID"
        exit 1
    fi
    print_success "Created offer with ID: $OFFER_ID"
    
    # Create transaction
    print_test_header "Create Transaction"
    TRANSACTION_DATA='{
        "offer_id": "'$OFFER_ID'",
        "produce_id": "'$PRODUCE_ID'",
        "final_price": 48,
        "final_quantity": 50
    }'

    TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$TRANSACTION_DATA" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to create transaction"
        exit 1
    fi
    check_response "$TRANSACTION_RESPONSE" 201
    
    TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.id')
    if [ -z "$TRANSACTION_ID" ] || [ "$TRANSACTION_ID" = "null" ]; then
        print_error "Failed to get transaction ID"
        exit 1
    fi
    print_success "Created transaction with ID: $TRANSACTION_ID"
    
    # Get all transactions
    print_test_header "Get All Transactions"
    TRANSACTIONS_RESPONSE=$(make_request "GET" "/transactions" "" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to get transactions"
        exit 1
    fi
    print_success "Retrieved all transactions"

    # Get transaction by ID
    print_test_header "Get Transaction by ID"
    TRANSACTION_DETAILS_RESPONSE=$(make_request "GET" "/transactions/$TRANSACTION_ID" "" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to get transaction details"
        exit 1
    fi
    print_success "Retrieved transaction details"

    # Start delivery window (farmer only)
    print_test_header "Start Delivery Window"
    START_DELIVERY_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/start-delivery" "{}" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to start delivery window"
        exit 1
    fi
    print_success "Started delivery window"

    # Confirm delivery (farmer only)
    print_test_header "Confirm Delivery"
    CONFIRM_DELIVERY_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/confirm-delivery" "{}" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to confirm delivery"
        exit 1
    fi
    print_success "Confirmed delivery"

    # Confirm inspection (buyer only)
    print_test_header "Confirm Inspection"
    CONFIRM_INSPECTION_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/confirm-inspection" '{"inspection_notes":"Quality matches description","quality_score":90}' "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to confirm inspection"
        exit 1
    fi
    print_success "Confirmed inspection"

    # Complete transaction (buyer only)
    print_test_header "Complete Transaction"
    COMPLETE_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/complete" "{}" "$BUYER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to complete transaction"
        exit 1
    fi
    print_success "Completed transaction"

    # Reactivate expired transaction (farmer only)
    print_test_header "Reactivate Expired Transaction"
    REACTIVATE_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/reactivate" "{}" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to reactivate transaction"
        exit 1
    fi
    print_success "Reactivated transaction"

    # Cancel transaction (either party)
    print_test_header "Cancel Transaction"
    CANCEL_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/cancel" '{"cancellation_reason":"Unable to fulfill order"}' "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to cancel transaction"
        exit 1
    fi
    print_success "Cancelled transaction"
    
    print_success "All transaction tests completed!"
}

# Run the tests
main 