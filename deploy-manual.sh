#!/bin/bash
# Manual deployment script for Pomelo Agency

echo "🚀 Starting manual deployment..."

# Navigate to project directory
cd /var/www/nuxt_social || exit 1

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required environment variables"
    exit 1
fi

echo "✅ .env file found"

# Remove old lock file if exists
if [ -f "pnpm-lock.yaml" ]; then
    rm pnpm-lock.yaml
    echo "🗑️  Removed old lock file"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile

# Ensure prisma directory exists
mkdir -p prisma

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm run db:generate

# Apply migrations
echo "🗄️  Applying database migrations..."
npx prisma migrate deploy

# Verify migrations
echo "📊 Checking database status..."
npx prisma migrate status

# Check if database file exists (for SQLite)
if [ -f "prisma/dev.db" ]; then
    echo "✅ Database file found at prisma/dev.db"
    ls -lh prisma/dev.db
else
    echo "⚠️  Database file not found at prisma/dev.db"
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "To start the service, run:"
echo "  sudo service Social restart"
echo ""
echo "To check service status:"
echo "  sudo systemctl status Social"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u Social -f"

