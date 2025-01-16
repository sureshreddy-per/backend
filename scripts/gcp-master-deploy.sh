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

# Function to check script existence
check_script() {
    local script=$1
    if [ ! -f "$script" ]; then
        error "Required script not found: $script"
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check for required commands
    local required_commands=("gcloud" "docker" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            error "$cmd is required but not installed. Please install it first."
        fi
    done

    # Check for required scripts
    local required_scripts=(
        "scripts/gcp-setup.sh"
        "scripts/gcp-db-setup.sh"
        "scripts/gcp-cloudrun-setup.sh"
        "scripts/gcp-loadbalancer-setup.sh"
        "scripts/setup-integrations.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        check_script "$script"
    done

    # Check gcloud auth
    if ! gcloud auth list --filter=status:ACTIVE --format="get(account)" 2>/dev/null | grep -q "@"; then
        error "Not logged into gcloud. Please run 'gcloud auth login' first."
    }

    log "Prerequisites check completed"
}

# Function to generate secure secrets
generate_secrets() {
    log "Generating secure secrets..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
        --replication-policy="automatic" \
        --data-file=-
    
    # Generate database password
    DB_PASSWORD=$(openssl rand -base64 32)
    echo -n "$DB_PASSWORD" | gcloud secrets create db-password \
        --replication-policy="automatic" \
        --data-file=-
    
    export JWT_SECRET DB_PASSWORD
    log "Secrets generated and stored in Secret Manager"
}

# Function to prompt for deployment options
prompt_options() {
    log "Configuring deployment options..."
    
    # Project ID
    if [ -z "$GCP_PROJECT_ID" ]; then
        read -p "Enter GCP Project ID: " GCP_PROJECT_ID
    fi

    # Region
    if [ -z "$REGION" ]; then
        read -p "Enter region (e.g., us-central1): " REGION
    fi

    # Environment
    if [ -z "$ENVIRONMENT" ]; then
        read -p "Enter environment (production/staging): " ENVIRONMENT
    fi

    # Domain
    if [ -z "$CUSTOM_DOMAIN" ]; then
        read -p "Enter custom domain (e.g., api.farmdeva.com): " CUSTOM_DOMAIN
    fi

    # Export variables
    export GCP_PROJECT_ID REGION ENVIRONMENT CUSTOM_DOMAIN
}

# Function to initialize GCP project
init_project() {
    log "Initializing GCP project..."
    
    # Set project
    gcloud config set project "$GCP_PROJECT_ID"
    
    # Enable required APIs
    apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "secretmanager.googleapis.com"
        "sql-component.googleapis.com"
        "sqladmin.googleapis.com"
        "storage.googleapis.com"
        "redis.googleapis.com"
        "maps-backend.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
    )

    for api in "${apis[@]}"; do
        gcloud services enable "$api"
    done
    
    # Enable billing if not enabled
    if ! gcloud beta billing projects describe "$GCP_PROJECT_ID" >/dev/null 2>&1; then
        warning "Billing not enabled for project. Please enable billing in the GCP Console."
        exit 1
    fi
}

# Function to run a deployment step
run_step() {
    local step_name=$1
    local script_path=$2
    local error_msg=$3

    log "Starting $step_name..."
    if ! bash "$script_path"; then
        error "$error_msg"
    fi
    log "$step_name completed successfully"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."

    # Check Cloud Run service
    if ! gcloud run services describe "$CLOUD_RUN_SERVICE" --region="$REGION" --platform=managed >/dev/null 2>&1; then
        warning "Cloud Run service verification failed"
        return 1
    fi

    # Check Load Balancer
    if ! gcloud compute forwarding-rules describe "$CLOUD_RUN_SERVICE-forwarding-rule" --global >/dev/null 2>&1; then
        warning "Load Balancer verification failed"
        return 1
    }

    # Check database
    if ! gcloud sql instances describe "$INSTANCE_NAME" >/dev/null 2>&1; then
        warning "Database verification failed"
        return 1
    }

    # Verify secrets
    local required_secrets=("jwt-secret" "db-password" "openai-api-key")
    for secret in "${required_secrets[@]}"; do
        if ! gcloud secrets versions list "$secret" --filter="state=ENABLED" --limit=1 >/dev/null 2>&1; then
            warning "Secret $secret verification failed"
            return 1
        fi
    done

    log "Deployment verification completed successfully"
    return 0
}

# Main deployment function
deploy() {
    log "Starting deployment process..."

    # Generate secrets
    generate_secrets

    # Initialize environment
    run_step "Initial Setup" "scripts/gcp-setup.sh" "Initial setup failed"
    
    # Set up database
    run_step "Database Setup" "scripts/gcp-db-setup.sh" "Database setup failed"
    
    # Set up integrations
    run_step "Integrations Setup" "scripts/setup-integrations.sh" "Integrations setup failed"
    
    # Deploy to Cloud Run
    run_step "Cloud Run Setup" "scripts/gcp-cloudrun-setup.sh" "Cloud Run setup failed"
    
    # Configure Load Balancer
    run_step "Load Balancer Setup" "scripts/gcp-loadbalancer-setup.sh" "Load Balancer setup failed"
    
    # Verify deployment
    if ! verify_deployment; then
        error "Deployment verification failed"
    fi
}

# Cleanup function for failed deployment
cleanup() {
    if [ $? -ne 0 ]; then
        warning "Deployment failed. Starting cleanup..."
        # Add cleanup logic here if needed
    fi
}

# Register cleanup function
trap cleanup EXIT

# Main execution
main() {
    log "Starting master deployment script..."
    
    check_prerequisites
    prompt_options
    init_project
    deploy
    
    log "Deployment completed successfully!"
    log "Service URLs:"
    log "Load Balancer: https://$CUSTOM_DOMAIN"
    log "Cloud Run direct: $(gcloud run services describe $CLOUD_RUN_SERVICE --region=$REGION --format='value(status.url)')"
    
    log "Next steps:"
    log "1. Configure your DNS records for $CUSTOM_DOMAIN"
    log "2. Set up Twilio webhooks for SMS notifications"
    log "3. Configure Sentry for error tracking"
    log "4. Set up monitoring alerts"
    log "5. Test all API endpoints"
    log "6. Monitor the logs for any issues"
}

# Run main function
main 