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
    print_header "Starting Inspection Tests"
    
    # Get authentication tokens for different roles
    FARMER_TOKEN=$(authenticate "$FARMER_MOBILE" "$FARMER_NAME" "FARMER")
    INSPECTOR_TOKEN=$(authenticate "$INSPECTOR_MOBILE" "$INSPECTOR_NAME" "INSPECTOR")
    ADMIN_TOKEN=$(authenticate "$ADMIN_MOBILE" "$ADMIN_NAME" "ADMIN")
    
    # Test 1: Create inspector profile
    print_header "Testing Create Inspector Profile"
    INSPECTOR_DATA='{
        "specializations": ["VEGETABLES", "FRUITS"],
        "experience_years": 5,
        "certifications": ["ISO_22000", "FSSAI"],
        "available_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        "service_areas": [
            {
                "type": "Point",
                "coordinates": [73.123456, 18.123456]
            }
        ],
        "languages": ["ENGLISH", "HINDI"],
        "bio": "Experienced agricultural inspector with focus on quality assurance"
    }'
    RESPONSE=$(make_request "POST" "/inspectors/profile" "$INSPECTOR_DATA" "$INSPECTOR_TOKEN")
    INSPECTOR_PROFILE_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$INSPECTOR_PROFILE_ID" ] && [ "$INSPECTOR_PROFILE_ID" != "null" ]; then
        print_success "Successfully created inspector profile"
    else
        print_error "Failed to create inspector profile"
    fi
    
    # Test 2: Create farm and produce for inspection
    print_header "Testing Create Farm and Produce"
    FARM_DATA='{
        "name": "Inspection Test Farm",
        "location": {
            "type": "Point",
            "coordinates": [73.123456, 18.123456]
        },
        "address": "Test Farm Address",
        "size": 10.5,
        "size_unit": "ACRES"
    }'
    RESPONSE=$(make_request "POST" "/farms" "$FARM_DATA" "$FARMER_TOKEN")
    FARM_ID=$(echo "$RESPONSE" | jq -r '.id')
    
    PRODUCE_DATA='{
        "farm_id": "'$FARM_ID'",
        "name": "Inspection Test Tomatoes",
        "variety": "Roma",
        "quantity": 100,
        "unit": "KG",
        "price_per_unit": 50,
        "harvest_date": "'$(date -v+1d +%Y-%m-%d)'",
        "description": "Tomatoes for inspection testing",
        "images": ["https://example.com/tomato.jpg"]
    }'
    RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
    PRODUCE_ID=$(echo "$RESPONSE" | jq -r '.id')
    
    # Test 3: Request inspection
    print_header "Testing Request Inspection"
    REQUEST_DATA='{
        "produce_id": "'$PRODUCE_ID'",
        "preferred_date": "'$(date -v+2d +%Y-%m-%d)'",
        "preferred_time_slot": "MORNING",
        "notes": "Need urgent inspection for export certification",
        "inspection_type": "EXPORT_CERTIFICATION"
    }'
    RESPONSE=$(make_request "POST" "/inspections/request" "$REQUEST_DATA" "$FARMER_TOKEN")
    INSPECTION_ID=$(echo "$RESPONSE" | jq -r '.id')
    if [ -n "$INSPECTION_ID" ] && [ "$INSPECTION_ID" != "null" ]; then
        print_success "Successfully created inspection request"
    else
        print_error "Failed to create inspection request"
    fi
    
    # Test 4: Get available inspectors
    print_header "Testing Get Available Inspectors"
    RESPONSE=$(make_request "GET" "/inspections/available-inspectors?date=$(date -v+2d +%Y-%m-%d)&location=73.123456,18.123456" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved available inspectors"
    else
        print_error "Failed to get available inspectors"
    fi
    
    # Test 5: Accept inspection request
    print_header "Testing Accept Inspection Request"
    RESPONSE=$(make_request "PUT" "/inspections/$INSPECTION_ID/accept" "" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully accepted inspection request"
    else
        print_error "Failed to accept inspection request"
    fi
    
    # Test 6: Update inspection status
    print_header "Testing Update Inspection Status"
    STATUS_DATA='{
        "status": "IN_PROGRESS",
        "notes": "Started inspection process"
    }'
    RESPONSE=$(make_request "PUT" "/inspections/$INSPECTION_ID/status" "$STATUS_DATA" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated inspection status"
    else
        print_error "Failed to update inspection status"
    fi
    
    # Test 7: Submit inspection report
    print_header "Testing Submit Inspection Report"
    REPORT_DATA='{
        "quality_score": 95,
        "certification_status": "APPROVED",
        "inspection_notes": "Excellent quality produce suitable for export",
        "defects": [],
        "recommendations": ["Maintain current storage conditions"],
        "images": ["https://example.com/inspection1.jpg"],
        "category_specific_assessment": {
            "size_uniformity": "EXCELLENT",
            "color_consistency": "VERY_GOOD",
            "ripeness": "OPTIMAL"
        }
    }'
    RESPONSE=$(make_request "PUT" "/inspections/$INSPECTION_ID/submit-report" "$REPORT_DATA" "$INSPECTOR_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully submitted inspection report"
    else
        print_error "Failed to submit inspection report"
    fi
    
    # Test 8: Get inspection history
    print_header "Testing Get Inspection History"
    RESPONSE=$(make_request "GET" "/inspections/history?page=1&limit=10" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved inspection history"
    else
        print_error "Failed to get inspection history"
    fi
    
    # Test 9: Get inspection details
    print_header "Testing Get Inspection Details"
    RESPONSE=$(make_request "GET" "/inspections/$INSPECTION_ID" "" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved inspection details"
    else
        print_error "Failed to get inspection details"
    fi
    
    print_header "Inspection Tests Completed"
}

# Run the tests
main 