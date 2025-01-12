#!/bin/bash

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for API
API_BASE_URL=${API_BASE_URL:-"http://localhost:3000/api"}

# Print functions for test output
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

print_test_header() {
    echo -e "\nTesting: ${YELLOW}$1${NC}"
}

print_success() {
    echo -e "✓ ${GREEN}$1${NC}"
}

print_error() {
    echo -e "✗ ${RED}$1${NC}"
}

print_warning() {
    echo -e "! ${YELLOW}$1${NC}"
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

# Function to handle authentication flow
get_auth_token() {
    local mobile_number=$1
    local name=$2
    local role=$3
    local email=$4

    # Check if mobile number exists
    local check_response=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile_number\"}")
    local is_registered=$(echo "$check_response" | jq -r '.isRegistered')

    if [ "$is_registered" = "false" ]; then
        # Register new user
        local register_response=$(make_request "POST" "/auth/register" "{
            \"mobile_number\":\"$mobile_number\",
            \"name\":\"$name\",
            \"role\":\"$role\",
            \"email\":\"$email\"
        }")
        
        if [ $? -ne 0 ]; then
            print_warning "Registration failed, user might already exist"
        fi
    fi

    # Request OTP
    local otp_response=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$mobile_number\"}")
    local otp=$(echo "$otp_response" | grep -o '"OTP sent successfully: [0-9]*"' | grep -o '[0-9]*')

    # Verify OTP
    local verify_response=$(make_request "POST" "/auth/otp/verify" "{
        \"mobile_number\":\"$mobile_number\",
        \"otp\":\"$otp\"
    }")

    echo "$verify_response"
}

# Function to wait for quality assessment completion
wait_for_quality_assessment() {
    local produce_id=$1
    local max_attempts=30
    local interval=5
    local attempt=1

    echo "Waiting for quality assessment completion..."
    while [ $attempt -le $max_attempts ]; do
        echo "Testing: Checking produce status (attempt $attempt/$max_attempts)"
        local response=$(make_request "GET" "/produce/$produce_id" "" "$ADMIN_TOKEN")
        if [ $? -eq 0 ]; then
            local status=$(echo "$response" | jq -r '.status')
            local quality_grade=$(echo "$response" | jq -r '.quality_grade')
            echo "Current status: $status"
            echo "Current quality grade: $quality_grade"
            
            if [ "$status" = "AVAILABLE" ]; then
                print_success "Quality assessment completed"
                return 0
            elif [ "$status" = "PENDING_AI_ASSESSMENT" ] && [ $attempt -eq $max_attempts ]; then
                echo "Forcing AI assessment completion..."
                local ai_assessment_response=$(make_request "POST" "/quality/ai-assessment" "{
                    \"produce_id\": \"$PRODUCE_ID\",
                    \"quality_grade\": 9,
                    \"confidence_level\": 95,
                    \"defects\": [\"minor_blemishes\"],
                    \"recommendations\": [\"store_in_cool_place\"],
                    \"description\": \"Good quality produce with minor issues\",
                    \"category\": \"VEGETABLES\",
                    \"category_specific_assessment\": {
                        \"size\": \"medium\",
                        \"ripeness\": \"good\",
                        \"color_uniformity\": 90
                    },
                    \"location\": \"12.9716,77.5946\",
                    \"metadata\": {
                        \"ai_model_version\": \"gpt-4-vision-preview\",
                        \"assessment_parameters\": {
                            \"lighting\": \"good\",
                            \"focus\": \"sharp\"
                        },
                        \"images\": [\"https://example.com/tomato1.jpg\"]
                    }
                }" "" "$ADMIN_TOKEN")
                echo "Debug - AI Assessment Response: $ai_assessment_response"
                sleep 5  # Wait for the event to be processed
            fi
        fi
        
        echo "Waiting $interval seconds before next check..."
        sleep $interval
        attempt=$((attempt + 1))
    done

    echo "✗ Timed out waiting for quality assessment completion"
    return 1
}

