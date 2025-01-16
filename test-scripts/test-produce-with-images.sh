#!/bin/bash

# Source utilities
source test-scripts/utils.sh

# Enable command tracing
set -x

# Create temp file for response
temp_response=$(mktemp)
trap 'rm -f $temp_response' EXIT

# Setup users
echo "Setting up FARMER user..."
register_data='{
  "mobile_number": "+1234567891",
  "name": "Test Farmer",
  "email": "farmer@test.com",
  "role": "FARMER"
}'

# Try to register, if fails due to existing user, request OTP directly
curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_data" > $temp_response 2>&1

if [ $? -ne 0 ] || grep -q "User already exists" "$temp_response"; then
  echo "User exists, requesting OTP..."
  curl -s -X POST "${BASE_URL}/api/auth/otp/request" \
    -H "Content-Type: application/json" \
    -d '{"mobile_number": "+1234567891"}' > $temp_response 2>&1
fi

# Extract OTP from response
otp=$(jq -r '.message' $temp_response | grep -o '[0-9]\{6\}')
request_id=$(jq -r '.requestId' $temp_response)

if [ -z "$otp" ] || [ -z "$request_id" ]; then
  echo "ERROR: Failed to extract OTP or request ID"
  cat $temp_response
  exit 1
fi

# Verify OTP
verify_data="{\"otp\": \"$otp\", \"requestId\": \"$request_id\"}"

curl -s -X POST "${BASE_URL}/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "$verify_data" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to verify OTP"
  cat $temp_response
  exit 1
fi

# Extract token
FARMER_TOKEN=$(jq -r '.token' $temp_response)

if [ -z "$FARMER_TOKEN" ]; then
  echo "ERROR: Failed to extract token"
  cat $temp_response
  exit 1
fi

echo "Setting up BUYER user..."
register_data='{
  "mobile_number": "+1234567892",
  "name": "Test Buyer",
  "email": "buyer@test.com",
  "role": "BUYER"
}'

# Try to register, if fails due to existing user, request OTP directly
curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_data" > $temp_response 2>&1

if [ $? -ne 0 ] || grep -q "User already exists" "$temp_response"; then
  echo "User exists, requesting OTP..."
  curl -s -X POST "${BASE_URL}/api/auth/otp/request" \
    -H "Content-Type: application/json" \
    -d '{"mobile_number": "+1234567892"}' > $temp_response 2>&1
fi

# Extract OTP from response
otp=$(jq -r '.message' $temp_response | grep -o '[0-9]\{6\}')
request_id=$(jq -r '.requestId' $temp_response)

if [ -z "$otp" ] || [ -z "$request_id" ]; then
  echo "ERROR: Failed to extract OTP or request ID"
  cat $temp_response
  exit 1
fi

# Verify OTP
verify_data="{\"otp\": \"$otp\", \"requestId\": \"$request_id\"}"

curl -s -X POST "${BASE_URL}/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "$verify_data" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to verify OTP"
  cat $temp_response
  exit 1
fi

# Extract token
BUYER_TOKEN=$(jq -r '.token' $temp_response)

if [ -z "$BUYER_TOKEN" ]; then
  echo "ERROR: Failed to extract token"
  cat $temp_response
  exit 1
fi

# Update buyer preferences
echo "Setting Buyer Preferences..."
curl -s -X PUT "${BASE_URL}/api/buyer-preferences" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "produce_names": ["Tomato"],
    "categories": ["VEGETABLES"],
    "min_quality_grade": 5,
    "location": "12.9716,77.5946",
    "max_distance_km": 100
  }' > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to set buyer preferences"
  cat $temp_response
  exit 1
fi

# Set daily price for tomato
echo "Setting Daily Price for Tomato..."
curl -s -X POST "${BASE_URL}/api/daily-prices" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "produce_name": "Tomato",
    "average_price": 60,
    "market_name": "Test Market",
    "location": "12.9716,77.5946"
  }' > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to set daily price"
  cat $temp_response
  exit 1
fi

# Create produce with images
echo "Creating produce with images..."
curl -s -X POST "${BASE_URL}/api/produce" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -F "name=Fresh Tomatoes" \
  -F "description=High quality fresh tomatoes" \
  -F "product_variety=Roma" \
  -F "produce_category=VEGETABLES" \
  -F "quantity=100" \
  -F "unit=KG" \
  -F "price_per_unit=50.00" \
  -F "location=12.9716,77.5946" \
  -F "location_name=Test Farm" \
  -F "harvested_at=2024-02-01T00:00:00Z" \
  -F "images=@test-scripts/IMG_2882.heic" \
  -F "images=@test-scripts/IMG_2884.heic" \
  -F "images=@test-scripts/IMG_2885.heic" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create produce"
  cat $temp_response
  exit 1
fi

# Extract produce ID
PRODUCE_ID=$(jq -r '.id' $temp_response)

if [ -z "$PRODUCE_ID" ]; then
  echo "ERROR: Failed to get produce ID"
  cat $temp_response
  exit 1
fi

# Wait for AI assessment and offer generation
echo "Waiting for AI assessment and offer generation..."
sleep 5

# Check for offers
echo "Checking for offers..."
curl -s -X GET "${BASE_URL}/api/offers" \
  -H "Authorization: Bearer $BUYER_TOKEN" > $temp_response 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to get offers"
  cat $temp_response
  exit 1
fi

# Print offers
echo "Offers:"
jq '.' $temp_response

# Cleanup
rm -f $temp_response 