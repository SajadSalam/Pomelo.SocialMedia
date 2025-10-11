/* eslint-disable no-console */
import axios from 'axios'
import FormData from 'form-data'
import { Buffer } from 'node:buffer'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

interface FacebookError {
  error: {
    message: string
    type: string
    code: number
  }
}

/**
 * Upload photo to Facebook/Instagram
 */
export async function uploadPhoto(
  pageId: string,
  imageUrl: string,
  accessToken: string,
): Promise<{ id: string }> {
  try {
    console.log('📤 [Facebook API] Uploading photo...')
    console.log('   - Page ID:', pageId)
    console.log('   - Image URL:', imageUrl)
    console.log('   - API Endpoint:', `${GRAPH_API_BASE}/${pageId}/photos`)

    const response = await axios.post(
      `${GRAPH_API_BASE}/${pageId}/photos`,
      {
        url: imageUrl,
        published: false, // Upload unpublished for carousel
        access_token: accessToken,
      },
    )
    console.log('✅ [Facebook API] Photo uploaded:', response.data)
    return response.data
  }
  catch (error: any) {
    console.error('❌ [Facebook API] Photo upload failed:', error.response?.data || error.message)
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to upload photo')
  }
}

/**
 * Create a single image post on Facebook Page
 */
export async function createFacebookPost(
  pageId: string,
  params: {
    message: string
    url?: string
    attached_media?: Array<{ media_fbid: string }>
  },
  accessToken: string,
): Promise<{ id: string }> {
  try {
    // If there's an image URL, use the /photos endpoint
    if (params.url) {
      console.log('📤 [Facebook API] Posting photo to /photos endpoint')
      const response = await axios.post(
        `${GRAPH_API_BASE}/${pageId}/photos`,
        {
          url: params.url,
          caption: params.message,
          published: true,
          access_token: accessToken,
        },
      )
      console.log('✅ [Facebook API] Photo posted:', response.data)
      return response.data
    }

    // Otherwise use the /feed endpoint for text or attached media
    console.log('📤 [Facebook API] Posting to /feed endpoint')
    const response = await axios.post(
      `${GRAPH_API_BASE}/${pageId}/feed`,
      {
        message: params.message,
        attached_media: params.attached_media,
        access_token: accessToken,
      },
    )
    return response.data
  }
  catch (error: any) {
    console.error('❌ [Facebook API] Failed to create post:', error.response?.data || error.message)
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to create Facebook post')
  }
}

/**
 * Create a carousel post on Facebook Page
 */
export async function createFacebookCarousel(
  pageId: string,
  mediaIds: string[],
  caption: string,
  accessToken: string,
): Promise<{ id: string }> {
  try {
    const attached_media = mediaIds.map(id => ({ media_fbid: id }))

    const response = await axios.post(
      `${GRAPH_API_BASE}/${pageId}/feed`,
      {
        message: caption,
        attached_media,
        access_token: accessToken,
      },
    )
    return response.data
  }
  catch (error: any) {
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to create Facebook carousel')
  }
}

/**
 * Poll Instagram media container status until ready
 */
