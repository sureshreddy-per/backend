#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "User Management Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111111111" "ADMIN")

# Get test user token
USER_TOKEN=$(get_auth_token "+2222222222" "FARMER")
USER_ID=$(make_request "GET" "/auth/profile" "$USER_TOKEN" | jq -r '.id')

# Test 1: Get all users (Admin)
print_test_header "Get All Users"
make_request "GET" "/users" "$ADMIN_TOKEN"

# Test 2: Get user by ID (Admin)
print_test_header "Get User by ID"
make_request "GET" "/users/$USER_ID" "$ADMIN_TOKEN"

# Test 3: Get users by role (Admin)
print_test_header "Get Users by Role"
make_request "GET" "/users/role/FARMER" "$ADMIN_TOKEN"

# Test 4: Update user (Admin)
print_test_header "Update User"
make_request "PUT" "/users/$USER_ID" "$ADMIN_TOKEN" '{
    "name": "Updated Test User",
    "email": "updated@test.com"
}'

# Test 5: Verify user (Admin)
print_test_header "Verify User"
make_request "PUT" "/users/$USER_ID/verify" "$ADMIN_TOKEN"

# Test 6: Block user (Admin)
print_test_header "Block User"
make_request "POST" "/users/$USER_ID/block" "$ADMIN_TOKEN"

# Test 7: Unblock user (Admin)
print_test_header "Unblock User"
make_request "POST" "/users/$USER_ID/unblock" "$ADMIN_TOKEN"

# Test 8: Schedule user deletion (Admin)
print_test_header "Schedule User Deletion"
make_request "POST" "/users/$USER_ID/schedule-deletion" "$ADMIN_TOKEN"

# Test 9: Cancel scheduled deletion (Admin)
print_test_header "Cancel Scheduled Deletion"
make_request "POST" "/users/$USER_ID/cancel-deletion" "$ADMIN_TOKEN"

# Test 10: Update FCM token
print_test_header "Update FCM Token"
make_request "PUT" "/users/$USER_ID/fcm-token" "$USER_TOKEN" '{
    "fcm_token": "sample-fcm-token-123"
}'

# Test 11: Update avatar
print_test_header "Update Avatar"
make_request "PUT" "/users/$USER_ID/avatar" "$USER_TOKEN" '{
    "avatar_url": "https://example.com/avatar.jpg"
}'

echo -e "\n${GREEN}User management tests completed!${NC}" 