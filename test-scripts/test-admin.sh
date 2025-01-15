#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Utility functions
print_test_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    return 1
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        ${data:+-d "$data"} \
        "http://localhost:3000/api$endpoint")
    
    # Check for curl errors
    if [ $? -ne 0 ]; then
        print_error "Failed to make request to $endpoint"
        return 1
    fi
    
    # Check for API errors
    if echo "$response" | grep -q '"statusCode":[45]'; then
        print_error "API request failed: $response"
        return 1
    fi
    
    echo "$response"
    return 0
}

# Function to get user token with registration if needed
get_user_token() {
    local mobile="$1"
    local name="$2"
    local role="$3"
    local email="$4"

    # Try to register
    local REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"mobile_number\":\"$mobile\",\"name\":\"$name\",\"role\":\"$role\",\"email\":\"$email\"}")
    if [ $? -ne 0 ]; then
        local IS_REGISTERED=$(make_request "POST" "/auth/check-mobile" "{\"mobile_number\":\"$mobile\"}")
        if [ "$IS_REGISTERED" != "true" ]; then
            print_error "Failed to register user and user does not exist"
            return 1
        fi
    fi

    # Request OTP
    local OTP_RESPONSE=$(make_request "POST" "/auth/otp/request" "{\"mobile_number\":\"$mobile\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to request OTP"
        return 1
    fi
    local OTP=$(echo "$OTP_RESPONSE" | jq -r '.message' | grep -o '[0-9]\{6\}')
    if [ -z "$OTP" ]; then
        print_error "Failed to extract OTP"
        return 1
    fi

    # Verify OTP and get token
    local VERIFY_RESPONSE=$(make_request "POST" "/auth/otp/verify" "{\"mobile_number\":\"$mobile\",\"otp\":\"$OTP\"}")
    if [ $? -ne 0 ]; then
        print_error "Failed to verify OTP"
        return 1
    fi
    
    echo "$VERIFY_RESPONSE"
    return 0
}

print_test_header "Starting Admin Flow Tests"

# Setup test users
print_test_header "Setting up test users"

