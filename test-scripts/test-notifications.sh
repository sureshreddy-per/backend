#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Notification Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222222" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222223" "BUYER")

# Create test produce and offer to generate notifications
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Notification Test Produce",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    }
}')

PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

# Create an offer to generate notifications
make_request "POST" "/offers" "$BUYER_TOKEN" "{
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 50,
    \"price_per_unit\": 45,
    \"delivery_location\": {
        \"latitude\": 12.9716,
        \"longitude\": 77.5946
    },
    \"delivery_date\": \"$(date -v+2d -u +"%Y-%m-%dT%H:%M:%SZ")\"
}"

# Test 1: Get user notifications
print_test_header "Get User Notifications"
NOTIFICATIONS_RESPONSE=$(make_request "GET" "/notifications" "$FARMER_TOKEN")

# Extract first notification ID for testing
NOTIFICATION_ID=$(echo $NOTIFICATIONS_RESPONSE | jq -r '.notifications[0].id')

# Test 2: Get unread count
print_test_header "Get Unread Count"
make_request "GET" "/notifications/unread-count" "$FARMER_TOKEN"

# Test 3: Mark notification as read
print_test_header "Mark Notification as Read"
make_request "POST" "/notifications/$NOTIFICATION_ID/mark-read" "$FARMER_TOKEN"

# Test again to verify the unread count has changed
print_test_header "Verify Unread Count After Marking as Read"
make_request "GET" "/notifications/unread-count" "$FARMER_TOKEN"

echo -e "\n${GREEN}Notification tests completed!${NC}" 