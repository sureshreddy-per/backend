# Deployment Security Configuration Guide

## 1. Environment Configuration

### Environment Variables
\`\`\`env
# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800
JWT_ALGORITHM=RS256

# Admin Configuration
ADMIN_USERS=admin1@company.com,admin2@company.com
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=900
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true

# OTP Configuration
OTP_SECRET=your_secure_otp_secret
OTP_LENGTH=6
OTP_EXPIRY=300
OTP_ATTEMPTS=3
OTP_COOLDOWN=60

# Redis Configuration
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password
REDIS_TLS=true
REDIS_DB=0

# SMS Gateway Configuration
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region

MESSAGEBIRD_API_KEY=your_messagebird_key

# SSO Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_CALLBACK_URL=https://your-domain.com/auth/microsoft/callback

APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
APPLE_CALLBACK_URL=https://your-domain.com/auth/apple/callback

# Security Configuration
CORS_ORIGINS=https://your-domain.com,https://admin.your-domain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
\`\`\`

### Admin User Management
- Admin users are configured through the `ADMIN_USERS` environment variable
- Specify admin email addresses as a comma-separated list
- Only users with emails in this list will be granted admin privileges
- Changes to admin users require application restart
- Keep this list minimal and regularly audit access
- Use company-controlled email addresses only
- Regularly rotate admin credentials
- Monitor and log all admin actions

### Docker Configuration

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
\`\`\`

### Docker Compose Configuration

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file: .env
    depends_on:
      - redis
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 500M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  app-network:
    driver: bridge

volumes:
  redis-data:
\`\`\`

## 2. Nginx Configuration

\`\`\`nginx
# /etc/nginx/conf.d/app.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.your-domain.com;" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/s;
    limit_req_status 429;

    # Proxy Configuration
    location / {
        limit_req zone=auth_limit burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Configuration
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
\`\`\`

## 3. Security Monitoring Configuration

### PM2 Configuration
\`\`\`javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'auth-service',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/auth-service/error.log',
    out_file: '/var/log/auth-service/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
\`\`\`

### Prometheus Configuration
\`\`\`yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'auth-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']
    basic_auth:
      username: 'prometheus'
      password: 'your_secure_password'
\`\`\`

### Grafana Dashboard Configuration
\`\`\`json
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "panels": [
    {
      "title": "Authentication Requests",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(auth_requests_total[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ]
    },
    {
      "title": "Failed Authentication Attempts",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(auth_failures_total[5m])",
          "legendFormat": "{{reason}}"
        }
      ]
    },
    {
      "title": "Rate Limited Requests",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(rate_limited_requests_total[5m])",
          "legendFormat": "{{endpoint}}"
        }
      ]
    }
  ]
}
\`\`\`

## 4. Backup Configuration

### Redis Backup
\`\`\`bash
#!/bin/bash
# /etc/cron.daily/redis-backup

# Configuration
BACKUP_DIR="/var/backups/redis"
RETENTION_DAYS=7
REDIS_PASSWORD="your_secure_redis_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb"

# Trigger Redis save
redis-cli -a $REDIS_PASSWORD SAVE

# Copy Redis dump
cp /var/lib/redis/dump.rdb $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Upload to secure storage (example with AWS S3)
aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/redis-backups/
\`\`\`

## 5. Security Hardening

### System Configuration
\`\`\`bash
# /etc/sysctl.conf

# Network security
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# IP spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Block SYN attacks
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
\`\`\`

### Fail2Ban Configuration
\`\`\`ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[auth-api]
enabled = true
port = http,https
filter = auth-api
logpath = /var/log/auth-service/error.log
maxretry = 5
bantime = 3600

[nginx-auth]
enabled = true
port = http,https
filter = nginx-auth
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
\`\`\`

\`\`\`ini
# /etc/fail2ban/filter.d/auth-api.conf
[Definition]
failregex = ^.*Failed login attempt from IP: <HOST>.*$
            ^.*Rate limit exceeded from IP: <HOST>.*$
            ^.*Invalid OTP attempt from IP: <HOST>.*$
ignoreregex =
\`\`\`

## 6. Monitoring Alerts

### Alertmanager Configuration
\`\`\`yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/your-webhook-url'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#security-alerts'
    send_resolved: true
    title: '{{ .GroupLabels.alertname }}'
    text: "{{ range .Alerts }}*Alert:* {{ .Annotations.description }}\n*Severity:* {{ .Labels.severity }}\n{{ end }}"

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
\`\`\`

### Alert Rules
\`\`\`yaml
# prometheus/rules/auth.rules.yml
groups:
- name: auth_alerts
  rules:
  - alert: HighFailedLogins
    expr: rate(auth_failures_total[5m]) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      description: High rate of failed login attempts

  - alert: RateLimitExceeded
    expr: rate(rate_limited_requests_total[5m]) > 50
    for: 5m
    labels:
      severity: warning
    annotations:
      description: High rate of rate-limited requests

  - alert: UnusualLoginPatterns
    expr: rate(auth_requests_total{status="success"}[5m]) > historical_avg * 2
    for: 15m
    labels:
      severity: warning
    annotations:
      description: Unusual spike in successful logins

  - alert: ServiceUnavailable
    expr: up{job="auth-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      description: Authentication service is down
\`\`\`

## 7. Disaster Recovery Procedures

### 1. Backup Strategy

#### Database Backups
\`\`\`bash
#!/bin/bash
# /etc/cron.daily/database-backup

# Configuration
DB_BACKUP_DIR="/var/backups/database"
DB_RETENTION_DAYS=30
ENCRYPTION_KEY_PATH="/etc/backup/encryption.key"

# Create backup directories
mkdir -p $DB_BACKUP_DIR

# Backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$DB_BACKUP_DIR/db-$TIMESTAMP.sql"

# Perform database backup with encryption
pg_dump -U postgres your_database | \
  gpg --encrypt --recipient backup@your-domain.com > "$BACKUP_FILE.gpg"

# Upload to secure storage with versioning
aws s3 cp "$BACKUP_FILE.gpg" \
  s3://your-bucket/database-backups/ \
  --storage-class STANDARD_IA \
  --server-side-encryption aws:kms \
  --sse-kms-key-id your-kms-key-id

# Cleanup old backups locally
find $DB_BACKUP_DIR -type f -mtime +$DB_RETENTION_DAYS -delete
\`\`\`

#### Configuration Backups
\`\`\`bash
#!/bin/bash
# /etc/cron.weekly/config-backup

# Configuration
CONFIG_BACKUP_DIR="/var/backups/config"
CONFIG_RETENTION_DAYS=90
IMPORTANT_CONFIGS=(
  "/etc/nginx/conf.d/"
  "/etc/letsencrypt/"
  "/etc/fail2ban/"
  "/etc/prometheus/"
  "/etc/alertmanager/"
  "/etc/environment"
  "/etc/sysctl.conf"
)

# Create backup directory
mkdir -p $CONFIG_BACKUP_DIR

# Backup filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$CONFIG_BACKUP_DIR/config-$TIMESTAMP.tar.gz"

# Create encrypted backup
tar czf - "${IMPORTANT_CONFIGS[@]}" | \
  gpg --encrypt --recipient backup@your-domain.com > "$BACKUP_FILE.gpg"

# Upload to secure storage
aws s3 cp "$BACKUP_FILE.gpg" \
  s3://your-bucket/config-backups/ \
  --storage-class GLACIER \
  --server-side-encryption aws:kms \
  --sse-kms-key-id your-kms-key-id

# Cleanup old backups
find $CONFIG_BACKUP_DIR -type f -mtime +$CONFIG_RETENTION_DAYS -delete
\`\`\`

### 2. Recovery Procedures

#### Service Recovery Playbook
\`\`\`yaml
# recovery-playbook.yml
name: Service Recovery
description: Steps to recover services after failure

steps:
  1. Initial Assessment:
    - Check monitoring dashboards for error patterns
    - Review logs for error messages
    - Identify affected components
    - Document incident start time and symptoms

  2. Communication:
    - Notify incident response team
    - Update status page
    - Notify affected customers if downtime > 5 minutes
    - Start incident management document

  3. Immediate Actions:
    - Check system resources (CPU, memory, disk)
    - Verify network connectivity
    - Check SSL certificate validity
    - Verify DNS resolution
    - Test database connectivity
    - Check Redis connection
    - Validate external service dependencies

  4. Recovery Steps:
    a. Application Recovery:
      - Verify application logs
      - Check for memory leaks
      - Restart application services:
        \`\`\`bash
        pm2 reload auth-service
        \`\`\`
      - Verify health endpoints
      - Check error rates

    b. Database Recovery:
      - Check database connections
      - Verify replication status
      - If corrupted, restore from backup:
        \`\`\`bash
        # Download and decrypt latest backup
        aws s3 cp s3://your-bucket/database-backups/latest.sql.gpg .
        gpg --decrypt latest.sql.gpg > latest.sql
        
        # Restore database
        psql -U postgres your_database < latest.sql
        
        # Verify data integrity
        psql -U postgres your_database -c "SELECT COUNT(*) FROM users;"
        \`\`\`

    c. Redis Recovery:
      - Check Redis cluster health
      - If data loss, restore from backup:
        \`\`\`bash
        # Stop Redis
        systemctl stop redis
        
        # Download and restore backup
        aws s3 cp s3://your-bucket/redis-backups/latest.rdb.gz .
        gunzip latest.rdb.gz
        mv latest.rdb /var/lib/redis/dump.rdb
        
        # Start Redis
        systemctl start redis
        \`\`\`

    d. Configuration Recovery:
      - Download and decrypt config backup:
        \`\`\`bash
        aws s3 cp s3://your-bucket/config-backups/latest.tar.gz.gpg .
        gpg --decrypt latest.tar.gz.gpg > latest.tar.gz
        
        # Restore configs
        tar xzf latest.tar.gz -C /
        
        # Reload services
        systemctl reload nginx
        systemctl restart fail2ban
        \`\`\`

  5. Verification:
    - Run health checks
    - Verify authentication flows
    - Test SSO providers
    - Check OTP functionality
    - Verify WebSocket connections
    - Monitor error rates
    - Check security measures

  6. Post-Recovery:
    - Update incident document
    - Notify stakeholders
    - Update status page
    - Schedule post-mortem
    - Document lessons learned
    - Update recovery procedures

### 3. High Availability Configuration

#### Load Balancer Configuration
\`\`\`nginx
# /etc/nginx/conf.d/upstream.conf
upstream auth_backend {
    least_conn;  # Load balancing method
    server 10.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:3000 backup;  # Backup server
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    location / {
        proxy_pass http://auth_backend;
        proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
\`\`\`

#### Database Replication
\`\`\`bash
# Primary PostgreSQL configuration
# /etc/postgresql/13/main/postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64

# /etc/postgresql/13/main/pg_hba.conf
host replication replicator 10.0.0.0/24 md5

# Setup replication
pg_basebackup -h primary -D /var/lib/postgresql/13/main -U replicator -P -v

# Standby configuration
# /etc/postgresql/13/main/postgresql.conf
primary_conninfo = 'host=primary port=5432 user=replicator password=secret'
restore_command = 'cp /var/lib/postgresql/13/archive/%f %p'
\`\`\`

### 4. Failover Procedures

#### Automated Failover Script
\`\`\`bash
#!/bin/bash
# /usr/local/bin/failover.sh

# Configuration
PRIMARY_HOST="10.0.0.1"
SECONDARY_HOST="10.0.0.2"
VIRTUAL_IP="10.0.0.100"

# Check primary health
check_primary() {
    ssh $PRIMARY_HOST "pg_isready" >/dev/null 2>&1
    return $?
}

# Perform failover
do_failover() {
    # Stop primary if accessible
    ssh $PRIMARY_HOST "systemctl stop postgresql" || true
    
    # Promote secondary
    ssh $SECONDARY_HOST "pg_ctl promote"
    
    # Update virtual IP
    ssh $SECONDARY_HOST "ip addr add $VIRTUAL_IP/24 dev eth0"
    
    # Update DNS if using Route53
    aws route53 change-resource-record-sets \
        --hosted-zone-id YOUR_ZONE_ID \
        --change-batch '{
            "Changes": [{
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "db.your-domain.com",
                    "Type": "A",
                    "TTL": 60,
                    "ResourceRecords": [{"Value":"'$SECONDARY_HOST'"}]
                }
            }]
        }'
    
    # Notify team
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"ALERT: Database failover performed. New primary: '$SECONDARY_HOST'"}' \
        $SLACK_WEBHOOK_URL
}

# Main logic
if ! check_primary; then
    echo "Primary database unreachable, initiating failover..."
    do_failover
fi
\`\`\`

### 5. Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

#### Service Level Objectives
\`\`\`yaml
RTO:
  auth_service: 5 minutes
  database: 15 minutes
  redis: 5 minutes
  full_system: 30 minutes

RPO:
  database: 5 minutes (continuous archiving)
  redis: 1 minute (AOF enabled)
  configurations: 1 day
\`\`\`

### 6. Regular Testing Schedule

#### Recovery Testing Plan
\`\`\`yaml
schedule:
  database_recovery:
    frequency: Monthly
    duration: 4 hours
    components:
      - Backup restoration
      - Replication verification
      - Failover testing
    
  application_recovery:
    frequency: Quarterly
    duration: 8 hours
    components:
      - Full system restore
      - Configuration recovery
      - Load testing post-recovery
    
  disaster_simulation:
    frequency: Bi-annual
    duration: 1 day
    components:
      - Complete infrastructure failure
      - Multi-region failover
      - Data center loss simulation
\`\`\` 