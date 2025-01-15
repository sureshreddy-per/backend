#!/bin/bash

# Variables
DOMAIN="api.agrochain.com"
EMAIL="admin@agrochain.com"  # Change this to your email
CERTBOT_PATH="/opt/certbot"
SSL_PATH="/etc/nginx/ssl"

# Create required directories
mkdir -p /var/www/certbot
mkdir -p $SSL_PATH

# Generate strong DH parameters (2048 bits)
openssl dhparam -out $SSL_PATH/dhparam.pem 2048

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        echo "Package manager not found. Please install certbot manually."
        exit 1
    fi
fi

# Stop nginx if running
systemctl stop nginx || true

# Request SSL certificate
certbot certonly --standalone \
    --preferred-challenges http \
    --agree-tos \
    --email $EMAIL \
    --domain $DOMAIN \
    --non-interactive

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx <<EOF
#!/bin/bash
nginx -s reload
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx

# Start nginx
systemctl start nginx

echo "SSL setup completed!"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Auto-renewal has been configured to run daily at 12:00"
echo "Next steps:"
echo "1. Verify HTTPS is working: curl -vI https://$DOMAIN"
echo "2. Check certificate expiry: certbot certificates"
echo "3. Test auto-renewal: certbot renew --dry-run" 