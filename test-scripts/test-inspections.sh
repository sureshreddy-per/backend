#!/bin/bash

# Import common utilities
source "$(dirname "$0")/utils.sh"

print_header "Initializing Test Data"

# Initialize test users
print_test "Creating test users"
ADMIN_TOKEN=$(get_auth_token "+911234567890" "ADMIN")
if [ -z "$ADMIN_TOKEN" ]; then
    print_error "Failed to get admin token"
    exit 1
fi

FARMER_TOKEN=$(get_auth_token "+911234567891" "FARMER")
if [ -z "$FARMER_TOKEN" ]; then
    print_error "Failed to get farmer token"
    exit 1
fi

INSPECTOR_TOKEN=$(get_auth_token "+911234567892" "INSPECTOR")
if [ -z "$INSPECTOR_TOKEN" ]; then
    print_error "Failed to get inspector token"
    exit 1
fi

# Create test produce
print_test "Creating test produce"
PRODUCE_RESPONSE=$(make_request "POST" "/api/produce" '{
    "name": "Test Tomatoes",
    "description": "Fresh farm tomatoes",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    },
    "harvest_date": "2024-02-01"
}' "$FARMER_TOKEN")

if ! check_response "$PRODUCE_RESPONSE"; then
    print_error "Failed to create test produce"
    exit 1
fi

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
    print_error "Failed to get produce ID"
    exit 1
fi

print_header "Testing Inspection Endpoints"

# Test inspection request
print_test_header "Testing POST /api/inspections/request"
INSPECTION_RESPONSE=$(make_request "POST" "/api/inspections/request" "{\"produce_id\":\"$PRODUCE_ID\"}" "$FARMER_TOKEN")
if ! check_response "$INSPECTION_RESPONSE"; then
    print_error "Failed to request inspection"
    exit 1
fi

INSPECTION_ID=$(echo "$INSPECTION_RESPONSE" | jq -r '.id')
if [ -z "$INSPECTION_ID" ] || [ "$INSPECTION_ID" = "null" ]; then
    print_error "Failed to get inspection ID"
    exit 1
fi

# Test get inspections by produce
print_test_header "Testing GET /api/inspections/produce/:produce_id"
response=$(make_request "GET" "/api/inspections/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
check_response "$response"

# Test get inspections by requester
print_test_header "Testing GET /api/inspections/requester"
response=$(make_request "GET" "/api/inspections/requester" "" "$FARMER_TOKEN")
check_response "$response"

# Test get inspections by inspector
print_test_header "Testing GET /api/inspections/inspector"
response=$(make_request "GET" "/api/inspections/inspector" "" "$INSPECTOR_TOKEN")
check_response "$response"

# Test assign inspector
print_test_header "Testing PUT /api/inspections/:id/assign"
response=$(make_request "PUT" "/api/inspections/$INSPECTION_ID/assign" "{\"inspector_id\":\"$INSPECTOR_TOKEN\"}" "$ADMIN_TOKEN")
check_response "$response"

# Test submit inspection result
print_test_header "Testing PUT /api/inspections/:id/result"
response=$(make_request "PUT" "/api/inspections/$INSPECTION_ID/result" '{
  "quality_grade": 4,
  "defects": ["minor_blemishes"],
  "recommendations": ["improve_storage"],
  "notes": "Good overall quality"
}' "$INSPECTOR_TOKEN")
check_response "$response"

print_header "Testing Inspection Fee Endpoints"

# Test get base fee config
print_test_header "Testing GET /api/config/inspection-fees/base"
response=$(make_request "GET" "/api/config/inspection-fees/base" "" "$ADMIN_TOKEN")
check_response "$response"

# Test update base fee config
print_test_header "Testing PUT /api/config/inspection-fees/base"
response=$(make_request "PUT" "/api/config/inspection-fees/base" '{
  "produce_category": "VEGETABLES",
  "base_fee": 50
}' "$ADMIN_TOKEN")
check_response "$response"

# Test get distance fee config
print_test_header "Testing GET /api/config/inspection-fees/distance"
response=$(make_request "GET" "/api/config/inspection-fees/distance" "" "$ADMIN_TOKEN")
check_response "$response"

# Test update distance fee config
print_test_header "Testing PUT /api/config/inspection-fees/distance"
response=$(make_request "PUT" "/api/config/inspection-fees/distance" '{
  "fee_per_km": 5,
  "max_fee": 500
}' "$ADMIN_TOKEN")
check_response "$response"

print_success "All inspection tests completed successfully!"

# Cleanup
cleanup 