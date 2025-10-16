import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { clientId, kind, caption, mediaIds, thumbnailId, scheduledAt, createdVia = 'dashboard' } = body

    if (!clientId || !kind || !caption) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID, post type, and caption are required',
      })
    }

    // Validate kind
    const validKinds = ['SINGLE_IMAGE', 'CAROUSEL', 'VIDEO', 'STORY']
    if (!validKinds.includes(kind)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid post type',
      })
    }

    // Validate mediaIds is an array
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'At least one media file is required',
      })
    }

    // Validate carousel has 2-10 images
    if (kind === 'CAROUSEL' && (mediaIds.length < 2 || mediaIds.length > 10)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Carousel must have 2-10 images',
      })
    }

    // Validate story has exactly 1 media file
    if (kind === 'STORY' && mediaIds.length !== 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Story must have exactly 1 media file',
      })
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      })
    }

    const post = await prisma.postRequest.create({
      data: {
        clientId,
        kind,
        caption,
        mediaIds: JSON.stringify(mediaIds),
        thumbnailId: thumbnailId || null,
        status: 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdVia,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      success: true,
      post,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create post',
    })
  }
})

