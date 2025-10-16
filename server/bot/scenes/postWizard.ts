import axios from 'axios'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Markup, Scenes } from 'telegraf'
import prisma from '../../utils/prisma'

interface WizardSession extends Scenes.SceneSession {
  clientId?: string
  clientName?: string
  postType?: string
  mediaUrls?: string[]
  mediaIds?: string[]
  caption?: string
  scheduledAt?: Date
  publishMode?: 'now' | 'scheduled'
}

// Helper function to publish the post
async function publishPost(ctx: any, session: WizardSession) {
  await ctx.reply('⏳ Creating your post...')

  try {
    // Create post with optional scheduledAt
    const post = await prisma.postRequest.create({
      data: {
        clientId: session.clientId!,
        kind: session.postType!,
        caption: session.caption!,
        mediaIds: JSON.stringify(session.mediaIds || []),
        status: 'DRAFT',
        scheduledAt: session.scheduledAt || null,
        createdVia: 'telegram',
      },
    })

    // Get client with channels
    const client = await prisma.client.findUnique({
      where: { id: session.clientId! },
      include: {
        channels: {
          where: { isEnabled: true },
        },
      },
    })

    if (!client || client.channels.length === 0) {
      await ctx.reply('✅ Post created as draft. No enabled channels found.')
      return
    }

    // Update post status to READY
    await prisma.postRequest.update({
      where: { id: post.id },
      data: { status: 'READY' },
    })

    const channelNames = client.channels.map(ch =>
      ch.type === 'FACEBOOK_PAGE' ? `📘 ${ch.name || 'Facebook'}` : `📸 ${ch.name || 'Instagram'}`,
    ).join('\n  • ')

    // Handle immediate vs scheduled publishing
    if (session.publishMode === 'now') {
      // Create publications and queue jobs immediately
      const publications = await Promise.all(
        client.channels.map(channel =>
          prisma.publication.create({
            data: {
              postRequestId: post.id,
              channelId: channel.id,
              status: 'queued',
            },
          }),
        ),
      )

      // Queue publishing jobs
      try {
        const { getPublishQueue } = await import('../../utils/queue')
        const publishQueue = await getPublishQueue()

        for (const publication of publications) {
          await publishQueue.add('publish-post', {
            publicationId: publication.id,
          })
        }
      }
      catch (error) {
        console.error('Failed to queue publications:', error)
      }

      await ctx.reply(
        `✅ *Post Published Successfully!*\n\n`
        + `🚀 Your post is now being published to:\n\n`
        + `  • ${channelNames}\n\n`
        + `━━━━━━━━━━━━━━━━\n`
        + `📊 View status in the dashboard\n`
        + `📝 Post ID: \`${post.id}\`\n\n`
        + `Type /new to create another post!`,
        { parse_mode: 'Markdown' },
      )
    }
    else {
      // Scheduled post - don't create publications yet (scheduler will handle it)
      await ctx.reply(
        `✅ *Post Scheduled Successfully!*\n\n`
        + `📅 *Scheduled for:* ${session.scheduledAt?.toLocaleString()}\n\n`
        + `📢 *Will publish to:*\n  • ${channelNames}\n\n`
        + `━━━━━━━━━━━━━━━━\n`
        + `The post will be automatically published at the scheduled time.\n\n`
        + `📊 View status in the dashboard\n`
        + `📝 Post ID: \`${post.id}\`\n\n`
        + `Type /new to create another post!`,
        { parse_mode: 'Markdown' },
      )
    }
  }
  catch (error: any) {
    await ctx.reply(`❌ *Failed to Create Post*\n\n${error.message}\n\nPlease try again with /new`, {
      parse_mode: 'Markdown',
    })
  }
}

