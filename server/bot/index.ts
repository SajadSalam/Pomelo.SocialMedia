import { Scenes, session, Telegraf } from 'telegraf'
import { postWizard } from './scenes/postWizard'

const config = useRuntimeConfig()

if (!config.telegramBotToken) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured, bot will not start')
}

// Create bot instance with scene context
export const bot = config.telegramBotToken
  ? new Telegraf<Scenes.SceneContext>(config.telegramBotToken)
  : null

if (bot) {
  // Create stage with scenes
  const stage = new Scenes.Stage<Scenes.SceneContext>([postWizard as any])

  // Use session middleware
  bot.use(session())
  bot.use(stage.middleware())

  // Register commands
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '🚀 *Welcome to Social Media Manager Bot\\!*\n\n'
      + '📱 Create and publish posts to Facebook and Instagram directly from Telegram\\.\n\n'
      + '*Quick Start:*\n'
      + '• Tap /new to create a post\n'
      + '• Tap /help for more info\n\n'
      + 'Let\'s get started\\! 🎉',
      { parse_mode: 'MarkdownV2' },
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📚 *Available Commands*\n\n'
      + '*Post Management:*\n'
      + '• /new \\- Create a new post\n'
      + '• /cancel \\- Cancel current operation\n\n'
      + '*How it works:*\n'
      + '1️⃣ Select your client\n'
      + '2️⃣ Choose post type \\(image/carousel/video/story\\)\n'
      + '3️⃣ Send your media files\n'
      + '4️⃣ Add a caption\n'
      + '5️⃣ Publish to all configured channels\\!\n\n'
      + '*Post Types:*\n'
      + '• 📷 Single Image \\- One image post\n'
      + '• 🎞️ Carousel \\- 2\\-10 images\n'
      + '• 🎥 Video/Reel \\- Video content\n'
      + '• 📱 Story \\- Instagram Stories only\n\n'
      + '✨ The bot automatically publishes to all enabled Facebook and Instagram channels for your selected client\\.',
      { parse_mode: 'MarkdownV2' },
    )
  })

  bot.command('new', async (ctx) => {
    if ('scene' in ctx) {
      await (ctx as Scenes.SceneContext).scene.enter('post-wizard')
    }
  })

  bot.command('cancel', async (ctx) => {
    if ('scene' in ctx) {
      await (ctx as Scenes.SceneContext).scene.leave()
      await ctx.reply('Operation cancelled.')
    }
  })

  // Handle unknown commands
  bot.on('message', async (ctx) => {
    await ctx.reply('Unknown command. Use /help to see available commands.')
  })
}

export default bot
