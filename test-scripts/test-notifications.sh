#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000/api"
USER_MOBILE="+12348912345"
USER_NAME="Test User"
USER_ROLE="BUYER"
USER_EMAIL="buyer_$(date +%s)@test.com"

# Test data
NOTIFICATION_TYPES=(
    "QUALITY_UPDATE"
    "QUALITY_ASSESSMENT_COMPLETED"
    "NEW_OFFER"
    "NEW_AUTO_OFFER"
    "OFFER_ACCEPTED"
    "OFFER_REJECTED"
    "OFFER_MODIFIED"
    "OFFER_PRICE_MODIFIED"
    "OFFER_APPROVED"
    "OFFER_EXPIRED"
    "OFFER_PRICE_UPDATE"
    "OFFER_STATUS_UPDATE"
    "INSPECTION_REQUEST"
    "INSPECTION_REQUESTED"
    "INSPECTION_COMPLETED"
    "INSPECTION_CANCELLED"
    "DELIVERY_WINDOW_STARTED"
    "DELIVERY_WINDOW_EXPIRED"
    "DELIVERY_CONFIRMED"
    "RATING_REQUIRED"
    "RATING_RECEIVED"
    "TRANSACTION_UPDATE"
    "TRANSACTION_COMPLETED"
    "TRANSACTION_CANCELLED"
    "PAYMENT_REQUIRED"
    "PAYMENT_RECEIVED"
)

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

# Make HTTP request with proper error handling and response validation
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    
    # Remove leading slash and /api prefix if present
    endpoint="${endpoint#/}"
    endpoint="${endpoint#api/}"
    local full_url="${API_BASE_URL}/${endpoint}"
    
    # Debug output to stderr
    echo -e "\n${YELLOW}=== API Request ===${NC}" >&2
    echo -e "${GREEN}URL:${NC} $full_url" >&2
    echo -e "${GREEN}Method:${NC} $method" >&2
    if [ -n "$data" ]; then
        echo -e "${GREEN}Request Data:${NC}" >&2
        echo "$data" | jq '.' >&2
    fi
    if [ -n "$token" ]; then
        echo -e "${GREEN}Authorization:${NC} Bearer Token" >&2
    fi
    
    # Make the request
    local response
    if [ -n "$token" ]; then
        response=$(curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "${full_url}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"} \
            "${full_url}")
    fi
    
    local curl_exit=$?
    
    # Debug output to stderr
    echo -e "\n${YELLOW}=== API Response ===${NC}" >&2
    echo -e "${GREEN}Curl Exit Code:${NC} $curl_exit" >&2
    if [ -n "$response" ]; then
        echo -e "${GREEN}Response Body:${NC}" >&2
        if echo "$response" | jq -e . >/dev/null 2>&1; then
            echo "$response" | jq '.' >&2
        else
            echo "$response" >&2
        fi
    fi
    echo -e "${YELLOW}=================${NC}\n" >&2
    
    # Check for curl errors
    if [ $curl_exit -ne 0 ]; then
        print_error "Curl command failed with error code $curl_exit" >&2
        return $curl_exit
    fi
    
    # Return only the response
    echo "$response"
    return 0
}

# Authentication function
authenticate() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"
    
    print_header "Authenticating $role"
    
    # Register user (ignore if already exists)
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}"
    echo "Registering user with data: $register_data"
    local register_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "${API_BASE_URL}/auth/register" 2>/dev/null)
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    echo "Requesting OTP with data: $otp_data"
    local otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$otp_data" \
        "${API_BASE_URL}/auth/otp/request" 2>/dev/null)
    
    if ! echo "$otp_response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response from OTP request: $otp_response"
        return 1
    fi
    
    # Extract OTP from response message
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response: $(echo "$otp_response" | jq -r '.message')"
        return 1
    fi
    
    print_success "Got OTP: $otp"
    
    # Verify OTP and get token
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    echo "Verifying OTP with data: $verify_data"
    local verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$verify_data" \
        "${API_BASE_URL}/auth/otp/verify" 2>/dev/null)
    
    if ! echo "$verify_response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response from OTP verify: $verify_response"
        return 1
    fi
    
    # Extract token
    local token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response: $verify_response"
        return 1
    fi
    
    print_success "Got token: ${token:0:20}..."
    echo "$token"
    return 0
}

