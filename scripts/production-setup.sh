#!/bin/bash

# Quick Production Setup Script
# Run this once after deploying to production

set -e

echo "🔧 Production Setup for Social Media Manager"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ .env file not found!"
  echo "Please create .env file with required variables:"
  echo "  DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN, etc."
  exit 1
fi

echo "✅ .env file found"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
pnpm db:generate
echo ""

# Run migrations
echo "🗄️  Setting up database..."
if [ -f "prisma/migrations" ]; then
  echo "Running migrations..."
  pnpm db:deploy
else
  echo "No migrations found. Using db push..."
  pnpm db:push
fi
echo ""

# Check if database has data
echo "📊 Checking database..."
if [ -f "prisma/dev.db" ]; then
  echo "✅ Database file exists"
  
  # Optional: Seed database
  read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    pnpm db:seed
    echo "✅ Database seeded"
  fi
else
  echo "⚠️  Database file not found at prisma/dev.db"
  echo "Make sure your DATABASE_URL is correct in .env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Production setup completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm build' to build the application"
echo "  2. Run 'pnpm start' to start the server"
echo "  3. Or use 'pm2 start ecosystem.config.cjs' for production"
echo ""

