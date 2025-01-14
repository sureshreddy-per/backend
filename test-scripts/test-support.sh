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

print_test_header() {
    echo -e "\nTesting: $1"
}

# Make HTTP request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local content_type="${5:-application/json}"
    
    # Remove /api prefix and leading slashes
    endpoint="${endpoint#/api}"
    endpoint="${endpoint#/}"
    
    local url="http://localhost:3000/api/$endpoint"
    echo "Making $method request to: $url"
    
    if [ -n "$data" ]; then
        echo "Request data: $data"
    fi
    
    if [ -n "$token" ]; then
        echo "Using auth token: ${token:0:20}..."
    fi
    
    local curl_cmd="curl -v -s -X $method"
    
    if [ "$content_type" = "multipart/form-data" ]; then
        # Parse the data JSON string to extract file path and form fields
        local file_path=$(echo "$data" | jq -r '.file')
        local form_data=$(echo "$data" | jq -r 'del(.file) | to_entries | map("-F \"\(.key)=\(.value|tostring)\"") | join(" ")')
        
        curl_cmd="$curl_cmd"
        if [ -n "$token" ]; then
            curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
        fi
        curl_cmd="$curl_cmd -F 'file=@$file_path' $form_data"
    else
        curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
        if [ -n "$token" ]; then
            curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
        fi
        if [ -n "$data" ]; then
            # Format JSON data properly
            data=$(echo "$data" | jq -c '.')
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    
    curl_cmd="$curl_cmd '$url' 2>&1"
    echo "Executing curl command: $curl_cmd"
    
    # Execute curl command and capture response
    local response
    response=$(eval "$curl_cmd")
    local curl_exit=$?
    
    echo "Raw response: $response"
    
    if [ $curl_exit -ne 0 ]; then
        echo "ERROR: Curl command failed with exit code $curl_exit"
        return $curl_exit
    fi
    
    # Extract response body after the verbose output
    local response_body
    response_body=$(echo "$response" | awk '/^{/,/^}/')
    
    if [ -z "$response_body" ]; then
        echo "ERROR: Empty response body"
        return 1
    fi
    
    # Try to parse response as JSON and format it
    if ! echo "$response_body" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response body: $response_body"
        return 1
    fi

    echo "$response_body" | jq -r '.'
    return 0
}

# Check response
check_response() {
    local response="$1"
    local expected_status="${2:-200}"
    
    if [ -z "$response" ]; then
        print_error "Empty response"
        return 1
    fi
    
    # Try to parse response as JSON and format it
    if ! echo "$response" | jq -e . >/dev/null 2>&1; then
        print_error "Invalid JSON response: $response"
        return 1
    fi
    
    # Extract response fields
    local error_msg=$(echo "$response" | jq -r '.message // empty')
    local status_code=$(echo "$response" | jq -r '.statusCode // empty')
    local error=$(echo "$response" | jq -r '.error // empty')
    
    # Check for error message
    if [ -n "$error" ] && [ "$error" != "null" ] && [ "$error" != "false" ]; then
        print_error "$error: $error_msg"
        return 1
    fi
    
    # Check status code if provided in response
    if [ -n "$status_code" ] && [ "$status_code" != "$expected_status" ]; then
        print_error "Unexpected status code: $status_code (expected $expected_status)"
        return 1
    fi
    
    return 0
}

