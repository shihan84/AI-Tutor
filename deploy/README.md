# AI Tutor Deployment Guide

This guide will help you deploy the AI Tutor application to your Ubuntu 22.04 server using GitHub Actions for automated CI/CD.

## 🚀 Quick Start

### 1. Server Setup

Run the setup script on your Ubuntu 22.04 server:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/shihan84/AI-Tutor/master/deploy/setup.sh

# Make it executable
chmod +x setup.sh

# Run the setup (requires root privileges)
sudo ./setup.sh
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret | Description | Example |
|--------|-------------|---------|
| `SERVER_HOST` | Your server IP or domain | `192.168.1.100` or `your-domain.com` |
| `SERVER_USER` | SSH username | `root` or `ubuntu` |
| `SERVER_SSH_KEY` | Your private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH port (optional) | `22` |

### 3. Generate SSH Key

If you don't have an SSH key, generate one:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ai-tutor-deploy

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/ai-tutor-deploy.pub user@your-server

# Add the private key to GitHub secrets
cat ~/.ssh/ai-tutor-deploy
```

### 4. Configure Domain and SSL

Update your domain configuration:

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/ai-tutor

# Replace 'your-domain.com' with your actual domain

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL certificate
sudo /usr/local/bin/ai-tutor-ssl
```

### 5. Environment Configuration

Copy and configure environment variables:

```bash
# Copy environment template
sudo cp /var/www/ai-tutor/.env.example /var/www/ai-tutor/.env

# Edit environment variables
sudo nano /var/www/ai-tutor/.env
```

Required environment variables:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# Application Configuration
NODE_ENV="production"
PORT="3000"
NEXTAUTH_SECRET="your-secure-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Security Configuration
JWT_SECRET="your-jwt-secret-here"
BCRYPT_ROUNDS="12"
```

### 6. First Deployment

Either:
- Push to the `master` branch to trigger automatic deployment, or
- Run manual deployment:

```bash
# Navigate to project directory
cd /var/www/ai-tutor

# Run deployment script
sudo ./deploy.sh
```

## 📋 Deployment Features

### Automated CI/CD Pipeline
- **Build**: Automatically builds the application on every push to master
- **Test**: Runs linter and build checks
- **Deploy**: Deploys to your Ubuntu server with zero downtime
- **Health Check**: Verifies application is running after deployment
- **Rollback**: Automatic backup creation before deployment

### Server Monitoring
- **Process Monitoring**: PM2 ensures the application stays running
- **Health Checks**: Automatic monitoring every 5 minutes
- **Resource Monitoring**: Disk space and memory usage alerts
- **Auto-restart**: Automatic restart on failure
- **Log Management**: Centralized logging with rotation

### Security Features
- **SSL/TLS**: Automatic SSL certificate setup and renewal
- **Firewall**: UFW configuration with only necessary ports open
- **Rate Limiting**: Nginx rate limiting to prevent abuse
- **Security Headers**: Comprehensive security headers configuration
- **Process Isolation**: Application runs as non-root user

### Backup and Recovery
- **Automated Backups**: Daily database and file backups
- **Easy Rollback**: One-click rollback to previous version
- **Backup Retention**: 7-day backup retention policy
- **Disaster Recovery**: Complete server restoration capability

## 🔧 Manual Operations

### Application Management

```bash
# View application status
pm2 status

# View logs
pm2 logs ai-tutor

# Monitor application
pm2 monit

# Restart application
pm2 restart ai-tutor

# Stop application
pm2 stop ai-tutor

# Start application
pm2 start ai-tutor
```

### Server Management

```bash
# View system status
systemctl status ai-tutor

# View Nginx status
systemctl status nginx

# View PostgreSQL status
systemctl status postgresql

# View firewall status
ufw status

# Manual backup
/usr/local/bin/ai-tutor-backup

# Manual health check
/usr/local/bin/ai-tutor-monitor

# SSL renewal
certbot renew
```

### Log Management

```bash
# Application logs
pm2 logs ai-tutor

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u ai-tutor -f

# Monitoring logs
tail -f /var/log/ai-tutor-monitor.log
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check GitHub Actions logs
# Check server disk space
df -h

# Check PM2 logs
pm2 logs ai-tutor

# Check system logs
journalctl -u ai-tutor -n 50
```

#### 2. Application Not Starting
```bash
# Check if PM2 is running
pm2 status

# Check Node.js version
node --version

# Check environment variables
pm2 env ai-tutor

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

#### 3. Database Issues
```bash
# Check database connection
npx prisma db push

# Reset database (caution: deletes all data)
npx prisma migrate reset

# View database status
sudo systemctl status postgresql
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Force renew certificate
certbot renew --force-renewal

# Check Nginx SSL configuration
nginx -t
```

### Performance Optimization

```bash
# Optimize PM2
pm2 describe ai-tutor
pm2 reload ai-tutor --optimize

# Clear application cache
pm2 restart ai-tutor

# Optimize Nginx
sudo nano /etc/nginx/nginx.conf

# Monitor system resources
htop
df -h
free -h
```

## 📊 Monitoring and Analytics

### Application Metrics
- Response time monitoring
- Error rate tracking
- Memory usage tracking
- CPU usage monitoring

### Server Metrics
- Disk space monitoring
- Network traffic monitoring
- Process health monitoring
- Service availability monitoring

### Log Analysis
- Error log aggregation
- Performance metrics
- User activity tracking
- Security event monitoring

## 🔒 Security Best Practices

### Regular Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update

# Renew SSL certificates
certbot renew

# Review firewall rules
ufw status

# Check for security updates
sudo apt list --upgradable
```

### Security Scans
```bash
# Check for vulnerabilities
npm audit

# Scan for malware
clamscan -r /var/www/ai-tutor

# Check file permissions
ls -la /var/www/ai-tutor

# Monitor login attempts
sudo lastb
```

## 📈 Scaling Options

### Vertical Scaling
- Increase server resources (CPU, RAM, Storage)
- Optimize database performance
- Implement caching strategies
- Load balancing configuration

### Horizontal Scaling
- Multiple server instances
- Database replication
- Content delivery network (CDN)
- Microservices architecture

## 🎯 Advanced Configuration

### Database Optimization
```sql
-- PostgreSQL optimization
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### Nginx Optimization
```nginx
# Performance optimization
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 50M;
```

### Application Optimization
```javascript
// PM2 optimization
module.exports = {
  apps: [{
    name: 'ai-tutor',
    script: 'server.ts',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review GitHub Issues for known problems
3. Check application logs for error details
4. Monitor system resources and performance
5. Contact support for critical issues

---

This deployment setup provides a robust, secure, and scalable foundation for your AI Tutor application with automated CI/CD, monitoring, and maintenance capabilities.