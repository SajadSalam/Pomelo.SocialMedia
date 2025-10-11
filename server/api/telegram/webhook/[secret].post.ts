export default defineEventHandler(async (event) => {
  try {
    const secret = getRouterParam(event, 'secret')
    const config = useRuntimeConfig()
    console.log('🔍 [Telegram] Webhook received with secret:', secret)

    // Validate webhook secret
    if (secret !== config.telegramWebhookSecret) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid webhook secret',
      })
    }

    // Get bot instance
    const { bot } = await import('../../../../server/bot/index')

    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Bot not configured',
      })
    }

    // Get update from request body
    const update = await readBody(event)

    // Process update with bot
    await bot.handleUpdate(update)

    return {
      success: true,
    }
  }
  catch (error: any) {
    console.error('Telegram webhook error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process webhook',
    })
  }
})
