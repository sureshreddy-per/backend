#!/bin/bash

# Exit on error
set -e

# Default values
PROJECT_ID=""
REGION=""
INSTANCE_NAME=""
DB_PASSWORD=""
JWT_SECRET=""
BUCKET_NAME=""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%dT%H:%M:%S%z')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%dT%H:%M:%S%z')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%dT%H:%M:%S%z')] WARNING: $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command_exists gcloud; then
        error "gcloud CLI is not installed. Please install it first."
        exit 1
    }

    if ! command_exists docker; then
        error "docker is not installed. Please install it first."
        exit 1
    }
}

# Initialize variables
init_variables() {
    log "Initializing variables..."
    
    # Get project ID if not set
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            error "No project ID set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
            exit 1
        fi
    fi

    # Get or prompt for region
    if [ -z "$REGION" ]; then
        read -p "Enter the region (e.g., us-central1): " REGION
    fi

    # Get or prompt for instance name
    if [ -z "$INSTANCE_NAME" ]; then
        read -p "Enter Cloud SQL instance name: " INSTANCE_NAME
    fi

    # Get or generate secrets
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32)
        log "Generated random database password"
    fi

    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        log "Generated random JWT secret"
    fi

    # Set bucket name if not provided
    if [ -z "$BUCKET_NAME" ]; then
        BUCKET_NAME="${PROJECT_ID}-storage"
    fi
}

# Enable required APIs
enable_apis() {
    log "Enabling required GCP APIs..."
    
    apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "secretmanager.googleapis.com"
        "sql-component.googleapis.com"
        "sqladmin.googleapis.com"
        "storage.googleapis.com"
        "redis.googleapis.com"
    )

    for api in "${apis[@]}"; do
        log "Enabling $api"
        gcloud services enable "$api"
    done
}

# Setup Secret Manager
setup_secrets() {
    log "Setting up Secret Manager secrets..."

    # Create and store secrets
    secrets=(
        "DB_PASSWORD:$DB_PASSWORD"
        "JWT_SECRET:$JWT_SECRET"
    )

    for secret_pair in "${secrets[@]}"; do
        secret_name="${secret_pair%%:*}"
        secret_value="${secret_pair#*:}"
        
        if ! gcloud secrets describe "$secret_name" >/dev/null 2>&1; then
            log "Creating secret: $secret_name"
            gcloud secrets create "$secret_name" --replication-policy="automatic"
        fi
        
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=-
        log "Updated secret: $secret_name"
    done
}

# Setup Cloud Storage
setup_storage() {
    log "Setting up Cloud Storage bucket..."
    
    if ! gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
        gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME"
        log "Created bucket: $BUCKET_NAME"
    else
        warning "Bucket $BUCKET_NAME already exists"
    fi
}

# Update environment file
update_env_file() {
    log "Updating .env.production.gcp file..."
    
    # Create backup
    cp .env.production.gcp .env.production.gcp.backup

    # Update values
    sed -i '' "s|PROJECT_ID:REGION:INSTANCE_NAME|$PROJECT_ID:$REGION:$INSTANCE_NAME|g" .env.production.gcp
    sed -i '' "s|YOUR_PROJECT_ID|$PROJECT_ID|g" .env.production.gcp
    sed -i '' "s|YOUR_BUCKET_NAME|$BUCKET_NAME|g" .env.production.gcp
    sed -i '' "s|YOUR_REGION|$REGION|g" .env.production.gcp

    log "Updated environment configuration"
}

# Main execution
main() {
    log "Starting GCP setup..."
    
    check_prerequisites
    init_variables
    enable_apis
    setup_secrets
    setup_storage
    update_env_file
    
    log "Setup completed successfully!"
    log "Next steps:"
    log "1. Review the updated .env.production.gcp file"
    log "2. Deploy your application using: ./scripts/gcp-deploy.sh"
    log "3. Store these values securely:"
    log "   - Project ID: $PROJECT_ID"
    log "   - Region: $REGION"
    log "   - Instance Name: $INSTANCE_NAME"
    log "   - Bucket Name: $BUCKET_NAME"
}

# Run main function
main 