# Test functions
test_notification_preferences() {
    local token="$1"
    if [ -z "$token" ]; then
        print_error "No token provided to test_notification_preferences"
        return 1
    fi
    print_header "Testing Notification Preferences"
    
    # Test 1: Update with all notification types
    print_success "Attempting to update notification preferences with all types"
    local preferences_data="{
        \"email_enabled\": true,
        \"sms_enabled\": true,
        \"push_enabled\": true,
        \"notification_types\": [
            \"QUALITY_UPDATE\",
            \"QUALITY_ASSESSMENT_COMPLETED\",
            \"NEW_OFFER\",
            \"NEW_AUTO_OFFER\",
            \"OFFER_ACCEPTED\",
            \"OFFER_REJECTED\",
            \"OFFER_MODIFIED\",
            \"OFFER_PRICE_MODIFIED\",
            \"OFFER_APPROVED\",
            \"OFFER_EXPIRED\",
            \"OFFER_PRICE_UPDATE\",
            \"OFFER_STATUS_UPDATE\",
            \"INSPECTION_REQUEST\",
            \"INSPECTION_REQUESTED\",
            \"INSPECTION_COMPLETED\",
            \"INSPECTION_CANCELLED\",
            \"DELIVERY_WINDOW_STARTED\",
            \"DELIVERY_WINDOW_EXPIRED\",
            \"DELIVERY_CONFIRMED\",
            \"RATING_REQUIRED\",
            \"RATING_RECEIVED\",
            \"TRANSACTION_UPDATE\",
            \"TRANSACTION_COMPLETED\",
            \"TRANSACTION_CANCELLED\",
            \"PAYMENT_REQUIRED\",
            \"PAYMENT_RECEIVED\"
        ]
    }"
    
    local RESPONSE=$(make_request "PUT" "/notifications/preferences" "$preferences_data" "$token")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
            print_success "Successfully updated notification preferences"
            echo "Response: $RESPONSE"
        else
            print_error "Invalid JSON response"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        print_error "Failed to update notification preferences"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    # Test 2: Verify preferences
    print_success "Attempting to verify notification preferences"
    RESPONSE=$(make_request "GET" "/notifications/preferences" "" "$token")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
            local types_count=$(echo "$RESPONSE" | jq -r '.notification_types | length')
            if [ "$types_count" -eq "${#NOTIFICATION_TYPES[@]}" ]; then
                print_success "Successfully verified notification preferences"
                echo "Response: $RESPONSE"
            else
                print_error "Notification types count mismatch (expected: ${#NOTIFICATION_TYPES[@]}, got: $types_count)"
                echo "Response: $RESPONSE"
                return 1
            fi
        else
            print_error "Invalid JSON response"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        print_error "Failed to get notification preferences"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    return 0
}

test_notifications_crud() {
    local token="$1"
    if [ -z "$token" ]; then
        print_error "No token provided to test_notifications_crud"
        return 1
    fi
    print_header "Testing Notifications CRUD Operations"
    
    # Test 1: Get notifications (empty state)
    local RESPONSE=$(make_request "GET" "/notifications?page=1&limit=10" "" "$token")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
            print_success "Successfully retrieved notifications"
            echo "Response: $RESPONSE"
        else
            print_error "Invalid JSON response"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        print_error "Failed to get notifications"
        return 1
    fi
    
    # Test 2: Get unread count
    RESPONSE=$(make_request "GET" "/notifications/unread-count" "" "$token")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
            print_success "Successfully retrieved unread count"
            echo "Response: $RESPONSE"
        else
            print_error "Invalid JSON response"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        print_error "Failed to get unread count"
        return 1
    fi
    
    # Test 3: Mark all as read (empty state)
    RESPONSE=$(make_request "PUT" "/notifications/read-all" "" "$token")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        if echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
            print_success "Successfully marked all as read"
            echo "Response: $RESPONSE"
        else
            print_error "Invalid JSON response"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        print_error "Failed to mark all as read"
        return 1
    fi
    
    return 0
}

# Main test execution
main() {
    print_header "Starting Notification Tests"
    
    # Register and get token
    print_header "Setting up user"
    local register_data="{\"mobile_number\":\"$USER_MOBILE\",\"name\":\"$USER_NAME\",\"role\":\"$USER_ROLE\",\"email\":\"$USER_EMAIL\"}"
    echo "Registering user with data: $register_data"
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        "${API_BASE_URL}/auth/register" >/dev/null 2>&1 || true
    
    echo "Requesting OTP"
    local otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$USER_MOBILE\"}" \
        "${API_BASE_URL}/auth/otp/request")
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    print_success "Got OTP: $otp"
    
    echo "Verifying OTP"
    local verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"mobile_number\":\"$USER_MOBILE\",\"otp\":\"$otp\"}" \
        "${API_BASE_URL}/auth/otp/verify")
    TOKEN=$(echo "$verify_response" | jq -r '.token')
    print_success "Got token: ${TOKEN:0:20}..."
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        print_error "Failed to get authentication token"
        exit 1
    fi
    
    # Run tests
    test_notification_preferences "$TOKEN" || exit 1
    test_notifications_crud "$TOKEN" || exit 1
    
    print_success "All notification tests completed successfully"
}

# Run the tests
main 