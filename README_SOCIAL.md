# Social Media Manager

A full-stack social media management platform built with Nuxt 3, Prisma, and BullMQ for managing multi-client Facebook and Instagram publishing with scheduling, analytics, and real-time updates.

## 🚀 Features

### Core Features
- **Multi-Client Management**: Manage multiple clients and their social media accounts
- **Multi-Platform Publishing**: Publish to Facebook Pages and Instagram Business accounts
- **Post Types**: Single images, carousels (2-10 images), and videos
- **Smart Scheduling**: Schedule posts for automatic publishing
- **Real-time Queue**: Monitor publishing status with live updates (SSE)
- **Analytics Dashboard**: Track impressions, reach, engagement, and more
- **Telegram Bot**: Create and publish posts via Telegram
- **Secure Authentication**: JWT-based authentication system

### Tech Stack
- **Frontend**: Nuxt 3, Vue 3, UnoCSS/Tailwind CSS
- **Backend**: Nuxt Server API (Nitro)
- **Database**: SQLite with Prisma ORM
- **Queue**: BullMQ with Redis
- **Authentication**: JWT with bcryptjs
- **Bot**: Telegraf (Telegram Bot Framework)
- **APIs**: Meta Graph API for Facebook/Instagram

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Redis server (for BullMQ)
- Meta (Facebook) Developer Account with App credentials
- (Optional) Telegram Bot Token for bot integration

## 🛠️ Installation

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <your-repo>
cd social
pnpm install
\`\`\`

### 2. Environment Setup

The \`.env\` file should already be created. Update it with your credentials:

\`\`\`env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
TELEGRAM_BOT_TOKEN=""  # Optional: Add your Telegram bot token
TELEGRAM_WEBHOOK_SECRET="change-this-to-a-random-string"
REDIS_URL="redis://localhost:6379"
\`\`\`

### 3. Database Setup

\`\`\`bash
# Run database migrations
pnpm db:migrate

# Seed the database with test data
pnpm db:seed
\`\`\`

This will create:
- A test user: `admin@example.com` / `password123`
- Two test clients
- Sample channels (disabled by default)
- A test post

### 4. Start Redis

Make sure Redis is running on your system:

\`\`\`bash
# macOS (with Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Windows (with Docker)
docker run -d -p 6379:6379 redis:latest

# Or use Redis Cloud (update REDIS_URL in .env)
\`\`\`

### 5. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

The application will be available at `http://localhost:3000`

## 📱 Setting Up Meta API

### 1. Create a Meta App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or select an existing one
3. Add the following products:
   - Facebook Login
   - Instagram Basic Display

### 2. Generate Access Tokens

1. Go to Graph API Explorer
2. Select your app
3. Generate a User Access Token with these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
4. Convert to a long-lived token (60 days)
5. Get Page Access Tokens for your Facebook Pages

### 3. Configure in Settings

1. Login to the application
2. Go to Settings
3. Enter your:
   - Long-lived Access Token
   - App ID
   - App Secret
4. Save settings

### 4. Add Channels

1. Go to Clients
2. Select or create a client
3. Add channels:
   - **Facebook Page**: Enter the Page ID and Page Access Token
   - **Instagram Business**: Enter the Instagram Business Account ID and token

## 🤖 Setting Up Telegram Bot (Optional)

### 1. Create a Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token

### 2. Configure

Add the token to `.env`:

\`\`\`env
TELEGRAM_BOT_TOKEN="your-bot-token-here"
\`\`\`

### 3. Set Webhook

Set up the webhook URL to receive updates:

\`\`\`bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook/<WEBHOOK_SECRET>"
\`\`\`

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `yourdomain.com` with your domain
- `<WEBHOOK_SECRET>` with the secret from your `.env`

### 4. Use the Bot

1. Start a chat with your bot
2. Use `/start` to begin
3. Use `/new` to create a new post
4. Follow the wizard to select client, upload media, and publish

## 📚 API Documentation

### Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require authentication.

Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

#### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

#### Channels
- `POST /api/clients/:id/channels` - Add channel to client
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

#### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post

#### Uploads
- `POST /api/uploads` - Upload media files
- `GET /api/uploads/:filename` - Get uploaded file

#### Insights
- `GET /api/insights/summary` - Get analytics summary
- `GET /api/insights/posts/:id` - Get post insights

#### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

#### Real-time
- `GET /api/events` - Server-Sent Events stream

## 🗄️ Database Schema

The application uses the following models:

- **User**: User accounts
- **UserSettings**: Meta API credentials
- **Client**: Clients/customers
- **Channel**: Social media channels (FB/IG)
- **PostRequest**: Posts to be published
- **Publication**: Publication instances per channel
- **MediaAsset**: Uploaded media files
- **Insight**: Analytics data

## 🔄 Publishing Flow

1. User creates a post (Draft status)
2. User uploads media files
3. User publishes the post
4. System creates Publication records for each enabled channel
5. Publications are added to BullMQ queue
6. Worker processes each publication:
   - Uploads media to Facebook/Instagram
   - Creates post via Graph API
   - Updates publication status
   - Emits SSE event for real-time update
7. System fetches insights periodically

## 📊 Queue Management

The application uses BullMQ for reliable job processing:

- **Concurrency**: 3 jobs in parallel
- **Retries**: 3 attempts with exponential backoff
- **Job Types**:
  - `publish-post`: Publish a post to a channel
  - `fetch-insights`: Fetch analytics for published posts

## 🔐 Security Notes

- Change the `JWT_SECRET` in production
- Use strong passwords
- Store Meta tokens securely
- Use HTTPS in production
- Set up proper CORS policies
- Rotate access tokens regularly

## 🚀 Deployment

### Build for Production

\`\`\`bash
pnpm build
\`\`\`

### Start Production Server

\`\`\`bash
pnpm start
\`\`\`

### Important Notes

- Run the worker process separately in production
- Set up a process manager (PM2, systemd)
- Use a managed Redis service (Redis Cloud, AWS ElastiCache)
- Set up proper logging and monitoring
- Configure environment variables for production

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with test data
- `pnpm db:studio` - Open Prisma Studio
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript check

## 🐛 Troubleshooting

### Redis Connection Error

Make sure Redis is running:
\`\`\`bash
redis-cli ping
\`\`\`

### Publishing Fails

- Check Meta API credentials in settings
- Verify channel access tokens are valid
- Check channel external IDs are correct
- Review error messages in queue page

### Worker Not Processing Jobs

- Ensure Redis is accessible
- Check worker logs in console
- Verify queue connection in code

## 📄 License

[Your License Here]

## 🤝 Contributing

[Your Contributing Guidelines]

## 📧 Support

For issues and questions, please [create an issue](https://github.com/your-repo/issues).

