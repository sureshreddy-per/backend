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

# Validate required variables
required_vars=(
    "GCP_PROJECT_ID"
    "REGION"
    "CLOUD_RUN_SERVICE"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "$var is not set in .env.production.gcp"
    fi
done

# Build and push Docker image
build_and_push() {
    log "Building Docker image..."
    docker build -t "gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE" .

    log "Pushing image to Container Registry..."
    docker push "gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE"
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    log "Deploying to Cloud Run..."
    
    # Get service account
    SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
        --filter="displayName:$CLOUD_RUN_SERVICE" \
        --format='value(email)')

    if [ -z "$SERVICE_ACCOUNT" ]; then
        log "Creating service account..."
        gcloud iam service-accounts create "$CLOUD_RUN_SERVICE" \
            --display-name="$CLOUD_RUN_SERVICE service account"
        
        SERVICE_ACCOUNT="$CLOUD_RUN_SERVICE@$GCP_PROJECT_ID.iam.gserviceaccount.com"
    fi

    # Grant necessary roles
    log "Granting necessary roles to service account..."
    roles=(
        "roles/secretmanager.secretAccessor"
        "roles/storage.objectViewer"
        "roles/cloudsql.client"
    )

    for role in "${roles[@]}"; do
        gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT" \
            --role="$role"
    done

    # Deploy to Cloud Run
    gcloud run deploy "$CLOUD_RUN_SERVICE" \
        --image="gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE" \
        --platform=managed \
        --region="$REGION" \
        --service-account="$SERVICE_ACCOUNT" \
        --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest" \
        --set-env-vars="GCP_PROJECT_ID=$GCP_PROJECT_ID,REGION=$REGION" \
        --allow-unauthenticated

    # Get the service URL
    SERVICE_URL=$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
        --platform=managed \
        --region="$REGION" \
        --format='value(status.url)')

    log "Service deployed successfully!"
    log "Service URL: $SERVICE_URL"
}

# Main execution
main() {
    log "Starting deployment process..."
    
    # Build and push Docker image
    build_and_push
    
    # Deploy to Cloud Run
    deploy_to_cloud_run
    
    log "Deployment completed successfully!"
}

# Run main function
main 