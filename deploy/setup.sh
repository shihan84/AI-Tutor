#!/bin/bash

# AI Tutor Deployment Script for Ubuntu 22.04
# Run this script on your server to set up the deployment environment

set -e

echo "🚀 Starting AI Tutor deployment setup..."

# Variables
PROJECT_DIR="/var/www/ai-tutor"
SERVICE_USER="www-data"
NODE_VERSION="20"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log_info "Installing required packages..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    certbot \
    python3-certbot-nginx \
    ufw

# Install Node.js
log_info "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
apt install -y nodejs

# Install PM2 globally
log_info "Installing PM2..."
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd -u $SERVICE_USER --hp /home/$SERVICE_USER
env PATH=$PATH:/usr/bin pm2 startup systemd -u $SERVICE_USER --hp /home/$SERVICE_USER

# Create project directory
log_info "Creating project directory..."
mkdir -p $PROJECT_DIR
chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR

# Create logs directory
mkdir -p $PROJECT_DIR/logs
chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/logs

# Setup PostgreSQL
log_info "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database user and database (optional - you can modify as needed)
sudo -u postgres psql -c "CREATE USER ai_tutor WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE ai_tutor OWNER ai_tutor;"

# Configure firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000  # For direct access to Node.js app

# Setup Nginx
log_info "Setting up Nginx..."
cat > /etc/nginx/sites-available/ai-tutor << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

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
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/ai-tutor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Create environment file template
log_info "Creating environment file template..."
cat > $PROJECT_DIR/.env.example << 'EOF'
# Database Configuration
DATABASE_URL="file:./dev.db"
# For PostgreSQL: DATABASE_URL="postgresql://ai_tutor:your_secure_password@localhost:5432/ai_tutor"

# Application Configuration
NODE_ENV="production"
PORT="3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# AI Configuration (if needed)
ZAI_API_KEY="your-zai-api-key"

# Email Configuration (for notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB in bytes

# Security Configuration
CORS_ORIGIN="https://your-domain.com"
JWT_SECRET="your-jwt-secret-here"
BCRYPT_ROUNDS="12"
EOF

# Create systemd service for auto-restart
log_info "Creating systemd service..."
cat > /etc/systemd/system/ai-tutor.service << 'EOF'
[Unit]
Description=AI Tutor Application
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai-tutor/current
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ai-tutor
ExecStop=/usr/bin/pm2 stop ai-tutor
PIDFile=/run/pm2-ai-tutor.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable ai-tutor

# Create backup script
log_info "Creating backup script..."
cat > /usr/local/bin/ai-tutor-backup << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/ai-tutor"
PROJECT_DIR="/var/www/ai-tutor/current"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
if [ -f "$PROJECT_DIR/dev.db" ]; then
    cp $PROJECT_DIR/dev.db $BACKUP_DIR/database_$DATE.db
fi

# Backup uploads directory
if [ -d "$PROJECT_DIR/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $PROJECT_DIR uploads
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/ai-tutor-backup

# Setup cron job for daily backups
echo "0 2 * * * /usr/local/bin/ai-tutor-backup" | crontab -

# Create monitoring script
log_info "Creating monitoring script..."
cat > /usr/local/bin/ai-tutor-monitor << 'EOF'
#!/bin/bash

PROJECT_DIR="/var/www/ai-tutor/current"
LOG_FILE="/var/log/ai-tutor-monitor.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Check if PM2 is running
if ! pm2 info ai-tutor > /dev/null 2>&1; then
    log_message "ERROR: AI Tutor process is not running"
    # Try to restart
    cd $PROJECT_DIR
    pm2 start ecosystem.config.js --env production
    log_message "Attempted to restart AI Tutor"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    log_message "WARNING: Disk usage is above 90%: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ $MEMORY_USAGE -gt 90 ]; then
    log_message "WARNING: Memory usage is above 90%: ${MEMORY_USAGE}%"
fi

# Check if the application is responding
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log_message "ERROR: Health check failed"
    # Restart the application
    cd $PROJECT_DIR
    pm2 restart ai-tutor
    log_message "Restarted AI Tutor due to health check failure"
fi
EOF

chmod +x /usr/local/bin/ai-tutor-monitor

# Setup cron job for monitoring (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/ai-tutor-monitor" | crontab -

# Create SSL setup script
log_info "Creating SSL setup script..."
cat > /usr/local/bin/ai-tutor-ssl << 'EOF'
#!/bin/bash

DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

# Stop Nginx temporarily
systemctl stop nginx

# Obtain SSL certificate
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Start Nginx
systemctl start nginx

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "SSL certificate setup completed for $DOMAIN"
EOF

chmod +x /usr/local/bin/ai-tutor-ssl

# Create deployment script for GitHub Actions
log_info "Creating deployment script..."
cat > $PROJECT_DIR/deploy.sh << 'EOF'
#!/bin/bash

set -e

PROJECT_DIR="/var/www/ai-tutor"
SERVICE_USER="www-data"

echo "🚀 Starting deployment..."

# Navigate to project directory
cd $PROJECT_DIR

# Create backup of current deployment
if [ -d "current" ]; then
    echo "📦 Creating backup..."
    cp -r current backup-$(date +%Y%m%d-%H%M%S)
fi

# Extract new deployment
echo "📂 Extracting deployment package..."
cd /tmp
if [ -f "deployment.tar.gz" ]; then
    tar -xzf deployment.tar.gz
    mv deploy $PROJECT_DIR/new
else
    echo "❌ Deployment package not found"
    exit 1
fi

# Switch to new deployment
echo "🔄 Switching to new deployment..."
cd $PROJECT_DIR
rm -rf current
mv new current
chown -R $SERVICE_USER:$SERVICE_USER current

# Install dependencies
echo "📦 Installing dependencies..."
cd current
npm ci --production

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma db push

# Build the application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart ai-tutor || pm2 start server.ts --name ai-tutor

# Save PM2 process list
pm2 save

# Cleanup
echo "🧹 Cleaning up..."
rm -f /tmp/deployment.tar.gz
rm -rf /tmp/deploy

echo "✅ Deployment completed successfully!"
EOF

chmod +x $PROJECT_DIR/deploy.sh
chown $SERVICE_USER:$SERVICE_USER $PROJECT_DIR/deploy.sh

log_info "✅ Deployment setup completed!"
echo ""
echo "🎉 Next steps:"
echo "1. Update /etc/nginx/sites-available/ai-tutor with your domain"
echo "2. Run /usr/local/bin/ai-tutor-ssl to setup SSL certificate"
echo "3. Add GitHub repository secrets:"
echo "   - SERVER_HOST: Your server IP or domain"
echo "   - SERVER_USER: SSH username (e.g., root or ubuntu)"
echo "   - SERVER_SSH_KEY: Your private SSH key"
echo "   - SERVER_PORT: SSH port (default 22)"
echo "4. Configure your environment variables in $PROJECT_DIR/.env"
echo "5. Run the first deployment manually or push to GitHub to trigger CI/CD"
echo ""
echo "📚 Useful commands:"
echo "  - View logs: pm2 logs ai-tutor"
echo "  - Monitor: pm2 monit"
echo "  - Restart: pm2 restart ai-tutor"
echo "  - Backup: /usr/local/bin/ai-tutor-backup"
echo "  - Monitor health: /usr/local/bin/ai-tutor-monitor"