#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "System Configuration Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222267" "ADMIN")

# Test 1: Get system configuration
print_test_header "Get System Configuration"
make_request "GET" "/config/system" "$ADMIN_TOKEN"

# Test 2: Update system configuration
print_test_header "Update System Configuration"
make_request "PUT" "/config/system" "$ADMIN_TOKEN" '{
    "maintenance_mode": false,
    "max_file_size_mb": 10,
    "default_pagination_limit": 20,
    "cache_ttl_minutes": 15,
    "allowed_file_types": ["jpg", "png", "pdf", "doc", "docx"],
    "max_failed_login_attempts": 5,
    "password_expiry_days": 90,
    "session_timeout_minutes": 30
}'

# Test 3: Get fee configuration
print_test_header "Get Fee Configuration"
make_request "GET" "/config/fees" "$ADMIN_TOKEN"

# Test 4: Update fee configuration
print_test_header "Update Fee Configuration"
make_request "PUT" "/config/fees" "$ADMIN_TOKEN" '{
    "transaction_fee_percentage": 2.5,
    "minimum_transaction_fee": 10,
    "maximum_transaction_fee": 1000,
    "inspection_base_fee": 50,
    "distance_fee_per_km": 2
}'

# Test 5: Get inspection fee configuration
print_test_header "Get Inspection Fee Configuration"
make_request "GET" "/config/inspection-fees" "$ADMIN_TOKEN"

# Test 6: Update inspection fee configuration
print_test_header "Update Inspection Fee Configuration"
make_request "PUT" "/config/inspection-fees" "$ADMIN_TOKEN" '{
    "base_fee": {
        "VEGETABLES": 50,
        "FRUITS": 60,
        "GRAINS": 70
    },
    "distance_multiplier": 1.5,
    "urgency_multiplier": 2.0
}'

# Test 7: Get inspection distance fee configuration
print_test_header "Get Inspection Distance Fee Configuration"
make_request "GET" "/config/inspection-distance-fees" "$ADMIN_TOKEN"

# Test 8: Update inspection distance fee configuration
print_test_header "Update Inspection Distance Fee Configuration"
make_request "PUT" "/config/inspection-distance-fees" "$ADMIN_TOKEN" '[
    {
        "min_distance": 0,
        "max_distance": 10,
        "fee": 50
    },
    {
        "min_distance": 11,
        "max_distance": 25,
        "fee": 100
    },
    {
        "min_distance": 26,
        "max_distance": 50,
        "fee": 200
    }
]'

# Test 9: Get notification configuration
print_test_header "Get Notification Configuration"
make_request "GET" "/config/notifications" "$ADMIN_TOKEN"

# Test 10: Update notification configuration
print_test_header "Update Notification Configuration"
make_request "PUT" "/config/notifications" "$ADMIN_TOKEN" '{
    "email": {
        "enabled": true,
        "daily_limit": 1000,
        "templates": {
            "welcome": "Welcome to our platform, {name}!",
            "order_confirmation": "Your order #{order_id} has been confirmed"
        }
    },
    "sms": {
        "enabled": true,
        "daily_limit": 500,
        "providers": ["twilio", "aws-sns"]
    },
    "push": {
        "enabled": true,
        "platforms": ["fcm", "apns"]
    }
}'

# Test 11: Get security configuration
print_test_header "Get Security Configuration"
make_request "GET" "/config/security" "$ADMIN_TOKEN"

# Test 12: Update security configuration
print_test_header "Update Security Configuration"
make_request "PUT" "/config/security" "$ADMIN_TOKEN" '{
    "password_policy": {
        "min_length": 8,
        "require_uppercase": true,
        "require_numbers": true,
        "require_special_chars": true
    },
    "jwt": {
        "access_token_expiry": "1h",
        "refresh_token_expiry": "7d"
    },
    "rate_limiting": {
        "enabled": true,
        "max_requests_per_minute": 60
    }
}'

echo -e "\n${GREEN}System configuration tests completed!${NC}" 