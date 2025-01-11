#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Produce Creation and Assessment Flow Tests"

# Get tokens for different roles
ADMIN_RESPONSE=$(get_auth_token "+5555555555" "ADMIN")
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')

INSPECTOR_RESPONSE=$(get_auth_token "+6666666666" "INSPECTOR")
INSPECTOR_TOKEN=$(echo "$INSPECTOR_RESPONSE" | jq -r '.token')
INSPECTOR_ID=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.id')
INSPECTOR_NAME=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.name')
INSPECTOR_MOBILE=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.mobile_number')

FARMER_RESPONSE=$(get_auth_token "+7777777777" "FARMER")
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')

# Create inspector profile
print_test_header "Creating Inspector Profile"
INSPECTOR_PROFILE_RESPONSE=$(make_request "POST" "/inspectors" "$INSPECTOR_TOKEN" "{
    \"name\": \"$INSPECTOR_NAME\",
    \"mobile_number\": \"$INSPECTOR_MOBILE\",
    \"location\": \"12.9716,77.5946\",
    \"user_id\": \"$INSPECTOR_ID\"
}")
check_response "$INSPECTOR_PROFILE_RESPONSE" 201
print_success "Created inspector profile"

# Step 1: Initial Produce Creation
print_test_header "1. Initial Produce Creation"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Test Tomatoes",
    "description": "Fresh organic tomatoes",
    "product_variety": "Roma",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50.00,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": [
        "https://example.com/test-image1.jpg",
        "https://example.com/test-image2.jpg"
    ],
    "video_url": "https://example.com/test-video.mp4",
    "harvested_at": "2024-02-01T00:00:00Z"
}')

check_response "$PRODUCE_RESPONSE" 201
PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
print_success "Created produce with ID: $PRODUCE_ID"

# Step 2: Wait for AI Assessment
print_test_header "2. Waiting for AI Assessment"
sleep 5 # Give time for AI assessment to complete

# Step 3: Check AI Assessment Result
print_test_header "3. Checking AI Assessment Result"
AI_ASSESSMENT_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "$FARMER_TOKEN")
check_response "$AI_ASSESSMENT_RESPONSE"
print_success "Retrieved AI assessment"

# Step 4: Request Manual Inspection
print_test_header "4. Requesting Manual Inspection"
INSPECTION_REQUEST_RESPONSE=$(make_request "POST" "/quality/inspection/request" "$FARMER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"location\": \"12.9716,77.5946\"
}")
check_response "$INSPECTION_REQUEST_RESPONSE" 201
INSPECTION_ID=$(echo "$INSPECTION_REQUEST_RESPONSE" | jq -r '.id')
print_success "Created inspection request with ID: $INSPECTION_ID"

# Step 5: Assign Inspector
print_test_header "5. Assigning Inspector"
ASSIGN_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/assign" "$INSPECTOR_TOKEN")
check_response "$ASSIGN_RESPONSE"
print_success "Assigned inspector to inspection request"

# Step 6: Submit Inspection Result
print_test_header "6. Submitting Inspection Result"
INSPECTION_RESULT_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/submit-result" "$INSPECTOR_TOKEN" "{
    \"quality_grade\": 8,
    \"defects\": [\"minor_bruising\"],
    \"recommendations\": [\"Store in cool temperature\"],
    \"images\": [\"https://example.com/inspection-image1.jpg\"],
    \"notes\": \"Good quality produce with minor blemishes\",
    \"category_specific_assessment\": {
        \"freshness_level\": \"fresh\",
        \"size\": \"medium\",
        \"color\": \"red\"
    }
}")
check_response "$INSPECTION_RESULT_RESPONSE"
print_success "Submitted inspection result"

# Step 7: Verify Final Status
print_test_header "7. Verifying Final Status"
FINAL_STATUS_RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "$FARMER_TOKEN")
check_response "$FINAL_STATUS_RESPONSE"
STATUS=$(echo "$FINAL_STATUS_RESPONSE" | jq -r '.status')
print_success "Final produce status: $STATUS"

# Step 8: Get All Quality Assessments
print_test_header "8. Getting All Quality Assessments"
ALL_ASSESSMENTS_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "$FARMER_TOKEN")
check_response "$ALL_ASSESSMENTS_RESPONSE"
print_success "Retrieved all quality assessments"

echo -e "\n${GREEN}All produce creation and assessment tests completed!${NC}" 