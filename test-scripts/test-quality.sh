#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Quality Assessment Endpoints"

# Get tokens for different roles
ADMIN_TOKEN=$(get_auth_token "+5555555555" "ADMIN")
INSPECTOR_TOKEN=$(get_auth_token "+6666666666" "INSPECTOR")
FARMER_TOKEN=$(get_auth_token "+7777777777" "FARMER")

# Create test produce first
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Quality Test Produce",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    }
}')

PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

# Test 1: Create AI assessment (Admin)
print_test_header "Create AI Assessment"
AI_ASSESSMENT_RESPONSE=$(make_request "POST" "/quality/ai-assessment" "$ADMIN_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quality_score\": 85,
    \"freshness_score\": 90,
    \"damage_score\": 5,
    \"ai_model_version\": \"v1.0\",
    \"confidence_score\": 0.95
}")

# Test 2: Create inspection assessment (Inspector)
print_test_header "Create Inspection Assessment"
INSPECTION_RESPONSE=$(make_request "POST" "/quality/inspection" "$INSPECTOR_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quality_score\": 82,
    \"freshness_score\": 88,
    \"damage_score\": 8,
    \"inspector_notes\": \"Good quality produce with minor blemishes\",
    \"inspection_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}")

# Test 3: Get assessments by produce
print_test_header "Get Assessments by Produce"
make_request "GET" "/quality/produce/$PRODUCE_ID" "$FARMER_TOKEN"

# Test 4: Get latest assessment
print_test_header "Get Latest Assessment"
make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "$FARMER_TOKEN"

# Test 5: Get latest manual assessment
print_test_header "Get Latest Manual Assessment"
make_request "GET" "/quality/produce/$PRODUCE_ID/latest-manual" "$FARMER_TOKEN"

echo -e "\n${GREEN}Quality assessment tests completed!${NC}" 