#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Starting Inspection Tests"

# Get tokens for different roles
print_test_header "Registering and authenticating users"

# Setup FARMER
print_test_header "Setting up FARMER user"
FARMER_TOKEN=$(get_auth_token "+1234567894" "Test Farmer" "FARMER")
if [ $? -ne 0 ]; then
    print_error "Failed to setup FARMER user"
    exit 1
fi

# Setup INSPECTOR
print_test_header "Setting up INSPECTOR user"
INSPECTOR_TOKEN=$(get_auth_token "+1234567895" "Test Inspector" "INSPECTOR")
if [ $? -ne 0 ]; then
    print_error "Failed to setup INSPECTOR user"
    exit 1
fi

# Setup ADMIN
print_test_header "Setting up ADMIN user"
ADMIN_TOKEN=$(get_auth_token "+1234567896" "Test Admin" "ADMIN")
if [ $? -ne 0 ]; then
    print_error "Failed to setup ADMIN user"
    exit 1
fi

# Create farm
print_test_header "Creating Farm"
FARM_DATA="{\"name\":\"Test Farm\",\"description\":\"A test farm for inspection testing\",\"size_in_acres\":10.5,\"address\":\"123 Test St\",\"location\":\"73.123456,18.123456\",\"image\":\"https://example.com/farm.jpg\"}"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" "$FARM_DATA" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to create farm"
    exit 1
fi

FARM_ID=$(echo "$FARM_RESPONSE" | jq -r '.id')
if [ -z "$FARM_ID" ] || [ "$FARM_ID" = "null" ]; then
    print_error "Failed to extract farm ID from response: $FARM_RESPONSE"
    exit 1
fi
print_success "Created farm with ID: $FARM_ID"

# Create produce
print_test_header "Creating Produce"
PRODUCE_DATA="{\"farm_id\":\"$FARM_ID\",\"name\":\"Test Produce\",\"description\":\"Fresh vegetables for testing\",\"quantity\":100,\"unit\":\"KG\",\"price_per_unit\":50,\"location\":\"73.123456,18.123456\",\"images\":[\"https://example.com/produce.jpg\"],\"produce_category\":\"VEGETABLES\"}"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$PRODUCE_DATA" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to create produce"
    exit 1
fi

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
    print_error "Failed to extract produce ID from response: $PRODUCE_RESPONSE"
    exit 1
fi
print_success "Created produce with ID: $PRODUCE_ID"

# Request inspection
print_test_header "Requesting Inspection"
INSPECTION_REQUEST_DATA="{\"produce_id\":\"$PRODUCE_ID\",\"location\":\"73.123456,18.123456\"}"
INSPECTION_REQUEST_RESPONSE=$(make_request "POST" "/quality/inspection/request" "$INSPECTION_REQUEST_DATA" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to create inspection request"
    exit 1
fi

INSPECTION_REQUEST_ID=$(echo "$INSPECTION_REQUEST_RESPONSE" | jq -r '.id')
if [ -z "$INSPECTION_REQUEST_ID" ] || [ "$INSPECTION_REQUEST_ID" = "null" ]; then
    print_error "Failed to extract inspection request ID from response: $INSPECTION_REQUEST_RESPONSE"
    exit 1
fi
print_success "Created inspection request with ID: $INSPECTION_REQUEST_ID"

# Get available inspectors
print_test_header "Getting Available Inspectors"
INSPECTORS_RESPONSE=$(make_request "GET" "/inspectors" "" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get available inspectors"
    exit 1
fi
print_success "Retrieved available inspectors"

# Assign inspector to request
print_test_header "Assigning Inspector"
ASSIGN_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_REQUEST_ID/assign" "" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to assign inspector"
    exit 1
fi
print_success "Assigned inspector to request"

# Get produce details to determine category
print_test_header "Getting Produce Details"
PRODUCE_RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get produce details"
    exit 1
fi
print_success "Retrieved produce details"

# Submit inspection result
print_test_header "Submitting Inspection Result"
INSPECTION_RESULT_DATA="{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quality_grade\": 8,
    \"confidence_level\": 95,
    \"category_specific_assessment\": {
        \"freshness_level\": \"fresh\",
        \"size\": \"medium\",
        \"color\": \"green\",
        \"moisture_content\": 85,
        \"foreign_matter\": 2
    }
}"
RESULT_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_REQUEST_ID/submit-result" "$INSPECTION_RESULT_DATA" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to submit inspection result"
    exit 1
fi
print_success "Submitted inspection result"

# Extract quality assessment ID from result response
QUALITY_ASSESSMENT_ID=$(echo "$RESULT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Get inspection history
print_test_header "Getting Inspection History"
HISTORY_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get inspection history"
    exit 1
fi
print_success "Retrieved inspection history"

# Get inspection details
print_test_header "Getting Inspection Details"
DETAILS_RESPONSE=$(make_request "GET" "/quality/$QUALITY_ASSESSMENT_ID" "" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get inspection details"
    exit 1
fi
print_success "Retrieved inspection details"

print_test_header "Inspection Tests Completed" 