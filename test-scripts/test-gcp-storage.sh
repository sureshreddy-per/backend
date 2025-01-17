#!/bin/bash

# Set base URL for API
BASE_URL="http://localhost:3000"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Enable debug mode
DEBUG="true"

# Utility functions
print_step() {
  echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
  if [ "$DEBUG" = "true" ]; then
    echo -e "[DEBUG] $1"
  fi
}

# Enable command tracing if DEBUG is true
if [ "$DEBUG" = "true" ]; then
  set -x
fi

# Create temp file for response
temp_response=$(mktemp)
trap 'rm -f $temp_response' EXIT

# Setup farmer user
print_step "Setting up FARMER user..."
register_data='{
  "mobile_number": "+1234567891",
  "name": "Test Farmer",
  "email": "farmer@test.com",
  "role": "FARMER"
}'

# Try to register farmer, if fails due to existing user, request OTP directly
curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_data" > $temp_response 2>&1

print_debug "Register Response:"
cat $temp_response

if [ $? -ne 0 ] || grep -q "User already exists" "$temp_response"; then
  print_debug "Farmer user exists, requesting OTP..."
  curl -s -X POST "${BASE_URL}/api/auth/otp/request" \
    -H "Content-Type: application/json" \
    -d '{"mobile_number": "+1234567891"}' > $temp_response 2>&1
fi

print_debug "OTP Response:"
cat $temp_response

# Extract OTP from response
otp=$(jq -r '.message | capture("OTP sent successfully: (?<otp>\\d+)").otp // empty' $temp_response)

if [ -z "$otp" ]; then
  print_error "Failed to extract OTP"
  print_debug "Response content:"
  cat $temp_response
  exit 1
fi

print_debug "Extracted OTP: $otp"

# Verify OTP for farmer
verify_data="{\"mobile_number\": \"+1234567891\", \"otp\": \"$otp\"}"
curl -s -X POST "${BASE_URL}/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "$verify_data" > $temp_response 2>&1

print_debug "Verify Response:"
cat $temp_response

if [ $? -ne 0 ]; then
  print_error "Failed to verify farmer OTP"
  cat $temp_response
  exit 1
fi

# Extract farmer token
FARMER_TOKEN=$(jq -r '.token' $temp_response)
if [ -z "$FARMER_TOKEN" ] || [ "$FARMER_TOKEN" = "null" ]; then
  print_error "Failed to extract farmer token"
  cat $temp_response
  exit 1
fi

print_success "Farmer setup complete"

# Test GCP storage by uploading multiple images
print_step "Testing GCP storage with multiple image uploads..."

# Check if test images exist
if [ ! -f "test-scripts/IMG_2882.heic" ] || [ ! -f "test-scripts/IMG_2884.heic" ]; then
  print_error "Test images not found in test-scripts directory"
  exit 1
fi

curl -s -X POST "${BASE_URL}/api/produce" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F 'data={"name":"Test Tomato","description":"Testing GCP storage with multiple images","product_variety":"Roma","produce_category":"VEGETABLES","quantity":10,"unit":"KG","price_per_unit":50,"location":"12.9716,77.5946","location_name":"Test Farm","harvested_at":"2024-02-01T00:00:00Z"}' \
  -F "images=@test-scripts/IMG_2882.heic;type=image/heic" \
  -F "images=@test-scripts/IMG_2884.heic;type=image/heic" > $temp_response 2>&1

print_debug "Upload Response:"
cat $temp_response

if [ $? -ne 0 ]; then
  print_error "Failed to upload test images"
  cat $temp_response
  exit 1
fi

# Check if we got a produce ID back
PRODUCE_ID=$(jq -r '.id' $temp_response)
if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
  print_error "Failed to get produce ID"
  cat $temp_response
  exit 1
fi

print_success "Test completed successfully - Produce ID: $PRODUCE_ID"

# Get the produce details to verify images were uploaded
print_step "Verifying uploaded produce details..."

curl -s -X GET "${BASE_URL}/api/produce/${PRODUCE_ID}" \
  -H "Authorization: Bearer $FARMER_TOKEN" > $temp_response 2>&1

print_debug "Produce Details Response:"
cat $temp_response

# Check if we got the correct number of images
IMAGE_COUNT=$(jq '.images | length' $temp_response)
if [ "$IMAGE_COUNT" -ne 2 ]; then
  print_error "Expected 2 images, but got ${IMAGE_COUNT}"
  exit 1
fi

print_success "Successfully verified produce has ${IMAGE_COUNT} images" 