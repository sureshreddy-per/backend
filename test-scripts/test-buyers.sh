#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

# Check if server is running
check_server || exit 1

print_header "Testing: Buyer Endpoints"

# Get buyer authentication token
echo "Getting buyer authentication token..."
if [ -z "$AUTH_TOKEN" ]; then
    token=$(get_auth_token "+1234567890" "Test Buyer" "BUYER")
    if [ $? -ne 0 ]; then
        print_error "Failed to get buyer token"
        exit 1
    fi
else
    token="$AUTH_TOKEN"
    print_success "Using provided token"
fi

print_success "Got buyer token"

# Test 1: Create buyer profile
print_test_header "Create Buyer Profile"
PROFILE_RESPONSE=$(make_request "POST" "/buyers/profile" "{
    \"business_name\": \"Test Buyer Business\",
    \"address\": \"45 Market Street, Business District\",
    \"lat_lng\": \"12.9716,77.5946\",
    \"location_name\": \"Business District\",
    \"gst\": \"GSTIN123456789\",
    \"registration_number\": \"REG123456\"
}" "$token")

if [ $? -eq 0 ]; then
    print_success "Created buyer profile"
    echo "Debug - Profile Response: $PROFILE_RESPONSE"
    # Extract buyer ID from response
    BUYER_ID=$(echo "$PROFILE_RESPONSE" | jq -r '.id')
    if [ -n "$BUYER_ID" ] && [ "$BUYER_ID" != "null" ]; then
        print_success "Extracted buyer ID: $BUYER_ID"
    else
        print_warning "Could not extract buyer ID from response"
        echo "Debug - Failed to extract ID from response: $PROFILE_RESPONSE"
    fi
else
    print_error "Failed to create buyer profile"
    echo "Debug - Error Response: $PROFILE_RESPONSE"
fi

# Test 2: Get buyer profile
print_test_header "Get Buyer Profile"
PROFILE_RESPONSE=$(make_request "GET" "/buyers/profile" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Retrieved buyer profile"
    echo "Debug - Profile Response: $PROFILE_RESPONSE"
    # Extract buyer ID from response if not already set
    if [ -z "$BUYER_ID" ] || [ "$BUYER_ID" = "null" ]; then
        BUYER_ID=$(echo "$PROFILE_RESPONSE" | jq -r '.id')
        if [ -n "$BUYER_ID" ] && [ "$BUYER_ID" != "null" ]; then
            print_success "Extracted buyer ID: $BUYER_ID"
        else
            print_warning "Could not extract buyer ID from response"
            echo "Debug - Failed to extract ID from response: $PROFILE_RESPONSE"
        fi
    fi
else
    print_error "Failed to get buyer profile"
    echo "Debug - Error Response: $PROFILE_RESPONSE"
fi

# Test 3: Get buyer by ID
print_test_header "Get Buyer by ID"
if [ -n "$BUYER_ID" ] && [ "$BUYER_ID" != "null" ]; then
    make_request "GET" "/buyers/$BUYER_ID" "" "$token"
    if [ $? -eq 0 ]; then
        print_success "Retrieved buyer by ID: $BUYER_ID"
    else
        print_error "Failed to get buyer by ID"
    fi
else
    print_error "No buyer ID available"
fi

# Test 4: Find nearby buyers
print_test_header "Find Nearby Buyers"
NEARBY_RESPONSE=$(make_request "GET" "/buyers/search/nearby?lat=12.9716&lng=77.5946&radius=10" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Found nearby buyers"
else
    print_error "Failed to find nearby buyers"
fi

# Test 5: Update buyer preferences
print_test_header "Update Buyer Preferences"
make_request "POST" "/buyers/preferences/price-range" "{
    \"min_price\": 10,
    \"max_price\": 60,
    \"categories\": [\"VEGETABLES\", \"FRUITS\"]
}" "$token"

if [ $? -eq 0 ]; then
    print_success "Updated buyer preferences"
else
    print_error "Failed to update buyer preferences"
fi

# Test 6: Get buyer preferences
print_test_header "Get Buyer Preferences"
PREFERENCES_RESPONSE=$(make_request "GET" "/buyers/preferences" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Retrieved buyer preferences"
else
    print_error "Failed to get buyer preferences"
fi

print_success "Test script completed."