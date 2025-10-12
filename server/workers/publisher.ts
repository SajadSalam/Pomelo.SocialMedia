/* eslint-disable no-console */
import type { Worker } from 'bullmq'
import type Redis from 'ioredis'
import {
  createFacebookCarousel,
  createFacebookPost,
  createInstagramCarousel,
  createInstagramPost,
  uploadPhoto,
  uploadVideo,
} from '../utils/facebook'
import prisma from '../utils/prisma'

let _publishWorker: Worker | null = null
let _connection: Redis | null = null

function initializeWorker() {
  if (_publishWorker) {
    return _publishWorker
  }

  // Only initialize if we're in a server context (not during build)
  if (typeof process === 'undefined' || !process.server) {
    console.log('⏭️  Skipping worker initialization (not in server context)')
    return null
  }

  try {
    const { Worker } = require('bullmq')
    const Redis = require('ioredis')
    const config = useRuntimeConfig()

    // Create Redis connection
    const connection = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    
    _connection = connection

    // Handle connection errors gracefully
    connection.on('error', (err: any) => {
      console.error('Redis connection error in worker:', err.message)
    })

    // Connect to Redis
    connection.connect().catch((err: any) => {
      console.error('Failed to connect to Redis in worker:', err.message)
    })

    // Create worker for publish-post queue
    _publishWorker = new Worker(
  'publish-post',
  async (job: any) => {
    const { publicationId } = job.data

    console.log(`Processing publication ${publicationId}`)

    let channel: any = null
    let postRequest: any = null

    try {
      // Get publication with related data
      const publication = await prisma.publication.findUnique({
        where: { id: publicationId },
        include: {
          channel: true,
          postRequest: {
            include: {
              client: true,
            },
          },
        },
      })

      if (!publication) {
        throw new Error('Publication not found')
      }

      if (!publication.channel.accessToken) {
        throw new Error('Channel access token not configured')
      }

      channel = publication.channel
      postRequest = publication.postRequest
      const mediaIds = JSON.parse(postRequest.mediaIds)

      // Get media assets
      const mediaAssets = await prisma.mediaAsset.findMany({
        where: {
          id: {
            in: mediaIds,
          },
        },
      })

      if (mediaAssets.length === 0) {
        throw new Error('No media assets found')
      }

      // Get full URLs for media - use runtime config
      const runtimeConfig = useRuntimeConfig()
      const baseUrl = runtimeConfig.baseUrl || 'http://localhost:3001'
      const mediaUrls = mediaAssets.map(asset => `${baseUrl}${asset.url}`)

      // Get thumbnail URL if provided
      let thumbnailUrl: string | undefined
      if (postRequest.thumbnailId) {
        const thumbnail = await prisma.mediaAsset.findUnique({
          where: { id: postRequest.thumbnailId },
        })
        if (thumbnail) {
          thumbnailUrl = `${baseUrl}${thumbnail.url}`
          console.log('🖼️  [Publisher] Thumbnail found:', thumbnailUrl)
        }
      }

      console.log('🔍 [Publisher] Publishing details:')
      console.log('   - Base URL:', baseUrl)
      console.log('   - Media URLs:', mediaUrls)
      console.log('   - Channel:', `${channel.type} (${channel.externalId})`)
      console.log('   - Channel name:', channel.name)
      console.log('   - Post kind:', postRequest.kind)
      console.log('   - Media assets count:', mediaAssets.length)
      console.log('   - Media assets:', mediaAssets.map(a => ({ url: a.url, mimeType: a.mimeType })))

      let platformPostId: string

      // Publish based on channel type and post kind
      if (channel.type === 'FACEBOOK_PAGE') {
        if (postRequest.kind === 'SINGLE_IMAGE') {
          // Single image post
          console.log('📸 [Facebook] Creating single image post...')
          const result = await createFacebookPost(
            channel.externalId,
            {
              message: postRequest.caption,
              url: mediaUrls[0],
            },
            channel.accessToken,
          )
          console.log('✅ [Facebook] Single image post created:', result.id)
          platformPostId = result.id
        }
        else if (postRequest.kind === 'CAROUSEL') {
          // Upload all photos first
          console.log('📸 [Facebook] Uploading carousel photos...')
          const uploadedPhotos = []
          for (let i = 0; i < mediaUrls.length; i++) {
            const url = mediaUrls[i]
            console.log(`   - Uploading photo ${i + 1}/${mediaUrls.length}: ${url}`)
            const photo = await uploadPhoto(channel.externalId, url, channel.accessToken)
            console.log(`   - Photo ${i + 1} uploaded:`, photo)
            uploadedPhotos.push(photo.id)
          }

          // Create carousel post
          console.log('🎠 [Facebook] Creating carousel with', uploadedPhotos.length, 'photos')
          const result = await createFacebookCarousel(
            channel.externalId,
            uploadedPhotos,
            postRequest.caption,
            channel.accessToken,
          )
          console.log('✅ [Facebook] Carousel created:', result.id)
          platformPostId = result.id
        }
        else if (postRequest.kind === 'VIDEO') {
          // Video post
          console.log('🎥 [Facebook] Uploading video...')
          const result = await uploadVideo(
            channel.externalId,
            mediaUrls[0],
            'Video Post',
            postRequest.caption,
            channel.accessToken,
            thumbnailUrl, // Custom thumbnail
          )
          console.log('✅ [Facebook] Video uploaded:', result.id)
          platformPostId = result.id
        }
        else {
          throw new Error(`Unsupported post kind: ${postRequest.kind}`)
        }
      }
      else if (channel.type === 'INSTAGRAM_BUSINESS') {
        console.log('📷 [Instagram] Publishing to Instagram Business Account...')
        if (postRequest.kind === 'SINGLE_IMAGE') {
          // Single image post
          console.log('📸 [Instagram] Creating single image post...')
          console.log('   - Image URL:', mediaUrls[0])
          const result = await createInstagramPost(
            channel.externalId,
            {
              caption: postRequest.caption,
              image_url: mediaUrls[0],
              media_type: 'IMAGE',
            },
            channel.accessToken,
          )
          console.log('✅ [Instagram] Single image post created:', result.id)
          platformPostId = result.id
        }
        else if (postRequest.kind === 'CAROUSEL') {
          // Carousel post
          console.log('🎠 [Instagram] Creating carousel with', mediaUrls.length, 'items')
          console.log('   - Media URLs:', mediaUrls)
          const result = await createInstagramCarousel(
            channel.externalId,
            mediaUrls,
            postRequest.caption,
            channel.accessToken,
          )
          console.log('✅ [Instagram] Carousel created:', result.id)
          platformPostId = result.id
        }
        else if (postRequest.kind === 'VIDEO') {
          // Video/Reel post
          console.log('🎥 [Instagram] Creating video post...')
          console.log('   - Video URL:', mediaUrls[0])
          
          const result = await createInstagramPost(
            channel.externalId,
            {
              caption: postRequest.caption,
              video_url: mediaUrls[0],
              media_type: 'REELS',
            },
            channel.accessToken,
          )
          console.log('✅ [Instagram] Video post created:', result.id)
          platformPostId = result.id
        }
        else {
          throw new Error(`Unsupported post kind: ${postRequest.kind}`)
        }
      }
      else {
        throw new Error(`Unsupported channel type: ${channel.type}`)
      }

      // Update publication status
      await prisma.publication.update({
        where: { id: publicationId },
        data: {
          status: 'published',
          platformPostId,
          error: null,
        },
      })

      // Update post request status if all publications are published
      const allPublications = await prisma.publication.findMany({
        where: { postRequestId: postRequest.id },
      })

      const allPublished = allPublications.every(p => p.status === 'published')
      if (allPublished) {
        await prisma.postRequest.update({
          where: { id: postRequest.id },
          data: { status: 'PUBLISHED' },
        })
      }

      // Emit SSE event for real-time update
      try {
        const { emitPublicationUpdate } = await import('../utils/events')
        emitPublicationUpdate({
          publicationId,
          status: 'published',
          platformPostId,
        })
      }
      catch (error) {
        console.error('Failed to emit SSE event:', error)
      }

      console.log(`✅ Published to ${channel.type}: ${platformPostId}`)

      return { success: true, platformPostId }
    }
    catch (error: any) {
      console.error(`❌ Failed to publish:`, error.message)
      if (channel) {
        console.error(`   - Channel: ${channel.type} (${channel.externalId})`)
        console.error(`   - Has Access Token: ${!!channel.accessToken}`)

        // Check if it's a permissions error
        if (error.message.includes('pages_read_engagement') || error.message.includes('pages_manage_posts')) {
          console.error(`\n⚠️  TOKEN PERMISSIONS ERROR!`)
          console.error(`   Your access token is missing required permissions.\n`)
          console.error(`   Required permissions for ${channel.type}:`)
          if (channel.type === 'FACEBOOK_PAGE') {
            console.error(`   ✓ pages_read_engagement`)
            console.error(`   ✓ pages_manage_posts`)
          }
          else {
            console.error(`   ✓ pages_read_engagement`)
            console.error(`   ✓ pages_manage_posts`)
            console.error(`   ✓ instagram_basic`)
            console.error(`   ✓ instagram_content_publish`)
          }
          console.error(`\n   📋 How to fix:`)
          console.error(`   1. Go to: https://developers.facebook.com/tools/explorer/`)
          console.error(`   2. Get a new Page Access Token with required permissions`)
          console.error(`   3. Update channel "${channel.name}" with the new token`)
          console.error(`   4. Test token: POST /api/channels/${channel.id}/validate-token\n`)
        }
      }
      console.error(`   - Full error:`, error)

      // Update publication with error
      await prisma.publication.update({
        where: { id: publicationId },
        data: {
          status: 'failed',
          error: error.message,
        },
      })

      // Update post request status
      const publication = await prisma.publication.findUnique({
        where: { id: publicationId },
      })

      if (publication) {
        await prisma.postRequest.update({
          where: { id: publication.postRequestId },
          data: { status: 'FAILED' },
        })
      }

      // Emit SSE event for failure
      try {
        const { emitPublicationUpdate } = await import('../utils/events')
        emitPublicationUpdate({
          publicationId,
          status: 'failed',
          error: error.message,
        })
      }
      catch (err) {
        console.error('Failed to emit SSE event:', err)
      }

      throw error
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 publications in parallel
  },
)

    if (_publishWorker) {
      _publishWorker.on('completed', (job: any) => {
        console.log(`✅ Job ${job.id} completed`)
      })

      _publishWorker.on('failed', (job: any, err: any) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message)
      })

      console.log('✅ Publishing worker started')
    }

    return _publishWorker
  }
  catch (error: any) {
    console.error('Failed to initialize worker:', error.message)
    return null
  }
}

// Export function to get worker
export function getPublishWorker() {
  return initializeWorker()
}

// Default export for backward compatibility
export default getPublishWorker()
