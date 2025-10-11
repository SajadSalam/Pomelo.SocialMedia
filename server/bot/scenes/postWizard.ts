import axios from 'axios'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Markup, Scenes } from 'telegraf'
import prisma from '../../utils/prisma'

interface WizardSession extends Scenes.SceneSession {
  clientId?: string
  postType?: string
  mediaUrls?: string[]
  mediaIds?: string[]
  caption?: string
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
      await ctx.reply('No clients with enabled channels found. Please configure clients in the dashboard first.')
      return ctx.scene.leave()
    }

    const keyboard = Markup.inlineKeyboard(
      clientsWithChannels.map(client => [
        Markup.button.callback(
          `${client.name} (${client.channels.length} channels)`,
          `client:${client.id}`,
        ),
      ]),
    )

    await ctx.reply('Select a client:', keyboard)
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

    await ctx.answerCbQuery()
    await ctx.reply('Great! Now choose the post type:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📷 Single Image', 'type:SINGLE_IMAGE')],
        [Markup.button.callback('🎞️ Carousel (2-10 images)', 'type:CAROUSEL')],
        [Markup.button.callback('🎥 Video', 'type:VIDEO')],
      ]),
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

    await ctx.answerCbQuery()

    let message = ''
    if (postType === 'SINGLE_IMAGE') {
      message = 'Please send 1 image.'
    }
    else if (postType === 'CAROUSEL') {
      message = 'Please send 2-10 images (send them one by one, then type /done when finished).'
    }
    else if (postType === 'VIDEO') {
      message = 'Please send 1 video.'
    }

    await ctx.reply(message)
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

        if (!session.mediaUrls) session.mediaUrls = []
        if (!session.mediaIds) session.mediaIds = []
        
        session.mediaUrls.push(mediaAsset.url)
        session.mediaIds.push(mediaAsset.id)

        if (session.postType === 'SINGLE_IMAGE') {
          await ctx.reply('✅ Image received! Now please enter the caption for your post:')
          return ctx.wizard.next()
        }
        else if (session.postType === 'CAROUSEL') {
          await ctx.reply(`✅ Image ${session.mediaUrls.length} received. Send more images or type /done to continue.`)
          return
        }
      }
      catch (error: any) {
        await ctx.reply(`Failed to process image: ${error.message}`)
        return
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

        if (!session.mediaUrls) session.mediaUrls = []
        if (!session.mediaIds) session.mediaIds = []
        
        session.mediaUrls.push(mediaAsset.url)
        session.mediaIds.push(mediaAsset.id)

        await ctx.reply('✅ Video received! Now please enter the caption for your post:')
        return ctx.wizard.next()
      }
      catch (error: any) {
        await ctx.reply(`Failed to process video: ${error.message}`)
        return
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

    await ctx.reply(
      `📝 Summary:\n\n`
      + `Client: ${session.clientId}\n`
      + `Type: ${session.postType}\n`
      + `Media: ${session.mediaUrls?.length || 0} file(s)\n`
      + `Caption: ${session.caption}\n\n`
      + `Ready to publish?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Publish Now', 'publish:now')],
        [Markup.button.callback('❌ Cancel', 'publish:cancel')],
      ]),
    )
    return ctx.wizard.next()
  },
  // Step 6: Handle publish confirmation
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Please select an option from the buttons above.')
      return
    }

    const data = ctx.callbackQuery.data
    await ctx.answerCbQuery()

    if (data === 'publish:cancel') {
      await ctx.reply('Post creation cancelled.')
      return ctx.scene.leave()
    }

    if (data === 'publish:now') {
      const session = ctx.scene.session as WizardSession

      try {
        // Create post
        const post = await prisma.postRequest.create({
          data: {
            clientId: session.clientId!,
            kind: session.postType!,
            caption: session.caption!,
            mediaIds: JSON.stringify(session.mediaIds || []),
            status: 'DRAFT',
            createdVia: 'telegram',
          },
        })

        // Publish post
        const client = await prisma.client.findUnique({
          where: { id: session.clientId! },
          include: {
            channels: {
              where: { isEnabled: true },
            },
          },
        })

        if (client && client.channels.length > 0) {
          await prisma.postRequest.update({
            where: { id: post.id },
            data: { status: 'READY' },
          })

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
            const { publishQueue } = await import('../../utils/queue')
            for (const publication of publications) {
              await publishQueue.add('publish-post', {
                publicationId: publication.id,
              })
            }
          }
          catch (error) {
            console.error('Failed to queue publications:', error)
          }

          await ctx.reply(`✅ Post created and queued for publishing to ${publications.length} channel(s)!`)
        }
        else {
          await ctx.reply('✅ Post created as draft. No enabled channels found.')
        }
      }
      catch (error: any) {
        await ctx.reply(`❌ Failed to create post: ${error.message}`)
      }

      return ctx.scene.leave()
    }
  },
)

