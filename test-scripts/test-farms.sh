#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Farm Management Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222268" "FARMER")

# Test 1: Create farm
print_test_header "Create Farm"
FARM_RESPONSE=$(make_request "POST" "/farmers/farms" "$FARMER_TOKEN" '{
    "name": "Green Valley Farm",
    "size": 10.5,
    "size_unit": "ACRES",
    "location": {
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "123 Farm Road, Rural District"
    },
    "soil_type": "LOAMY",
    "irrigation_type": "DRIP",
    "crops": ["TOMATOES", "POTATOES", "ONIONS"],
    "facilities": ["STORAGE", "PACKAGING"],
    "certifications": ["ORGANIC"]
}')

FARM_ID=$(echo $FARM_RESPONSE | jq -r '.id')

# Test 2: Get farm details
print_test_header "Get Farm Details"
make_request "GET" "/farmers/farms/$FARM_ID" "$FARMER_TOKEN"

# Test 3: Update farm details
print_test_header "Update Farm Details"
make_request "PATCH" "/farmers/farms/$FARM_ID" "$FARMER_TOKEN" '{
    "irrigation_type": "SPRINKLER",
    "crops": ["TOMATOES", "POTATOES", "ONIONS", "CARROTS"],
    "facilities": ["STORAGE", "PACKAGING", "COLD_STORAGE"]
}'

# Test 4: Add farm plot
print_test_header "Add Farm Plot"
PLOT_RESPONSE=$(make_request "POST" "/farmers/farms/$FARM_ID/plots" "$FARMER_TOKEN" '{
    "name": "Plot A",
    "size": 2.5,
    "size_unit": "ACRES",
    "soil_type": "CLAYEY",
    "current_crop": "TOMATOES",
    "planting_date": "2024-01-01",
    "expected_harvest_date": "2024-03-01"
}')

PLOT_ID=$(echo $PLOT_RESPONSE | jq -r '.id')

# Test 5: Update farm plot
print_test_header "Update Farm Plot"
make_request "PATCH" "/farmers/farms/$FARM_ID/plots/$PLOT_ID" "$FARMER_TOKEN" '{
    "current_crop": "POTATOES",
    "planting_date": "2024-01-15",
    "expected_harvest_date": "2024-04-15"
}'

# Test 6: Add farm equipment
print_test_header "Add Farm Equipment"
EQUIPMENT_RESPONSE=$(make_request "POST" "/farmers/farms/$FARM_ID/equipment" "$FARMER_TOKEN" '{
    "name": "Tractor",
    "type": "VEHICLE",
    "model": "John Deere 5055E",
    "purchase_date": "2023-01-01",
    "maintenance_schedule": "MONTHLY"
}')

EQUIPMENT_ID=$(echo $EQUIPMENT_RESPONSE | jq -r '.id')

# Test 7: Update farm equipment
print_test_header "Update Farm Equipment"
make_request "PATCH" "/farmers/farms/$FARM_ID/equipment/$EQUIPMENT_ID" "$FARMER_TOKEN" '{
    "last_maintenance_date": "2024-01-01",
    "next_maintenance_date": "2024-02-01",
    "status": "OPERATIONAL"
}'

# Test 8: Add crop schedule
print_test_header "Add Crop Schedule"
make_request "POST" "/farmers/farms/$FARM_ID/crop-schedules" "$FARMER_TOKEN" '{
    "crop": "TOMATOES",
    "plot_id": "'$PLOT_ID'",
    "planting_date": "2024-02-01",
    "expected_harvest_date": "2024-04-01",
    "expected_yield": 5000,
    "yield_unit": "KG"
}'

# Test 9: Get farm analytics
print_test_header "Get Farm Analytics"
make_request "GET" "/farmers/farms/$FARM_ID/analytics" "$FARMER_TOKEN"

# Test 10: Get farm reports
print_test_header "Get Farm Reports"
make_request "GET" "/farmers/farms/$FARM_ID/reports" "$FARMER_TOKEN"

# Test 11: Add farm workers
print_test_header "Add Farm Workers"
make_request "POST" "/farmers/farms/$FARM_ID/workers" "$FARMER_TOKEN" '{
    "workers": [
        {
            "name": "John Doe",
            "role": "FIELD_WORKER",
            "contact": "+1234567890"
        },
        {
            "name": "Jane Smith",
            "role": "SUPERVISOR",
            "contact": "+1234567891"
        }
    ]
}'

# Test 12: Get farm inventory
print_test_header "Get Farm Inventory"
make_request "GET" "/farmers/farms/$FARM_ID/inventory" "$FARMER_TOKEN"

echo -e "\n${GREEN}Farm management tests completed!${NC}" 