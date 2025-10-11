/* eslint-disable no-console */
import axios from 'axios'
import * as dotenv from 'dotenv'
import { resolve } from 'node:path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') })

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BASE_URL = process.env.BASE_URL
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

async function setWebhook() {
  console.log('🔧 Setting up Telegram Webhook...\n')

  // Validate required environment variables
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env')
    process.exit(1)
  }

  if (!BASE_URL) {
    console.error('❌ Error: BASE_URL is not set in .env')
    process.exit(1)
  }

  if (!TELEGRAM_WEBHOOK_SECRET) {
    console.error('❌ Error: TELEGRAM_WEBHOOK_SECRET is not set in .env')
    process.exit(1)
  }

  // Construct webhook URL
  const webhookUrl = `${BASE_URL}/api/telegram/webhook/${TELEGRAM_WEBHOOK_SECRET}`

  console.log('📋 Configuration:')
  console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`)
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Webhook URL: ${webhookUrl}\n`)

  try {
    // Set webhook
    console.log('📤 Setting webhook...')
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query'],
      },
    )

    if (response.data.ok) {
      console.log('✅ Webhook set successfully!\n')
      
      // Get webhook info to verify
      console.log('📊 Verifying webhook...')
      const infoResponse = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      )

      const info = infoResponse.data.result
      console.log('\n✅ Webhook Info:')
      console.log(`   URL: ${info.url}`)
      console.log(`   Has custom certificate: ${info.has_custom_certificate}`)
      console.log(`   Pending update count: ${info.pending_update_count}`)
      console.log(`   Max connections: ${info.max_connections || 'default (40)'}`)
      
      if (info.last_error_date) {
        console.log(`\n⚠️  Last error: ${info.last_error_message}`)
        console.log(`   Date: ${new Date(info.last_error_date * 1000).toLocaleString()}`)
      }
      else {
        console.log('\n✅ No errors reported')
      }

      console.log('\n🎉 Setup complete! Your bot is ready to receive messages.')
      console.log('💡 Test it by sending /start to your bot on Telegram.')
    }
    else {
      console.error('❌ Failed to set webhook:', response.data.description)
      process.exit(1)
    }
  }
  catch (error: any) {
    console.error('❌ Error setting webhook:', error.message)
    if (error.response?.data) {
      console.error('   Response:', error.response.data)
    }
    process.exit(1)
  }
}

async function deleteWebhook() {
  console.log('🗑️  Deleting webhook...\n')

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env')
    process.exit(1)
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`,
      {
        drop_pending_updates: true,
      },
    )

    if (response.data.ok) {
      console.log('✅ Webhook deleted successfully!')
      console.log('💡 Bot will now only work in polling mode.')
    }
    else {
      console.error('❌ Failed to delete webhook:', response.data.description)
      process.exit(1)
    }
  }
  catch (error: any) {
    console.error('❌ Error deleting webhook:', error.message)
    process.exit(1)
  }
}

async function getWebhookInfo() {
  console.log('📊 Getting webhook info...\n')

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env')
    process.exit(1)
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
    )

    const info = response.data.result
    
    if (!info.url) {
      console.log('ℹ️  No webhook is currently set.')
      console.log('💡 Run "pnpm webhook:set" to set up the webhook.')
    }
    else {
      console.log('✅ Current Webhook Info:')
      console.log(`   URL: ${info.url}`)
      console.log(`   Has custom certificate: ${info.has_custom_certificate}`)
      console.log(`   Pending update count: ${info.pending_update_count}`)
      console.log(`   Max connections: ${info.max_connections || 'default (40)'}`)
      
      if (info.allowed_updates) {
        console.log(`   Allowed updates: ${info.allowed_updates.join(', ')}`)
      }
      
      if (info.last_error_date) {
        console.log(`\n⚠️  Last error: ${info.last_error_message}`)
        console.log(`   Date: ${new Date(info.last_error_date * 1000).toLocaleString()}`)
      }
      else {
        console.log('\n✅ No errors reported')
      }
    }
  }
  catch (error: any) {
    console.error('❌ Error getting webhook info:', error.message)
    process.exit(1)
  }
}

// Parse command line arguments
const command = process.argv[2]

switch (command) {
  case 'set':
    setWebhook()
    break
  case 'delete':
    deleteWebhook()
    break
  case 'info':
    getWebhookInfo()
    break
  default:
    console.log('📱 Telegram Webhook Manager\n')
    console.log('Usage:')
    console.log('  pnpm webhook:set    - Set webhook URL from .env')
    console.log('  pnpm webhook:delete - Delete webhook (use polling mode)')
    console.log('  pnpm webhook:info   - Show current webhook info\n')
    console.log('Example:')
    console.log('  npx tsx scripts/set-webhook.ts set')
    process.exit(0)
}

