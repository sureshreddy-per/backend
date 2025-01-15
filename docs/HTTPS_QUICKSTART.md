# HTTPS Quick Start Guide

This is a simplified guide for quickly setting up HTTPS on your development or staging environment.

## Quick Setup

1. **Prerequisites Check**
   ```bash
   # Check if ports 80 and 443 are available
   sudo lsof -i :80
   sudo lsof -i :443
   
   # Ensure Docker is running
   docker --version
   docker-compose --version
   ```

2. **One-Command Setup**
   ```bash
   # Clone and setup
   git clone https://github.com/yourusername/agrochain.git
   cd agrochain
   
   # Update domain in setup script
   sed -i 's/api.agrochain.com/your-domain.com/' setup-ssl.sh
   
   # Run setup
   chmod +x setup-ssl.sh && sudo ./setup-ssl.sh
   
   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Verify Setup**
   ```bash
   # Check HTTPS
   curl -vI https://your-domain.com
   
   # Check services
   docker-compose -f docker-compose.prod.yml ps
   ```

## Common Commands

### Certificate Management
```bash
# View certificates
certbot certificates

# Force renewal
certbot renew --force-renewal

# Test renewal
certbot renew --dry-run
```

### Docker Services
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Nginx
```bash
# Test configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Troubleshooting

### Certificate Issues
```bash
# Check Certbot logs
docker-compose -f docker-compose.prod.yml logs certbot

# Verify domain
dig +short your-domain.com
```

### Nginx Issues
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs nginx

# Test config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### SSL Issues
```bash
# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiry
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Quick Reference

### Important Paths
- SSL Certificates: `/etc/letsencrypt/live/your-domain.com/`
- Nginx Config: `./nginx.conf`
- Docker Compose: `./docker-compose.prod.yml`

### Environment Variables
```bash
# Required in .env.production
NODE_ENV=production
VIRTUAL_HOST=your-domain.com
LETSENCRYPT_HOST=your-domain.com
LETSENCRYPT_EMAIL=your-email@domain.com
```

### Health Checks
```bash
# API health
curl -k https://your-domain.com/health

# SSL certificate
curl -vI https://your-domain.com
```

For more detailed information, refer to the complete [HTTPS Setup Guide](./HTTPS_SETUP.md). 