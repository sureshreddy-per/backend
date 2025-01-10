#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Farmer Endpoints"

# Get farmer token
FARMER_TOKEN=$(get_auth_token "+1111222257" "FARMER")

# Test 1: Create farmer profile
print_test_header "Create Farmer Profile"
FARMER_RESPONSE=$(make_request "POST" "/farmers" "$FARMER_TOKEN" '{
    "business_name": "Green Valley Farms",
    "years_of_experience": 10,
    "specializations": ["ORGANIC", "VEGETABLES"],
    "certifications": ["ORGANIC_CERTIFIED"],
    "primary_location": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "123 Farm Road, Rural District"
    }
}')

# Test 2: Get farmer profile
print_test_header "Get Farmer Profile"
make_request "GET" "/farmers/profile" "$FARMER_TOKEN"

# Test 3: Find nearby farmers
print_test_header "Find Nearby Farmers"
make_request "GET" "/farmers/nearby?latitude=12.9716&longitude=77.5946&radius=10" "$FARMER_TOKEN"

# Test 4: Add farm
print_test_header "Add Farm"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" "$FARMER_TOKEN" '{
    "name": "Green Valley Plot 1",
    "size": 5.5,
    "size_unit": "ACRES",
    "location": {
        "latitude": 12.9720,
        "longitude": 77.5950,
        "address": "Plot 1, Farm Road, Rural District"
    },
    "soil_type": "LOAMY",
    "irrigation_type": "DRIP",
    "crops": ["TOMATOES", "CARROTS", "ONIONS"]
}')

FARM_ID=$(echo $FARM_RESPONSE | jq -r '.id')

# Test 5: Update farm
print_test_header "Update Farm"
make_request "PATCH" "/farmers/farms/$FARM_ID" "$FARMER_TOKEN" '{
    "irrigation_type": "SPRINKLER",
    "crops": ["TOMATOES", "CARROTS", "ONIONS", "POTATOES"]
}'

# Test 6: Add another farm
print_test_header "Add Another Farm"
make_request "POST" "/farmers/farms" "$FARMER_TOKEN" '{
    "name": "Green Valley Plot 2",
    "size": 3.2,
    "size_unit": "ACRES",
    "location": {
        "latitude": 12.9725,
        "longitude": 77.5955,
        "address": "Plot 2, Farm Road, Rural District"
    },
    "soil_type": "CLAYEY",
    "irrigation_type": "DRIP",
    "crops": ["CABBAGE", "CAULIFLOWER"]
}'

echo -e "\n${GREEN}Farmer tests completed!${NC}" 