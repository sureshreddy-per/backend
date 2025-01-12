#!/bin/bash

# Source utility functions
source ./test-scripts/utils.sh

# Test data
BUYER_ID=""
RESPONSE=""

print_header "Testing Buyer Preferences"

# Test getting buyer preferences
print_test "Get buyer preferences"
RESPONSE=$(curl -s -X GET \
  "${API_URL}/buyer-preferences" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
check_response "$RESPONSE"

# Test updating buyer preferences
print_test "Update buyer preferences"
RESPONSE=$(curl -s -X PUT \
  "${API_URL}/buyer-preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "produce_names": ["tomato", "potato", "onion"],
    "notification_enabled": true,
    "notification_methods": ["EMAIL", "SMS"]
  }')
check_response "$RESPONSE"

# Test getting updated preferences
print_test "Get updated preferences"
RESPONSE=$(curl -s -X GET \
  "${API_URL}/buyer-preferences" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
check_response "$RESPONSE"

print_success "All buyer preference tests completed successfully"