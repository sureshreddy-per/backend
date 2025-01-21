#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test variables
FARMER_MOBILE="+1111222266"
BUYER_MOBILE="+1111222277"
INSPECTOR_MOBILE="+1111222288"
TEST_LOCATION="12.9716,77.5946"

# Utility functions
print_step() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

print_debug() {
    echo -e "${BLUE}DEBUG: $1${NC}" >&2
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_error() {
    local response=$1
    local error_message=$2

    if echo "$response" | grep -q '"error"'; then
        print_error "$error_message"
    fi
}

get_id() {
    local response=$1
    if [ -z "$response" ]; then
        print_error "Empty response when trying to get ID"
    fi

    # Try to parse as JSON and get id field
    if command -v jq >/dev/null 2>&1; then
        local id=$(echo "$response" | jq -r '.id // empty')
        if [ -n "$id" ]; then
            echo "$id"
            return
        fi
    fi

    # Fallback to grep if jq fails or id not found
    local id=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    if [ -n "$id" ]; then
        echo "$id"
        return
    fi

    print_error "Could not extract ID from response"
}

make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4

    print_debug "Making $method request to $endpoint" >&2
    local response=""
    if [ -n "$data" ]; then
        print_debug "Request data: $data" >&2
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "http://localhost:3000/api$endpoint")
    else
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "http://localhost:3000/api$endpoint")
    fi
    print_debug "Response: $response" >&2
    echo "$response"
}

# Function to get auth token for a role
get_auth_token() {
    local mobile=$1
    local name=$2
    local role=$3

    print_step "Getting $role token"

    # Try registration
    print_debug "Registering $role with mobile: $mobile"
    role_email=$(echo "$role" | tr '[:upper:]' '[:lower:]')
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"${role_email}@test.com\"}")

    print_debug "Registration Response: $REGISTER_RESPONSE"

    # Check if user exists and request OTP
    if echo "$REGISTER_RESPONSE" | grep -q "User already exists"; then
        print_debug "User exists, requesting OTP"
        OTP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/request \
            -H "Content-Type: application/json" \
            -d "{\"mobile_number\":\"$mobile\"}")
        print_debug "OTP Response: $OTP_RESPONSE"
        OTP=$(echo $OTP_RESPONSE | grep -o 'OTP sent successfully: [0-9]*' | grep -o '[0-9]*')
    else
        OTP=$(echo $REGISTER_RESPONSE | grep -o 'OTP sent: [0-9]*' | grep -o '[0-9]*')
    fi

    if [ -z "$OTP" ]; then
        print_error "Failed to get OTP for $role"
    fi

    # Verify OTP and get token
    print_debug "Verifying OTP for $role"
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/otp/verify \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$mobile\",\"otp\":\"$OTP\"}")

    print_debug "Verify Response: $VERIFY_RESPONSE"
    TOKEN=$(echo $VERIFY_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        print_error "Failed to get token for $role"
    fi

    print_success "Got $role token"
    echo "$TOKEN"
}

# Check if server is running
check_server() {
    print_step "Checking if server is running"
    if ! curl -s "http://localhost:3000/api/health" > /dev/null; then
        print_error "Server is not running. Please start the server first."
    fi
    print_success "Server is running"
}

# Start of script execution
print_step "Starting Transaction Tests"

# Check if server is running
check_server

# Get authentication tokens
FARMER_TOKEN=$(get_auth_token "$FARMER_MOBILE" "Test Farmer" "FARMER")
BUYER_TOKEN=$(get_auth_token "$BUYER_MOBILE" "Test Buyer" "BUYER")
INSPECTOR_TOKEN=$(get_auth_token "$INSPECTOR_MOBILE" "Test Inspector" "INSPECTOR")

