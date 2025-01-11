#!/bin/bash

# Import common utilities
source "$(dirname "$0")/utils.sh"

print_header "Initializing Test Data"

# Initialize test users
print_test "Creating test users"
ADMIN_TOKEN=$(get_auth_token "+911234567890" "Test Admin" "ADMIN")
if [ -z "$ADMIN_TOKEN" ]; then
    print_error "Failed to get admin token"
    exit 1
fi

FARMER_TOKEN=$(get_auth_token "+911234567891" "Test Farmer" "FARMER")
if [ -z "$FARMER_TOKEN" ]; then
    print_error "Failed to get farmer token"
    exit 1
fi

INSPECTOR_TOKEN=$(get_auth_token "+911234567892" "Test Inspector" "INSPECTOR")
if [ -z "$INSPECTOR_TOKEN" ]; then
    print_error "Failed to get inspector token"
    exit 1
fi

# Create farmer profile
echo "-> Creating farmer profile"
FARMER_PROFILE_RESPONSE=$(curl -s -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $FARMER_TOKEN" -d '{}' 'http://localhost:3000/api/farmers')
if [[ $(echo "$FARMER_PROFILE_RESPONSE" | jq -r '.id') == "null" ]]; then
    echo "ERROR: Failed to create farmer profile"
    echo "Response: $FARMER_PROFILE_RESPONSE"
    exit 1
fi
echo "✓ Created farmer profile"

# Create test produce with images for AI assessment
echo "-> Creating test produce"
PRODUCE_RESPONSE=$(make_request "POST" "/api/produce" '{
    "quantity": 100,
    "location": "12.9716,77.5946",
    "images": ["https://example.com/tomatoes1.jpg"],
    "location_name": "Test Farm",
    "video_url": "https://example.com/tomatoes-video.mp4",
    "harvested_at": "2024-02-01T00:00:00Z"
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

# Wait for AI assessment to complete
print_test "Waiting for AI assessment"
sleep 5  # Give some time for AI assessment to complete

# Get latest AI assessment
print_test_header "Testing GET /api/quality/produce/:produce_id/latest"
AI_ASSESSMENT_RESPONSE=$(make_request "GET" "/api/quality/produce/$PRODUCE_ID/latest" "" "$FARMER_TOKEN")
check_response "$AI_ASSESSMENT_RESPONSE"

# Test inspection request only if AI assessment confidence is low
AI_CONFIDENCE=$(echo "$AI_ASSESSMENT_RESPONSE" | jq -r '.confidence_level')
if [ -z "$AI_CONFIDENCE" ] || [ "$AI_CONFIDENCE" -lt 80 ]; then
    print_header "Testing Manual Inspection Flow"
    
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
        "notes": "Good overall quality",
        "category": "VEGETABLES",
        "category_specific_assessment": {
            "ripeness": "good",
            "freshness": "excellent",
            "color_uniformity": 85,
            "size_uniformity": 90
        }
    }' "$INSPECTOR_TOKEN")
    check_response "$response"
fi

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