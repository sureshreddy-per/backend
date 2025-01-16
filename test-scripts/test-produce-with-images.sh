#!/bin/bash

# Set base URL for API
BASE_URL="http://localhost:3000"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  
  if [ -n "$token" ]; then
    curl -s -X "$method" "${BASE_URL}${endpoint}" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s -X "$method" "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data"
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

if [ $? -ne 0 ] || grep -q "User already exists" "$temp_response"; then
  print_debug "Farmer user exists, requesting OTP..."
  curl -s -X POST "${BASE_URL}/api/auth/otp/request" \
    -H "Content-Type: application/json" \
    -d '{"mobile_number": "+1234567891"}' > $temp_response 2>&1
fi

print_debug "OTP Response:"
cat $temp_response

# Extract OTP and request ID
otp=$(jq -r '.otp' $temp_response)
request_id=$(jq -r '.request_id' $temp_response)

if [ -z "$otp" ] || [ -z "$request_id" ]; then
  print_error "Failed to extract OTP or request ID"
  cat $temp_response
  exit 1
fi

# Verify OTP for farmer
verify_data="{\"mobile_number\": \"+1234567891\", \"otp\": \"$otp\"}"
curl -s -X POST "${BASE_URL}/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "$verify_data" > $temp_response 2>&1

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

# Setup buyer user
print_step "Setting up BUYER user..."
register_data='{
  "mobile_number": "+1234567892",
  "name": "Test Buyer",
  "email": "buyer@test.com",
  "role": "BUYER"
}'

# Try to register buyer, if fails due to existing user, request OTP directly
curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_data" > $temp_response 2>&1

if [ $? -ne 0 ] || grep -q "User already exists" "$temp_response"; then
  print_debug "Buyer user exists, requesting OTP..."
  curl -s -X POST "${BASE_URL}/api/auth/otp/request" \
    -H "Content-Type: application/json" \
    -d '{"mobile_number": "+1234567892"}' > $temp_response 2>&1
fi

# Extract OTP and request ID for buyer
otp=$(jq -r '.otp' $temp_response)
request_id=$(jq -r '.request_id' $temp_response)

if [ -z "$otp" ] || [ -z "$request_id" ]; then
  print_error "Failed to extract OTP or request ID"
  cat $temp_response
  exit 1
fi

# Verify OTP for buyer
verify_data="{\"mobile_number\": \"+1234567892\", \"otp\": \"$otp\"}"
curl -s -X POST "${BASE_URL}/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "$verify_data" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  print_error "Failed to verify buyer OTP"
  cat $temp_response
  exit 1
fi

# Extract buyer token
BUYER_TOKEN=$(jq -r '.token' $temp_response)
if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" = "null" ]; then
  print_error "Failed to extract buyer token"
  cat $temp_response
  exit 1
fi

print_success "Buyer setup complete"

# Update buyer preferences
print_step "Setting Buyer Preferences..."
curl -s -X PUT "${BASE_URL}/api/buyer-preferences" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "produce_names": ["Tomato"],
    "produce_price_preferences": [
      {
        "produce_name": "Tomato",
        "min_price": 40,
        "max_price": 80
      }
    ],
    "notification_enabled": true,
    "notification_methods": ["EMAIL", "SMS"]
  }' > $temp_response 2>&1

if [ $? -ne 0 ]; then
  print_error "Failed to set buyer preferences"
  cat $temp_response
  exit 1
fi

print_success "Buyer preferences set"

# Create produce with images
print_step "Creating produce with images..."
produce_data='{
  "name": "Fresh Tomatoes",
  "description": "High quality fresh tomatoes",
  "product_variety": "Roma",
  "produce_category": "VEGETABLES",
  "quantity": 100,
  "unit": "KG",
  "price_per_unit": 50,
  "location": "12.9716,77.5946",
  "location_name": "Test Farm",
  "harvested_at": "2024-02-01T00:00:00Z"
}'

curl -s -X POST "${BASE_URL}/api/produce" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "data=${produce_data}" \
  -F "images=@test-scripts/IMG_2882.heic;type=image/heic" \
  -F "images=@test-scripts/IMG_2884.heic;type=image/heic" \
  -F "images=@test-scripts/IMG_2885.heic;type=image/heic" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  print_error "Failed to create produce"
  cat $temp_response
  exit 1
fi

# Extract produce ID
PRODUCE_ID=$(jq -r '.id' $temp_response)
if [ -z "$PRODUCE_ID" ] || [ "$PRODUCE_ID" = "null" ]; then
  print_error "Failed to get produce ID"
  cat $temp_response
  exit 1
fi

print_success "Produce created with ID: $PRODUCE_ID"

# Wait for AI assessment and offer generation
print_step "Waiting for AI assessment and offer generation..."
sleep 5

# Check for offers
print_step "Checking for offers..."
curl -s -X GET "${BASE_URL}/api/offers" \
  -H "Authorization: Bearer $BUYER_TOKEN" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  print_error "Failed to get offers"
  cat $temp_response
  exit 1
fi

print_step "Offers:"
jq '.' $temp_response

print_success "Test completed successfully" 