export const postWizard = new Scenes.WizardScene<Scenes.WizardContext>(
  'post-wizard',
  // Step 1: Select client
  async (ctx) => {
    const clients = await prisma.client.findMany({
      include: {
        channels: {
          where: {
            isEnabled: true,
          },
        },
      },
    })

    const clientsWithChannels = clients.filter(c => c.channels.length > 0)

    if (clientsWithChannels.length === 0) {
      await ctx.reply('❌ No clients with enabled channels found.\n\n'
        + 'Please configure clients in the dashboard first.')
      return ctx.scene.leave()
    }

    const keyboard = Markup.inlineKeyboard(
      clientsWithChannels.map(client => [
        Markup.button.callback(
          `👤 ${client.name} • ${client.channels.length} ${client.channels.length === 1 ? 'channel' : 'channels'}`,
          `client:${client.id}`,
        ),
      ]),
    )

    await ctx.reply('🎯 *Select a Client*\n\nChoose which client to create a post for:', {
      parse_mode: 'Markdown',
      ...keyboard,
    })
    return ctx.wizard.next()
  },
  // Step 2: Handle client selection and ask for post type
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Please select a client from the buttons above.')
      return
    }

    const data = ctx.callbackQuery.data
    if (!data.startsWith('client:')) {
      return
    }

    const clientId = data.replace('client:', '')
    const session = ctx.scene.session as WizardSession
    session.clientId = clientId

    // Get client name
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    })
    session.clientName = client?.name || 'Unknown'

    await ctx.answerCbQuery()
    await ctx.editMessageText(
      `✅ *Client Selected:* ${session.clientName}\n\n`
      + '📝 *Choose Post Type*\n\n'
      + 'Select the type of content you want to post:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📷 Single Image', 'type:SINGLE_IMAGE')],
          [Markup.button.callback('🎞️ Carousel (2-10 images)', 'type:CAROUSEL')],
          [Markup.button.callback('🎥 Video/Reel', 'type:VIDEO')],
          [Markup.button.callback('📱 Story (Instagram)', 'type:STORY')],
        ]),
      },
    )
    return ctx.wizard.next()
  },
  // Step 3: Handle post type and ask for media
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Please select a post type from the buttons above.')
      return
    }

    const data = ctx.callbackQuery.data
    if (!data.startsWith('type:')) {
      return
    }

    const postType = data.replace('type:', '')
    const session = ctx.scene.session as WizardSession
    session.postType = postType
    session.mediaUrls = []
    session.mediaIds = []

    await ctx.answerCbQuery()

    let message = ''
    let emoji = ''
    if (postType === 'SINGLE_IMAGE') {
      emoji = '📷'
      message = `${emoji} *Single Image Post*\n\n`
        + '📤 Please send *1 image* file.\n\n'
        + 'Recommended: 1080x1080px or 1080x1350px'
    }
    else if (postType === 'CAROUSEL') {
      emoji = '🎞️'
      message = `${emoji} *Carousel Post*\n\n`
        + '📤 Please send *2-10 images* (send them one by one)\n\n'
        + 'Type /done when finished uploading all images.\n\n'
        + 'Recommended: 1080x1080px (square format)'
    }
    else if (postType === 'VIDEO') {
      emoji = '🎥'
      message = `${emoji} *Video/Reel Post*\n\n`
        + '📤 Please send *1 video* file.\n\n'
        + '• Max duration: 60 seconds (recommended)\n'
        + '• Recommended: 1080x1920px (9:16 for Reels)'
    }
    else if (postType === 'STORY') {
      emoji = '📱'
      message = `${emoji} *Instagram Story*\n\n`
        + '📤 Please send *1 image or video* file.\n\n'
        + '• Images: JPG/PNG format\n'
        + '• Videos: Max 15 seconds\n'
        + '• Recommended: 1080x1920px (9:16 aspect ratio)'
    }

    await ctx.editMessageText(
      `✅ *Post Type Selected:* ${postType.replace('_', ' ')}\n\n━━━━━━━━━━━━━━━━\n\n${message}`,
      { parse_mode: 'Markdown' },
    )
    return ctx.wizard.next()
  },
  // Step 4: Handle media uploads
  async (ctx) => {
    const session = ctx.scene.session as WizardSession

    // Check for /done command (for carousel)
    if (ctx.message && 'text' in ctx.message && ctx.message.text === '/done') {
      if (session.postType === 'CAROUSEL') {
        if (!session.mediaUrls || session.mediaUrls.length < 2) {
          await ctx.reply('Please send at least 2 images for a carousel.')
          return
        }
        // Move to caption step
        await ctx.reply('Great! Now please enter the caption for your post:')
        return ctx.wizard.next()
      }
    }

    // Handle photo
    if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1] // Get highest resolution
      const fileId = photo.file_id

      try {
        // Download file from Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId)
        const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        // Save file
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }

        const timestamp = Date.now()
        const filename = `telegram-${timestamp}.jpg`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)

        // Create MediaAsset
        const mediaAsset = await prisma.mediaAsset.create({
          data: {
            filename,
            mimeType: 'image/jpeg',
            bytes: buffer.length,
            url: `/uploads/${filename}`,
            thumbUrl: `/uploads/${filename}`,
          },
        })

        if (!session.mediaUrls)
          session.mediaUrls = []
        if (!session.mediaIds)
          session.mediaIds = []

        session.mediaUrls.push(mediaAsset.url)
        session.mediaIds.push(mediaAsset.id)

        if (session.postType === 'SINGLE_IMAGE' || session.postType === 'STORY') {
          await ctx.reply('✅ Image received! Now please enter the caption for your post:')
          return ctx.wizard.next()
        }
        else if (session.postType === 'CAROUSEL') {
          await ctx.reply(`✅ Image ${session.mediaUrls.length} received. Send more images or type /done to continue.`)
        }
      }
      catch (error: any) {
        await ctx.reply(`Failed to process image: ${error.message}`)
      }
    }
    // Handle video
    else if (ctx.message && 'video' in ctx.message) {
      const video = ctx.message.video
      const fileId = video.file_id

      try {
        // Download file from Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId)
        const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        // Save file
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }

        const timestamp = Date.now()
        const filename = `telegram-${timestamp}.mp4`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)

        // Create MediaAsset
        const mediaAsset = await prisma.mediaAsset.create({
          data: {
            filename,
            mimeType: 'video/mp4',
            bytes: buffer.length,
            url: `/uploads/${filename}`,
            thumbUrl: null,
          },
        })

        if (!session.mediaUrls)
          session.mediaUrls = []
        if (!session.mediaIds)
          session.mediaIds = []

        session.mediaUrls.push(mediaAsset.url)
        session.mediaIds.push(mediaAsset.id)

        if (session.postType === 'VIDEO' || session.postType === 'STORY') {
          await ctx.reply('✅ Video received! Now please enter the caption for your post:')
          return ctx.wizard.next()
        }
      }
      catch (error: any) {
        await ctx.reply(`Failed to process video: ${error.message}`)
      }
    }
    else {
      await ctx.reply('Please send a photo or video.')
    }
  },
  // Step 5: Handle caption and confirm
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please enter a caption as text.')
      return
    }

    const session = ctx.scene.session as WizardSession
    session.caption = ctx.message.text

    // Get client details with channels
    const client = await prisma.client.findUnique({
      where: { id: session.clientId! },
      include: {
        channels: {
          where: { isEnabled: true },
        },
      },
    })

    const channelList = client?.channels
      .map(ch => `  • ${ch.type === 'FACEBOOK_PAGE' ? '📘 Facebook' : '📸 Instagram'}: ${ch.name || 'Unnamed'}`)
      .join('\n') || '  • No channels'

    const postTypeDisplay = session.postType === 'SINGLE_IMAGE'
      ? '📷 Single Image'
      : session.postType === 'CAROUSEL'
        ? '🎞️ Carousel'
        : session.postType === 'VIDEO'
          ? '🎥 Video/Reel'
          : '📱 Story'

    await ctx.reply(
      `━━━━━━━━━━━━━━━━\n`
      + `📋 *POST PREVIEW*\n`
      + `━━━━━━━━━━━━━━━━\n\n`
      + `👤 *Client:* ${session.clientName}\n`
      + `${postTypeDisplay} *Type:* ${session.postType?.replace('_', ' ')}\n`
      + `📁 *Media Files:* ${session.mediaUrls?.length || 0}\n\n`
      + `✍️ *Caption:*\n${session.caption}\n\n`
      + `━━━━━━━━━━━━━━━━\n`
      + `📢 *Will Publish To:*\n${channelList}\n`
      + `━━━━━━━━━━━━━━━━\n\n`
      + `Ready to publish this post?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Publish Now', 'publish:now')],
          [Markup.button.callback('📅 Schedule for Later', 'publish:schedule')],
          [Markup.button.callback('❌ Cancel', 'publish:cancel')],
        ]),
      },
    )
    return ctx.wizard.next()
  },
  // Step 6: Handle publish mode selection
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Please select an option from the buttons above.')
      return
    }

    const data = ctx.callbackQuery.data
    const session = ctx.scene.session as WizardSession

    if (data === 'publish:cancel') {
      await ctx.answerCbQuery()
      await ctx.reply('❌ *Post Cancelled*\n\nThe post was not created.\n\nType /new to start over.', {
        parse_mode: 'Markdown',
      })
      return ctx.scene.leave()
    }

    if (data === 'publish:now') {
      session.publishMode = 'now'
      await ctx.answerCbQuery()
      // Publish immediately
      await publishPost(ctx, session)
      return ctx.scene.leave()
    }

    if (data === 'publish:schedule') {
      session.publishMode = 'scheduled'
      await ctx.answerCbQuery()
      await ctx.reply(
        `📅 *Schedule Your Post*\n\n`
        + `Please enter the date and time when you want to publish this post.\n\n`
        + `*Format:* \`YYYY-MM-DD HH:mm\`\n\n`
        + `*Examples:*\n`
        + `• \`2025-10-17 14:30\`\n`
        + `• \`2025-12-25 09:00\`\n\n`
        + `Or type /now to publish immediately instead.`,
        { parse_mode: 'Markdown' },
      )
      return ctx.wizard.next()
    }
  },
  // Step 7: Handle schedule datetime input
  async (ctx) => {
    const session = ctx.scene.session as WizardSession

    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please enter a date and time in the format: YYYY-MM-DD HH:mm')
      return
    }

    const text = ctx.message.text.trim()

    // Allow /now to skip scheduling
    if (text === '/now') {
      session.publishMode = 'now'
      session.scheduledAt = undefined
      await publishPost(ctx, session)
      return ctx.scene.leave()
    }

    // Parse datetime in format: YYYY-MM-DD HH:mm
    const datetimeRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
    const match = text.match(datetimeRegex)

    if (!match) {
      await ctx.reply(
        `❌ *Invalid Format*\n\n`
        + `Please use the format: \`YYYY-MM-DD HH:mm\`\n\n`
        + `Example: \`2025-10-17 14:30\``,
        { parse_mode: 'Markdown' },
      )
      return
    }

    const [, year, month, day, hour, minute] = match
    const scheduledDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)

    // Validate date
    if (Number.isNaN(scheduledDate.getTime())) {
      await ctx.reply('❌ Invalid date. Please check your input and try again.')
      return
    }

    // Check if date is in the future
    const now = new Date()
    if (scheduledDate <= now) {
      await ctx.reply(
        `❌ *Date Must Be In The Future*\n\n`
        + `The scheduled time must be later than the current time.\n\n`
        + `Current time: ${now.toLocaleString()}\n`
        + `Your input: ${scheduledDate.toLocaleString()}`,
        { parse_mode: 'Markdown' },
      )
      return
    }

    // Store the scheduled date
    session.scheduledAt = scheduledDate

    await ctx.reply(
      `✅ *Schedule Set*\n\n`
      + `Your post will be published on:\n`
      + `📅 ${scheduledDate.toLocaleString()}\n\n`
      + `Proceeding to publish...`,
      { parse_mode: 'Markdown' },
    )

    // Publish the scheduled post
    await publishPost(ctx, session)
    return ctx.scene.leave()
  },
)
