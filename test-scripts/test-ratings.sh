#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Rating Flow Tests"

# Function to register and get token
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/api/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/api/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}" | jq -r '.isRegistered')
        if [ "$IS_REGISTERED" != "true" ]; then
            print_error "Failed to register user and user does not exist"
            return 1
        fi
    fi

    # Request OTP
    local OTP_RESPONSE=$(make_request "POST" "/api/auth/otp/request" "{\"mobile_number\":\"$mobile\"}")
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
    local VERIFY_RESPONSE=$(make_request "POST" "/api/auth/otp/verify" "{\"mobile_number\":\"$mobile\",\"otp\":\"$OTP\"}")
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

# Get tokens for different roles
print_test_header "Registering and authenticating users"

# Setup FARMER
print_test_header "Setting up FARMER user"
FARMER_RESPONSE=$(get_user_token "+1111222299" "Test Farmer" "FARMER" "farmer_$(date +%s)@test.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup FARMER user"
    exit 1
fi
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')
FARMER_ID=$(echo "$FARMER_RESPONSE" | jq -r '.user.id')

# Create farmer profile
print_test_header "Creating Farmer Profile"
FARMER_PROFILE_RESPONSE=$(make_request "POST" "/api/farmers" "{\"name\":\"Test Farmer\",\"mobile_number\":\"+1111222299\",\"location\":\"12.9716,77.5946\",\"user_id\":\"$FARMER_ID\"}" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_warning "Farmer profile might already exist, continuing..."
    # Get existing farmer profile
    FARMER_PROFILE_RESPONSE=$(make_request "GET" "/api/farmers/me" "" "$FARMER_TOKEN")
    if [ $? -ne 0 ]; then
        print_error "Failed to get farmer profile"
        exit 1
    fi
else
    check_response "$FARMER_PROFILE_RESPONSE" 201
    print_success "Created farmer profile"
fi
FARMER_PROFILE_ID=$(echo "$FARMER_PROFILE_RESPONSE" | jq -r '.id')

# Setup BUYER
print_test_header "Setting up BUYER user"
BUYER_RESPONSE=$(get_user_token "+1111222200" "Test Buyer" "BUYER" "buyer_$(date +%s)@test.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup BUYER user"
    exit 1
fi
BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | jq -r '.token')
BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.user.id')

# Update buyer location if needed
print_test_header "Updating Buyer Location"
BUYER_UPDATE_RESPONSE=$(make_request "PUT" "/api/buyers/me" "{\"location\":\"12.9716,77.5946\",\"business_name\":\"Test Buyer\",\"address\":\"Test Address\"}" "$BUYER_TOKEN")
if [ $? -ne 0 ]; then
    print_warning "Failed to update buyer location, continuing..."
else
    check_response "$BUYER_UPDATE_RESPONSE"
    print_success "Updated buyer location"
fi

# Verify we have all tokens
if [ -z "$FARMER_TOKEN" ] || [ -z "$BUYER_TOKEN" ]; then
    print_error "Failed to get all required tokens"
    exit 1
fi

# Create test produce
print_header "Creating test produce"
echo "Using FARMER token for produce creation: $FARMER_TOKEN"
PRODUCE_RESPONSE=$(make_request "POST" "/api/produce" "{\"name\":\"Rating Test Produce\",\"quantity\":100,\"unit\":\"KG\",\"price_per_unit\":50,\"location\":\"12.9716,77.5946\",\"location_name\":\"Test Farm\",\"images\":[\"https://example.com/image1.jpg\"],\"description\":\"Test produce for rating\",\"produce_category\":\"VEGETABLES\"}" "$FARMER_TOKEN")
check_response "$PRODUCE_RESPONSE" "Created test produce"
PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
PRODUCE_FARMER_ID=$FARMER_PROFILE_ID  # Use the farmer profile ID instead of the one from produce

# Get buyer profile ID
print_header "Getting buyer profile"
echo "Using BUYER token to get profile: $BUYER_TOKEN"
BUYER_PROFILE_RESPONSE=$(make_request "GET" "/api/buyers/me" "" "$BUYER_TOKEN")
check_response "$BUYER_PROFILE_RESPONSE" "Got buyer profile"
BUYER_PROFILE_ID=$(echo "$BUYER_PROFILE_RESPONSE" | jq -r '.id')

# Create test offer
print_header "Creating test offer"
echo "Using BUYER token for offer creation: $BUYER_TOKEN"
OFFER_RESPONSE=$(make_request "POST" "/api/offers" "{\"produce_id\":\"$PRODUCE_ID\",\"buyer_id\":\"$BUYER_PROFILE_ID\",\"farmer_id\":\"$PRODUCE_FARMER_ID\",\"price_per_unit\":48,\"quantity\":50,\"buyer_min_price\":45,\"buyer_max_price\":50,\"quality_grade\":8,\"distance_km\":10,\"inspection_fee\":100,\"message\":\"Test offer for rating\"}" "$BUYER_TOKEN")
check_response "$OFFER_RESPONSE" "Created test offer"
OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.id')

# Create test transaction
print_header "Creating test transaction"
echo "Using BUYER token for transaction creation: $BUYER_TOKEN"
TRANSACTION_RESPONSE=$(make_request "POST" "/api/transactions" "{\"offer_id\":\"$OFFER_ID\",\"produce_id\":\"$PRODUCE_ID\",\"final_price\":48,\"final_quantity\":50}" "$BUYER_TOKEN")
check_response "$TRANSACTION_RESPONSE" "Created test transaction"
TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.id')

# Start delivery as farmer
print_header "Starting delivery as farmer"
echo "Using FARMER token for starting delivery: $FARMER_TOKEN"
START_DELIVERY_RESPONSE=$(make_request "POST" "/api/transactions/$TRANSACTION_ID/start-delivery" "{}" "$FARMER_TOKEN")
check_response "$START_DELIVERY_RESPONSE" "Started delivery"

# Confirm delivery as farmer
print_header "Confirming delivery as farmer"
echo "Using FARMER token for confirming delivery: $FARMER_TOKEN"
CONFIRM_DELIVERY_RESPONSE=$(make_request "POST" "/api/transactions/$TRANSACTION_ID/confirm-delivery" "{\"notes\":\"Delivered successfully\"}" "$FARMER_TOKEN")
check_response "$CONFIRM_DELIVERY_RESPONSE" "Confirmed delivery"

# Confirm inspection as buyer
print_header "Confirming inspection as buyer"
echo "Using BUYER token for inspection confirmation: $BUYER_TOKEN"
INSPECTION_RESPONSE=$(make_request "POST" "/api/transactions/$TRANSACTION_ID/confirm-inspection" "{}" "$BUYER_TOKEN")
check_response "$INSPECTION_RESPONSE" "Confirmed inspection"

# Complete transaction as buyer
print_header "Completing transaction as buyer"
echo "Using BUYER token for transaction completion: $BUYER_TOKEN"
COMPLETE_RESPONSE=$(make_request "POST" "/api/transactions/$TRANSACTION_ID/complete" "{}" "$BUYER_TOKEN")
check_response "$COMPLETE_RESPONSE" "Completed transaction"
sleep 5  # Wait for transaction completion to be processed

# Create rating (Buyer -> Farmer)
print_header "Creating rating (Buyer -> Farmer)"
echo "Using BUYER token for rating creation: $BUYER_TOKEN"
RATING_RESPONSE=$(make_request "POST" "/api/ratings" "{\"transaction_id\":\"$TRANSACTION_ID\",\"rating\":4,\"review\":\"Good quality produce and timely delivery\",\"rating_type\":\"BUYER_TO_FARMER\"}" "$BUYER_TOKEN")
check_response "$RATING_RESPONSE" "Created rating"

# Test 2: Create rating (Farmer rating Buyer)
print_test_header "Create Rating (Farmer -> Buyer)"
FARMER_RATING_RESPONSE=$(make_request "POST" "/api/ratings" "{\"transaction_id\":\"$TRANSACTION_ID\",\"rating\":5,\"review\":\"Great buyer, smooth transaction\",\"rating_type\":\"FARMER_TO_BUYER\"}" "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create farmer's rating"
    exit 1
fi
check_response "$FARMER_RATING_RESPONSE" 201
print_success "Created farmer's rating"

# Test 3: Get received ratings
print_test_header "Get Received Ratings"
RECEIVED_RATINGS=$(make_request "GET" "/api/ratings/received" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get received ratings"
    exit 1
fi
check_response "$RECEIVED_RATINGS"
print_success "Retrieved received ratings"

# Test 4: Get given ratings
print_test_header "Get Given Ratings"
GIVEN_RATINGS=$(make_request "GET" "/api/ratings/given" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get given ratings"
    exit 1
fi
check_response "$GIVEN_RATINGS"
print_success "Retrieved given ratings"

# Test 5: Get rating by ID
print_test_header "Get Rating by ID"
RATING_DETAILS=$(make_request "GET" "/api/ratings/$RATING_ID" "" "$BUYER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get rating details"
    exit 1
fi
check_response "$RATING_DETAILS"
print_success "Retrieved rating by ID"

# Test 6: Get ratings by transaction
print_test_header "Get Ratings by Transaction"
TRANSACTION_RATINGS=$(make_request "GET" "/api/ratings/transaction/$TRANSACTION_ID" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get transaction ratings"
    exit 1
fi
check_response "$TRANSACTION_RATINGS"
print_success "Retrieved ratings by transaction"

# Test 7: Delete rating
print_test_header "Delete Rating"
DELETE_RESPONSE=$(make_request "DELETE" "/api/ratings/$RATING_ID" "" "$BUYER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to delete rating"
    exit 1
fi
check_response "$DELETE_RESPONSE"
print_success "Deleted rating"

# Testing: Get Rating by ID
echo "Testing: Get Rating by ID"
RATING_ID=$(echo "$FARMER_RATING_RESPONSE" | jq -r '.id')
debug_request "GET" "http://localhost:3000/api/ratings/$RATING_ID" "" "$FARMER_TOKEN"
check_error "Retrieved rating by ID"

# Testing: Delete Rating
echo "Testing: Delete Rating"
debug_request "DELETE" "http://localhost:3000/api/ratings/$RATING_ID" "" "$FARMER_TOKEN"
check_error "Deleted rating"

echo -e "\n${GREEN}Rating tests completed!${NC}" 