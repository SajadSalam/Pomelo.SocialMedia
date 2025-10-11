# Deployment Guide - Pomelo Agency

This guide will help you set up automated deployment to your Ubuntu server using GitHub Actions.

## Prerequisites

1. **Ubuntu Server** with SSH access
2. **Git** installed on the server
3. **Node.js** (LTS version) and **pnpm** installed on the server
4. **PM2** (optional but recommended) for process management
5. **Redis** server running (for BullMQ job queue)
6. **PostgreSQL** or SQLite for database

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

# Install PM2 for process management
npm install -g pm2

# Install Redis (for job queue)
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Optional: Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

### 2. Clone Repository on Server

```bash
# Navigate to your desired directory
cd ~

# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git pomelo-agency
cd pomelo-agency

# Set up Git to pull without conflicts
git config pull.rebase false
```

### 3. Set Up PM2 Startup

```bash
# Generate PM2 startup script
pm2 startup

# Follow the instructions provided by the command above
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

3. **SSH_PRIVATE_KEY**
   - Your SSH private key (the entire content of your `~/.ssh/id_rsa` or similar)
   - To generate a new SSH key pair:
     ```bash
     ssh-keygen -t rsa -b 4096 -C "github-actions"
     # Copy the private key content:
     cat ~/.ssh/id_rsa
     # Add the public key to server's authorized_keys:
     cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
     ```

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

6. **DEPLOY_PATH** (optional, defaults to `~/pomelo-agency`)
   - The path where your project is located on the server
   - Example: `/var/www/pomelo-agency`

## Testing the Deployment

Once you've set up all the secrets:

1. Make a commit to the `main` branch
2. Push to GitHub
3. Go to GitHub Actions tab in your repository
4. Watch the workflow run

The deployment will:
- ✅ Run linting checks
- ✅ Run type checks
- ✅ Deploy to your server (only on main branch)
- ✅ Copy .env file
- ✅ Install dependencies
- ✅ Run database migrations
- ✅ Build the project
- ✅ Restart the application with PM2

## Manual Deployment (Optional)

If you need to deploy manually:

```bash
# SSH into your server
ssh your-username@your-server-ip

# Navigate to project
cd ~/pomelo-agency

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Run migrations
pnpm run db:generate
pnpm run db:migrate

# Build
pnpm run build

# Restart with PM2
pm2 restart pomelo-agency || pm2 start npm --name "pomelo-agency" -- start
pm2 save
```

## Viewing Logs

```bash
# View PM2 logs
pm2 logs pomelo-agency

# View specific number of lines
pm2 logs pomelo-agency --lines 100

# Monitor in real-time
pm2 monit
```

## Troubleshooting

### Deployment fails with "Permission denied"
- Ensure your SSH key is correctly added to GitHub Secrets
- Verify the public key is in `~/.ssh/authorized_keys` on the server

### Application won't start
- Check PM2 logs: `pm2 logs pomelo-agency`
- Verify all environment variables are correct
- Ensure Redis is running: `sudo systemctl status redis-server`

### Database migration errors
- Check your DATABASE_URL in .env
- Ensure database is accessible
- Try running migrations manually: `pnpm run db:migrate`

### Port already in use
- Check what's running on port 3000: `sudo lsof -i :3000`
- Kill the process or change the port in your .env

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

