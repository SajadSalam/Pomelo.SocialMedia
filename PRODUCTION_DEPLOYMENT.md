# 🚀 Production Deployment Guide

This guide will help you deploy the Social Media Manager application to production.

---

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed
- Redis server running
- Your `.env` file configured

---

## 🔧 Quick Start (Recommended)

### **Option 1: Automated Deployment**

Run the automated deployment script:

```bash
pnpm deploy
```

This will:
1. ✅ Install dependencies
2. ✅ Generate Prisma Client
3. ✅ Run database migrations
4. ✅ Build the application
5. ✅ Verify setup

Then start the server:

```bash
pnpm start
```

---

### **Option 2: Manual Deployment**

If you prefer manual control:

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Generate Prisma Client
pnpm db:generate

# 3. Run database migrations
pnpm db:push
# OR for production with migration files:
pnpm db:deploy

# 4. (Optional) Seed database
pnpm db:seed

# 5. Build the application
pnpm build

# 6. Start the server
pnpm start
```

---

## 🐛 Troubleshooting "Table Does Not Exist" Error

If you see this error when running `pnpm start`:

```
The table `main.PostRequest` does not exist in the current database.
```

**Solution:**

```bash
# Step 1: Generate Prisma Client
pnpm db:generate

# Step 2: Push schema to database
pnpm db:push

# Step 3: Rebuild the application
pnpm build

# Step 4: Start
pnpm start
```

---

## 🔄 PM2 (Recommended for Production)

### **Install PM2**

```bash
npm install -g pm2
```

### **Start with PM2**

```bash
# Start the application
pm2 start ecosystem.config.cjs

# View logs
pm2 logs social-media-manager

# Monitor
pm2 monit

# Restart
pm2 restart social-media-manager

# Stop
pm2 stop social-media-manager

# Auto-start on system reboot
pm2 startup
pm2 save
```

---

## 📦 Package.json Scripts Reference

### **Development**
- `pnpm dev` - Start development server
- `pnpm dev:pwa` - Start dev server with PWA enabled

### **Database**
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:migrate` - Create and apply new migration (dev)
- `pnpm db:deploy` - Apply migrations (production)
- `pnpm db:push` - Push schema without migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

### **Build & Deploy**
- `pnpm build` - Build for production (includes Prisma generation)
- `pnpm start` - Start production server
- `pnpm deploy` - Full automated deployment
- `pnpm prod:setup` - Interactive production setup

### **Telegram Webhook**
- `pnpm webhook:set` - Set Telegram webhook
- `pnpm webhook:info` - Show webhook status
- `pnpm webhook:delete` - Delete webhook

### **Code Quality**
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript checks

---

## 🌍 Environment Variables

Make sure your production `.env` file has:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
BASE_URL="https://your-production-domain.com"
PORT=3000

# Meta (Facebook/Instagram)
META_APP_ID="your-app-id"
META_APP_SECRET="your-app-secret"
META_LONG_LIVED_USER_TOKEN="your-token"
DEFAULT_FB_PAGE_ID="your-page-id"
DEFAULT_IG_BUSINESS_ID="your-ig-id"
META_MOCK="false"
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default secrets in `.env`
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Set up firewall rules
- [ ] Configure Redis password
- [ ] Restrict database file permissions
- [ ] Set up log rotation
- [ ] Enable rate limiting
- [ ] Keep dependencies updated

---

## 📊 Monitoring

### **Check Application Status**

```bash
# With PM2
pm2 status

# Check logs
pm2 logs social-media-manager --lines 100

# View specific error logs
pm2 logs social-media-manager --err

# Monitor resources
pm2 monit
```

### **Check Database**

```bash
# Open Prisma Studio
pnpm db:studio

# Check database file
ls -lh prisma/dev.db
```

### **Check Redis**

```bash
# Connect to Redis
redis-cli

# Check connection
redis-cli ping
```

---

## 🔄 Updating Production

When deploying updates:

```bash
# 1. Pull latest changes
git pull

# 2. Re-deploy
pnpm deploy

# 3. Restart with PM2
pm2 restart social-media-manager

# OR restart with pnpm
# Stop the server (Ctrl+C)
# Then: pnpm start
```

---

## 🆘 Common Issues

### **Issue: "Cannot find module '@prisma/client'"**

**Solution:**
```bash
pnpm install
pnpm db:generate
pnpm build
```

---

### **Issue: "Redis connection refused"**

**Solution:**
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:alpine

# Or use Redis Cloud (Upstash)
```

---

### **Issue: "Port already in use"**

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

---

## 📚 Additional Resources

- [Nuxt Production Checklist](https://nuxt.com/docs/getting-started/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

## ✅ Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Redis server running
- [ ] Application built successfully
- [ ] Telegram webhook configured
- [ ] Meta API credentials valid
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error logging configured
- [ ] PM2 startup script enabled

---

**Need help?** Check the logs:
```bash
pm2 logs social-media-manager --lines 50
```

Good luck with your deployment! 🚀

