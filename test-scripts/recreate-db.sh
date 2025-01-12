#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="agritech"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Print functions
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Stop the backend server
print_header "Stopping backend server"
pkill -f "node.*dist/main"
sleep 2

# Drop and recreate database
print_header "Recreating database"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -c "DROP DATABASE IF EXISTS $DB_NAME;"
if [ $? -eq 0 ]; then
    print_success "Successfully dropped database"
else
    print_error "Failed to drop database"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;"
if [ $? -eq 0 ]; then
    print_success "Successfully created database"
else
    print_error "Failed to create database"
    exit 1
fi

# Apply schema
print_header "Applying schema"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -d $DB_NAME -f create_tables.sql
if [ $? -eq 0 ]; then
    print_success "Successfully applied schema"
else
    print_error "Failed to apply schema"
    exit 1
fi

# Start the backend server
print_header "Starting backend server"
npm run start:dev &
sleep 5

print_success "Database recreated successfully!" 