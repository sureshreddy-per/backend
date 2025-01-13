#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Produce Creation and Assessment Flow Tests"

# Function to register and get token
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}" | jq -r '.isRegistered')
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
    
    local TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        print_error "Failed to extract token"
        return 1
    fi

    echo "$VERIFY_RESPONSE"
    return 0
}

# Get tokens for different roles
print_test_header "Registering and authenticating users"

# Setup ADMIN
print_test_header "Setting up ADMIN user"
ADMIN_RESPONSE=$(get_user_token "+5555555555" "ADMIN" "ADMIN" "admin_$(date +%s)@test.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup ADMIN user"
    exit 1
fi
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')

# Setup INSPECTOR
print_test_header "Setting up INSPECTOR user"
INSPECTOR_RESPONSE=$(get_user_token "+6666666666" "INSPECTOR" "INSPECTOR" "inspector_$(date +%s)@test.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup INSPECTOR user"
    exit 1
fi
INSPECTOR_TOKEN=$(echo "$INSPECTOR_RESPONSE" | jq -r '.token')
INSPECTOR_ID=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.id')
INSPECTOR_NAME=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.name')
INSPECTOR_MOBILE=$(echo "$INSPECTOR_RESPONSE" | jq -r '.user.mobile_number')

# Setup FARMER
print_test_header "Setting up FARMER user"
FARMER_RESPONSE=$(get_user_token "+7777777777" "FARMER" "FARMER" "farmer_$(date +%s)@test.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup FARMER user"
    exit 1
fi
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')

# Verify we have all tokens
if [ -z "$ADMIN_TOKEN" ] || [ -z "$INSPECTOR_TOKEN" ] || [ -z "$FARMER_TOKEN" ]; then
    print_error "Failed to get all required tokens"
    exit 1
fi

# Create inspector profile if not exists
print_test_header "Creating Inspector Profile"
if [ -z "$INSPECTOR_ID" ] || [ -z "$INSPECTOR_NAME" ] || [ -z "$INSPECTOR_MOBILE" ]; then
    print_error "Missing inspector details"
    exit 1
fi

INSPECTOR_PROFILE_RESPONSE=$(make_request "POST" "/inspectors" "{\"name\":\"$INSPECTOR_NAME\",\"mobile_number\":\"$INSPECTOR_MOBILE\",\"location\":\"12.9716,77.5946\",\"user_id\":\"$INSPECTOR_ID\"}" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_warning "Inspector profile might already exist, continuing..."
else
    check_response "$INSPECTOR_PROFILE_RESPONSE" 201
    print_success "Created inspector profile"
fi

# Step 1: Initial Produce Creation
print_test_header "1. Initial Produce Creation"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "{\"name\":\"Test Tomatoes\",\"description\":\"Fresh organic tomatoes\",\"product_variety\":\"Roma\",\"produce_category\":\"VEGETABLES\",\"quantity\":100,\"unit\":\"KG\",\"price_per_unit\":50.00,\"location\":\"12.9716,77.5946\",\"location_name\":\"Test Farm\",\"images\":[\"https://example.com/test-image1.jpg\",\"https://example.com/test-image2.jpg\"],\"video_url\":\"https://example.com/test-video.mp4\",\"harvested_at\":\"2024-02-01T00:00:00Z\"}" "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create produce"
    exit 1
fi

check_response "$PRODUCE_RESPONSE" 201
PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
if [ "$PRODUCE_ID" = "null" ] || [ -z "$PRODUCE_ID" ]; then
    print_error "Failed to get produce ID"
    exit 1
fi
print_success "Created produce with ID: $PRODUCE_ID"

# Step 2: Wait for AI Assessment
print_test_header "2. Waiting for AI Assessment"
sleep 5 # Give time for AI assessment to complete

# Step 3: Check AI Assessment Result
print_test_header "3. Checking AI Assessment Result"
AI_ASSESSMENT_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID/latest" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get AI assessment"
    exit 1
fi
check_response "$AI_ASSESSMENT_RESPONSE"
print_success "Retrieved AI assessment"

# Step 4: Request Manual Inspection
print_test_header "4. Requesting Manual Inspection"
INSPECTION_REQUEST_RESPONSE=$(make_request "POST" "/quality/inspection/request" "{\"produce_id\":\"$PRODUCE_ID\",\"location\":\"12.9716,77.5946\"}" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to create inspection request"
    exit 1
fi
check_response "$INSPECTION_REQUEST_RESPONSE" 201
INSPECTION_ID=$(echo "$INSPECTION_REQUEST_RESPONSE" | jq -r '.id')
if [ "$INSPECTION_ID" = "null" ] || [ -z "$INSPECTION_ID" ]; then
    print_error "Failed to get inspection ID"
    exit 1
fi
print_success "Created inspection request with ID: $INSPECTION_ID"

# Step 5: Assign Inspector
print_test_header "5. Assigning Inspector"
ASSIGN_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/assign" "{}" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to assign inspector"
    exit 1
fi
check_response "$ASSIGN_RESPONSE"
echo "Assign Response: $ASSIGN_RESPONSE"
print_success "Assigned inspector to inspection request"

# Step 6: Submit Inspection Result
print_test_header "6. Submitting Inspection Result"
INSPECTION_RESULT_RESPONSE=$(make_request "PUT" "/quality/inspection/$INSPECTION_ID/submit-result" "{\"produce_id\":\"$PRODUCE_ID\",\"quality_grade\":8,\"confidence_level\":100,\"defects\":[\"minor_bruising\"],\"recommendations\":[\"Store in cool temperature\"],\"category_specific_assessment\":{\"freshness_level\":\"fresh\",\"size\":\"medium\",\"color\":\"red\",\"moisture_content\":85,\"foreign_matter\":0.5},\"metadata\":{\"notes\":\"Good quality produce with minor blemishes\",\"images\":[\"https://example.com/inspection-image1.jpg\"]}}" "$INSPECTOR_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to submit inspection result"
    exit 1
fi
check_response "$INSPECTION_RESULT_RESPONSE"
echo "Inspection Result Response: $INSPECTION_RESULT_RESPONSE"
print_success "Submitted inspection result"

# Step 7: Verifying Final Status
print_test_header "7. Verifying Final Status"
FINAL_STATUS_RESPONSE=$(make_request "GET" "/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get final status"
    exit 1
fi
check_response "$FINAL_STATUS_RESPONSE"
echo "Final Status Response: $FINAL_STATUS_RESPONSE"
FINAL_STATUS=$(echo "$FINAL_STATUS_RESPONSE" | jq -r '.status')
print_success "Final produce status: $FINAL_STATUS"

# Step 8: Getting All Quality Assessments
print_test_header "8. Getting All Quality Assessments"
QUALITY_ASSESSMENTS_RESPONSE=$(make_request "GET" "/quality/produce/$PRODUCE_ID" "" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get quality assessments"
    exit 1
fi
check_response "$QUALITY_ASSESSMENTS_RESPONSE"
echo "Quality Assessments Response: $QUALITY_ASSESSMENTS_RESPONSE"
print_success "Retrieved all quality assessments"

echo -e "\n${GREEN}All produce creation and assessment tests completed!${NC}" 