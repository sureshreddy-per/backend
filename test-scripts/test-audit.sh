#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Audit Endpoints"

# Get admin token
ADMIN_TOKEN=$(get_auth_token "+1111222272" "ADMIN")

# Test 1: Get all audit logs
print_test_header "Get All Audit Logs"
make_request "GET" "/audit/logs" "$ADMIN_TOKEN"

# Test 2: Get audit logs with filters
print_test_header "Get Audit Logs with Filters"
make_request "GET" "/audit/logs?action=CREATE&entity=USER&start_date=2024-01-01&end_date=2024-01-31" "$ADMIN_TOKEN"

# Test 3: Get audit logs by user
print_test_header "Get Audit Logs by User"
make_request "GET" "/audit/logs/by-user/123" "$ADMIN_TOKEN"

# Test 4: Get audit logs by entity
print_test_header "Get Audit Logs by Entity"
make_request "GET" "/audit/logs/by-entity/PRODUCE" "$ADMIN_TOKEN"

# Test 5: Get audit logs by action
print_test_header "Get Audit Logs by Action"
make_request "GET" "/audit/logs/by-action/UPDATE" "$ADMIN_TOKEN"

# Test 6: Get audit summary
print_test_header "Get Audit Summary"
make_request "GET" "/audit/summary" "$ADMIN_TOKEN"

# Test 7: Get audit statistics
print_test_header "Get Audit Statistics"
make_request "GET" "/audit/statistics" "$ADMIN_TOKEN"

# Test 8: Get audit logs by severity
print_test_header "Get Audit Logs by Severity"
make_request "GET" "/audit/logs/by-severity/HIGH" "$ADMIN_TOKEN"

# Test 9: Get audit logs by status
print_test_header "Get Audit Logs by Status"
make_request "GET" "/audit/logs/by-status/SUCCESS" "$ADMIN_TOKEN"

# Test 10: Get audit logs by IP address
print_test_header "Get Audit Logs by IP"
make_request "GET" "/audit/logs/by-ip/192.168.1.1" "$ADMIN_TOKEN"

# Test 11: Get audit logs by date range
print_test_header "Get Audit Logs by Date Range"
make_request "GET" "/audit/logs/by-date?start=2024-01-01&end=2024-01-31" "$ADMIN_TOKEN"

# Test 12: Export audit logs
print_test_header "Export Audit Logs"
make_request "POST" "/audit/logs/export" "$ADMIN_TOKEN" '{
    "format": "CSV",
    "filters": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "actions": ["CREATE", "UPDATE", "DELETE"],
        "entities": ["USER", "PRODUCE", "TRANSACTION"],
        "severity": ["HIGH", "MEDIUM"]
    }
}'

# Test 13: Get audit configuration
print_test_header "Get Audit Configuration"
make_request "GET" "/audit/config" "$ADMIN_TOKEN"

# Test 14: Update audit configuration
print_test_header "Update Audit Configuration"
make_request "PUT" "/audit/config" "$ADMIN_TOKEN" '{
    "retention_days": 90,
    "log_level": "INFO",
    "enabled_actions": ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
    "enabled_entities": ["USER", "PRODUCE", "TRANSACTION", "INSPECTION"],
    "alert_severity": ["HIGH"],
    "export_format": ["CSV", "JSON"]
}'

# Test 15: Get audit alerts
print_test_header "Get Audit Alerts"
make_request "GET" "/audit/alerts" "$ADMIN_TOKEN"

echo -e "\n${GREEN}Audit tests completed!${NC}" 