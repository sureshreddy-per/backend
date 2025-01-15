#!/bin/bash

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo"
  exit 1
fi

# Default domain from environment or argument
DOMAIN=${1:-$(grep ALLOWED_ORIGINS .env.production | cut -d'=' -f2 | cut -d',' -f1 | sed 's/https:\/\///')}

if [ -z "$DOMAIN" ]; then
    echo "Domain not provided and couldn't be found in .env.production"
    echo "Usage: sudo ./setup-ssl.sh yourdomain.com"
    exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install certbot
    elif command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        yum install -y certbot
    else
        echo "Unsupported package manager. Please install certbot manually."
        exit 1
    fi
fi

# Create directory for certificates if it doesn't exist
mkdir -p /etc/letsencrypt

# Obtain SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
certbot certonly --standalone \
    --preferred-challenges http \
    --agree-tos \
    --non-interactive \
    --staple-ocsp \
    -d "$DOMAIN" \
    --email "$(grep ADMIN_USERS .env.production | cut -d'=' -f2 | cut -d',' -f1)" \
    --rsa-key-size 4096

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo "SSL certificate obtained successfully!"

    # Create symbolic links to the certificates in the project
    CERT_DIR="ssl"
    mkdir -p "$CERT_DIR"

    ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/fullchain.pem"
    ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/privkey.pem"
    ln -sf "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$CERT_DIR/chain.pem"

    # Set proper permissions
    chmod 755 "$CERT_DIR"
    chmod 644 "$CERT_DIR"/*.pem

    # Add renewal hook
    RENEWAL_HOOK="/etc/letsencrypt/renewal-hooks/deploy/copy-certs.sh"
    mkdir -p "$(dirname "$RENEWAL_HOOK")"

    cat > "$RENEWAL_HOOK" << EOF
#!/bin/bash
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$(pwd)/$CERT_DIR/fullchain.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$(pwd)/$CERT_DIR/privkey.pem"
cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$(pwd)/$CERT_DIR/chain.pem"
chmod 644 "$(pwd)/$CERT_DIR"/*.pem
EOF

    chmod +x "$RENEWAL_HOOK"

    # Add to crontab for automatic renewal check (twice daily as recommended by Let's Encrypt)
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -

    echo "SSL certificates have been set up and linked to $CERT_DIR/"
    echo "Automatic renewal has been configured"
else
    echo "Failed to obtain SSL certificate"
    exit 1
fi