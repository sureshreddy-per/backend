#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Business Metrics Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222266" "ADMIN")

# Test 1: Get error rates by path
print_test_header "Get Error Rates"
make_request "GET" "/metrics/error-rates" "$ADMIN_TOKEN"

# Test 2: Get error rates with filters
print_test_header "Get Error Rates with Filters"
make_request "GET" "/metrics/error-rates?start_date=2024-01-01&end_date=2024-01-31&min_count=5" "$ADMIN_TOKEN"

# Test 3: Get response time percentiles
print_test_header "Get Response Time Percentiles"
make_request "GET" "/metrics/response-times" "$ADMIN_TOKEN"

# Test 4: Get response times by endpoint
print_test_header "Get Response Times by Endpoint"
make_request "GET" "/metrics/response-times?path=/produce&method=GET" "$ADMIN_TOKEN"

# Test 5: Get daily price trends
print_test_header "Get Daily Price Trends"
make_request "GET" "/metrics/daily-prices" "$ADMIN_TOKEN"

# Test 6: Get daily price trends by category
print_test_header "Get Daily Price Trends by Category"
make_request "GET" "/metrics/daily-prices?category=VEGETABLES&days=30" "$ADMIN_TOKEN"

# Test 7: Get hourly activity distribution
print_test_header "Get Hourly Activity Distribution"
make_request "GET" "/metrics/hourly-distribution" "$ADMIN_TOKEN"

# Test 8: Get hourly distribution by day
print_test_header "Get Hourly Distribution by Day"
make_request "GET" "/metrics/hourly-distribution?day=monday&type=transactions" "$ADMIN_TOKEN"

# Test 9: Get top performing users
print_test_header "Get Top Performing Users"
make_request "GET" "/metrics/top-users" "$ADMIN_TOKEN"

# Test 10: Get top users by category
print_test_header "Get Top Users by Category"
make_request "GET" "/metrics/top-users?role=FARMER&metric=sales&period=last_30_days" "$ADMIN_TOKEN"

# Test 11: Get business growth metrics
print_test_header "Get Business Growth Metrics"
make_request "GET" "/metrics/business/growth" "$ADMIN_TOKEN"

# Test 12: Get user engagement metrics
print_test_header "Get User Engagement Metrics"
make_request "GET" "/metrics/business/engagement" "$ADMIN_TOKEN"

# Test 13: Get transaction metrics
print_test_header "Get Transaction Metrics"
make_request "GET" "/metrics/business/transactions" "$ADMIN_TOKEN"

# Test 14: Get quality metrics
print_test_header "Get Quality Metrics"
make_request "GET" "/metrics/business/quality" "$ADMIN_TOKEN"

# Test 15: Get market trends
print_test_header "Get Market Trends"
make_request "GET" "/metrics/business/market-trends" "$ADMIN_TOKEN"

echo -e "\n${GREEN}Business metrics tests completed!${NC}" 