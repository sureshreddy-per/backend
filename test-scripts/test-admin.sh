#!/bin/bash

# Import common functions
source "$(dirname "$0")/utils.sh"

echo -e "\nTesting: Admin Endpoints"

# Register and get token for admin user
admin_token=$(get_auth_token "+1111222259" "Test Admin" "ADMIN")
if [ -z "$admin_token" ]; then
    echo "Failed to get admin token"
    exit 1
fi

# Register and get token for farmer user
farmer_token=$(get_auth_token "+1111222260" "Test Farmer" "FARMER")
if [ -z "$farmer_token" ]; then
    echo "Failed to get farmer token"
    exit 1
fi

# Register and get token for buyer user
buyer_token=$(get_auth_token "+1111222261" "Test Buyer" "BUYER")
if [ -z "$buyer_token" ]; then
    echo "Failed to get buyer token"
    exit 1
fi

# Create buyer profile
echo -e "\nTesting: Create Buyer Profile"
make_request "POST" "/buyers/profile" '{
    "business_name": "Test Buyer Business",
    "address": "123 Test Street, Test City",
    "lat_lng": "12.9716-77.5946"
}' "$buyer_token"

# Create test produce
echo -e "\nTesting: Create Produce"
produce_response=$(make_request "POST" "/produce" '{
    "name": "Admin Test Produce",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50,
    "location": "12.9716,77.5946"
}' "$farmer_token")
produce_id=$(echo "$produce_response" | jq -r '.id')
if [ "$produce_id" == "null" ] || [ -z "$produce_id" ]; then
    echo "Failed to create produce"
    exit 1
fi

# Test admin offer creation
echo -e "\nTesting: Admin Create Offer"
buyer_response=$(make_request "GET" "/users/role/BUYER" "{}" "$admin_token")
buyer_user_id=$(echo "$buyer_response" | jq -r '.[0].id')
farmer_response=$(make_request "GET" "/users/role/FARMER" "{}" "$admin_token")
farmer_user_id=$(echo "$farmer_response" | jq -r '.[0].id')

admin_offer_response=$(make_request "POST" "/offers/admin/create" "{
    \"buyer_id\": \"$buyer_user_id\",
    \"farmer_id\": \"$farmer_user_id\",
    \"produce_id\": \"$produce_id\",
    \"quantity\": 75,
    \"price\": 55,
    \"message\": \"Admin created offer for testing\"
}" "$admin_token")
admin_offer_id=$(echo "$admin_offer_response" | jq -r '.id')
if [ "$admin_offer_id" == "null" ] || [ -z "$admin_offer_id" ]; then
    echo "Failed to create admin offer"
    exit 1
fi

# Create test transaction
echo -e "\nTesting: Create Transaction"
transaction_response=$(make_request "POST" "/transactions" "{
    \"offer_id\": \"$admin_offer_id\",
    \"produce_id\": \"$produce_id\",
    \"final_price\": 55,
    \"final_quantity\": 75
}" "$farmer_token")
transaction_id=$(echo "$transaction_response" | jq -r '.id')
if [ "$transaction_id" == "null" ] || [ -z "$transaction_id" ]; then
    echo "Failed to create transaction"
    exit 1
fi

# Get farmer user ID
echo -e "\nTesting: Get Farmer User"
farmer_response=$(make_request "GET" "/users/role/FARMER" "{}" "$admin_token")
farmer_user_id=$(echo "$farmer_response" | jq -r '.[0].id')
if [ "$farmer_user_id" == "null" ] || [ -z "$farmer_user_id" ]; then
    echo "Failed to get farmer user ID"
    exit 1
fi

# Test admin system configuration endpoints
echo -e "\nTesting: Get System Config"
make_request "GET" "/admin/system/config" "{}" "$admin_token"

echo -e "\nTesting: Update System Config"
make_request "POST" "/admin/system/config" '{
    "maintenance_mode": false,
    "max_file_size_mb": 10,
    "default_pagination_limit": 20,
    "cache_ttl_minutes": 15
}' "$admin_token"

# Test admin user management endpoints
echo -e "\nTesting: Block User"
make_request "POST" "/admin/users/$farmer_user_id/block" '{
    "reason": "Violation of terms",
    "duration_days": 7
}' "$admin_token"

echo -e "\nTesting: Unblock User"
make_request "POST" "/admin/users/$farmer_user_id/unblock" '{
    "reason": "Appeal approved"
}' "$admin_token"

# Test admin produce management endpoints
echo -e "\nTesting: Delete Produce"
make_request "POST" "/admin/produce/$produce_id/delete" '{
    "reason": "Inappropriate listing"
}' "$admin_token"

# Test admin offer management endpoints
echo -e "\nTesting: Cancel Offer"
make_request "POST" "/admin/offers/$admin_offer_id/cancel" '{
    "reason": "Suspicious activity"
}' "$admin_token"

# Test admin transaction management endpoints
echo -e "\nTesting: Cancel Transaction"
make_request "POST" "/admin/transactions/$transaction_id/cancel" '{
    "reason": "Dispute resolution"
}' "$admin_token"

# Test admin inspector management endpoints
echo -e "\nTesting: Register Inspector"
inspector_token=$(get_auth_token "+1111222262" "Test Inspector" "INSPECTOR")
if [ -z "$inspector_token" ]; then
    echo "Failed to get inspector token"
    exit 1
fi

echo -e "\nTesting: Get Inspector Profile"
inspector_response=$(make_request "GET" "/users/me" "{}" "$inspector_token")
inspector_id=$(echo "$inspector_response" | jq -r '.id')
if [ "$inspector_id" == "null" ] || [ -z "$inspector_id" ]; then
    echo "Failed to get inspector ID"
    exit 1
fi

echo -e "\nTesting: Assign Inspector to Produce"
make_request "POST" "/admin/produce/$produce_id/assign-inspector" "{
    \"inspector_id\": \"$inspector_id\",
    \"priority\": \"HIGH\",
    \"notes\": \"Urgent quality verification needed\"
}" "$admin_token"

# Test admin statistics endpoints
echo -e "\nTesting: Get User Stats"
make_request "GET" "/admin/stats/users" "{}" "$admin_token"

echo -e "\nTesting: Get Transaction Stats"
make_request "GET" "/admin/stats/transactions" "{}" "$admin_token"

echo -e "\nTesting: Get Revenue Stats"
make_request "GET" "/admin/stats/revenue" "{}" "$admin_token"

echo -e "\nTesting: Get Produce Stats"
make_request "GET" "/admin/stats/produce" "{}" "$admin_token"

# Test admin audit logs
echo -e "\nTesting: Get Audit Logs"
make_request "GET" "/admin/audit-logs" "{}" "$admin_token"

# Test admin metrics
echo -e "\nTesting: Get System Metrics"
make_request "GET" "/admin/metrics" "{}" "$admin_token"

echo -e "\nAdmin endpoint testing completed" 