async function pollContainerStatus(
  containerId: string,
  accessToken: string,
  maxAttempts = 30,
  delayMs = 2000,
): Promise<void> {
  console.log(`⏳ [Instagram API] Polling container status: ${containerId}`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${GRAPH_API_BASE}/${containerId}`,
        {
          params: {
            fields: 'status_code,status',
            access_token: accessToken,
          },
        },
      )

      const status = response.data.status_code
      console.log(`   - Attempt ${attempt}/${maxAttempts}: Status = ${status}`)

      if (status === 'FINISHED') {
        console.log('✅ [Instagram API] Container is ready!')
        return
      }

      if (status === 'ERROR') {
        throw new Error('Container processing failed')
      }

      // Wait before next attempt (IN_PROGRESS)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    catch (error: any) {
      // If it's not a status check error, rethrow
      if (error.message === 'Container processing failed') {
        throw error
      }
      // Otherwise, continue polling
      if (attempt === maxAttempts) {
        throw new Error('Container processing timeout')
      }
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw new Error('Container not ready after polling')
}

/**
 * Create Instagram post
 */
export async function createInstagramPost(
  instagramAccountId: string,
  params: {
    caption: string
    image_url?: string
    video_url?: string
    thumb_offset?: number
    media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS'
    children?: string[]
  },
  accessToken: string,
): Promise<{ id: string }> {
  try {
    console.log('📤 [Instagram API] Creating Instagram post...')
    console.log('   - Instagram Account ID:', instagramAccountId)
    console.log('   - Params:', JSON.stringify(params, null, 2))
    console.log('   - API Endpoint:', `${GRAPH_API_BASE}/${instagramAccountId}/media`)

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${GRAPH_API_BASE}/${instagramAccountId}/media`,
      {
        ...params,
        access_token: accessToken,
      },
    )

    const containerId = containerResponse.data.id
    console.log('✅ [Instagram API] Container created:', containerId)

    // Step 2: For videos/reels, wait until processing is complete
    if (params.media_type === 'VIDEO' || params.media_type === 'REELS') {
      await pollContainerStatus(containerId, accessToken)
    }

    // Step 3: Publish the container
    console.log('📤 [Instagram API] Publishing container...')
    const publishResponse = await axios.post(
      `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken,
      },
    )

    console.log('✅ [Instagram API] Post published:', publishResponse.data.id)
    return publishResponse.data
  }
  catch (error: any) {
    console.error('❌ [Instagram API] Failed to create post:', error.response?.data || error.message)
    console.error('   - Request params:', JSON.stringify(params, null, 2))
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to create Instagram post')
  }
}

/**
 * Create Instagram carousel post
 */
export async function createInstagramCarousel(
  instagramAccountId: string,
  imageUrls: string[],
  caption: string,
  accessToken: string,
): Promise<{ id: string }> {
  try {
    console.log('📤 [Instagram API] Creating Instagram carousel...')
    console.log('   - Instagram Account ID:', instagramAccountId)
    console.log('   - Image URLs:', imageUrls)
    console.log('   - Caption:', caption)

    // Step 1: Create item containers for each image
    const itemIds = []
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]
      console.log(`   - Creating carousel item ${i + 1}/${imageUrls.length}: ${imageUrl}`)
      const response = await axios.post(
        `${GRAPH_API_BASE}/${instagramAccountId}/media`,
        {
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: accessToken,
        },
      )
      console.log(`   - Carousel item ${i + 1} created:`, response.data.id)
      itemIds.push(response.data.id)
    }

    // Step 2: Create carousel container
    console.log('📤 [Instagram API] Creating carousel container with items:', itemIds)
    const carouselResponse = await axios.post(
      `${GRAPH_API_BASE}/${instagramAccountId}/media`,
      {
        caption,
        media_type: 'CAROUSEL',
        children: itemIds,
        access_token: accessToken,
      },
    )

    const carouselId = carouselResponse.data.id

    // Step 3: Publish the carousel
    const publishResponse = await axios.post(
      `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`,
      {
        creation_id: carouselId,
        access_token: accessToken,
      },
    )

    return publishResponse.data
  }
  catch (error: any) {
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to create Instagram carousel')
  }
}

/**
 * Upload video to Facebook with optional custom thumbnail
 */
export async function uploadVideo(
  pageId: string,
  videoUrl: string,
  title: string,
  description: string,
  accessToken: string,
  thumbnailUrl?: string,
): Promise<{ id: string }> {
  try {
    // Step 1: Upload the video
    console.log('📤 [Facebook API] Uploading video...')
    const videoResponse = await axios.post(
      `${GRAPH_API_BASE}/${pageId}/videos`,
      {
        file_url: videoUrl,
        title,
        description,
        access_token: accessToken,
      },
    )

    const videoId = videoResponse.data.id
    console.log('✅ [Facebook API] Video uploaded:', videoId)

    // Step 2: Update with custom thumbnail if provided
    if (thumbnailUrl) {
      console.log('📸 [Facebook API] Setting custom thumbnail:', thumbnailUrl)
      try {
        // Facebook requires binary image data, not URLs
        // Download the image first
        console.log('📥 [Facebook API] Downloading thumbnail image...')
        const imageResponse = await axios.get(thumbnailUrl, {
          responseType: 'arraybuffer',
        })
        const imageBuffer = Buffer.from(imageResponse.data, 'binary')

        // Determine content type
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg'

        console.log('📤 [Facebook API] Uploading thumbnail as binary data...')

        // Create form data
        const formData = new FormData()
        formData.append('source', imageBuffer, {
          filename: 'thumbnail.jpg',
          contentType,
        })
        formData.append('access_token', accessToken)

        // Upload thumbnail
        const thumbResponse = await axios.post(
          `${GRAPH_API_BASE}/${videoId}/thumbnails`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        )
        console.log('✅ [Facebook API] Thumbnail updated successfully:', thumbResponse.data)
      }
      catch (thumbError: any) {
        const errorMsg = thumbError.response?.data?.error?.message || thumbError.message
        console.error('❌ [Facebook API] Failed to set thumbnail:', errorMsg)
        console.error('   - Full error:', thumbError.response?.data)
        // Don't fail the whole upload if thumbnail fails
      }
    }

    return videoResponse.data
  }
  catch (error: any) {
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to upload video')
  }
}

/**
 * Fetch post insights from Facebook
 */
export async function fetchFacebookInsights(
  postId: string,
  accessToken: string,
): Promise<any> {
  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${postId}/insights`,
      {
        params: {
          metric: 'post_impressions,post_engaged_users,post_clicks',
          access_token: accessToken,
        },
      },
    )
    return response.data
  }
  catch (error: any) {
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to fetch Facebook insights')
  }
}

/**
 * Fetch Instagram insights
 */
export async function fetchInstagramInsights(
  mediaId: string,
  accessToken: string,
): Promise<any> {
  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${mediaId}/insights`,
      {
        params: {
          metric: 'impressions,reach,engagement,likes,comments,saves,shares',
          access_token: accessToken,
        },
      },
    )
    return response.data
  }
  catch (error: any) {
    const fbError = error.response?.data as FacebookError
    throw new Error(fbError?.error?.message || 'Failed to fetch Instagram insights')
  }
}
