#!/bin/bash

# Source utilities
source "$(dirname "$0")/utils.sh"

print_test_header "Search Endpoints"

# Get tokens for different roles
FARMER_TOKEN=$(get_auth_token "+1111222276" "FARMER")
BUYER_TOKEN=$(get_auth_token "+1111222277" "BUYER")

# Test 1: Search produce
print_test_header "Search Produce"
make_request "GET" "/search/produce?query=tomatoes&category=VEGETABLES" "$BUYER_TOKEN"

# Test 2: Search produce with filters
print_test_header "Search Produce with Filters"
make_request "GET" "/search/produce?query=organic&min_price=50&max_price=100&location=12.9716,77.5946&radius=10" "$BUYER_TOKEN"

# Test 3: Search farmers
print_test_header "Search Farmers"
make_request "GET" "/search/farmers?query=organic&location=12.9716,77.5946&radius=10" "$BUYER_TOKEN"

# Test 4: Search buyers
print_test_header "Search Buyers"
make_request "GET" "/search/buyers?query=wholesale&location=12.9716,77.5946&radius=10" "$FARMER_TOKEN"

# Test 5: Search by location
print_test_header "Search by Location"
make_request "GET" "/search/nearby?latitude=12.9716&longitude=77.5946&radius=10&type=PRODUCE" "$BUYER_TOKEN"

# Test 6: Search transactions
print_test_header "Search Transactions"
make_request "GET" "/search/transactions?query=completed&start_date=2024-01-01&end_date=2024-01-31" "$BUYER_TOKEN"

# Test 7: Search with advanced filters
print_test_header "Search with Advanced Filters"
make_request "POST" "/search/advanced" "$BUYER_TOKEN" '{
    "query": "fresh vegetables",
    "filters": {
        "category": ["VEGETABLES"],
        "price_range": {
            "min": 50,
            "max": 100
        },
        "quality_score": {
            "min": 4
        },
        "certifications": ["ORGANIC"],
        "location": {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "radius": 10
        },
        "availability": {
            "min_quantity": 100,
            "delivery_date": "2024-02-01"
        }
    },
    "sort": {
        "field": "price",
        "order": "asc"
    }
}'

# Test 8: Search suggestions
print_test_header "Search Suggestions"
make_request "GET" "/search/suggestions?query=tom" "$BUYER_TOKEN"

# Test 9: Search categories
print_test_header "Search Categories"
make_request "GET" "/search/categories?query=veg" "$BUYER_TOKEN"

# Test 10: Search trending
print_test_header "Search Trending"
make_request "GET" "/search/trending" "$BUYER_TOKEN"

# Test 11: Search history
print_test_header "Search History"
make_request "GET" "/search/history" "$BUYER_TOKEN"

# Test 12: Clear search history
print_test_header "Clear Search History"
make_request "DELETE" "/search/history" "$BUYER_TOKEN"

# Test 13: Save search
print_test_header "Save Search"
SAVED_SEARCH_RESPONSE=$(make_request "POST" "/search/save" "$BUYER_TOKEN" '{
    "name": "Organic Vegetables",
    "query": "organic vegetables",
    "filters": {
        "category": ["VEGETABLES"],
        "certifications": ["ORGANIC"],
        "location": {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "radius": 10
        }
    }
}')

SAVED_SEARCH_ID=$(echo $SAVED_SEARCH_RESPONSE | jq -r '.id')

# Test 14: Get saved searches
print_test_header "Get Saved Searches"
make_request "GET" "/search/saved" "$BUYER_TOKEN"

# Test 15: Delete saved search
print_test_header "Delete Saved Search"
make_request "DELETE" "/search/saved/$SAVED_SEARCH_ID" "$BUYER_TOKEN"

# Test 16: Search analytics
print_test_header "Search Analytics"
make_request "GET" "/search/analytics" "$BUYER_TOKEN"

echo -e "\n${GREEN}Search tests completed!${NC}" 