#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3000"

# Function to check if a command was successful
check_response() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Function to validate JSON response
validate_json() {
    if jq -e . >/dev/null 2>&1 <<<"$1"; then
        return 0
    else
        echo -e "${RED}Invalid JSON response${NC}"
        return 1
    fi
}

echo -e "${YELLOW}Starting Inspection API Tests${NC}"
echo "================================"

# Register admin user
echo -e "${GREEN}1. Registering admin user...${NC}"
ADMIN_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+1234567890",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  }')

validate_json "$ADMIN_REGISTER_RESPONSE"
ADMIN_OTP=$(echo $ADMIN_REGISTER_RESPONSE | jq -r '.message | capture("OTP sent: (?<otp>[0-9]+)").otp')

# Register farmer user
echo -e "\n${GREEN}2. Registering farmer user...${NC}"
FARMER_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+1234567891",
    "name": "Farmer User",
    "email": "farmer@example.com",
    "role": "FARMER"
  }')

validate_json "$FARMER_REGISTER_RESPONSE"
FARMER_OTP=$(echo $FARMER_REGISTER_RESPONSE | jq -r '.message | capture("OTP sent: (?<otp>[0-9]+)").otp')

# Register inspector user
echo -e "\n${GREEN}3. Registering inspector user...${NC}"
INSPECTOR_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_number": "+1234567892",
    "name": "Inspector User",
    "email": "inspector@example.com",
    "role": "INSPECTOR"
  }')

validate_json "$INSPECTOR_REGISTER_RESPONSE"
INSPECTOR_OTP=$(echo $INSPECTOR_REGISTER_RESPONSE | jq -r '.message | capture("OTP sent: (?<otp>[0-9]+)").otp')

# Get tokens for all users
echo -e "\n${GREEN}4. Getting tokens for all users...${NC}"

# Admin token
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile_number\": \"+1234567890\",
    \"otp\": \"$ADMIN_OTP\"
  }")
ADMIN_TOKEN=$(echo $ADMIN_TOKEN_RESPONSE | jq -r '.access_token')

# Farmer token
FARMER_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile_number\": \"+1234567891\",
    \"otp\": \"$FARMER_OTP\"
  }")
FARMER_TOKEN=$(echo $FARMER_TOKEN_RESPONSE | jq -r '.access_token')

# Inspector token
INSPECTOR_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile_number\": \"+1234567892\",
    \"otp\": \"$INSPECTOR_OTP\"
  }")
INSPECTOR_TOKEN=$(echo $INSPECTOR_TOKEN_RESPONSE | jq -r '.access_token')

# Create test produce
echo -e "\n${GREEN}5. Creating test produce...${NC}"
PRODUCE_RESPONSE=$(curl -s -X POST "$BASE_URL/produce" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -d '{
    "name": "Test Produce",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  }')

validate_json "$PRODUCE_RESPONSE"
PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

echo -e "\n${YELLOW}Testing Inspection Endpoints${NC}"
echo "================================"

# Test 1: Request inspection
echo -e "\n${GREEN}6. Testing POST /inspections/request${NC}"
INSPECTION_REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/inspections/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FARMER_TOKEN" \
  -d "{\"produce_id\": \"$PRODUCE_ID\"}")

validate_json "$INSPECTION_REQUEST_RESPONSE"
INSPECTION_ID=$(echo $INSPECTION_REQUEST_RESPONSE | jq -r '.id')

# Test 2: Get inspections by produce
echo -e "\n${GREEN}7. Testing GET /inspections/by-produce/:produce_id${NC}"
INSPECTIONS_BY_PRODUCE_RESPONSE=$(curl -s -X GET "$BASE_URL/inspections/by-produce/$PRODUCE_ID" \
  -H "Authorization: Bearer $FARMER_TOKEN")
validate_json "$INSPECTIONS_BY_PRODUCE_RESPONSE"

# Test 3: Get inspections by requester
echo -e "\n${GREEN}8. Testing GET /inspections/by-requester${NC}"
INSPECTIONS_BY_REQUESTER_RESPONSE=$(curl -s -X GET "$BASE_URL/inspections/by-requester" \
  -H "Authorization: Bearer $FARMER_TOKEN")
validate_json "$INSPECTIONS_BY_REQUESTER_RESPONSE"

# Test 4: Get inspections by inspector
echo -e "\n${GREEN}9. Testing GET /inspections/by-inspector${NC}"
INSPECTIONS_BY_INSPECTOR_RESPONSE=$(curl -s -X GET "$BASE_URL/inspections/by-inspector" \
  -H "Authorization: Bearer $INSPECTOR_TOKEN")
validate_json "$INSPECTIONS_BY_INSPECTOR_RESPONSE"

# Test 5: Assign inspector to inspection
echo -e "\n${GREEN}10. Testing PUT /inspections/:id/assign${NC}"
ASSIGN_INSPECTOR_RESPONSE=$(curl -s -X PUT "$BASE_URL/inspections/$INSPECTION_ID/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"inspector_id\": \"$(echo $INSPECTOR_TOKEN_RESPONSE | jq -r '.user.id')\"}")
validate_json "$ASSIGN_INSPECTOR_RESPONSE"

echo -e "\n${YELLOW}Testing Inspection Fees Endpoints${NC}"
echo "================================"

# Test 6: Update base fee (Admin only)
echo -e "\n${GREEN}11. Testing PUT /inspection-fees/base-fee${NC}"
BASE_FEE_RESPONSE=$(curl -s -X PUT "$BASE_URL/inspection-fees/base-fee" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "produce_category": "VEGETABLES",
    "base_fee": 50.00
  }')
validate_json "$BASE_FEE_RESPONSE"

# Test 7: Update distance fee (Admin only)
echo -e "\n${GREEN}12. Testing PUT /inspection-fees/distance-fee${NC}"
DISTANCE_FEE_RESPONSE=$(curl -s -X PUT "$BASE_URL/inspection-fees/distance-fee" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "min_distance": 0,
    "max_distance": 50,
    "fee": 2.5
  }')
validate_json "$DISTANCE_FEE_RESPONSE"

echo -e "\n${GREEN}All tests completed!${NC}" 