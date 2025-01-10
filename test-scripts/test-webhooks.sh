#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Webhook Endpoints"

# Get tokens for different roles
ADMIN_TOKEN=$(get_auth_token "+1111222278" "ADMIN")
FARMER_TOKEN=$(get_auth_token "+1111222279" "FARMER")

# Test 1: Register webhook
print_test_header "Register Webhook"
WEBHOOK_RESPONSE=$(make_request "POST" "/webhooks" "$ADMIN_TOKEN" '{
    "url": "https://example.com/webhook",
    "events": ["PRODUCE_CREATED", "TRANSACTION_COMPLETED", "INSPECTION_REQUESTED"],
    "description": "Test webhook for produce and transaction events",
    "secret": "webhook_secret_123",
    "is_active": true,
    "retry_policy": {
        "max_attempts": 3,
        "interval": 300
    }
}')

WEBHOOK_ID=$(echo $WEBHOOK_RESPONSE | jq -r '.id')

# Test 2: Get all webhooks
print_test_header "Get All Webhooks"
make_request "GET" "/webhooks" "$ADMIN_TOKEN"

# Test 3: Get webhook by ID
print_test_header "Get Webhook by ID"
make_request "GET" "/webhooks/$WEBHOOK_ID" "$ADMIN_TOKEN"

# Test 4: Update webhook
print_test_header "Update Webhook"
make_request "PATCH" "/webhooks/$WEBHOOK_ID" "$ADMIN_TOKEN" '{
    "events": ["PRODUCE_CREATED", "TRANSACTION_COMPLETED", "INSPECTION_REQUESTED", "QUALITY_UPDATED"],
    "is_active": true,
    "retry_policy": {
        "max_attempts": 5,
        "interval": 600
    }
}'

# Test 5: Test webhook
print_test_header "Test Webhook"
make_request "POST" "/webhooks/$WEBHOOK_ID/test" "$ADMIN_TOKEN" '{
    "event": "PRODUCE_CREATED",
    "payload": {
        "produce_id": "test_123",
        "name": "Test Produce",
        "category": "VEGETABLES"
    }
}'

# Test 6: Get webhook delivery history
print_test_header "Get Webhook Delivery History"
make_request "GET" "/webhooks/$WEBHOOK_ID/history" "$ADMIN_TOKEN"

# Test 7: Get webhook delivery details
print_test_header "Get Webhook Delivery Details"
DELIVERY_ID="test_delivery_123"
make_request "GET" "/webhooks/$WEBHOOK_ID/history/$DELIVERY_ID" "$ADMIN_TOKEN"

# Test 8: Retry webhook delivery
print_test_header "Retry Webhook Delivery"
make_request "POST" "/webhooks/$WEBHOOK_ID/history/$DELIVERY_ID/retry" "$ADMIN_TOKEN"

# Test 9: Get webhook metrics
print_test_header "Get Webhook Metrics"
make_request "GET" "/webhooks/$WEBHOOK_ID/metrics" "$ADMIN_TOKEN"

# Test 10: Get webhook events
print_test_header "Get Webhook Events"
make_request "GET" "/webhooks/events" "$ADMIN_TOKEN"

# Test 11: Register user webhook (Farmer)
print_test_header "Register User Webhook"
USER_WEBHOOK_RESPONSE=$(make_request "POST" "/webhooks/user" "$FARMER_TOKEN" '{
    "url": "https://example.com/user-webhook",
    "events": ["OFFER_RECEIVED", "INSPECTION_COMPLETED"],
    "description": "Test webhook for user events",
    "secret": "user_webhook_secret_123",
    "is_active": true
}')

USER_WEBHOOK_ID=$(echo $USER_WEBHOOK_RESPONSE | jq -r '.id')

# Test 12: Get user webhooks
print_test_header "Get User Webhooks"
make_request "GET" "/webhooks/user" "$FARMER_TOKEN"

# Test 13: Update user webhook
print_test_header "Update User Webhook"
make_request "PATCH" "/webhooks/user/$USER_WEBHOOK_ID" "$FARMER_TOKEN" '{
    "events": ["OFFER_RECEIVED", "INSPECTION_COMPLETED", "TRANSACTION_UPDATED"],
    "is_active": true
}'

# Test 14: Delete user webhook
print_test_header "Delete User Webhook"
make_request "DELETE" "/webhooks/user/$USER_WEBHOOK_ID" "$FARMER_TOKEN"

# Test 15: Delete webhook
print_test_header "Delete Webhook"
make_request "DELETE" "/webhooks/$WEBHOOK_ID" "$ADMIN_TOKEN"

echo -e "\n${GREEN}Webhook tests completed!${NC}" 