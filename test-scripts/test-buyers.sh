#!/bin/bash

# Set API base URL
API_BASE_URL="http://localhost:3000/api"

# Test variables
TEST_MOBILE="+1234567890"
TEST_NAME="Test Buyer"
TEST_ROLE="BUYER"
TEST_EMAIL="buyer@test.com"

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

# Make HTTP request
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
    
    # Debug output to stderr
    >&2 echo "Debug - Request details:"
    >&2 echo "Method: $method"
    >&2 echo "Endpoint: ${full_url}"
    >&2 echo "Data: $data"
    [ -n "$token" ] && >&2 echo "Token: ${token:0:20}..."
    
    # Temporary file for response
    local tmp_file=$(mktemp)
    
    # Make the request with headers and status code
    if [ -n "$token" ]; then
        curl -s -D "${tmp_file}.headers" -o "${tmp_file}.body" -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "${full_url}" > "${tmp_file}.code"
    else
        curl -s -D "${tmp_file}.headers" -o "${tmp_file}.body" -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${full_url}" > "${tmp_file}.code"
    fi
    
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

# Get auth token
get_auth_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local token=""
    
    echo "Step 1: Checking mobile number..."
    # Check mobile number first
    local check_mobile_data="{\"mobile_number\":\"$mobile\"}"
    local check_response=$(make_request "POST" "/auth/check-mobile" "$check_mobile_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Mobile check failed, proceeding with registration"
    fi
    
    echo "Step 2: Registering user..."
    # Register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"buyer@test.com\"}"
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Registration failed, user might already exist"
    fi
    
    echo "Step 3: Requesting OTP..."
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
    
    echo "Step 4: Verifying OTP: $otp"
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
    
    echo "$token"
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

# Check response for errors
check_response() {
    local response="$1"
    local expected_status="${2:-200}"
    
    # Check if response is empty
    if [ -z "$response" ]; then
        print_error "Empty response"
        return 1
    fi
    
    # Try to parse response as JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        print_error "Invalid JSON response: $response"
        return 1
    fi
    
    # Check for error message
    local error_msg=$(echo "$response" | jq -r '.message // empty')
    local status_code=$(echo "$response" | jq -r '.statusCode // empty')
    local error=$(echo "$response" | jq -r '.error // empty')
    
    if [ -n "$error_msg" ] || [ -n "$error" ]; then
        if [[ "$error_msg" =~ "success" ]] || [[ "$error_msg" =~ "OTP sent" ]]; then
            print_success "$error_msg"
            return 0
        fi
        if [ -n "$error" ] && [[ "$error" != "null" ]]; then
            print_error "$error"
            return 1
        fi
    fi
    
    if [ -n "$status_code" ] && [ "$status_code" != "$expected_status" ]; then
        print_error "Unexpected status code: $status_code (expected $expected_status)"
        return 1
    fi
    
    return 0
}

# Check if server is running
check_server || exit 1

print_header "Testing: Buyer Endpoints"

# Get buyer authentication token
echo "Getting buyer authentication token..."
if [ -z "$AUTH_TOKEN" ]; then
    # Capture token generation output
    TOKEN_RESPONSE=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$TEST_MOBILE\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to check mobile number"
        exit 1
    fi

    TOKEN_RESPONSE=$(make_request "POST" "/auth/register" "{\"mobile_number\":\"$TEST_MOBILE\",\"name\":\"$TEST_NAME\",\"role\":\"$TEST_ROLE\",\"email\":\"$TEST_EMAIL\"}")
    if [ $? -ne 0 ]; then
        print_warning "Registration failed, user might already exist"
    fi

    TOKEN_RESPONSE=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$TEST_MOBILE\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        exit 1
    fi

    # Extract OTP from response
    OTP=$(echo "$TOKEN_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$OTP" ]; then
        print_error "Could not extract OTP from response"
        exit 1
    fi

    # Verify OTP and get token
    TOKEN_RESPONSE=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"$TEST_MOBILE\",\"otp\":\"$OTP\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        exit 1
    fi

    # Extract token from response
    token=$(echo "$TOKEN_RESPONSE" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response"
        exit 1
    fi
else
    token="$AUTH_TOKEN"
    print_success "Using provided token"
fi

print_success "Got buyer token"

# Get buyer profile to get the ID
print_test_header "Get Buyer Profile"
PROFILE_RESPONSE=$(make_request "GET" "/buyers/profile" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Retrieved buyer profile"
    echo "Debug - Profile Response: $PROFILE_RESPONSE"
    # Extract buyer ID from response
    BUYER_ID=$(echo "$PROFILE_RESPONSE" | jq -r '.id')
    if [ -n "$BUYER_ID" ] && [ "$BUYER_ID" != "null" ]; then
        print_success "Extracted buyer ID: $BUYER_ID"
    else
        print_warning "Could not extract buyer ID from response"
        echo "Debug - Failed to extract ID from response: $PROFILE_RESPONSE"
        exit 1
    fi
else
    print_error "Failed to get buyer profile"
    echo "Debug - Error Response: $PROFILE_RESPONSE"
    exit 1
fi

# Test 2: Get buyer by ID
print_test_header "Get Buyer by ID"
if [ -n "$BUYER_ID" ] && [ "$BUYER_ID" != "null" ]; then
    BUYER_RESPONSE=$(make_request "GET" "/buyers/$BUYER_ID" "" "$token")
    if [ $? -eq 0 ]; then
        print_success "Retrieved buyer by ID: $BUYER_ID"
        echo "Debug - Buyer Response: $BUYER_RESPONSE"
    else
        print_error "Failed to get buyer by ID"
        echo "Debug - Error Response: $BUYER_RESPONSE"
        exit 1
    fi
else
    print_error "No buyer ID available"
    exit 1
fi

# Test 3: Create daily price
print_test_header "Create Daily Price"
DAILY_PRICE_RESPONSE=$(make_request "POST" "/daily-prices" "{
    \"buyer_id\": \"$BUYER_ID\",
    \"produce_category\": \"VEGETABLES\",
    \"min_price\": 20.50,
    \"max_price\": 50.75,
    \"minimum_quantity\": 100,
    \"valid_days\": 7
}" "$token")

if [ $? -eq 0 ]; then
    print_success "Created daily price"
    echo "Debug - Daily Price Response: $DAILY_PRICE_RESPONSE"
    DAILY_PRICE_ID=$(echo "$DAILY_PRICE_RESPONSE" | jq -r '.id')
    if [ -n "$DAILY_PRICE_ID" ] && [ "$DAILY_PRICE_ID" != "null" ]; then
        print_success "Extracted daily price ID: $DAILY_PRICE_ID"
    else
        print_warning "Could not extract daily price ID from response"
    fi
else
    print_error "Failed to create daily price"
    echo "Debug - Error Response: $DAILY_PRICE_RESPONSE"
fi

# Test 4: Get active daily prices
print_test_header "Get Active Daily Prices"
ACTIVE_PRICES_RESPONSE=$(make_request "GET" "/daily-prices/active?buyer_id=$BUYER_ID" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Retrieved active daily prices"
    echo "Debug - Active Prices Response: $ACTIVE_PRICES_RESPONSE"
else
    print_error "Failed to get active daily prices"
    echo "Debug - Error Response: $ACTIVE_PRICES_RESPONSE"
fi

# Test 5: Update daily price
if [ -n "$DAILY_PRICE_ID" ] && [ "$DAILY_PRICE_ID" != "null" ]; then
    print_test_header "Update Daily Price"
    UPDATE_PRICE_RESPONSE=$(make_request "PUT" "/daily-prices/$DAILY_PRICE_ID" "{
        \"min_price\": 25.00,
        \"max_price\": 55.00,
        \"valid_days\": 5
    }" "$token")

    if [ $? -eq 0 ]; then
        print_success "Updated daily price"
        echo "Debug - Update Response: $UPDATE_PRICE_RESPONSE"
    else
        print_error "Failed to update daily price"
        echo "Debug - Error Response: $UPDATE_PRICE_RESPONSE"
    fi
fi

# Test 6: Update buyer location
print_test_header "Update Buyer Location"
LOCATION_UPDATE_RESPONSE=$(make_request "POST" "/buyers/details/update" "{
    \"lat_lng\": \"12.9716,77.5946\",
    \"address\": \"45 Market Street, Business District\"
}" "$token")

if [ $? -eq 0 ]; then
    print_success "Updated buyer location"
    echo "Debug - Location Update Response: $LOCATION_UPDATE_RESPONSE"
else
    print_error "Failed to update buyer location"
    echo "Debug - Error Response: $LOCATION_UPDATE_RESPONSE"
fi

# Test 7: Find nearby buyers
print_test_header "Find Nearby Buyers"
NEARBY_RESPONSE=$(make_request "GET" "/buyers/search/nearby?lat=12.9716&lng=77.5946&radius=10" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Found nearby buyers"
    echo "Debug - Nearby Buyers Response: $NEARBY_RESPONSE"
else
    print_error "Failed to find nearby buyers"
    echo "Debug - Error Response: $NEARBY_RESPONSE"
fi

# Test 8: Update buyer preferences
print_test_header "Set Price Alert"
PRICE_ALERT_RESPONSE=$(make_request "POST" "/buyers/preferences/price-alerts" "{
    \"target_price\": 25.50,
    \"condition\": \"BELOW\",
    \"notification_methods\": [\"EMAIL\", \"SMS\"],
    \"expiry_date\": \"2024-12-31T23:59:59Z\"
}" "$token")

if [ $? -eq 0 ]; then
    print_success "Created price alert"
    echo "Debug - Price Alert Response: $PRICE_ALERT_RESPONSE"
    
    # Extract alert ID for later use
    ALERT_ID=$(echo "$PRICE_ALERT_RESPONSE" | jq -r '.id')
    if [ -n "$ALERT_ID" ] && [ "$ALERT_ID" != "null" ]; then
        print_success "Extracted alert ID: $ALERT_ID"
        
        # Test updating price alert
        print_test_header "Update Price Alert"
        UPDATE_ALERT_RESPONSE=$(make_request "PATCH" "/buyers/preferences/price-alerts/$ALERT_ID" "{
            \"target_price\": 30.00,
            \"condition\": \"ABOVE\"
        }" "$token")
        
        if [ $? -eq 0 ]; then
            print_success "Updated price alert"
            echo "Debug - Update Alert Response: $UPDATE_ALERT_RESPONSE"
        else
            print_error "Failed to update price alert"
            echo "Debug - Error Response: $UPDATE_ALERT_RESPONSE"
        fi
        
        # Test getting price alerts
        print_test_header "Get Price Alerts"
        GET_ALERTS_RESPONSE=$(make_request "GET" "/buyers/preferences/price-alerts" "" "$token")
        
        if [ $? -eq 0 ]; then
            print_success "Retrieved price alerts"
            echo "Debug - Get Alerts Response: $GET_ALERTS_RESPONSE"
        else
            print_error "Failed to get price alerts"
            echo "Debug - Error Response: $GET_ALERTS_RESPONSE"
        fi
        
        # Test deleting price alert
        print_test_header "Delete Price Alert"
        DELETE_ALERT_RESPONSE=$(make_request "DELETE" "/buyers/preferences/price-alerts/$ALERT_ID" "" "$token")
        
        if [ $? -eq 0 ]; then
            print_success "Deleted price alert"
            echo "Debug - Delete Alert Response: $DELETE_ALERT_RESPONSE"
        else
            print_error "Failed to delete price alert"
            echo "Debug - Error Response: $DELETE_ALERT_RESPONSE"
        fi
    else
        print_warning "Could not extract alert ID from response"
    fi
else
    print_error "Failed to create price alert"
    echo "Debug - Error Response: $PRICE_ALERT_RESPONSE"
fi

# Test setting preferred price range
print_test_header "Set Preferred Price Range"
PRICE_RANGE_RESPONSE=$(make_request "POST" "/buyers/preferences/price-range" "{
    \"min_price\": 20.00,
    \"max_price\": 50.00,
    \"categories\": [\"VEGETABLES\", \"FRUITS\"]
}" "$token")

if [ $? -eq 0 ]; then
    print_success "Set preferred price range"
    echo "Debug - Price Range Response: $PRICE_RANGE_RESPONSE"
else
    print_error "Failed to set preferred price range"
    echo "Debug - Error Response: $PRICE_RANGE_RESPONSE"
fi

# Test getting all preferences
print_test_header "Get All Preferences"
PREFERENCES_RESPONSE=$(make_request "GET" "/buyers/preferences" "" "$token")

if [ $? -eq 0 ]; then
    print_success "Retrieved all preferences"
    echo "Debug - Preferences Response: $PREFERENCES_RESPONSE"
else
    print_error "Failed to get preferences"
    echo "Debug - Error Response: $PREFERENCES_RESPONSE"
fi

print_success "Test script completed."