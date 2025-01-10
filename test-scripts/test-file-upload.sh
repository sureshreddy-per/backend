#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "File Upload Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222270" "FARMER")
ADMIN_TOKEN=$(get_auth_token "+1111222271" "ADMIN")

# Create a temporary test file
echo "Test content for file upload" > test_file.txt

# Test 1: Upload file
print_test_header "Upload File"
UPLOAD_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -F "file=@test_file.txt" \
    -F "type=DOCUMENT" \
    -F "category=CERTIFICATION" \
    "${BASE_URL}/files/upload")

FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')

# Test 2: Get file metadata
print_test_header "Get File Metadata"
make_request "GET" "/files/$FILE_ID/metadata" "$FARMER_TOKEN"

# Test 3: Get file download URL
print_test_header "Get File Download URL"
make_request "GET" "/files/$FILE_ID/download-url" "$FARMER_TOKEN"

# Test 4: Update file metadata
print_test_header "Update File Metadata"
make_request "PATCH" "/files/$FILE_ID/metadata" "$FARMER_TOKEN" '{
    "name": "updated_test_file.txt",
    "description": "Updated test file description",
    "tags": ["test", "document"]
}'

# Test 5: Upload multiple files
print_test_header "Upload Multiple Files"
echo "Test content for file 2" > test_file2.txt
echo "Test content for file 3" > test_file3.txt

MULTI_UPLOAD_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -F "files[]=@test_file2.txt" \
    -F "files[]=@test_file3.txt" \
    -F "type=DOCUMENT" \
    -F "category=CERTIFICATION" \
    "${BASE_URL}/files/upload-multiple")

# Test 6: Get files by category
print_test_header "Get Files by Category"
make_request "GET" "/files?category=CERTIFICATION" "$FARMER_TOKEN"

# Test 7: Get files by type
print_test_header "Get Files by Type"
make_request "GET" "/files?type=DOCUMENT" "$FARMER_TOKEN"

# Test 8: Delete file
print_test_header "Delete File"
make_request "DELETE" "/files/$FILE_ID" "$FARMER_TOKEN"

# Test 9: Upload profile picture
print_test_header "Upload Profile Picture"
echo "Test content for profile picture" > profile_pic.jpg
PROFILE_PIC_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -F "file=@profile_pic.jpg" \
    -F "type=IMAGE" \
    -F "category=PROFILE" \
    "${BASE_URL}/files/upload")

# Test 10: Upload produce images
print_test_header "Upload Produce Images"
echo "Test content for produce image" > produce_image.jpg
PRODUCE_IMAGE_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $FARMER_TOKEN" \
    -F "file=@produce_image.jpg" \
    -F "type=IMAGE" \
    -F "category=PRODUCE" \
    "${BASE_URL}/files/upload")

# Test 11: Get file storage metrics (Admin only)
print_test_header "Get File Storage Metrics"
make_request "GET" "/files/metrics" "$ADMIN_TOKEN"

# Test 12: Get file usage by user (Admin only)
print_test_header "Get File Usage by User"
make_request "GET" "/files/usage" "$ADMIN_TOKEN"

# Clean up test files
rm -f test_file.txt test_file2.txt test_file3.txt profile_pic.jpg produce_image.jpg

echo -e "\n${GREEN}File upload tests completed!${NC}" 