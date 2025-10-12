# Deployment Guide - Pomelo Agency

This guide will help you set up automated deployment to your Ubuntu server using GitHub Actions.

## Deployment Strategy

This CI/CD pipeline uses a **build-then-transfer** approach with appleboy actions:
1. ✅ Code is built on GitHub Actions (fast, doesn't consume server resources)
2. ✅ Built files are transferred to server using `appleboy/scp-action`
3. ✅ Final deployment steps via `appleboy/ssh-action`
4. ✅ Service is restarted automatically with `systemd`

## Prerequisites

1. **Ubuntu Server** with SSH access
2. **Node.js** (LTS version) and **pnpm** installed on the server
3. **systemd** service configured (for process management)
4. **Redis** server running (for BullMQ job queue)
5. **PostgreSQL** or SQLite for database

## Server Setup

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install pnpm
npm install -g pnpm

# Install Redis (for job queue)
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Optional: Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

### 2. Create Project Directory

```bash
# Create the directory
sudo mkdir -p /var/www/nuxt_social

# Set ownership (replace 'your-user' with your SSH username)
sudo chown -R $USER:$USER /var/www/nuxt_social
```

### 3. Set Up systemd Service

Copy the `social.service` file from your repo to the server, or create it manually:

```bash
# Create the service file
sudo nano /etc/systemd/system/Social.service
```

Paste this content (adjust paths and user as needed):

```ini
[Unit]
Description=Pomelo Agency - Social Media Management Platform
After=network.target redis-server.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nuxt_social
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node /var/www/nuxt_social/.output/server/index.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=social

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable Social

# Start the service (will fail initially until first deployment)
# sudo systemctl start Social

# Check status
sudo systemctl status Social
```

### 4. Enable SSH Password Authentication

Ensure password authentication is enabled in your SSH config:

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Ensure these lines are present and not commented:
PasswordAuthentication yes
PubkeyAuthentication yes

# Restart SSH service
sudo systemctl restart sshd
```

**Security Note:** For better security, consider using SSH key authentication instead of passwords in production.

### 5. Configure Sudo Permissions for Service Restart

The CI/CD pipeline needs to restart the service without a password prompt:

```bash
# Edit sudoers file
sudo visudo

# Add this line (replace 'your-user' with your SSH username)
your-user ALL=(ALL) NOPASSWD: /usr/sbin/service Social restart
```

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### Required Secrets

1. **SSH_HOST**
   - Your server's IP address or domain
   - Example: `123.45.67.89` or `server.yourdomain.com`

2. **SSH_USERNAME**
   - Your SSH username (usually `root` or your user)
   - Example: `ubuntu` or `root`

3. **SSH_PASSWORD**
   - Your SSH user password
   - **Required for appleboy actions (scp and ssh)**
   - Make sure your server allows password authentication in SSH config

4. **ENV_FILE**
   - Your complete `.env` file content
   - Example:
     ```
     JWT_SECRET=your-super-secret-jwt-key-here
     TELEGRAM_BOT_TOKEN=your-telegram-bot-token
     TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
     REDIS_URL=redis://localhost:6379
     DATABASE_URL=file:./prisma/dev.db
     BASE_URL=https://your-domain.com
     NODE_ENV=production
     ```

### Optional Secrets

5. **SSH_PORT** (optional, defaults to 22)
   - Custom SSH port if you're not using the default
   - Example: `2222`

## Testing the Deployment

Once you've set up all the secrets:

1. Make a commit to the `main` branch
2. Push to GitHub
3. Go to GitHub Actions tab in your repository
4. Watch the workflow run

The deployment will:
- ✅ Checkout code on GitHub Actions runner
- ✅ Setup Node.js and pnpm
- ✅ Install dependencies and build the project on GitHub Actions (fast!)
- ✅ Transfer built files to server using `appleboy/scp-action`
- ✅ SSH into server using `appleboy/ssh-action`
- ✅ Copy .env file to server
- ✅ Install production dependencies on server
- ✅ Run database migrations
- ✅ Restart the application with `service Social restart`

## Manual Deployment (Optional)

If you need to deploy manually from your local machine:

```bash
# Build locally
pnpm install
pnpm run db:generate
pnpm run build

# Transfer to server (adjust paths as needed)
# You'll need rsync or scp installed
scp -r .output/ your-user@your-server:/var/www/nuxt_social/
scp package.json pnpm-lock.yaml your-user@your-server:/var/www/nuxt_social/
scp -r prisma/ your-user@your-server:/var/www/nuxt_social/

# SSH into server and restart
ssh your-user@your-server
cd /var/www/nuxt_social
pnpm install --prod
pnpm run db:migrate
sudo service Social restart
```

## Viewing Logs

```bash
# View service logs
sudo journalctl -u Social -f

# View last 100 lines
sudo journalctl -u Social -n 100

# View logs from today
sudo journalctl -u Social --since today

# View logs with priority (errors only)
sudo journalctl -u Social -p err

# Check service status
sudo systemctl status Social
```

## Troubleshooting

### Deployment fails with "Permission denied"
- Ensure your SSH password is correctly added to GitHub Secrets
- Verify password authentication is enabled in `/etc/ssh/sshd_config`
- Check user has write permissions to `/var/www/nuxt_social`

### Application won't start
- Check service logs: `sudo journalctl -u Social -n 100`
- Verify all environment variables are correct in `/var/www/nuxt_social/.env`
- Ensure Redis is running: `sudo systemctl status redis-server`
- Check service status: `sudo systemctl status Social`

### Database migration errors
- Check your DATABASE_URL in .env
- Ensure database is accessible
- Try running migrations manually:
  ```bash
  cd /var/www/nuxt_social
  pnpm run db:migrate
  ```

### Service restart fails
- Verify sudo permissions are configured correctly
- Check: `sudo visudo` for the NOPASSWD line
- Try restarting manually: `sudo service Social restart`

### SCP transfer fails
- Check directory permissions: `ls -la /var/www/nuxt_social`
- Ensure user owns the directory: `sudo chown -R $USER:$USER /var/www/nuxt_social`
- Verify SSH password authentication is enabled

### Port already in use
- Check what's running on port 3000: `sudo lsof -i :3000`
- Kill the process: `sudo kill -9 <PID>`
- Or change the port in your systemd service file

## Setting Up SSL/HTTPS (Recommended)

Use Nginx as a reverse proxy with Let's Encrypt SSL:

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Configure Nginx (create /etc/nginx/sites-available/pomelo-agency)
# Then enable it and get SSL certificate
sudo ln -s /etc/nginx/sites-available/pomelo-agency /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

## Support

For issues or questions, please create an issue in the GitHub repository.

