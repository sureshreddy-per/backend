#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Support Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222233" "FARMER")
ADMIN_TOKEN=$(get_auth_token "+1111222234" "ADMIN")

# Test 1: Create support ticket
print_test_header "Create Support Ticket"
TICKET_RESPONSE=$(make_request "POST" "/support" "$FARMER_TOKEN" '{
    "subject": "Issue with produce listing",
    "description": "Unable to update produce quantity",
    "category": "TECHNICAL",
    "priority": "MEDIUM",
    "attachments": []
}')

TICKET_ID=$(echo $TICKET_RESPONSE | jq -r '.id')

# Test 2: Get all tickets (Admin)
print_test_header "Get All Tickets"
make_request "GET" "/support" "$ADMIN_TOKEN"

# Test 3: Get user's tickets
print_test_header "Get User's Tickets"
make_request "GET" "/support/my-tickets" "$FARMER_TOKEN"

# Test 4: Get ticket by ID
print_test_header "Get Ticket by ID"
make_request "GET" "/support/$TICKET_ID" "$FARMER_TOKEN"

# Create another ticket with attachment
echo "Test screenshot content" > test-screenshot.png

# Test 5: Create ticket with attachment
print_test_header "Create Ticket with Attachment"
make_request "POST" "/support" "$FARMER_TOKEN" '{
    "subject": "Payment issue",
    "description": "Payment not reflecting in account",
    "category": "PAYMENT",
    "priority": "HIGH",
    "attachments": ["@test-screenshot.png"]
}' "multipart/form-data"

# Cleanup test file
rm -f test-screenshot.png

echo -e "\n${GREEN}Support ticket tests completed!${NC}" 