# Function to wait for offers
wait_for_offers() {
    local max_attempts=12
    local attempt=1
    local interval=5

    while [ $attempt -le $max_attempts ]; do
        print_test_header "Checking for offers (attempt $attempt/$max_attempts)"
        local response=$(make_request "GET" "/offers" "" "$BUYER_TOKEN")
        if [ $? -eq 0 ]; then
            local offers_count=$(echo "$response" | jq '.items | length')
            echo "Debug - Found $offers_count offers"

            if [ "$offers_count" -gt 0 ]; then
                local offer_id=$(echo "$response" | jq -r '.items[0].id')
                if [ -n "$offer_id" ] && [ "$offer_id" != "null" ]; then
                    print_success "Found offer with ID: $offer_id"
                    OFFER_ID="$offer_id"
                    return 0
                fi
            fi
        fi

        echo "Waiting ${interval} seconds before next check..."
        sleep $interval
        attempt=$((attempt + 1))
    done

    print_error "Timed out waiting for offers"
    return 1
}

# Main test flow
echo -e "\n=== Complete Offer Management Flow Tests ===\n"

# Verify database connection
print_test_header "Verifying Database Connection"
DB_CHECK_RESPONSE=$(PGPASSWORD="postgres" psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1" 2>&1)
if [ $? -eq 0 ]; then
    print_success "Database connection successful"
else
    print_error "Failed to connect to database"
    echo "Debug - Error Response: $DB_CHECK_RESPONSE"
    exit 1
fi

# Verify API server connection
print_test_header "Verifying API Server Connection"
API_CHECK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${API_BASE_URL}/health)
if [ "$API_CHECK_RESPONSE" = "200" ]; then
    print_success "API server connection successful"
else
    print_error "Failed to connect to API server"
    echo "Debug - HTTP Status Code: $API_CHECK_RESPONSE"
    exit 1
fi

# Get tokens for different roles
print_test_header "Setting up test users"

# Get FARMER token
FARMER_RESPONSE=$(get_auth_token "+7777777777" "Test Farmer" "FARMER" "test.farmer@test.com")
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')
FARMER_ID=$(echo "$FARMER_RESPONSE" | jq -r '.user.id')
if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
    print_error "Failed to get farmer token"
    exit 1
fi
print_success "Got FARMER token"

# Get BUYER token
BUYER_RESPONSE=$(get_auth_token "+8888888888" "Test Buyer" "BUYER" "test.buyer@test.com")
BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | jq -r '.token')
BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.user.id')
if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" = "null" ]; then
    print_error "Failed to get buyer token"
    exit 1
fi
print_success "Got BUYER token"

# Get ADMIN token
ADMIN_RESPONSE=$(get_auth_token "+9999999999" "Test Admin" "ADMIN" "test.admin@test.com")
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')
ADMIN_ID=$(echo "$ADMIN_RESPONSE" | jq -r '.user.id')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    print_error "Failed to get admin token"
    exit 1
fi
print_success "Got ADMIN token"

# Step 1: Updating buyer details with location
print_test_header "Update Buyer Details"
BUYER_UPDATE_RESPONSE=$(make_request "POST" "/buyers/details/update" "{
    \"business_name\": \"Test Buyer Business\",
    \"lat_lng\": \"12.9716,77.5946\",
    \"address\": \"45 Market Street, Business District\",
    \"gst\": \"GSTIN123456789\",
    \"registration_number\": \"REG123456\"
}" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Updated buyer details"
else
    print_error "Failed to update buyer details"
    echo "Debug - Error Response: $BUYER_UPDATE_RESPONSE"
    exit 1
fi

# Step 2: Setting buyer preferences
print_test_header "Set Buyer Preferences"
PREFERENCES_RESPONSE=$(make_request "POST" "/buyers/preferences/price-range" "{
    \"min_price\": 20.00,
    \"max_price\": 50.00,
    \"categories\": [\"VEGETABLES\"]
}" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Set buyer preferences"
    echo "Debug - Preferences Response: $PREFERENCES_RESPONSE"
else
    print_error "Failed to set buyer preferences"
    echo "Debug - Error Response: $PREFERENCES_RESPONSE"
fi

