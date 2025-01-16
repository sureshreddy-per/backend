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

# Configure service resources
configure_resources() {
    log "Configuring service resources..."

    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --memory=1Gi \
        --cpu=1 \
        --timeout=300 \
        --concurrency=80 \
        --port=8080 \
        --execution-environment=gen2 \
        --min-instances=1 \
        --max-instances=10 \
        --platform=managed

    log "Service resources configured"
}

# Configure auto-scaling
configure_autoscaling() {
    log "Configuring auto-scaling rules..."

    # Set CPU utilization target
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --cpu-throttling \
        --cpu-utilization-target=70 \
        --min-instances=1 \
        --max-instances=10 \
        --platform=managed

    # Set request-based scaling
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --request-timeout=300 \
        --container-concurrency=80 \
        --platform=managed

    log "Auto-scaling configured"
}

# Configure health checks
configure_health_checks() {
    log "Configuring health checks..."

    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --use-http2 \
        --healthcheck-path=/api/health \
        --healthcheck-timeout=5s \
        --healthcheck-interval=30s \
        --platform=managed

    log "Health checks configured"
}

# Setup custom domain
setup_custom_domain() {
    log "Setting up custom domain..."

    # Prompt for custom domain if not set
    if [ -z "$CUSTOM_DOMAIN" ]; then
        read -p "Enter your custom domain (e.g., api.farmdeva.com): " CUSTOM_DOMAIN
    fi

    # Verify domain ownership
    gcloud domains verify "$CUSTOM_DOMAIN"

    # Map custom domain
    gcloud beta run domain-mappings create \
        --service="$CLOUD_RUN_SERVICE" \
        --domain="$CUSTOM_DOMAIN" \
        --region="$REGION" \
        --platform=managed

    # Wait for SSL certificate provisioning
    log "Waiting for SSL certificate provisioning (this may take several minutes)..."
    while true; do
        STATUS=$(gcloud beta run domain-mappings describe \
            --domain="$CUSTOM_DOMAIN" \
            --region="$REGION" \
            --platform=managed \
            --format='get(status.conditions[0].status)')
        
        if [ "$STATUS" = "True" ]; then
            break
        fi
        sleep 30
    done

    log "Custom domain and SSL setup completed"
    log "Please configure your DNS records with the following details:"
    gcloud beta run domain-mappings describe \
        --domain="$CUSTOM_DOMAIN" \
        --region="$REGION" \
        --platform=managed \
        --format='get(status.resourceRecords)'
}

# Configure security
configure_security() {
    log "Configuring security settings..."

    # Enable HTTPS-only traffic
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --platform=managed \
        --ingress=internal-and-cloud-load-balancing \
        --session-affinity \
        --use-http2

    # Configure CORS (if needed)
    if [ ! -z "$ALLOWED_ORIGINS" ]; then
        gcloud run services update "$CLOUD_RUN_SERVICE" \
            --region="$REGION" \
            --platform=managed \
            --set-env-vars="ALLOWED_ORIGINS=$ALLOWED_ORIGINS"
    fi

    log "Security settings configured"
}

# Configure monitoring
configure_monitoring() {
    log "Setting up monitoring..."

    # Enable Cloud Monitoring
    gcloud services enable monitoring.googleapis.com

    # Create uptime check
    gcloud monitoring uptime-check-configs create "$CLOUD_RUN_SERVICE-uptime" \
        --display-name="$CLOUD_RUN_SERVICE Uptime Check" \
        --http-check-path="/api/health" \
        --period=300s \
        --timeout=10s \
        --success-threshold=1 \
        --failure-threshold=3 \
        --monitored-resource="cloud_run_revision" \
        --monitored-resource-filter="resource.labels.service_name=$CLOUD_RUN_SERVICE"

    # Create alert policy
    gcloud alpha monitoring policies create \
        --display-name="$CLOUD_RUN_SERVICE Alerts" \
        --notification-channels="$ADMIN_USERS" \
        --condition-filter="resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_latencies\"" \
        --condition-threshold-value=2000 \
        --condition-threshold-duration=300s

    log "Monitoring configured"
}

# Main execution
main() {
    log "Starting Cloud Run configuration..."
    
    configure_resources
    configure_autoscaling
    configure_health_checks
    configure_security
    setup_custom_domain
    configure_monitoring
    
    log "Cloud Run configuration completed successfully!"
    log "Service URL: https://$CUSTOM_DOMAIN"
    log "Default URL: $(gcloud run services describe $CLOUD_RUN_SERVICE --region=$REGION --format='value(status.url)')"
}

# Run main function
main 