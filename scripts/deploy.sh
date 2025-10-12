#!/bin/bash

# Production Deployment Script
# This script handles all the necessary steps for production deployment

set -e  # Exit on error

echo "🚀 Starting production deployment..."
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
pnpm install --frozen-lockfile
echo "✅ Dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2/5: Generating Prisma Client..."
pnpm db:generate
echo "✅ Prisma Client generated"
echo ""

# Step 3: Run database migrations
echo "🗄️  Step 3/5: Running database migrations..."
if [ "$NODE_ENV" = "production" ]; then
  # Use deploy in production (doesn't prompt)
  pnpm db:deploy
else
  # Use push for development/staging (creates tables without migration files)
  pnpm db:push
fi
echo "✅ Database migrations completed"
echo ""

# Step 4: Build the application
echo "🏗️  Step 4/5: Building application..."
pnpm build
echo "✅ Application built successfully"
echo ""

# Step 5: Verify setup
echo "🔍 Step 5/5: Verifying setup..."
if [ -f ".output/server/index.mjs" ]; then
  echo "✅ Build output exists"
else
  echo "❌ Build output not found!"
  exit 1
fi

if [ -f "prisma/dev.db" ]; then
  echo "✅ Database file exists"
else
  echo "⚠️  Warning: Database file not found. Make sure DATABASE_URL is correct."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To start the application:"
echo "  pnpm start"
echo ""
echo "To run with PM2 (recommended for production):"
echo "  pm2 start ecosystem.config.cjs"
echo ""

