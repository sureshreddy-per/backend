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

# Enable required APIs
enable_apis() {
    log "Enabling required APIs..."
    
    apis=(
        "compute.googleapis.com"
        "certificatemanager.googleapis.com"
    )

    for api in "${apis[@]}"; do
        gcloud services enable "$api"
    done
}

# Create SSL certificate
create_ssl_certificate() {
    log "Creating SSL certificate..."

    if [ -z "$CUSTOM_DOMAIN" ]; then
        read -p "Enter your custom domain (e.g., api.farmdeva.com): " CUSTOM_DOMAIN
    fi

    # Create managed SSL certificate
    gcloud compute ssl-certificates create "$CLOUD_RUN_SERVICE-cert" \
        --domains="$CUSTOM_DOMAIN" \
        --global

    log "SSL certificate created"
}

# Create external IP address
create_external_ip() {
    log "Creating external IP address..."

    # Create static IP address
    gcloud compute addresses create "$CLOUD_RUN_SERVICE-ip" \
        --network-tier=PREMIUM \
        --global

    # Get the IP address
    EXTERNAL_IP=$(gcloud compute addresses describe "$CLOUD_RUN_SERVICE-ip" \
        --global \
        --format="get(address)")

    log "External IP created: $EXTERNAL_IP"
    log "Please update your DNS A record for $CUSTOM_DOMAIN to point to $EXTERNAL_IP"
}

# Create health check
create_health_check() {
    log "Creating health check..."

    gcloud compute health-checks create http "$CLOUD_RUN_SERVICE-health" \
        --port=80 \
        --request-path=/api/health \
        --check-interval=30s \
        --timeout=5s \
        --unhealthy-threshold=3 \
        --healthy-threshold=1

    log "Health check created"
}

# Create backend service
create_backend_service() {
    log "Creating backend service..."

    # Get the Cloud Run service URL
    SERVICE_URL=$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --format="get(status.url)" \
        --platform=managed)

    # Create serverless NEG
    gcloud compute network-endpoint-groups create "$CLOUD_RUN_SERVICE-neg" \
        --region="$REGION" \
        --network-endpoint-type=serverless \
        --cloud-run-service="$CLOUD_RUN_SERVICE"

    # Create backend service
    gcloud compute backend-services create "$CLOUD_RUN_SERVICE-backend" \
        --global \
        --load-balancing-scheme=EXTERNAL_MANAGED \
        --protocol=HTTPS \
        --health-checks="$CLOUD_RUN_SERVICE-health" \
        --enable-cdn \
        --connection-draining-timeout=300s

    # Add backend
    gcloud compute backend-services add-backend "$CLOUD_RUN_SERVICE-backend" \
        --global \
        --network-endpoint-group="$CLOUD_RUN_SERVICE-neg" \
        --network-endpoint-group-region="$REGION"

    log "Backend service created"
}

# Configure CDN
configure_cdn() {
    log "Configuring CDN..."

    # Update backend service with CDN policy
    gcloud compute backend-services update "$CLOUD_RUN_SERVICE-backend" \
        --global \
        --enable-cdn \
        --cdn-policy=cache-mode=CACHE_ALL_STATIC,client-ttl=3600,default-ttl=3600,max-ttl=86400,serve-while-stale=86400

    log "CDN configured"
}

# Create URL map
create_url_map() {
    log "Creating URL map..."

    gcloud compute url-maps create "$CLOUD_RUN_SERVICE-urlmap" \
        --default-service="$CLOUD_RUN_SERVICE-backend"

    log "URL map created"
}

# Create target proxy
create_target_proxy() {
    log "Creating target proxy..."

    gcloud compute target-https-proxies create "$CLOUD_RUN_SERVICE-proxy" \
        --url-map="$CLOUD_RUN_SERVICE-urlmap" \
        --ssl-certificates="$CLOUD_RUN_SERVICE-cert"

    log "Target proxy created"
}

# Create forwarding rule
create_forwarding_rule() {
    log "Creating forwarding rule..."

    gcloud compute forwarding-rules create "$CLOUD_RUN_SERVICE-forwarding-rule" \
        --load-balancing-scheme=EXTERNAL_MANAGED \
        --network-tier=PREMIUM \
        --address="$CLOUD_RUN_SERVICE-ip" \
        --target-https-proxy="$CLOUD_RUN_SERVICE-proxy" \
        --global \
        --ports=443

    log "Forwarding rule created"
}

# Configure security policies
configure_security_policies() {
    log "Configuring security policies..."

    # Create Cloud Armor security policy
    gcloud compute security-policies create "$CLOUD_RUN_SERVICE-policy" \
        --description="Security policy for $CLOUD_RUN_SERVICE"

    # Add rules to security policy
    gcloud compute security-policies rules create 1000 \
        --security-policy="$CLOUD_RUN_SERVICE-policy" \
        --description="Block known bad IPs" \
        --src-ip-ranges="*" \
        --action="allow" \
        --preview

    # Add WAF rules
    gcloud compute security-policies rules create 2000 \
        --security-policy="$CLOUD_RUN_SERVICE-policy" \
        --description="Enable XSS protection" \
        --expression="evaluatePreconfiguredWaf('xss', ['owasp-crs-v030001-id941110-xss'])" \
        --action="deny(403)" \
        --preview

    # Apply security policy to backend service
    gcloud compute backend-services update "$CLOUD_RUN_SERVICE-backend" \
        --global \
        --security-policy="$CLOUD_RUN_SERVICE-policy"

    log "Security policies configured"
}

# Main execution
main() {
    log "Starting Load Balancer setup..."
    
    enable_apis
    create_ssl_certificate
    create_external_ip
    create_health_check
    create_backend_service
    configure_cdn
    create_url_map
    create_target_proxy
    create_forwarding_rule
    configure_security_policies
    
    log "Load Balancer setup completed successfully!"
    log "Please configure your DNS records:"
    log "1. Add an A record for $CUSTOM_DOMAIN pointing to $EXTERNAL_IP"
    log "2. Wait for DNS propagation (may take up to 24 hours)"
    log "3. SSL certificate provisioning will begin after DNS verification"
    log "Load Balancer URL: https://$CUSTOM_DOMAIN"
}

# Run main function
main 