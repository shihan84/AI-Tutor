#!/bin/bash

# AI Tutor Platform - Deployment Script
# This script is used by GitHub Actions for automated deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting AI Tutor Platform Deployment${NC}"

# Navigate to project directory
cd /var/www/ai-tutor

# Create backup
if [ -d "current" ]; then
    echo -e "${YELLOW}💾 Creating backup...${NC}"
    cp -r current backup-$(date +%Y%m%d-%H%M%S)
fi

# Extract new deployment
echo -e "${YELLOW}📦 Extracting deployment package...${NC}"
cd /tmp
tar -xzf deployment.tar.gz

# Remove old deployment
echo -e "${YELLOW}🗑️  Removing old deployment...${NC}"
rm -rf /var/www/ai-tutor/current

# Move new deployment
echo -e "${YELLOW}📂 Moving new deployment...${NC}"
mv deploy /var/www/ai-tutor/current

# Navigate to new deployment
cd /var/www/ai-tutor/current

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma db push

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Restart PM2 process
echo -e "${YELLOW}🔄 Restarting PM2 process...${NC}"
pm2 restart ai-tutor || pm2 start server.ts --name ai-tutor

# Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
rm -f /tmp/deployment.tar.gz
rm -rf /tmp/deploy

# Wait for application to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}🔍 Performing health check...${NC}"
if pm2 info ai-tutor | grep -q "online"; then
    echo -e "${GREEN}✅ Application is running successfully${NC}"
    
    # Show application status
    echo -e "${BLUE}📊 Application Status:${NC}"
    pm2 info ai-tutor
    
    # Show recent logs
    echo -e "${BLUE}📝 Recent Logs:${NC}"
    pm2 logs ai-tutor --lines 10
    
    exit 0
else
    echo -e "${RED}❌ Application failed to start${NC}"
    echo -e "${RED}📝 Error Logs:${NC}"
    pm2 logs ai-tutor --lines 20
    exit 1
fi