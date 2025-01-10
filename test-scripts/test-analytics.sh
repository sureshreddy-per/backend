#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Analytics Endpoints"

# Get tokens for different roles
ADMIN_TOKEN=$(get_auth_token "+1111222273" "ADMIN")
FARMER_TOKEN=$(get_auth_token "+1111222274" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222275" "BUYER")

# Test 1: Get platform overview
print_test_header "Get Platform Overview"
make_request "GET" "/analytics/overview" "$ADMIN_TOKEN"

# Test 2: Get user growth analytics
print_test_header "Get User Growth Analytics"
make_request "GET" "/analytics/users/growth?period=MONTHLY" "$ADMIN_TOKEN"

# Test 3: Get user engagement metrics
print_test_header "Get User Engagement Metrics"
make_request "GET" "/analytics/users/engagement" "$ADMIN_TOKEN"

# Test 4: Get produce analytics
print_test_header "Get Produce Analytics"
make_request "GET" "/analytics/produce?category=VEGETABLES" "$ADMIN_TOKEN"

# Test 5: Get transaction analytics
print_test_header "Get Transaction Analytics"
make_request "GET" "/analytics/transactions?period=LAST_30_DAYS" "$ADMIN_TOKEN"

# Test 6: Get quality metrics
print_test_header "Get Quality Metrics"
make_request "GET" "/analytics/quality" "$ADMIN_TOKEN"

# Test 7: Get farmer performance metrics
print_test_header "Get Farmer Performance Metrics"
make_request "GET" "/analytics/farmers/performance" "$ADMIN_TOKEN"

# Test 8: Get buyer behavior analytics
print_test_header "Get Buyer Behavior Analytics"
make_request "GET" "/analytics/buyers/behavior" "$ADMIN_TOKEN"

# Test 9: Get price trend analytics
print_test_header "Get Price Trend Analytics"
make_request "GET" "/analytics/prices/trends?produce=TOMATOES" "$ADMIN_TOKEN"

# Test 10: Get regional analytics
print_test_header "Get Regional Analytics"
make_request "GET" "/analytics/regional?state=KARNATAKA" "$ADMIN_TOKEN"

# Test 11: Get seasonal analytics
print_test_header "Get Seasonal Analytics"
make_request "GET" "/analytics/seasonal" "$ADMIN_TOKEN"

# Test 12: Get inspection analytics
print_test_header "Get Inspection Analytics"
make_request "GET" "/analytics/inspections" "$ADMIN_TOKEN"

# Test 13: Get farmer-specific analytics (Farmer only)
print_test_header "Get Farmer Analytics"
make_request "GET" "/analytics/farmer/dashboard" "$FARMER_TOKEN"

# Test 14: Get buyer-specific analytics (Buyer only)
print_test_header "Get Buyer Analytics"
make_request "GET" "/analytics/buyer/dashboard" "$BUYER_TOKEN"

# Test 15: Get market prediction analytics
print_test_header "Get Market Predictions"
make_request "GET" "/analytics/predictions?produce=TOMATOES" "$ADMIN_TOKEN"

# Test 16: Get custom date range analytics
print_test_header "Get Custom Date Range Analytics"
make_request "GET" "/analytics/custom?start_date=2024-01-01&end_date=2024-01-31" "$ADMIN_TOKEN"

# Test 17: Get comparative analytics
print_test_header "Get Comparative Analytics"
make_request "GET" "/analytics/compare?metric=PRICE&produce=TOMATOES,POTATOES" "$ADMIN_TOKEN"

# Test 18: Export analytics report
print_test_header "Export Analytics Report"
make_request "POST" "/analytics/export" "$ADMIN_TOKEN" '{
    "report_type": "COMPREHENSIVE",
    "format": "PDF",
    "sections": [
        "USER_GROWTH",
        "TRANSACTIONS",
        "PRODUCE_TRENDS",
        "QUALITY_METRICS",
        "REGIONAL_INSIGHTS"
    ],
    "date_range": {
        "start": "2024-01-01",
        "end": "2024-01-31"
    }
}'

echo -e "\n${GREEN}Analytics tests completed!${NC}" 