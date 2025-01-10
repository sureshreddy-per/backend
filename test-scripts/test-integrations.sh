#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Integration Endpoints"

# Get tokens for different roles
ADMIN_TOKEN=$(get_auth_token "+1111222280" "ADMIN")
FARMER_TOKEN=$(get_auth_token "+1111222281" "FARMER")

# Test 1: Get available integrations
print_test_header "Get Available Integrations"
make_request "GET" "/integrations" "$ADMIN_TOKEN"

# Test 2: Get integration details
print_test_header "Get Integration Details"
make_request "GET" "/integrations/payment-gateway" "$ADMIN_TOKEN"

# Test 3: Enable integration
print_test_header "Enable Integration"
make_request "POST" "/integrations/payment-gateway/enable" "$ADMIN_TOKEN" '{
    "provider": "STRIPE",
    "config": {
        "api_key": "test_key_123",
        "webhook_secret": "whsec_test_123",
        "currency": "USD",
        "payment_methods": ["CARD", "UPI", "BANK_TRANSFER"]
    }
}'

# Test 4: Update integration configuration
print_test_header "Update Integration Configuration"
make_request "PUT" "/integrations/payment-gateway/config" "$ADMIN_TOKEN" '{
    "webhook_secret": "whsec_test_456",
    "payment_methods": ["CARD", "UPI", "BANK_TRANSFER", "WALLET"]
}'

# Test 5: Test integration connection
print_test_header "Test Integration Connection"
make_request "POST" "/integrations/payment-gateway/test" "$ADMIN_TOKEN"

# Test 6: Get integration status
print_test_header "Get Integration Status"
make_request "GET" "/integrations/payment-gateway/status" "$ADMIN_TOKEN"

# Test 7: Get integration metrics
print_test_header "Get Integration Metrics"
make_request "GET" "/integrations/payment-gateway/metrics" "$ADMIN_TOKEN"

# Test 8: Enable SMS integration
print_test_header "Enable SMS Integration"
make_request "POST" "/integrations/sms/enable" "$ADMIN_TOKEN" '{
    "provider": "TWILIO",
    "config": {
        "account_sid": "test_sid",
        "auth_token": "test_token",
        "from_number": "+1234567890"
    }
}'

# Test 9: Enable email integration
print_test_header "Enable Email Integration"
make_request "POST" "/integrations/email/enable" "$ADMIN_TOKEN" '{
    "provider": "SENDGRID",
    "config": {
        "api_key": "test_key_789",
        "from_email": "test@example.com",
        "from_name": "Test System"
    }
}'

# Test 10: Enable storage integration
print_test_header "Enable Storage Integration"
make_request "POST" "/integrations/storage/enable" "$ADMIN_TOKEN" '{
    "provider": "AWS_S3",
    "config": {
        "access_key": "test_access_key",
        "secret_key": "test_secret_key",
        "bucket": "test-bucket",
        "region": "us-east-1"
    }
}'

# Test 11: Enable maps integration
print_test_header "Enable Maps Integration"
make_request "POST" "/integrations/maps/enable" "$ADMIN_TOKEN" '{
    "provider": "GOOGLE_MAPS",
    "config": {
        "api_key": "test_maps_key",
        "region": "IN"
    }
}'

# Test 12: Get integration logs
print_test_header "Get Integration Logs"
make_request "GET" "/integrations/payment-gateway/logs" "$ADMIN_TOKEN"

# Test 13: Clear integration logs
print_test_header "Clear Integration Logs"
make_request "DELETE" "/integrations/payment-gateway/logs" "$ADMIN_TOKEN"

# Test 14: Sync integration data
print_test_header "Sync Integration Data"
make_request "POST" "/integrations/payment-gateway/sync" "$ADMIN_TOKEN"

# Test 15: Disable integration
print_test_header "Disable Integration"
make_request "POST" "/integrations/payment-gateway/disable" "$ADMIN_TOKEN"

# Test 16: Get user integration settings (Farmer)
print_test_header "Get User Integration Settings"
make_request "GET" "/integrations/user/settings" "$FARMER_TOKEN"

# Test 17: Update user integration settings
print_test_header "Update User Integration Settings"
make_request "PUT" "/integrations/user/settings" "$FARMER_TOKEN" '{
    "payment_gateway": {
        "default_method": "UPI",
        "auto_payout": true,
        "payout_threshold": 1000
    },
    "notifications": {
        "sms": true,
        "email": true,
        "push": false
    }
}'

echo -e "\n${GREEN}Integration tests completed!${NC}" 