#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Metrics Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222244" "ADMIN")

# Test Admin Metrics
print_test_header "Admin Metrics Endpoints"

# Test 1: Get dashboard metrics
print_test_header "Get Dashboard Metrics"
make_request "GET" "/metrics/dashboard" "$ADMIN_TOKEN"

# Test 2: Get performance metrics
print_test_header "Get Performance Metrics"
make_request "GET" "/metrics/performance" "$ADMIN_TOKEN"

# Test 3: Get daily prices metrics
print_test_header "Get Daily Prices Metrics"
make_request "GET" "/metrics/daily-prices" "$ADMIN_TOKEN"

# Test 4: Get hourly distribution
print_test_header "Get Hourly Distribution"
make_request "GET" "/metrics/hourly-distribution" "$ADMIN_TOKEN"

# Test 5: Get top users
print_test_header "Get Top Users"
make_request "GET" "/metrics/top-users" "$ADMIN_TOKEN"

# Test Business Metrics
print_test_header "Business Metrics Endpoints"

# Test 6: Get error rates
print_test_header "Get Error Rates"
make_request "GET" "/metrics/error-rates" "$ADMIN_TOKEN"

# Test 7: Get response times
print_test_header "Get Response Times"
make_request "GET" "/metrics/response-times" "$ADMIN_TOKEN"

# Test 8: Get daily price trends
print_test_header "Get Daily Price Trends"
make_request "GET" "/metrics/daily-prices" "$ADMIN_TOKEN"

# Test 9: Get hourly activity distribution
print_test_header "Get Hourly Activity Distribution"
make_request "GET" "/metrics/hourly-distribution" "$ADMIN_TOKEN"

# Test 10: Get top performing users
print_test_header "Get Top Performing Users"
make_request "GET" "/metrics/top-users" "$ADMIN_TOKEN"

# Test System Configuration
print_test_header "System Configuration Endpoints"

# Test 11: Get system configuration
print_test_header "Get System Configuration"
make_request "GET" "/config/system" "$ADMIN_TOKEN"

# Test 12: Update system configuration
print_test_header "Update System Configuration"
make_request "PUT" "/config/system" "$ADMIN_TOKEN" '{
    "maintenance_mode": false,
    "max_file_size_mb": 10,
    "default_pagination_limit": 20,
    "cache_ttl_minutes": 15
}'

# Test 13: Get fee configuration
print_test_header "Get Fee Configuration"
make_request "GET" "/config/fees" "$ADMIN_TOKEN"

# Test 14: Update fee configuration
print_test_header "Update Fee Configuration"
make_request "PUT" "/config/fees" "$ADMIN_TOKEN" '{
    "transaction_fee_percentage": 2.5,
    "minimum_transaction_fee": 10,
    "maximum_transaction_fee": 1000
}'

echo -e "\n${GREEN}Metrics and configuration tests completed!${NC}" 