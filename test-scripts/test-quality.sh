#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
FARMER_MOBILE="+1234567891"
FARMER_NAME="Test Farmer"
INSPECTOR_MOBILE="+1234567892"
INSPECTOR_NAME="Test Inspector"
ADMIN_MOBILE="+1234567893"
ADMIN_NAME="Test Admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Utility functions
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
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Make HTTP request with proper error handling
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    
    endpoint=${endpoint#/api}
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    local response=""
    if [ -n "$token" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "${full_url}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${full_url}")
    fi
    
    echo "$response"
}

# Authentication function
authenticate() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    
    print_header "Authenticating $role"
    
    # Register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"${role,,}@test.com\"}"
    local register_response=$(make_request "POST" "/auth/register" "$register_data")
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "$otp_data")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    
    if [ -z "$otp" ]; then
        print_error "Failed to get OTP"
        exit 1
    fi
    
    # Verify OTP
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    local verify_response=$(make_request "POST" "/auth/otp/verify" "$verify_data")
    local token=$(echo "$verify_response" | jq -r '.token')
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Failed to get authentication token"
        exit 1
    fi
    
    echo "$token"
}

# Main test execution
main() {
    print_header "Starting Quality Assessment Tests"
    
    # Get authentication tokens for different roles
    FARMER_TOKEN=$(authenticate "$FARMER_MOBILE" "$FARMER_NAME" "FARMER")
    INSPECTOR_TOKEN=$(authenticate "$INSPECTOR_MOBILE" "$INSPECTOR_NAME" "INSPECTOR")
    ADMIN_TOKEN=$(authenticate "$ADMIN_MOBILE" "$ADMIN_NAME" "ADMIN")
    
    # Test 1: Create farm and produce
    print_header "Testing Create Farm and Produce"
    FARM_DATA='{
        "name": "Quality Test Farm",
        "location": "12.9716,77.5946",
        "address": "Test Farm Address",
        "size": 10.5,
        "size_unit": "ACRES"
    }'
    RESPONSE=$(make_request "POST" "/farms" "$FARM_DATA" "$FARMER_TOKEN")
    FARM_ID=$(echo "$RESPONSE" | jq -r '.id')
    
    PRODUCE_DATA='{
        "farm_id": "'$FARM_ID'",
        "name": "Quality Test Tomatoes",
        "variety": "Roma",
        "quantity": 100,
        "unit": "KG",
        "price_per_unit": 50,
        "harvest_date": "'$(date -v+1d +%Y-%m-%d)'",
        "description": "Tomatoes for quality testing",
        "images": ["https://example.com/tomato.jpg"]
    }'
    RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
    PRODUCE_ID=$(echo "$RESPONSE" | jq -r '.id')
    
    # Test 2: Create quality assessment
    print_header "Testing Create Quality Assessment"
    ASSESSMENT_DATA='{
        "produce_id": "'$PRODUCE_ID'",
        "overall_grade": "A",
        "quality_score": 90,
        "freshness_level": "VERY_FRESH",
        "appearance_score": 95,
        "size_uniformity": "HIGH",
        "color_assessment": "EXCELLENT",
        "defects": ["MINOR_BLEMISHES"],
        "inspector_notes": "High quality produce with minimal defects",
        "assessment_date": "'$(date +%Y-%m-%d)'",
        "images": ["https://example.com/quality-check.jpg"]
    }'
    RESPONSE=$(make_request "POST" "/quality/assessments" "$ASSESSMENT_DATA" "$INSPECTOR_TOKEN")
    ASSESSMENT_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$ASSESSMENT_ID" ] && [ "$ASSESSMENT_ID" != "null" ]; then
        print_success "Successfully created quality assessment"
    else
        print_error "Failed to create quality assessment"
    fi
    
    # Test 3: Get quality assessment
    print_header "Testing Get Quality Assessment"
    RESPONSE=$(make_request "GET" "/quality/assessments/$ASSESSMENT_ID" "" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved quality assessment"
    else
        print_error "Failed to get quality assessment"
    fi
    
    # Test 4: Update quality assessment
    print_header "Testing Update Quality Assessment"
    UPDATE_DATA='{
        "quality_score": 95,
        "inspector_notes": "Updated: Exceptional quality produce"
    }'
    RESPONSE=$(make_request "PATCH" "/quality/assessments/$ASSESSMENT_ID" "$UPDATE_DATA" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated quality assessment"
    else
        print_error "Failed to update quality assessment"
    fi
    
    # Test 5: Get produce quality history
    print_header "Testing Get Produce Quality History"
    RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/history" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved produce quality history"
    else
        print_error "Failed to get produce quality history"
    fi
    
    # Test 6: Request inspection
    print_header "Testing Request Inspection"
    INSPECTION_DATA='{
        "produce_id": "'$PRODUCE_ID'",
        "preferred_date": "'$(date -v+2d +%Y-%m-%d)'",
        "notes": "Please inspect for export quality certification"
    }'
    RESPONSE=$(make_request "POST" "/quality/inspections/request" "$INSPECTION_DATA" "$FARMER_TOKEN")
    INSPECTION_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$INSPECTION_ID" ] && [ "$INSPECTION_ID" != "null" ]; then
        print_success "Successfully created inspection request"
    else
        print_error "Failed to create inspection request"
    fi
    
    # Test 7: Assign inspector
    print_header "Testing Assign Inspector"
    ASSIGN_DATA='{
        "inspector_id": "'$(echo "$INSPECTOR_TOKEN" | jq -r '.user.id')'"
    }'
    RESPONSE=$(make_request "PUT" "/quality/inspections/$INSPECTION_ID/assign" "$ASSIGN_DATA" "$ADMIN_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully assigned inspector"
    else
        print_error "Failed to assign inspector"
    fi
    
    # Test 8: Complete inspection
    print_header "Testing Complete Inspection"
    COMPLETE_DATA='{
        "quality_score": 98,
        "inspection_notes": "Completed inspection: Premium export quality",
        "certification_status": "APPROVED"
    }'
    RESPONSE=$(make_request "PUT" "/quality/inspections/$INSPECTION_ID/complete" "$COMPLETE_DATA" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully completed inspection"
    else
        print_error "Failed to complete inspection"
    fi
    
    print_header "Quality Assessment Tests Completed"
}

# Run the tests
main 