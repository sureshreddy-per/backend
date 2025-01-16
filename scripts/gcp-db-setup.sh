#!/bin/bash

# Exit on error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%dT%H:%M:%S%z')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%dT%H:%M:%S%z')] ERROR: $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%dT%H:%M:%S%z')] WARNING: $1${NC}"
}

# Load environment variables
if [ ! -f .env.production.gcp ]; then
    error ".env.production.gcp file not found. Please run ./scripts/gcp-setup.sh first"
fi

# Source environment variables
source <(grep -v '^#' .env.production.gcp | sed 's/^/export /')

# Create Cloud SQL instance
create_sql_instance() {
    log "Creating Cloud SQL instance..."
    
    # Check if instance already exists
    if gcloud sql instances describe "$INSTANCE_NAME" --quiet 2>/dev/null; then
        warning "Cloud SQL instance $INSTANCE_NAME already exists"
        return
    fi

    # Create the instance
    gcloud sql instances create "$INSTANCE_NAME" \
        --database-version=POSTGRES_14 \
        --cpu=2 \
        --memory=4GB \
        --region="$REGION" \
        --storage-type=SSD \
        --storage-size=10GB \
        --availability-type=zonal \
        --backup-start-time="23:00" \
        --enable-point-in-time-recovery \
        --database-flags="max_connections=100" \
        --root-password="$DB_PASSWORD"

    log "Cloud SQL instance created successfully"
}

# Configure database
setup_database() {
    log "Setting up database..."

    # Create database
    gcloud sql databases create "$DB_NAME" \
        --instance="$INSTANCE_NAME"

    # Create user
    gcloud sql users create "$DB_USER" \
        --instance="$INSTANCE_NAME" \
        --password="$DB_PASSWORD"

    log "Database setup completed"
}

# Configure networking
setup_networking() {
    log "Configuring networking..."

    # Enable private IP
    gcloud sql instances patch "$INSTANCE_NAME" \
        --network="default" \
        --no-assign-ip

    # Add Cloud Run connector
    gcloud services vpc-peerings connect \
        --service=servicenetworking.googleapis.com \
        --network=default \
        --ranges=cloudsql-postgres-range

    log "Networking setup completed"
}

# Configure backups
setup_backups() {
    log "Configuring backups..."

    # Enable automated backups
    gcloud sql instances patch "$INSTANCE_NAME" \
        --backup-start-time="23:00" \
        --enable-bin-log

    # Set retention period
    gcloud sql instances patch "$INSTANCE_NAME" \
        --backup-retention-period=7

    log "Backup configuration completed"
}

# Configure monitoring
setup_monitoring() {
    log "Setting up monitoring..."

    # Enable monitoring
    gcloud sql instances patch "$INSTANCE_NAME" \
        --enable-database-monitoring

    # Create alerts for high CPU and disk usage
    gcloud beta monitoring channels create \
        --display-name="Cloud SQL Alerts" \
        --type=email \
        --email-address="$ADMIN_USERS"

    log "Monitoring setup completed"
}

# Initialize database schema
init_database() {
    log "Initializing database schema..."

    # Get Cloud SQL proxy
    if ! command -v cloud_sql_proxy &> /dev/null; then
        log "Installing Cloud SQL proxy..."
        wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
        chmod +x cloud_sql_proxy
    fi

    # Start Cloud SQL proxy
    ./cloud_sql_proxy -instances="$GCP_PROJECT_ID:$REGION:$INSTANCE_NAME"=tcp:5432 &
    PROXY_PID=$!

    # Wait for proxy to start
    sleep 5

    # Run database migrations
    log "Running database migrations..."
    if [ -f create_tables.sql ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f create_tables.sql
    else
        warning "create_tables.sql not found. Skipping schema initialization."
    fi

    # Kill proxy
    kill $PROXY_PID

    log "Database initialization completed"
}

# Main execution
main() {
    log "Starting Cloud SQL setup..."
    
    create_sql_instance
    setup_database
    setup_networking
    setup_backups
    setup_monitoring
    init_database
    
    log "Cloud SQL setup completed successfully!"
    log "Connection string: postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME"
    log "Instance connection name: $GCP_PROJECT_ID:$REGION:$INSTANCE_NAME"
}

# Run main function
main 