#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Utility functions
print_test_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    return 1
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        ${data:+-d "$data"} \
        "http://localhost:3000/api$endpoint")

    # Check for curl errors
    if [ $? -ne 0 ]; then
        print_error "Failed to make request to $endpoint"
        return 1
    fi

    # Check for API errors
    if echo "$response" | grep -q '"statusCode":[45]'; then
        print_error "API request failed: $response"
        return 1
    fi

    echo "$response"
    return 0
}

# Function to get user token with registration if needed
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}")
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

    echo "$VERIFY_RESPONSE"
    return 0
}

# Main test flow
print_test_header "Starting Inspection Flow Tests"

# Setup test users
print_test_header "Setting up test users"

# Setup ADMIN
ADMIN_RESPONSE=$(get_user_token "+1111111111" "Test Admin" "ADMIN" "test_admin@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup ADMIN user"
    exit 1
fi
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')

# Setup INSPECTOR
INSPECTOR_RESPONSE=$(get_user_token "+2222222222" "Test Inspector" "INSPECTOR" "test_inspector@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup INSPECTOR user"
    exit 1
fi
INSPECTOR_TOKEN=$(echo "$INSPECTOR_RESPONSE" | jq -r '.token')
INSPECTOR_ID=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.id')

# Setup FARMER
FARMER_RESPONSE=$(get_user_token "+3333333333" "Test Farmer" "FARMER" "test_farmer@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup FARMER user"
    exit 1
fi
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')
FARMER_ID=$(echo "$FARMER_RESPONSE" | jq -r '.user.id')

# Create inspector profile
print_test_header "Creating Inspector Profile"
INSPECTOR_PROFILE_RESPONSE=$(make_request "POST" "/inspectors" "{
    \"name\":\"Test Inspector\",
    \"mobile_number\":\"+2222222222\",
    \"location\":\"12.9716,77.5946\",
    \"user_id\":\"$INSPECTOR_ID\"
}" "$INSPECTOR_TOKEN")

if [ $? -ne 0 ]; then
    print_warning "Inspector profile might already exist, continuing..."
else
    print_success "Created inspector profile"
fi

# Create test produce
print_test_header "Creating Test Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "{
    \"name\":\"Test Produce\",
    \"description\":\"Test produce for inspection\",
    \"product_variety\":\"Test Variety\",
    \"produce_category\":\"VEGETABLES\",
    \"quantity\":100,
    \"unit\":\"KG\",
    \"price_per_unit\":50.00,
    \"location\":\"12.9716,77.5946\",
    \"location_name\":\"Test Location\",
    \"images\":[\"https://example.com/test.jpg\"],
    \"harvested_at\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}" "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create produce"
    exit 1
fi

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
print_success "Created produce with ID: $PRODUCE_ID"

# Wait for AI Assessment
print_test_header "Waiting for AI Assessment"
sleep 5

# Request Manual Inspection
print_test_header "Requesting Manual Inspection"
INSPECTION_REQUEST_RESPONSE=$(make_request "POST" "/quality/inspection/request" "{
    \"produce_id\":\"$PRODUCE_ID\",
    \"location\":\"12.9716,77.5946\"
}" "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create inspection request"
    exit 1
fi

INSPECTION_ID=$(echo "$INSPECTION_REQUEST_RESPONSE" | jq -r '.id')
print_success "Created inspection request with ID: $INSPECTION_ID"

# Assign Inspector
print_test_header "Assigning Inspector"
ASSIGN_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/assign" "{}" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to assign inspector"
    exit 1
fi
print_success "Assigned inspector to inspection request"

# Submit Inspection Result
print_test_header "Submitting Inspection Result"
INSPECTION_RESULT_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/submit-result" "{
    \"produce_id\":\"$PRODUCE_ID\",
    \"quality_grade\":8,
    \"confidence_level\":100,
    \"defects\":[\"minor_bruising\"],
    \"recommendations\":[\"Store in cool temperature\"],
    \"category_specific_assessment\":{
        \"freshness_level\":\"fresh\",
        \"size\":\"medium\",
        \"color\":\"red\",
        \"moisture_content\":85,
        \"foreign_matter\":0.5
    },
    \"metadata\":{
        \"notes\":\"Good quality produce with minor blemishes\",
        \"images\":[\"https://example.com/inspection-image1.jpg\"]
    }
}" "$INSPECTOR_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to submit inspection result"
    exit 1
fi
print_success "Submitted inspection result"

# Verify Final Status
print_test_header "Verifying Final Status"
FINAL_STATUS_RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get final status"
    exit 1
fi

FINAL_STATUS=$(echo "$FINAL_STATUS_RESPONSE" | jq -r '.status')
print_success "Final produce status: $FINAL_STATUS"

# Get All Quality Assessments
print_test_header "Getting All Quality Assessments"
QUALITY_ASSESSMENTS_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get quality assessments"
    exit 1
fi
print_success "Retrieved all quality assessments"

echo -e "\n${GREEN}All inspection tests completed successfully!${NC}"