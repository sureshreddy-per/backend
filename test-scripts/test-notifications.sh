#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
USER_MOBILE="+1234567891"
USER_NAME="Test User"

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
    print_header "Starting Notification Tests"
    
    # Get authentication token
    TOKEN=$(authenticate "$USER_MOBILE" "$USER_NAME" "BUYER")
    
    # Test 1: Update notification preferences
    print_header "Testing Update Notification Preferences"
    PREFERENCES_DATA='{
        "email_enabled": true,
        "sms_enabled": true,
        "push_enabled": true,
        "notification_types": [
            "OFFER_RECEIVED",
            "OFFER_ACCEPTED",
            "QUALITY_ASSESSMENT_COMPLETED",
            "INSPECTION_SCHEDULED",
            "PAYMENT_RECEIVED"
        ]
    }'
    RESPONSE=$(make_request "PUT" "/notifications/preferences" "$PREFERENCES_DATA" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated notification preferences"
    else
        print_error "Failed to update notification preferences"
    fi
    
    # Test 2: Get notification preferences
    print_header "Testing Get Notification Preferences"
    RESPONSE=$(make_request "GET" "/notifications/preferences" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved notification preferences"
    else
        print_error "Failed to get notification preferences"
    fi
    
    # Test 3: Get notifications
    print_header "Testing Get Notifications"
    RESPONSE=$(make_request "GET" "/notifications?page=1&limit=10" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved notifications"
    else
        print_error "Failed to get notifications"
    fi
    
    # Test 4: Get unread notifications count
    print_header "Testing Get Unread Notifications Count"
    RESPONSE=$(make_request "GET" "/notifications/unread-count" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully retrieved unread notifications count"
    else
        print_error "Failed to get unread notifications count"
    fi
    
    # Test 5: Mark notification as read
    print_header "Testing Mark Notification as Read"
    RESPONSE=$(make_request "GET" "/notifications?page=1&limit=1" "" "$TOKEN")
    NOTIFICATION_ID=$(echo "$RESPONSE" | jq -r '.items[0].id')
    if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
        RESPONSE=$(make_request "PUT" "/notifications/$NOTIFICATION_ID/read" "" "$TOKEN")
        if [ $? -eq 0 ]; then
            print_success "Successfully marked notification as read"
        else
            print_error "Failed to mark notification as read"
        fi
    else
        print_warning "No notification found to mark as read"
    fi
    
    # Test 6: Mark all notifications as read
    print_header "Testing Mark All Notifications as Read"
    RESPONSE=$(make_request "PUT" "/notifications/read-all" "" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully marked all notifications as read"
    else
        print_error "Failed to mark all notifications as read"
    fi
    
    # Test 7: Update FCM token
    print_header "Testing Update FCM Token"
    FCM_DATA='{
        "fcm_token": "test_fcm_token_123"
    }'
    RESPONSE=$(make_request "PUT" "/notifications/fcm-token" "$FCM_DATA" "$TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Successfully updated FCM token"
    else
        print_error "Failed to update FCM token"
    fi
    
    # Test 8: Delete notification
    print_header "Testing Delete Notification"
    RESPONSE=$(make_request "GET" "/notifications?page=1&limit=1" "" "$TOKEN")
    NOTIFICATION_ID=$(echo "$RESPONSE" | jq -r '.items[0].id')
    if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
        RESPONSE=$(make_request "DELETE" "/notifications/$NOTIFICATION_ID" "" "$TOKEN")
        if [ $? -eq 0 ]; then
            print_success "Successfully deleted notification"
        else
            print_error "Failed to delete notification"
        fi
    else
        print_warning "No notification found to delete"
    fi
    
    print_header "Notification Tests Completed"
}

# Run the tests
main 