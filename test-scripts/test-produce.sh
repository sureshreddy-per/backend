#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Produce Endpoints"

# Get farmer token
FARMER_TOKEN=$(get_auth_token "+3333333333" "FARMER")

# Test 1: Create produce listing
print_test_header "Create Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" "$FARMER_TOKEN" '{
    "name": "Fresh Tomatoes",
    "category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
    }
}')

# Extract produce ID for subsequent requests
PRODUCE_ID=$(echo $PRODUCE_RESPONSE | jq -r '.id')

# Test 2: Get all produce with filters
print_test_header "Get All Produce"
make_request "GET" "/produce?category=VEGETABLES&min_price=10&max_price=100" "$FARMER_TOKEN"

# Test 3: Find nearby produce
print_test_header "Find Nearby Produce"
make_request "GET" "/produce/nearby?latitude=12.9716&longitude=77.5946&radius=10" "$FARMER_TOKEN"

# Test 4: Get produce by ID
print_test_header "Get Produce by ID"
make_request "GET" "/produce/$PRODUCE_ID" "$FARMER_TOKEN"

# Test 5: Update produce
print_test_header "Update Produce"
make_request "PATCH" "/produce/$PRODUCE_ID" "$FARMER_TOKEN" '{
    "price_per_unit": 55,
    "quantity": 90
}'

# Test 6: Delete produce
print_test_header "Delete Produce"
make_request "DELETE" "/produce/$PRODUCE_ID" "$FARMER_TOKEN"

# Test Produce Synonyms
print_test_header "Produce Synonyms Endpoints"

# Get admin token for synonym management
ADMIN_TOKEN=$(get_auth_token "+4444444444" "ADMIN")

# Test 7: Add new synonyms (Admin)
print_test_header "Add New Synonyms"
make_request "POST" "/produce-synonyms" "$ADMIN_TOKEN" '{
    "canonical_name": "tomato",
    "synonyms": ["tamatar", "tomatoes", "cherry tomato"]
}'

# Test 8: Search produce synonyms
print_test_header "Search Produce Synonyms"
make_request "GET" "/produce-synonyms/search?query=tamatar" "$FARMER_TOKEN"

# Test 9: Find canonical name
print_test_header "Find Canonical Name"
make_request "GET" "/produce-synonyms/canonical?name=tamatar" "$FARMER_TOKEN"

# Test 10: Deactivate synonym (Admin)
print_test_header "Deactivate Synonym"
make_request "DELETE" "/produce-synonyms/tomato" "$ADMIN_TOKEN"

echo -e "\n${GREEN}Produce tests completed!${NC}" 