# Setup ADMIN
print_test_header "Setting up ADMIN user"
ADMIN_RESPONSE=$(get_user_token "+7777777771" "Test Admin" "ADMIN" "test_admin_flow@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup ADMIN user"
    exit 1
fi
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')

# Setup FARMER
print_test_header "Setting up FARMER user"
FARMER_RESPONSE=$(get_user_token "+7777777772" "Test Farmer" "FARMER" "test_farmer_flow@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup FARMER user"
    exit 1
fi
FARMER_TOKEN=$(echo "$FARMER_RESPONSE" | jq -r '.token')
FARMER_ID=$(echo "$FARMER_RESPONSE" | jq -r '.user.id')

# Setup BUYER
print_test_header "Setting up BUYER user"
BUYER_RESPONSE=$(get_user_token "+7777777773" "Test Buyer" "BUYER" "test_buyer_flow@example.com")
if [ $? -ne 0 ]; then
    print_error "Failed to setup BUYER user"
    exit 1
fi
BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | jq -r '.token')
BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.user.id')

# Create buyer profile
print_test_header "Creating Buyer Profile"
BUYER_PROFILE_RESPONSE=$(make_request "POST" "/buyers/profile" '{
    "business_name": "Test Buyer Business",
    "address": "123 Test Street, Test City",
    "lat_lng": "12.9716-77.5946"
}' "$BUYER_TOKEN")

if [ $? -ne 0 ]; then
    print_warning "Buyer profile might already exist, continuing..."
else
    print_success "Created buyer profile"
fi

# Create test produce
print_test_header "Creating Test Produce"
PRODUCE_RESPONSE=$(make_request "POST" "/produce" '{
    "name": "Admin Test Produce",
    "description": "Test produce for admin flow",
    "product_variety": "Test Variety",
    "produce_category": "VEGETABLES",
    "quantity": 100,
    "unit": "KG",
    "price_per_unit": 50.00,
    "location": "12.9716,77.5946",
    "location_name": "Test Farm",
    "images": ["https://example.com/test.jpg"],
    "harvested_at": "2024-02-01T00:00:00Z"
}' "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create produce"
    exit 1
fi

PRODUCE_ID=$(echo "$PRODUCE_RESPONSE" | jq -r '.id')
print_success "Created produce with ID: $PRODUCE_ID"

# Test admin offer creation
print_test_header "Testing Admin Offer Creation"
ADMIN_OFFER_RESPONSE=$(make_request "POST" "/offers/admin/create" "{
    \"buyer_id\": \"$BUYER_ID\",
    \"farmer_id\": \"$FARMER_ID\",
    \"produce_id\": \"$PRODUCE_ID\",
    \"quantity\": 75,
    \"price_per_unit\": 55,
    \"message\": \"Admin created offer for testing\"
}" "$ADMIN_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create admin offer"
    exit 1
fi

ADMIN_OFFER_ID=$(echo "$ADMIN_OFFER_RESPONSE" | jq -r '.id')
print_success "Created admin offer with ID: $ADMIN_OFFER_ID"

# Create test transaction
print_test_header "Creating Test Transaction"
TRANSACTION_RESPONSE=$(make_request "POST" "/transactions" "{
    \"offer_id\": \"$ADMIN_OFFER_ID\",
    \"produce_id\": \"$PRODUCE_ID\",
    \"final_price\": 55,
    \"final_quantity\": 75
}" "$FARMER_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to create transaction"
    exit 1
fi

TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.id')
print_success "Created transaction with ID: $TRANSACTION_ID"

# Test admin system configuration
print_test_header "Testing System Configuration"
CONFIG_RESPONSE=$(make_request "GET" "/admin/system/config" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get system config"
    exit 1
fi
print_success "Retrieved system configuration"

print_test_header "Updating System Configuration"
UPDATE_CONFIG_RESPONSE=$(make_request "POST" "/admin/system/config" '{
    "maintenance_mode": false,
    "max_file_size_mb": 10,
    "default_pagination_limit": 20,
    "cache_ttl_minutes": 15
}' "$ADMIN_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to update system config"
    exit 1
fi
print_success "Updated system configuration"

# Test user management
print_test_header "Testing User Management"
BLOCK_RESPONSE=$(make_request "POST" "/admin/users/$FARMER_ID/block" '{
    "reason": "Test block",
    "duration_days": 1
}' "$ADMIN_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to block user"
    exit 1
fi
print_success "Blocked user successfully"

UNBLOCK_RESPONSE=$(make_request "POST" "/admin/users/$FARMER_ID/unblock" '{
    "reason": "Test unblock"
}' "$ADMIN_TOKEN")

if [ $? -ne 0 ]; then
    print_error "Failed to unblock user"
    exit 1
fi
print_success "Unblocked user successfully"

# Test admin statistics
print_test_header "Testing Admin Statistics"

print_test_header "Getting User Stats"
USER_STATS_RESPONSE=$(make_request "GET" "/admin/stats/users" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get user stats"
    exit 1
fi
print_success "Retrieved user statistics"

print_test_header "Getting Transaction Stats"
TRANSACTION_STATS_RESPONSE=$(make_request "GET" "/admin/stats/transactions" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get transaction stats"
    exit 1
fi
print_success "Retrieved transaction statistics"

print_test_header "Getting Revenue Stats"
REVENUE_STATS_RESPONSE=$(make_request "GET" "/admin/stats/revenue" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get revenue stats"
    exit 1
fi
print_success "Retrieved revenue statistics"

print_test_header "Getting Produce Stats"
PRODUCE_STATS_RESPONSE=$(make_request "GET" "/admin/stats/produce" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get produce stats"
    exit 1
fi
print_success "Retrieved produce statistics"

# Test audit logs
print_test_header "Testing Audit Logs"
AUDIT_LOGS_RESPONSE=$(make_request "GET" "/admin/audit-logs" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get audit logs"
    exit 1
fi
print_success "Retrieved audit logs"

# Test system metrics
print_test_header "Testing System Metrics"
METRICS_RESPONSE=$(make_request "GET" "/admin/metrics" "{}" "$ADMIN_TOKEN")
if [ $? -ne 0 ]; then
    print_error "Failed to get system metrics"
    exit 1
fi
print_success "Retrieved system metrics"

echo -e "\n${GREEN}All admin flow tests completed successfully!${NC}" 