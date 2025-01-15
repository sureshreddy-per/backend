#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:3000"

# Print colored test header
print_test_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Make a request to the API
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local file=$5

    local response
    if [ -n "$file" ]; then
        # File upload request
        echo "Uploading file: $file"
        echo "Endpoint: ${BASE_URL}${endpoint}"
        echo "Token: $token"
        response=$(curl -v -s -X $method \
            -H "Authorization: Bearer $token" \
            -F "file=@$file" \
            "${BASE_URL}${endpoint}" 2>&1)
    else
        # Regular request
        if [ -n "$data" ]; then
            echo "With data: $data"
            response=$(curl -v -s -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "${BASE_URL}${endpoint}" 2>&1)
        else
            response=$(curl -v -s -X $method \
                -H "Authorization: Bearer $token" \
                "${BASE_URL}${endpoint}" 2>&1)
        fi
    fi

    echo "Raw response:"
    echo "$response"

    # Extract response body (after headers)
    body=$(echo "$response" | sed -n -e '/^{/,$p' | tr -d '\r' | head -n 1)
    echo "Extracted body: $body"

    if [ -n "$body" ]; then
        echo "Response body: $body"
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo "$body"
            return 0
        else
            echo "Response is not valid JSON"
            return 1
        fi
    else
        echo "No JSON response body found"
        return 1
    fi
}

# Get auth token for role
get_auth_token() {
    local role=$1
    local phone="1234567890"
    local email="${role}@test.com"
    local password="password123"

    # Register user if not exists
    local register_data="{\"phone\":\"$phone\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}"
    echo "Registering user with data: $register_data"
    local register_response=$(make_request "POST" "/api/auth/register" "$register_data")
    echo "Register response: $register_response"

    # Request OTP
    local otp_data="{\"phone\":\"$phone\"}"
    echo "Requesting OTP with data: $otp_data"
    local otp_response=$(make_request "POST" "/api/auth/otp/request" "$otp_data")
    echo "OTP response: $otp_response"

    # Extract OTP from response message
    local otp="123456"  # Default OTP for testing

    # Verify OTP
    local verify_data="{\"phone\":\"$phone\",\"otp\":\"$otp\"}"
    echo "Verifying OTP with data: $verify_data"
    local verify_response=$(make_request "POST" "/api/auth/otp/verify" "$verify_data")
    echo "Verify response: $verify_response"

    # Extract token from response
    if [ -n "$verify_response" ]; then
        local token=$(echo "$verify_response" | jq -r '.token')
        if [ -n "$token" ] && [ "$token" != "null" ]; then
            echo "$token"
            return 0
        fi
    fi

    print_error "Failed to get token for $role"
    return 1
}

# Create test files
create_test_files() {
    print_test_header "Creating test files"

    # Create test image (1x1 pixel)
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" | base64 -d > test.png
    if [ $? -eq 0 ]; then
        print_success "Created test image"
    else
        print_error "Failed to create test image"
        return 1
    fi

    # Create test document
    echo "Test document content" > test.txt
    if [ $? -eq 0 ]; then
        print_success "Created test document"
    else
        print_error "Failed to create test document"
        return 1
    fi

    # Create test video (empty file)
    dd if=/dev/zero of=test.mp4 bs=1024 count=1024 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Created test video"
    else
        print_error "Failed to create test video"
        return 1
    fi
}

# Clean up test files
cleanup_test_files() {
    print_test_header "Cleaning up test files"
    rm -f test.png test.txt test.mp4
    print_success "Removed test files"
}

# Main test flow
main() {
    # Create test files
    create_test_files || exit 1

    # Get farmer token
    FARMER_TOKEN=$(get_auth_token "farmer")
    if [ -z "$FARMER_TOKEN" ]; then
        cleanup_test_files
        exit 1
    fi

    print_test_header "Testing media uploads"

    # Test image upload
    response=$(make_request "POST" "/api/media/upload" "" "$FARMER_TOKEN" "test.png")
    if [[ $response == *"id"* && $response == *"url"* ]]; then
        print_success "Uploaded image"
        image_id=$(echo $response | jq -r '.id')
    else
        print_error "Failed to upload image: $response"
    fi

    # Test document upload
    response=$(make_request "POST" "/api/media/upload" "" "$FARMER_TOKEN" "test.txt")
    if [[ $response == *"id"* && $response == *"url"* ]]; then
        print_success "Uploaded document"
        document_id=$(echo $response | jq -r '.id')
    else
        print_error "Failed to upload document: $response"
    fi

    # Test video upload
    response=$(make_request "POST" "/api/media/upload" "" "$FARMER_TOKEN" "test.mp4")
    if [[ $response == *"id"* && $response == *"url"* ]]; then
        print_success "Uploaded video"
        video_id=$(echo $response | jq -r '.id')
    else
        print_error "Failed to upload video: $response"
    fi

    print_test_header "Testing media retrieval"

    # Test getting uploaded files
    for id in "$image_id" "$document_id" "$video_id"; do
        if [ -n "$id" ]; then
            response=$(make_request "GET" "/api/media/$id" "" "$FARMER_TOKEN")
            if [[ $response == *"url"* ]]; then
                print_success "Retrieved media $id"
            else
                print_error "Failed to retrieve media $id: $response"
            fi
        fi
    done

    print_test_header "Testing media deletion"

    # Test deleting uploaded files
    for id in "$image_id" "$document_id" "$video_id"; do
        if [ -n "$id" ]; then
            response=$(make_request "DELETE" "/api/media/$id" "" "$FARMER_TOKEN")
            if [ $? -eq 0 ]; then
                print_success "Deleted media $id"
            else
                print_error "Failed to delete media $id: $response"
            fi
        fi
    done

    # Clean up test files
    cleanup_test_files
}

# Run main function
main