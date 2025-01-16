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
    error ".env.production.gcp file not found"
fi

source .env.production.gcp

# Setup payment integration
setup_payment() {
    log "Setting up payment integration..."
    
    # Prompt for Stripe keys
    read -p "Enter Stripe Public Key: " STRIPE_PUBLIC_KEY
    read -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
    
    # Store in Secret Manager
    echo -n "$STRIPE_SECRET_KEY" | gcloud secrets create stripe-secret-key \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --set-env-vars="STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY" \
        --update-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest"
}

# Setup email service
setup_email() {
    log "Setting up email service..."
    
    # Prompt for SendGrid key
    read -p "Enter SendGrid API Key: " SENDGRID_API_KEY
    
    # Store in Secret Manager
    echo -n "$SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --update-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
}

# Setup SMS gateway
setup_sms() {
    log "Setting up SMS gateway..."
    
    # Prompt for Twilio credentials
    read -p "Enter Twilio Account SID: " TWILIO_ACCOUNT_SID
    read -p "Enter Twilio Auth Token: " TWILIO_AUTH_TOKEN
    read -p "Enter Twilio Phone Number: " TWILIO_PHONE_NUMBER
    
    # Store in Secret Manager
    echo -n "$TWILIO_AUTH_TOKEN" | gcloud secrets create twilio-auth-token \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --set-env-vars="TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID,TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER" \
        --update-secrets="TWILIO_AUTH_TOKEN=twilio-auth-token:latest"
}

# Setup Google Maps
setup_maps() {
    log "Setting up Google Maps..."
    
    # Enable required APIs
    apis=(
        "maps-backend.googleapis.com"
        "geocoding-backend.googleapis.com"
        "places-backend.googleapis.com"
        "distance-matrix-backend.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        gcloud services enable "$api"
    done
    
    # Create API key with restrictions
    MAPS_API_KEY=$(gcloud alpha services api-keys create \
        --display-name="Maps API Key" \
        --api-target=service=maps-backend.googleapis.com \
        --format="get(keyString)")
    
    # Store API key
    echo -n "$MAPS_API_KEY" | gcloud secrets create maps-api-key \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --update-secrets="GOOGLE_MAPS_API_KEY=maps-api-key:latest"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Prompt for Sentry DSN
    read -p "Enter Sentry DSN: " SENTRY_DSN
    
    # Store in Secret Manager
    echo -n "$SENTRY_DSN" | gcloud secrets create sentry-dsn \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --update-secrets="SENTRY_DSN=sentry-dsn:latest"
}

# Setup weather API
setup_weather() {
    log "Setting up weather API..."
    
    # Prompt for OpenWeatherMap API key
    read -p "Enter OpenWeatherMap API Key: " WEATHER_API_KEY
    
    # Store in Secret Manager
    echo -n "$WEATHER_API_KEY" | gcloud secrets create weather-api-key \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --update-secrets="WEATHER_API_KEY=weather-api-key:latest"
}

# Setup OpenAI
setup_openai() {
    log "Setting up OpenAI integration..."
    
    # Prompt for OpenAI key
    read -p "Enter OpenAI API Key: " OPENAI_API_KEY
    
    # Store in Secret Manager
    echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key \
        --replication-policy="automatic" \
        --data-file=-
    
    # Update environment variables
    gcloud run services update "$CLOUD_RUN_SERVICE" \
        --region="$REGION" \
        --update-secrets="OPENAI_API_KEY=openai-api-key:latest" \
        --set-env-vars="OPENAI_MODEL=gpt-4,OPENAI_TEMPERATURE=0.7,OPENAI_MAX_TOKENS=2000,ENABLE_AI_FEATURES=true"
    
    log "OpenAI configuration completed"
}

# Main execution
main() {
    log "Starting third-party integrations setup..."
    
    # Prompt for which integrations to set up
    PS3="Select integration to set up (0 to exit): "
    options=("SMS (Twilio)" "Google Maps" "Monitoring (Sentry)" "Weather API" "OpenAI" "All" "Exit")
    select opt in "${options[@]}"
    do
        case $opt in
            "SMS (Twilio)")
                setup_sms
                ;;
            "Google Maps")
                setup_maps
                ;;
            "Monitoring (Sentry)")
                setup_monitoring
                ;;
            "Weather API")
                setup_weather
                ;;
            "OpenAI")
                setup_openai
                ;;
            "All")
                setup_sms
                setup_maps
                setup_monitoring
                setup_weather
                setup_openai
                break
                ;;
            "Exit")
                break
                ;;
            *) 
                echo "Invalid option"
                ;;
        esac
    done
    
    log "Integration setup completed!"
    log "Next steps:"
    log "1. Verify all integrations are working"
    log "2. Update application code with new environment variables"
    log "3. Test each integration endpoint"
    log "4. Set up monitoring alerts"
}

# Run main function
main 