#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test variables
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
INSPECTOR_MOBILE="+1234567892"
INSPECTOR_NAME="Test Inspector"
ADMIN_MOBILE="+1234567893"
ADMIN_NAME="Test Admin"
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
print_step "Starting Quality Assessment Tests"

# Check if server is running
check_server

# Get authentication tokens
FARMER_TOKEN=$(get_auth_token "$FARMER_MOBILE" "$FARMER_NAME" "FARMER")
INSPECTOR_TOKEN=$(get_auth_token "$INSPECTOR_MOBILE" "$INSPECTOR_NAME" "INSPECTOR")
ADMIN_TOKEN=$(get_auth_token "$ADMIN_MOBILE" "$ADMIN_NAME" "ADMIN")

# Create test farm and produce
print_step "Creating test farm and produce"
FARM_RESPONSE=$(make_request "POST" "/farms" "$FARMER_TOKEN" "{
    \"name\": \"Quality Test Farm\",
    \"location\": \"$TEST_LOCATION\",
    \"address\": \"Test Farm Address\",
    \"size\": 10.5,
    \"size_unit\": \"ACRES\"
}")
FARM_ID=$(get_id "$FARM_RESPONSE")
print_success "Created farm with ID: $FARM_ID"

PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" "{
    \"farm_id\": \"$FARM_ID\",
    \"name\": \"Quality Test Tomatoes\",
    \"variety\": \"Roma\",
    \"quantity\": 100,
    \"unit\": \"KG\",
    \"price_per_unit\": 50,
    \"harvest_date\": \"$(date -v+1d +%Y-%m-%d)\",
    \"description\": \"Tomatoes for quality testing\",
    \"images\": [\"https://example.com/tomato.jpg\"]
}")
PRODUCE_ID=$(get_id "$PRODUCE_RESPONSE")
print_success "Created produce with ID: $PRODUCE_ID"

# Create quality assessment
print_step "Creating quality assessment"
ASSESSMENT_RESPONSE=$(make_request "POST" "/quality/assessments" "$INSPECTOR_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"overall_grade\": \"A\",
    \"quality_score\": 90,
    \"freshness_level\": \"VERY_FRESH\",
    \"appearance_score\": 95,
    \"size_uniformity\": \"HIGH\",
    \"color_assessment\": \"EXCELLENT\",
    \"defects\": [\"MINOR_BLEMISHES\"],
    \"inspector_notes\": \"High quality produce with minimal defects\",
    \"assessment_date\": \"$(date +%Y-%m-%d)\",
    \"images\": [\"https://example.com/quality-check.jpg\"]
}")
ASSESSMENT_ID=$(get_id "$ASSESSMENT_RESPONSE")
print_success "Created quality assessment with ID: $ASSESSMENT_ID"

# Get quality assessment
print_step "Getting quality assessment"
ASSESSMENT_DETAILS=$(make_request "GET" "/quality/assessments/$ASSESSMENT_ID" "$INSPECTOR_TOKEN")
check_error "$ASSESSMENT_DETAILS" "Failed to get quality assessment"
print_success "Retrieved quality assessment"

# Update quality assessment
print_step "Updating quality assessment"
UPDATE_RESPONSE=$(make_request "PATCH" "/quality/assessments/$ASSESSMENT_ID" "$INSPECTOR_TOKEN" "{
    \"quality_score\": 95,
    \"inspector_notes\": \"Updated: Exceptional quality produce\"
}")
check_error "$UPDATE_RESPONSE" "Failed to update quality assessment"
print_success "Updated quality assessment"

# Get produce quality history
print_step "Getting produce quality history"
HISTORY_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/history" "$FARMER_TOKEN")
check_error "$HISTORY_RESPONSE" "Failed to get produce quality history"
print_success "Retrieved produce quality history"

# Request inspection
print_step "Requesting inspection"
INSPECTION_RESPONSE=$(make_request "POST" "/quality/inspections/request" "$FARMER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"preferred_date\": \"$(date -v+2d +%Y-%m-%d)\",
    \"notes\": \"Please inspect for export quality certification\"
}")
INSPECTION_ID=$(get_id "$INSPECTION_RESPONSE")
print_success "Created inspection request with ID: $INSPECTION_ID"

# Assign inspector
print_step "Assigning inspector"
ASSIGN_RESPONSE=$(make_request "PUT" "/quality/inspections/$INSPECTION_ID/assign" "$ADMIN_TOKEN" "{
    \"inspector_id\": \"$(echo "$INSPECTOR_TOKEN" | jq -r '.user.id')\"
}")
check_error "$ASSIGN_RESPONSE" "Failed to assign inspector"
print_success "Assigned inspector"

# Complete inspection
print_step "Completing inspection"
COMPLETE_RESPONSE=$(make_request "PUT" "/quality/inspections/$INSPECTION_ID/complete" "$INSPECTOR_TOKEN" "{
    \"quality_score\": 98,
    \"inspection_notes\": \"Completed inspection: Premium export quality\",
    \"certification_status\": \"APPROVED\"
}")
check_error "$COMPLETE_RESPONSE" "Failed to complete inspection"
print_success "Completed inspection"

echo -e "\n${GREEN}✓ All Quality Assessment Tests Completed Successfully${NC}" 