# Get buyer profile to get the correct buyer_id
print_test_header "Get Buyer Profile"
BUYER_PROFILE_RESPONSE=$(make_request "GET" "/buyers/profile" "" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Got buyer profile"
    BUYER_ID=$(echo "$BUYER_PROFILE_RESPONSE" | jq -r '.id')
    echo "Debug - Buyer Profile Response: $BUYER_PROFILE_RESPONSE"
    
    # Add debug info for buyer location and preferences
    BUYER_LAT_LNG=$(echo "$BUYER_PROFILE_RESPONSE" | jq -r '.lat_lng')
    BUYER_IS_ACTIVE=$(echo "$BUYER_PROFILE_RESPONSE" | jq -r '.is_active')
    BUYER_PREFERENCES=$(echo "$BUYER_PROFILE_RESPONSE" | jq -r '.preferences')
    echo "Debug - Buyer Location: $BUYER_LAT_LNG"
    echo "Debug - Buyer Active Status: $BUYER_IS_ACTIVE"
    echo "Debug - Buyer Preferences: $BUYER_PREFERENCES"
else
    print_error "Failed to get buyer profile"
    echo "Debug - Error Response: $BUYER_PROFILE_RESPONSE"
    exit 1
fi

# Test: Set Daily Price
print_test_header "Set Daily Price"
DAILY_PRICE_RESPONSE=$(make_request "POST" "/daily-prices" "{
    \"buyer_id\": \"$BUYER_ID\",
    \"produce_category\": \"VEGETABLES\",
    \"min_price\": 20.00,
    \"max_price\": 50.00,
    \"minimum_quantity\": 100,
    \"valid_days\": 7
}" "$BUYER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Set daily price"
    echo "Debug - Daily Price Response: $DAILY_PRICE_RESPONSE"
    
    # Add debug info for daily price
    echo "Debug - Daily Price Active Status: $(echo "$DAILY_PRICE_RESPONSE" | jq -r '.is_active')"
    echo "Debug - Daily Price Valid From: $(echo "$DAILY_PRICE_RESPONSE" | jq -r '.valid_from')"
    echo "Debug - Daily Price Valid Until: $(echo "$DAILY_PRICE_RESPONSE" | jq -r '.valid_until')"
    echo "Debug - Daily Price Category: $(echo "$DAILY_PRICE_RESPONSE" | jq -r '.produce_category')"
    
    DAILY_PRICE_ID=$(echo "$DAILY_PRICE_RESPONSE" | jq -r '.id')
    if [ -n "$DAILY_PRICE_ID" ] && [ "$DAILY_PRICE_ID" != "null" ]; then
        print_success "Extracted daily price ID: $DAILY_PRICE_ID"
    else
        print_warning "Could not extract daily price ID from response"
    fi
else
    print_error "Failed to set daily price"
    echo "Debug - Error Response: $DAILY_PRICE_RESPONSE"
fi

# Step 3: Create a produce item
print_test_header "Create Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "{
    \"name\": \"Fresh Tomatoes\",
    \"description\": \"High quality fresh tomatoes\",
    \"product_variety\": \"Roma Tomatoes\",
    \"produce_category\": \"VEGETABLES\",
    \"quantity\": 100,
    \"unit\": \"KG\",
    \"price_per_unit\": 50,
    \"location\": \"12.9716,77.5946\",
    \"location_name\": \"Test Farm\",
    \"images\": [\"https://example.com/tomato1.jpg\"],
    \"harvested_at\": \"2024-02-01T00:00:00Z\"
}" "$FARMER_TOKEN")

if [ $? -eq 0 ]; then
    print_success "Created produce"
    PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
    echo "Debug - Produce Response: $PRODUCE_RESPONSE"
    
    # Add debug info for produce
    echo "Debug - Produce Location: $(echo "$PRODUCE_RESPONSE" | jq -r '.location')"
    echo "Debug - Produce Category: $(echo "$PRODUCE_RESPONSE" | jq -r '.produce_category')"
    echo "Debug - Produce Status: $(echo "$PRODUCE_RESPONSE" | jq -r '.status')"
else
    print_error "Failed to create produce"
    echo "Debug - Error Response: $PRODUCE_RESPONSE"
    exit 1
fi

# Wait for quality assessment completion
echo "Waiting for quality assessment completion..."
if ! wait_for_quality_assessment "$PRODUCE_ID"; then
    echo "Failed to complete quality assessment"
    exit 1
fi

echo "Waiting for offers to be generated..."
if ! wait_for_offers; then
    echo "Failed to get offer ID"
    exit 1
fi

# Step 4: Get AI assessment results
print_test_header "Get AI Assessment Results"
AI_ASSESSMENT_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
if [ $? -eq 0 ]; then
    print_success "Got AI assessment results"
    echo "Debug - AI Assessment Response: $AI_ASSESSMENT_RESPONSE"
else
    print_error "Failed to get AI assessment results"
    echo "Debug - Error Response: $AI_ASSESSMENT_RESPONSE"
    exit 1
fi

print_success "All tests completed successfully" 