# HTTPS Setup Guide for AgroChain API

This guide explains how to set up HTTPS for the AgroChain API using Let's Encrypt SSL certificates and Nginx as a reverse proxy.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Directory Structure](#directory-structure)
- [Configuration Files](#configuration-files)
- [Setup Instructions](#setup-instructions)
- [SSL Certificate Management](#ssl-certificate-management)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

1. **Domain Requirements**:
   - A registered domain name (e.g., api.agrochain.com)
   - DNS A record pointing to your server's IP address
   - Access to domain DNS management

2. **Server Requirements**:
   - Docker and Docker Compose installed
   - Open ports:
     - Port 80 (HTTP)
     - Port 443 (HTTPS)
   - Minimum 1GB RAM
   - Root or sudo access

3. **SSL Requirements**:
   - Valid email address for Let's Encrypt notifications
   - Server accessible from the internet (for SSL verification)

## Directory Structure

```plaintext
/
├── docker-compose.prod.yml    # Production Docker Compose configuration
├── nginx.conf                 # Nginx configuration
├── setup-ssl.sh              # SSL setup script
├── ssl/                      # SSL-related files
│   └── dhparam.pem          # DH parameters file
└── volumes/                  # Docker volumes
    ├── certbot-etc/         # Let's Encrypt certificates
    ├── certbot-var/         # Let's Encrypt working directory
    └── webroot/             # Webroot for SSL verification
```

## Configuration Files

### 1. Docker Compose Configuration
The `docker-compose.prod.yml` includes:
- Nginx reverse proxy
- Certbot for SSL certificates
- Volume mappings for certificates
- Network configuration

Key configurations:
```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - certbot-etc:/etc/letsencrypt
    - certbot-var:/var/lib/letsencrypt
    - webroot:/var/www/html
  ports:
    - "80:80"
    - "443:443"

certbot:
  image: certbot/certbot
  volumes:
    - certbot-etc:/etc/letsencrypt
    - certbot-var:/var/lib/letsencrypt
    - webroot:/var/www/html
```

### 2. Nginx Configuration
The `nginx.conf` includes:
- HTTP to HTTPS redirect
- SSL configuration
- Security headers
- Proxy settings

Key security features:
```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
```

## Setup Instructions

1. **Initial Setup**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/agrochain.git
   cd agrochain

   # Make the SSL setup script executable
   chmod +x setup-ssl.sh
   ```

2. **Configure Domain**:
   ```bash
   # Edit setup-ssl.sh
   nano setup-ssl.sh

   # Update these variables
   DOMAIN="your-domain.com"
   EMAIL="your-email@domain.com"
   ```

3. **Run SSL Setup**:
   ```bash
   # Run the setup script
   sudo ./setup-ssl.sh
   ```

4. **Start Services**:
   ```bash
   # Start all services
   docker-compose -f docker-compose.prod.yml up -d

   # Verify services are running
   docker-compose -f docker-compose.prod.yml ps
   ```

## SSL Certificate Management

### Automatic Renewal
Certificates auto-renew every 90 days. The setup includes:
- Daily renewal check at 12:00
- Automatic Nginx reload after renewal
- Email notifications for renewal status

### Manual Commands
```bash
# Check certificate status
certbot certificates

# Test renewal process
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# View certificate expiry
echo | openssl s_client -connect api.agrochain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Common Issues and Solutions

1. **Certificate Issuance Failed**:
   ```bash
   # Check Certbot logs
   docker-compose -f docker-compose.prod.yml logs certbot

   # Verify domain pointing
   dig +short your-domain.com
   ```

2. **Nginx Not Starting**:
   ```bash
   # Check Nginx logs
   docker-compose -f docker-compose.prod.yml logs nginx

   # Test Nginx configuration
   docker-compose -f docker-compose.prod.yml exec nginx nginx -t
   ```

3. **SSL Certificate Not Found**:
   ```bash
   # Check certificate path
   ls -la /etc/letsencrypt/live/your-domain.com/

   # Verify permissions
   ls -la /etc/letsencrypt/archive/
   ```

## Security Best Practices

1. **SSL Configuration**:
   - Use only TLS 1.2 and 1.3
   - Enable HSTS
   - Configure strong cipher suites
   - Enable OCSP stapling

2. **Headers and Security**:
   - Set security headers
   - Enable XSS protection
   - Configure Content Security Policy
   - Set proper CORS headers

3. **Access Control**:
   - Restrict admin access
   - Use strong passwords
   - Implement rate limiting
   - Monitor access logs

4. **Maintenance**:
   - Regular security updates
   - Monitor certificate expiry
   - Review access logs
   - Backup certificates

## Monitoring and Maintenance

1. **Regular Checks**:
   ```bash
   # Check SSL configuration
   curl -vI https://api.agrochain.com

   # Test SSL security
   ssllabs-scan api.agrochain.com

   # Monitor certificate expiry
   certbot certificates
   ```

2. **Log Monitoring**:
   ```bash
   # View Nginx access logs
   docker-compose -f docker-compose.prod.yml logs -f nginx

   # View SSL-related logs
   docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log
   ```

For additional support or questions, please contact the DevOps team or create an issue in the repository. 