#!/bin/bash

# Source utilities for colors
source "$(dirname "$0")/utils.sh"

# Function to run a test script
run_test_script() {
    local script=$1
    echo -e "\n${YELLOW}Running $script...${NC}"
    bash "$script"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $script completed successfully${NC}"
    else
        echo -e "${RED}✗ $script failed${NC}"
        FAILED_TESTS+=("$script")
    fi
}

# Array to store failed tests
FAILED_TESTS=()

# Print start message
echo -e "${YELLOW}Starting API Tests${NC}"
echo "================================"

# Make all test scripts executable
chmod +x test-scripts/*.sh

# Run all test scripts in sequence
echo -e "\n${YELLOW}Running Core System Tests${NC}"
run_test_script "$(dirname "$0")/test-auth.sh"
run_test_script "$(dirname "$0")/test-users.sh"
run_test_script "$(dirname "$0")/test-system-config.sh"

echo -e "\n${YELLOW}Running User Role Tests${NC}"
run_test_script "$(dirname "$0")/test-farmers.sh"
run_test_script "$(dirname "$0")/test-farms.sh"
run_test_script "$(dirname "$0")/test-buyers.sh"
run_test_script "$(dirname "$0")/test-buyer-preferences.sh"

echo -e "\n${YELLOW}Running Produce and Quality Tests${NC}"
run_test_script "$(dirname "$0")/test-produce.sh"
run_test_script "$(dirname "$0")/test-quality.sh"
run_test_script "$(dirname "$0")/test-inspections.sh"

echo -e "\n${YELLOW}Running Transaction Flow Tests${NC}"
run_test_script "$(dirname "$0")/test-offers.sh"
run_test_script "$(dirname "$0")/test-daily-prices.sh"
run_test_script "$(dirname "$0")/test-transactions.sh"
run_test_script "$(dirname "$0")/test-ratings.sh"

echo -e "\n${YELLOW}Running File and Media Tests${NC}"
run_test_script "$(dirname "$0")/test-file-upload.sh"
run_test_script "$(dirname "$0")/test-media.sh"

echo -e "\n${YELLOW}Running Communication Tests${NC}"
run_test_script "$(dirname "$0")/test-notifications.sh"
run_test_script "$(dirname "$0")/test-support.sh"
run_test_script "$(dirname "$0")/test-webhooks.sh"

echo -e "\n${YELLOW}Running Integration Tests${NC}"
run_test_script "$(dirname "$0")/test-integrations.sh"

echo -e "\n${YELLOW}Running Report and Analytics Tests${NC}"
run_test_script "$(dirname "$0")/test-reports.sh"
run_test_script "$(dirname "$0")/test-business-metrics.sh"
run_test_script "$(dirname "$0")/test-analytics.sh"

echo -e "\n${YELLOW}Running Search and Discovery Tests${NC}"
run_test_script "$(dirname "$0")/test-search.sh"

echo -e "\n${YELLOW}Running Admin and Audit Tests${NC}"
run_test_script "$(dirname "$0")/test-admin.sh"
run_test_script "$(dirname "$0")/test-audit.sh"
run_test_script "$(dirname "$0")/test-metrics.sh"

# Print summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo "================================"
if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests completed successfully!${NC}"
else
    echo -e "${RED}The following tests failed:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}- $test${NC}"
    done
    exit 1
fi 