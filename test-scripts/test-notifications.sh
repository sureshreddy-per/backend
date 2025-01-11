#!/bin/bash

# Set API base URL
API_BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Print functions
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
    echo -e "\n${GREEN}$1${NC}"
}

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make HTTP request with proper error handling
make_request() {
    local method="$1"
    local endpoint="$2"
    local token="$3"
    local data="$4"
    local response=""
    local http_code=""
    local headers=""
    local body=""
    
    # Remove /api prefix if present
    endpoint=${endpoint#/api}
    # Remove leading slash if present
    endpoint=${endpoint#/}
    local full_url="${API_BASE_URL}/${endpoint}"
    
    # Debug output
    >&2 echo "Debug - Request details:"
    >&2 echo "Method: $method"
    >&2 echo "Endpoint: ${full_url}"
    >&2 echo "Data: $data"
    [ -n "$token" ] && >&2 echo "Token: ${token:0:20}..."
    
    # Temporary file for response
    local tmp_file=$(mktemp)
    
    # Build curl command
    local curl_cmd="curl -s -X $method"
    curl_cmd+=" -H 'Content-Type: application/json'"
    
    if [ -n "$token" ]; then
        # Remove any newlines and whitespace from token
        token=$(echo "$token" | tr -d '\n' | tr -d ' ')
        curl_cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        # Properly escape the data
        data=$(echo "$data" | sed 's/"/\\"/g')
        curl_cmd+=" -d \"$data\""
    fi
    
    # Add output handling
    curl_cmd+=" -D '${tmp_file}.headers'"
    curl_cmd+=" -o '${tmp_file}.body'"
    curl_cmd+=" -w '%{http_code}'"
    curl_cmd+=" '${full_url}'"
    curl_cmd+=" > '${tmp_file}.code'"
    
    # Debug the curl command
    >&2 echo "Debug - Curl command:"
    >&2 echo "$curl_cmd"
    
    # Execute the curl command
    eval "$curl_cmd"
    
    # Read status code, headers and body
    http_code=$(cat "${tmp_file}.code")
    headers=$(cat "${tmp_file}.headers")
    body=$(cat "${tmp_file}.body")
    
    # Debug output
    >&2 echo "Debug - HTTP Status Code: $http_code"
    >&2 echo "Debug - Response Headers:"
    >&2 echo "$headers"
    >&2 echo "Debug - Response Body:"
    >&2 echo "$body"
    
    # Cleanup temp files
    rm -f "${tmp_file}" "${tmp_file}.headers" "${tmp_file}.body" "${tmp_file}.code"
    
    # Check if the response is empty
    if [ -z "$body" ] && [ "$http_code" != "204" ]; then
        >&2 echo "Error: Empty response received (Status Code: $http_code)"
        return 1
    fi
    
    # Check if the status code indicates success
    if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
        >&2 echo "Error: Request failed with status code $http_code"
        if [ -n "$body" ]; then
            echo "$body"
        fi
        return 1
    fi
    
    # If we have a body, check if it's valid JSON
    if [ -n "$body" ]; then
        if ! echo "$body" | jq . >/dev/null 2>&1; then
            >&2 echo "Error: Invalid JSON response"
            >&2 echo "Raw response: $body"
            return 1
        fi
        echo "$body"
    fi
    
    return 0
}

# Get auth token with proper error handling
get_auth_token() {
    local mobile="$1"
    local role="$2"
    local name="Test ${role}"
    local email="test.$(echo "$role" | tr '[:upper:]' '[:lower:]')@test.com"
    local token=""
    
    # Check mobile number first
    local check_mobile_data="{\"mobile_number\":\"$mobile\"}"
    local check_response=$(make_request "POST" "/auth/check-mobile" "" "$check_mobile_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Mobile check failed, proceeding with registration"
    fi
    
    # Register user
    local register_data="{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}"
    local register_response=$(make_request "POST" "/auth/register" "" "$register_data")
    
    if [ $? -ne 0 ]; then
        print_warning "Registration failed, user might already exist"
    fi
    
    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile\"}"
    local otp_response=$(make_request "POST" "/auth/otp/request" "" "$otp_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    
    # Extract OTP from response message
    local otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        print_error "Could not extract OTP from response"
        return 1
    fi
    
    # Verify OTP and get token
    local verify_data="{\"mobile_number\":\"$mobile\",\"otp\":\"$otp\"}"
    local verify_response=$(make_request "POST" "/auth/otp/verify" "" "$verify_data")
    
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    # Extract token from verify response
    token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Could not extract token from response"
        return 1
    fi
    
    # Clean and return the token
    echo "$token" | tr -d '\n' | tr -d ' '
    return 0
}

# Check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "http://localhost:3000/api/health" > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running"
        return 1
    fi
}

# Check required commands
check_requirements() {
    local missing_reqs=0
    
    echo "Checking requirements..."
    
    # Check for curl
    if ! command -v curl >/dev/null 2>&1; then
        print_error "curl is required but not installed"
        missing_reqs=1
    fi
    
    # Check for jq
    if ! command -v jq >/dev/null 2>&1; then
        print_error "jq is required but not installed"
        missing_reqs=1
    fi
    
    # Check for tr
    if ! command -v tr >/dev/null 2>&1; then
        print_error "tr is required but not installed"
        missing_reqs=1
    fi
    
    if [ $missing_reqs -eq 1 ]; then
        print_error "Please install missing requirements and try again"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Wait for produce status to change
wait_for_produce_status() {
    local produce_id="$1"
    local target_status="$2"
    local token="$3"
    local max_attempts=30
    local attempt=1
    local interval=5
    
    while [ $attempt -le $max_attempts ]; do
        print_test_header "Checking produce status (attempt $attempt/$max_attempts)"
        local response=$(make_request "GET" "/produce/$produce_id" "$token")
        if [ $? -eq 0 ]; then
            local status=$(echo "$response" | jq -r '.status')
            if [ "$status" = "$target_status" ]; then
                print_success "Produce status is now $target_status"
                return 0
            fi
            echo "Current status: $status"
        fi
        
        echo "Waiting ${interval} seconds before next check..."
        sleep $interval
        attempt=$((attempt + 1))
    done
    
    print_error "Timed out waiting for produce status to change to $target_status"
    return 1
}

# Check notifications
check_notifications() {
    local token="$1"
    local expected_type="$2"
    local max_attempts=12
    local attempt=1
    local interval=5
    
    while [ $attempt -le $max_attempts ]; do
        print_test_header "Checking notifications (attempt $attempt/$max_attempts)"
        local response=$(make_request "GET" "/notifications" "$token")
        if [ $? -eq 0 ]; then
            echo "Debug - Notifications Response: $response"
            local notifications_count=$(echo "$response" | jq '.total')
            if [ "$notifications_count" -gt 0 ]; then
                local has_expected_type=$(echo "$response" | jq --arg type "$expected_type" '.notifications[] | select(.type == $type) | length > 0')
                if [ "$has_expected_type" = "true" ]; then
                    print_success "Found notification of type $expected_type"
                    return 0
                fi
            fi
            echo "No notifications of type $expected_type found yet"
        fi
        
        echo "Waiting ${interval} seconds before next check..."
        sleep $interval
        attempt=$((attempt + 1))
    done
    
    print_error "Timed out waiting for notification of type $expected_type"
    return 1
}

# Cleanup function
cleanup() {
    print_header "Cleaning up..."
    # Add any cleanup tasks here if needed
    print_success "Cleanup completed"
}

# Set up trap for cleanup on script exit
trap cleanup EXIT

# Main execution
print_header "Starting Notification Tests"

# Check requirements and server
check_requirements
check_server

print_test_header "Notification Endpoints"

# Get farmer token
print_test_header "Getting Farmer Token"
FARMER_TOKEN=$(get_auth_token "+1111222222" "FARMER")
if [ $? -ne 0 ]; then
    print_error "Failed to get farmer token"
    exit 1
fi
print_success "Got farmer token: ${FARMER_TOKEN:0:20}..."

# Get buyer token
print_test_header "Getting Buyer Token"
BUYER_TOKEN=$(get_auth_token "+1111222223" "BUYER")
if [ $? -ne 0 ]; then
    print_error "Failed to get buyer token"
    exit 1
fi
print_success "Got buyer token: ${BUYER_TOKEN:0:20}..."

# Create test produce
print_test_header "Creating Test Produce"
PRODUCE_DATA='{
    "name": "Notification Test Produce",
    "description": "Test produce for notifications",
    "product_variety": "Test Variety",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": ["https://example.com/test-image1.jpg"],
    "harvested_at": "2024-02-01T00:00:00Z"
}'

PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" "$PRODUCE_DATA")
if [ $? -ne 0 ]; then
    print_error "Failed to create test produce"
    exit 1
fi

print_success "Created test produce"
echo "Debug - Produce Response: $PRODUCE_RESPONSE"

# Extract produce ID
PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
echo "Debug - Produce ID: $PRODUCE_ID"

# Wait for AI assessment
print_test_header "Waiting for AI Assessment"
wait_for_produce_status "$PRODUCE_ID" "QUALITY_ASSESSMENT_COMPLETED" "$FARMER_TOKEN"

# Check for quality assessment notification
print_test_header "Checking Quality Assessment Notification"
check_notifications "$FARMER_TOKEN" "QUALITY_ASSESSMENT_COMPLETED"

# Check for auto-offer notification
print_test_header "Checking Auto-Offer Notification"
check_notifications "$FARMER_TOKEN" "NEW_OFFER"

# Check buyer notifications
print_test_header "Checking Buyer Notifications"
check_notifications "$BUYER_TOKEN" "NEW_AUTO_OFFER"

# Get notifications for both users
print_test_header "Get User Notifications"
FARMER_NOTIFICATIONS=$(make_request "GET" "/notifications" "$FARMER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get farmer notifications"
    exit 1
fi
print_success "Retrieved farmer notifications"
echo "Debug - Farmer Notifications: $FARMER_NOTIFICATIONS"

BUYER_NOTIFICATIONS=$(make_request "GET" "/notifications" "$BUYER_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get buyer notifications"
    exit 1
fi
print_success "Retrieved buyer notifications"
echo "Debug - Buyer Notifications: $BUYER_NOTIFICATIONS"

# Mark notifications as read
print_test_header "Mark Notifications as Read"
FARMER_NOTIFICATION_ID=$(echo "$FARMER_NOTIFICATIONS" | jq -r '.notifications[0].id')
if [ -n "$FARMER_NOTIFICATION_ID" ] && [ "$FARMER_NOTIFICATION_ID" != "null" ]; then
    MARK_READ_RESPONSE=$(make_request "POST" "/notifications/$FARMER_NOTIFICATION_ID/mark-read" "$FARMER_TOKEN")
    if [ $? -eq 0 ]; then
        print_success "Marked farmer notification as read"
    else
        print_error "Failed to mark farmer notification as read"
    fi
else
    print_warning "No farmer notifications to mark as read"
fi

# Get unread count
print_test_header "Get Unread Count"
FARMER_UNREAD=$(make_request "GET" "/notifications/unread-count" "$FARMER_TOKEN")
if [ $? -eq 0 ]; then
    print_success "Retrieved farmer unread count"
    echo "Debug - Farmer Unread Count: $FARMER_UNREAD"
else
    print_error "Failed to get farmer unread count"
fi 