# Get auth token
get_auth_token() {
    local mobile_number="$1"
    local role="$2"
    local name="Test $role"
    local email="test.$(echo "$role" | tr '[:upper:]' '[:lower:]')_$(date +%s)@example.com"

    # Check if user exists
    local check_data="{\"mobile_number\":\"$mobile_number\"}"
    local check_response
    check_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$check_data" \
        "http://localhost:3000/api/auth/check-mobile")
    
    if [ $? -ne 0 ] || [ -z "$check_response" ]; then
        echo "ERROR: Failed to check mobile number" >&2
        return 1
    fi

    local is_registered
    is_registered=$(echo "$check_response" | jq -r '.isRegistered')
    if [ "$is_registered" != "true" ]; then
        # Register user
        local register_data="{\"name\":\"$name\",\"email\":\"$email\",\"mobile_number\":\"$mobile_number\",\"role\":\"$role\"}"
        local register_response
        register_response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$register_data" \
            "http://localhost:3000/api/auth/register")
        
        if [ $? -ne 0 ] || [ -z "$register_response" ]; then
            echo "ERROR: Failed to register user" >&2
            return 1
        fi
    fi

    # Request OTP
    local otp_data="{\"mobile_number\":\"$mobile_number\"}"
    local otp_response
    otp_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$otp_data" \
        "http://localhost:3000/api/auth/otp/request")
    
    if [ $? -ne 0 ] || [ -z "$otp_response" ]; then
        echo "ERROR: Failed to request OTP" >&2
        return 1
    fi

    # Extract OTP from response
    local otp
    otp=$(echo "$otp_response" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$otp" ]; then
        echo "ERROR: Failed to extract OTP" >&2
        return 1
    fi

    # Verify OTP
    local verify_data="{\"mobile_number\":\"$mobile_number\",\"otp\":\"$otp\"}"
    local verify_response
    verify_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$verify_data" \
        "http://localhost:3000/api/auth/otp/verify")
    
    if [ $? -ne 0 ] || [ -z "$verify_response" ]; then
        echo "ERROR: Failed to verify OTP" >&2
        return 1
    fi

    # Extract token from response
    local token
    token=$(echo "$verify_response" | jq -r '.token')
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        echo "ERROR: Failed to extract token" >&2
        return 1
    fi

    # Return only the token
    echo "$token"
    return 0
}

# Main test execution
main() {
    # Check if server is running
    echo "Checking if server is running..."
    local health_response
    health_response=$(curl -s "http://localhost:3000/api/health")
    if [ $? -ne 0 ] || [ -z "$health_response" ]; then
        echo "ERROR: Server is not running"
        exit 1
    fi

    # Try to parse response as JSON
    if ! echo "$health_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid health check response"
        exit 1
    fi

    # Check if status is healthy
    local status
    status=$(echo "$health_response" | jq -r '.status')
    if [ "$status" != "healthy" ]; then
        echo "ERROR: Server is not healthy (status: $status)"
        exit 1
    fi

    echo "✓ Server is running"

    echo
    echo "Testing: Support Endpoints"
    echo

    # Get tokens for different roles
    echo "Testing: Setting up test users"
    FARMER_TOKEN=$(get_auth_token "+1111222233" "FARMER")
    if [ -z "$FARMER_TOKEN" ]; then
        echo "ERROR: Failed to get FARMER token"
        exit 1
    fi

    ADMIN_TOKEN=$(get_auth_token "+1111222234" "ADMIN")
    if [ -z "$ADMIN_TOKEN" ]; then
        echo "ERROR: Failed to get ADMIN token"
        exit 1
    fi

    # Create a support ticket
    echo "Testing: Create Support Ticket"
    local TICKET_DATA='{
        "title": "Issue with produce listing",
        "description": "Unable to update produce quantity",
        "category": "TECHNICAL",
        "priority": "MEDIUM"
    }'
    echo "Creating ticket with data: $TICKET_DATA"
    echo "Using token: ${FARMER_TOKEN:0:20}..."
    
    local create_response
    create_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${FARMER_TOKEN}" \
        -d "$TICKET_DATA" \
        "http://localhost:3000/api/support")
    echo "Full response: $create_response"
    
    if [ -z "$create_response" ]; then
        echo "ERROR: Empty response"
        exit 1
    fi
    
    if ! echo "$create_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response: $create_response"
        exit 1
    fi
    
    local ticket_id
    ticket_id=$(echo "$create_response" | jq -r '.id')
    if [ -z "$ticket_id" ] || [ "$ticket_id" = "null" ]; then
        echo "ERROR: Failed to get ticket ID"
        exit 1
    fi
    echo "✓ Created support ticket with ID: $ticket_id"
    
    # Create a support ticket with attachment
    echo "Testing: Create Support Ticket with Attachment"
    local TICKET_WITH_ATTACHMENT='{
        "title": "Issue with document",
        "description": "Please check the attached document",
        "category": "TECHNICAL",
        "priority": "HIGH",
        "attachments": ["67179689-ae90-4fdc-8a8c-eee8b1c01168.pdf", "67179689-ae90-4fdc-8a8c-eee8b1c01169.pdf"]
    }'
    echo "Creating ticket with data: $TICKET_WITH_ATTACHMENT"
    
    local create_with_attachment_response
    create_with_attachment_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${FARMER_TOKEN}" \
        -d "$TICKET_WITH_ATTACHMENT" \
        "http://localhost:3000/api/support")
    echo "Full response: $create_with_attachment_response"
    
    if [ -z "$create_with_attachment_response" ]; then
        echo "ERROR: Empty response"
        exit 1
    fi
    
    if ! echo "$create_with_attachment_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response: $create_with_attachment_response"
        exit 1
    fi
    
    local attachment_ticket_id
    attachment_ticket_id=$(echo "$create_with_attachment_response" | jq -r '.id')
    if [ -z "$attachment_ticket_id" ] || [ "$attachment_ticket_id" = "null" ]; then
        echo "ERROR: Failed to get ticket ID"
        exit 1
    fi
    echo "✓ Created support ticket with attachment, ID: $attachment_ticket_id"

    # Get all tickets
    echo "Testing: Get All Tickets"
    local all_tickets_response
    all_tickets_response=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "http://localhost:3000/api/support")
    
    if [ -z "$all_tickets_response" ]; then
        echo "ERROR: Empty response"
        exit 1
    fi
    
    if ! echo "$all_tickets_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response: $all_tickets_response"
        exit 1
    fi
    
    local total_tickets
    total_tickets=$(echo "$all_tickets_response" | jq -r '.data | length')
    echo "✓ Retrieved all tickets (total: $total_tickets)"
    
    # Get user's tickets
    echo "Testing: Get User's Tickets"
    local my_tickets_response
    my_tickets_response=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${FARMER_TOKEN}" \
        "http://localhost:3000/api/support/my-tickets")
    
    if [ -z "$my_tickets_response" ]; then
        echo "ERROR: Empty response"
        exit 1
    fi
    
    if ! echo "$my_tickets_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response: $my_tickets_response"
        exit 1
    fi
    
    local total_my_tickets
    total_my_tickets=$(echo "$my_tickets_response" | jq -r '.data | length')
    echo "✓ Retrieved user's tickets (total: $total_my_tickets)"
    
    # Get ticket details
    echo "Testing: Get Ticket Details"
    local ticket_details_response
    ticket_details_response=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${FARMER_TOKEN}" \
        "http://localhost:3000/api/support/$ticket_id")
    
    if [ -z "$ticket_details_response" ]; then
        echo "ERROR: Empty response"
        exit 1
    fi
    
    if ! echo "$ticket_details_response" | jq -e . >/dev/null 2>&1; then
        echo "ERROR: Invalid JSON response: $ticket_details_response"
        exit 1
    fi
    
    local response_ticket_id
    response_ticket_id=$(echo "$ticket_details_response" | jq -r '.id')
    if [ "$response_ticket_id" != "$ticket_id" ]; then
        echo "ERROR: Retrieved wrong ticket (expected: $ticket_id, got: $response_ticket_id)"
        exit 1
    fi
    echo "✓ Retrieved ticket details"

    echo "✓ All support ticket tests completed"
}

# Run the tests
main 