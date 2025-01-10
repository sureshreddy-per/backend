#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Report Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222255" "FARMER")
ADMIN_TOKEN=$(get_auth_token "+1111222256" "ADMIN")

# Test 1: Create report
print_test_header "Create Report"
REPORT_RESPONSE=$(make_request "POST" "/reports" "$FARMER_TOKEN" '{
    "report_type": "TRANSACTION_HISTORY",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "format": "PDF",
    "filters": {
        "status": ["COMPLETED", "CANCELLED"],
        "min_amount": 1000
    }
}')

REPORT_ID=$(echo $REPORT_RESPONSE | jq -r '.id')

# Test 2: Get report by ID
print_test_header "Get Report by ID"
make_request "GET" "/reports/$REPORT_ID" "$FARMER_TOKEN"

# Test 3: Get user reports
print_test_header "Get User Reports"
make_request "GET" "/reports" "$FARMER_TOKEN"

# Test 4: Get report types
print_test_header "Get Report Types"
make_request "GET" "/reports/types" "$FARMER_TOKEN"

# Test 5: Get report formats
print_test_header "Get Report Formats"
make_request "GET" "/reports/formats" "$FARMER_TOKEN"

# Test admin report generation
print_test_header "Admin Reports"

# Test 6: Create admin report
print_test_header "Create Admin Report"
make_request "POST" "/reports" "$ADMIN_TOKEN" '{
    "report_type": "SYSTEM_METRICS",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "format": "CSV",
    "filters": {
        "include_errors": true,
        "include_performance": true
    }
}'

# Test 7: Create financial report
print_test_header "Create Financial Report"
make_request "POST" "/reports" "$ADMIN_TOKEN" '{
    "report_type": "FINANCIAL_SUMMARY",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "format": "EXCEL",
    "filters": {
        "include_fees": true,
        "include_transactions": true,
        "min_amount": 1000
    }
}'

echo -e "\n${GREEN}Report tests completed!${NC}" 