# Create test produce
print_step "Creating test produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" "{
    \"name\": \"Transaction Test Produce\",
    \"description\": \"Test produce for transaction\",
    \"produce_category\": \"VEGETABLES\",
    \"quantity\": 100,
    \"unit\": \"KG\",
    \"price_per_unit\": 50,
    \"location\": \"$TEST_LOCATION\",
    \"images\": [\"https://example.com/image1.jpg\"]
}")
print_debug "Produce Response: $PRODUCE_RESPONSE"
PRODUCE_ID=$(get_id "$PRODUCE_RESPONSE")
print_success "Created produce with ID: $PRODUCE_ID"

# Create test offer
print_step "Creating test offer"
FARMER_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.farmer_id')
BUYER_ID=$(echo "$BUYER_TOKEN" | jq -r '.user.id')

OFFER_RESPONSE=$(make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\":\"$PRODUCE_ID\",
    \"buyer_id\":\"$BUYER_ID\",
    \"farmer_id\":\"$FARMER_ID\",
    \"quantity\":50,
    \"price_per_unit\":48,
    \"buyer_min_price\":45,
    \"buyer_max_price\":50,
    \"quality_grade\":8,
    \"distance_km\":10,
    \"inspection_fee\":100,
    \"message\":\"Test offer for transaction\"
}")
print_debug "Offer Response: $OFFER_RESPONSE"
OFFER_ID=$(get_id "$OFFER_RESPONSE")
print_success "Created offer with ID: $OFFER_ID"

# Create transaction
print_step "Creating transaction"
TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "$BUYER_TOKEN" "{
    \"offer_id\":\"$OFFER_ID\",
    \"produce_id\":\"$PRODUCE_ID\",
    \"final_price\":48,
    \"final_quantity\":50
}")
print_debug "Transaction Response: $TRANSACTION_RESPONSE"
TRANSACTION_ID=$(get_id "$TRANSACTION_RESPONSE")
print_success "Created transaction with ID: $TRANSACTION_ID"

# Get all transactions (as buyer)
print_step "Getting all transactions"
TRANSACTIONS_RESPONSE=$(make_request "GET" "/transactions" "$BUYER_TOKEN")
check_error "$TRANSACTIONS_RESPONSE" "Failed to get transactions"
print_success "Retrieved all transactions"

# Get transaction details
print_step "Getting transaction details"
TRANSACTION_DETAILS=$(make_request "GET" "/transactions/$TRANSACTION_ID" "$BUYER_TOKEN")
check_error "$TRANSACTION_DETAILS" "Failed to get transaction details"
print_success "Retrieved transaction details"

# Start delivery
print_step "Starting delivery"
START_DELIVERY_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/start-delivery" "$FARMER_TOKEN")
check_error "$START_DELIVERY_RESPONSE" "Failed to start delivery"
print_success "Started delivery"

# Confirm delivery
print_step "Confirming delivery"
CONFIRM_DELIVERY_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/confirm-delivery" "$FARMER_TOKEN")
check_error "$CONFIRM_DELIVERY_RESPONSE" "Failed to confirm delivery"
print_success "Confirmed delivery"

# Confirm inspection
print_step "Confirming inspection"
CONFIRM_INSPECTION_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/confirm-inspection" "$BUYER_TOKEN")
check_error "$CONFIRM_INSPECTION_RESPONSE" "Failed to confirm inspection"
print_success "Confirmed inspection"

# Complete transaction
print_step "Completing transaction"
COMPLETE_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/complete" "$BUYER_TOKEN")
check_error "$COMPLETE_RESPONSE" "Failed to complete transaction"
print_success "Completed transaction"

# Reactivate expired transaction
print_step "Reactivating expired transaction"
REACTIVATE_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/reactivate" "$FARMER_TOKEN")
check_error "$REACTIVATE_RESPONSE" "Failed to reactivate transaction"
print_success "Reactivated transaction"

# Cancel transaction
print_step "Cancelling transaction"
CANCEL_RESPONSE=$(make_request "POST" "/transactions/$TRANSACTION_ID/cancel" "$FARMER_TOKEN")
check_error "$CANCEL_RESPONSE" "Failed to cancel transaction"
print_success "Cancelled transaction"

echo -e "\n${GREEN}✓ All Transaction Tests Completed Successfully${NC}"