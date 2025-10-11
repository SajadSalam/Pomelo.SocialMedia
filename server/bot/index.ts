import { Scenes, Telegraf, session } from 'telegraf'
import { postWizard } from './scenes/postWizard'

const config = useRuntimeConfig()

if (!config.telegramBotToken) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured, bot will not start')
}

// Create bot instance
export const bot = config.telegramBotToken
  ? new Telegraf(config.telegramBotToken)
  : null

if (bot) {
  // Create stage with scenes
  const stage = new Scenes.Stage<Scenes.SceneContext>([postWizard])

  // Use session middleware
  bot.use(session())
  bot.use(stage.middleware())

  // Register commands
  bot.command('start', async (ctx) => {
    await ctx.reply(
      'Welcome to Social Media Manager Bot! 🚀\n\n'
      + 'Commands:\n'
      + '/new - Create a new post\n'
      + '/help - Show help',
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      'Available commands:\n\n'
      + '/new - Start the post creation wizard\n'
      + '/cancel - Cancel current operation\n\n'
      + 'The bot will guide you through creating posts that will be published to your configured Facebook and Instagram channels.',
    )
  })

  bot.command('new', async (ctx) => {
    await ctx.scene.enter('post-wizard')
  })

  bot.command('cancel', async (ctx) => {
    await ctx.scene.leave()
    await ctx.reply('Operation cancelled.')
  })

  // Handle unknown commands
  bot.on('message', async (ctx) => {
    await ctx.reply('Unknown command. Use /help to see available commands.')
  })

  console.log('✅ Telegram bot initialized')
}

export default bot

