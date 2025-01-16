#!/bin/bash

# Configuration
BASE_URL="${API_URL:-"http://localhost:3000/api"}"
TEST_FILES_DIR="/tmp/test_files"
MAX_FILE_SIZE_MB=5
TEST_IMAGE_SIZE="500x500"

# Storage upload types
STORAGE_TYPE_IMAGES="images"
STORAGE_TYPE_VIDEOS="videos"
STORAGE_TYPE_THUMBNAILS="thumbnails"
STORAGE_TYPE_REPORTS="reports"
STORAGE_TYPE_DOCUMENTS="documents"

# User configuration
ADMIN_MOBILE="+919876543210"
ADMIN_NAME="Test Admin"
ADMIN_ROLE="ADMIN"

# Test token (valid for 24 hours)
TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZWM3ODZlYi1hOWUzLTQ4NTMtYmFiYS1lZTc0M2I2Yzc3YzIiLCJtb2JpbGVfbnVtYmVyIjoiKzkxOTg3NjU0MzIxMCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjk3NjA0NiwiZXhwIjoxNzM3MDYyNDQ2fQ.opmwVQoii7NhBWbNNyvxJrPpByPcthVJP3mYk_WQWzk"

# Export GCP environment variables
export GCP_PROJECT_ID=sapient-torch-447917-k7
export GCP_BUCKET_NAME=farmdeva-dev-001-asia
export GCP_SERVICE_ACCOUNT_KEY=src/config/gcp-service-account-key.json

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Set GCP service account key path relative to project root
GCP_KEY_PATH="$PROJECT_ROOT/src/config/gcp-service-account-key.json"

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
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_test_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Create test files
create_test_files() {
    print_test_header "Creating test files"
    
    # Create test directory
    mkdir -p $TEST_FILES_DIR
    
    # Create test images using magick command
    magick -size $TEST_IMAGE_SIZE xc:white -draw "text 250,300 'Test Image 1'" "$TEST_FILES_DIR/test_image1.jpg"
    magick -size $TEST_IMAGE_SIZE xc:white -draw "text 250,300 'Test Image 2'" "$TEST_FILES_DIR/test_image2.jpg"
    
    # Create test file for type validation
    echo "Test text file" > "$TEST_FILES_DIR/test_file.txt"
    
    # Create oversized file for size validation
    dd if=/dev/zero of="$TEST_FILES_DIR/oversized.jpg" bs=1M count=$((MAX_FILE_SIZE_MB + 1))
    
    print_success "Created test files"
}

# Cleanup test files
cleanup_test_files() {
    print_test_header "Cleaning up test files"
    rm -rf $TEST_FILES_DIR
    print_success "Cleaned up test files"
}

# Add cleanup on script exit
cleanup_on_exit() {
    if [ -d "$TEST_FILES_DIR" ]; then
        cleanup_test_files
    fi
}

# Set up trap for cleanup
trap cleanup_on_exit EXIT

# Test single image upload
test_single_image_upload() {
    print_test_header "Testing single image upload"
    
    echo "Uploading single image..."
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TEST_TOKEN}" \
        -F "file=@${TEST_FILES_DIR}/test_image1.jpg" \
        "${BASE_URL}/upload/${STORAGE_TYPE_IMAGES}")
    
    echo "Upload response: $response"
    
    if [[ $response =~ "Internal server error" ]]; then
        print_error "Failed to upload image: Internal server error"
        return 1
    fi

    local url=$(echo "$response" | jq -r '.url')
    local filename=$(echo "$response" | jq -r '.filename')
    
    if [[ -z "$url" || "$url" == "null" || -z "$filename" || "$filename" == "null" ]]; then
        print_error "Failed to get image URL and filename from response"
        return 1
    fi

    IMAGE_URL="$url"
    IMAGE_FILENAME="$filename"
    print_success "Successfully uploaded image"
    echo "URL: $url"
    echo "Filename: $filename"
}

# Test multiple images upload
test_multiple_images_upload() {
    print_test_header "Testing multiple images upload"
    
    echo "Uploading multiple images..."
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TEST_TOKEN}" \
        -F "files=@${TEST_FILES_DIR}/test_image1.jpg" \
        -F "files=@${TEST_FILES_DIR}/test_image2.jpg" \
        "${BASE_URL}/upload/multiple/${STORAGE_TYPE_IMAGES}")
    
    echo "Upload response: $response"
    
    if [[ $response =~ "Internal server error" ]]; then
        print_error "Failed to upload images: Internal server error"
        return 1
    fi

    local first_url=$(echo "$response" | jq -r '.[0].url')
    local first_filename=$(echo "$response" | jq -r '.[0].filename')
    
    if [[ -z "$first_url" || "$first_url" == "null" || -z "$first_filename" || "$first_filename" == "null" ]]; then
        print_error "Failed to get image URLs from response"
        return 1
    fi

    IMAGE_URL="$first_url"
    IMAGE_FILENAME="$first_filename"
    print_success "Successfully uploaded multiple images"
    echo "First image URL: $first_url"
    echo "First image filename: $first_filename"
}

# Test file size validation
test_file_size_validation() {
    print_test_header "Testing file size validation"
    
    echo "Testing file size validation..."
    # Try to upload oversized file
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TEST_TOKEN}" \
        -F "file=@${TEST_FILES_DIR}/oversized.jpg" \
        "${BASE_URL}/upload/${STORAGE_TYPE_IMAGES}")
    
    echo "Validation response: $response"
    
    # Check if we got a validation error (which is what we want)
    if echo "$response" | grep -q "File size exceeds"; then
        print_success "File size validation test passed"
        return 0
    else
        print_error "File size validation test failed - oversized file was accepted"
        return 1
    fi
}

# Test file type validation
test_file_type_validation() {
    print_test_header "Testing file type validation"
    
    echo "Testing file type validation..."
    # Try to upload invalid file type
    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TEST_TOKEN}" \
        -F "file=@${TEST_FILES_DIR}/test_file.txt" \
        "${BASE_URL}/upload/${STORAGE_TYPE_IMAGES}")
    
    echo "Validation response: $response"
    
    # Check if we got a validation error (which is what we want)
    if echo "$response" | grep -q "Invalid file type"; then
        print_success "File type validation test passed"
        return 0
    else
        print_error "File type validation test failed - invalid file type was accepted"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    create_test_files
    
    # Run tests with token
    test_single_image_upload
    test_multiple_images_upload
    test_file_size_validation
    test_file_type_validation
}

# Run tests
run_all_tests 