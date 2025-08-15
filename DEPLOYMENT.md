# AI Tutor Platform - Ubuntu 22.04 Server Setup

This guide will help you set up the AI Tutor platform on an Ubuntu 22.04 server with automated deployment via GitHub Actions.

## Prerequisites

- Ubuntu 22.04 server with SSH access
- Domain name pointed to your server
- GitHub repository with the code

## Server Setup

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib nodejs npm

# Install PM2 globally
npm install -g pm2

# Configure PostgreSQL
sudo -u postgres createdb ai-tutor
sudo -u postgres psql -c "CREATE USER ai_tutor_user WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai-tutor TO ai_tutor_user;"

# Create application directory
sudo mkdir -p /var/www/ai-tutor
sudo chown -R $USER:$USER /var/www/ai-tutor

# Create logs directory
mkdir -p /var/www/ai-tutor/logs
```

### 2. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ai-tutor
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Static files
    location /_next/static/ {
        alias /var/www/ai-tutor/current/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ai-tutor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 4. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Or manually configure iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### 5. Environment Setup

Create environment file:
```bash
nano /var/www/ai-tutor/.env
```

```env
# Database
DATABASE_URL="postgresql://ai_tutor_user:your_strong_password@localhost:5432/ai-tutor"

# Application
NODE_ENV="production"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# AI Service (if needed)
ZAI_API_KEY="your-zai-api-key"

# Server Configuration
PORT=3000
HOSTNAME="0.0.0.0"
```

## GitHub Actions Setup

### 1. Repository Secrets

Add the following secrets to your GitHub repository:

- `SERVER_HOST`: Your server IP address
- `SERVER_USER`: SSH username (e.g., ubuntu)
- `SERVER_SSH_KEY`: Your private SSH key
- `SERVER_PORT`: SSH port (default 22)

### 2. SSH Key Setup

Generate SSH key on your local machine:
```bash
ssh-keygen -t rsa -b 4096 -f ai-tutor-deploy
```

Add the public key to your server:
```bash
cat ai-tutor-deploy.pub | ssh user@your-server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Add the private key to GitHub repository secrets.

### 3. Initial Deployment

Clone the repository on the server:
```bash
cd /var/www/ai-tutor
git clone https://github.com/shihan84/AI-Tutor.git current
cd current
npm install
npm run build
pm2 start ecosystem.config.js
```

## Monitoring and Maintenance

### 1. Log Rotation

Create logrotate configuration:
```bash
sudo nano /etc/logrotate.d/ai-tutor
```

```
/var/www/ai-tutor/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reload ai-tutor
    endscript
}
```

### 2. Monitoring Scripts

Create health check script:
```bash
nano /var/www/ai-tutor/health-check.sh
```

```bash
#!/bin/bash

# Health check for AI Tutor application
APP_URL="http://localhost:3000/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "$APP_URL" > /dev/null; then
        echo "✅ Application is healthy"
        exit 0
    else
        echo "⚠️  Health check failed (attempt $i/$MAX_RETRIES)"
        if [ $i -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    fi
done

echo "❌ Application is unhealthy, restarting..."
pm2 restart ai-tutor
```

Make it executable:
```bash
chmod +x /var/www/ai-tutor/health-check.sh
```

### 3. Backup Script

Create backup script:
```bash
nano /var/www/ai-tutor/backup.sh
```

```bash
#!/bin/bash

# Backup script for AI Tutor
BACKUP_DIR="/var/backups/ai-tutor"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/ai-tutor/current"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
pg_dump -h localhost -U ai_tutor_user ai-tutor > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup application files
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $DATE"
```

Make it executable:
```bash
chmod +x /var/www/ai-tutor/backup.sh
```

### 4. Cron Jobs

Set up automated tasks:
```bash
crontab -e
```

Add these lines:
```cron
# Health check every 5 minutes
*/5 * * * * /var/www/ai-tutor/health-check.sh

# Daily backup at 2 AM
0 2 * * * /var/www/ai-tutor/backup.sh

# Weekly system updates (Sunday at 3 AM)
0 3 * * 0 apt update && apt upgrade -y && apt autoremove -y
```

## Security Considerations

### 1. System Hardening

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change SSH port
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Disable password authentication (use SSH keys only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd
```

### 2. Application Security

- Use environment variables for sensitive data
- Implement rate limiting
- Use HTTPS with valid SSL certificates
- Regular security updates
- Monitor logs for suspicious activity

### 3. Database Security

```sql
-- Create read-only user for reporting
CREATE USER ai_tutor_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE ai-tutor TO ai_tutor_readonly;
GRANT USAGE ON SCHEMA public TO ai_tutor_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_tutor_readonly;

-- Create backup user
CREATE USER ai_tutor_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE ai-tutor TO ai_tutor_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_tutor_backup;
```

## Performance Optimization

### 1. System Optimization

```bash
# Create swap file if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize sysctl settings
echo 'net.core.rmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_rmem = 4096 87380 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_wmem = 4096 65536 16777216' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. Nginx Optimization

Add to your Nginx configuration:
```nginx
# Worker processes and connections
worker_processes auto;
worker_rlimit_nofile 65535;

# Events
events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

# HTTP optimizations
http {
    # Brotli compression
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 3. Node.js Optimization

Update ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'ai-tutor',
    script: 'server.ts',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    // ... rest of the configuration
  }]
}
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   pm2 logs ai-tutor --lines 50
   pm2 monit
   ```

2. **Database connection issues**
   ```bash
   sudo systemctl status postgresql
   psql -h localhost -U ai_tutor_user -d ai-tutor
   ```

3. **Nginx configuration issues**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Memory issues**
   ```bash
   free -h
   pm2 info ai-tutor
   pm2 monit
   ```

### Rollback Procedure

```bash
# List available backups
ls -la /var/www/ai-tutor/backup-*

# Restore from backup
cd /var/www/ai-tutor
rm -rf current
mv backup-YYYYMMDD-HHMMSS current
cd current
npm install
npm run build
pm2 restart ai-tutor
```

This comprehensive deployment setup ensures your AI Tutor platform is production-ready with automated deployments, monitoring, backups, and security measures.