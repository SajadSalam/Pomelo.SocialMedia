import prisma from '../../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID is required',
      })
    }

    // Get post with client and channels
    const post = await prisma.postRequest.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            channels: {
              where: {
                isEnabled: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found',
      })
    }

    if (post.client.channels.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No enabled channels found for this client',
      })
    }

    // Update post status to READY
    await prisma.postRequest.update({
      where: { id },
      data: { status: 'READY' },
    })

    // Create publications for each enabled channel
    const publications = await Promise.all(
      post.client.channels.map(channel =>
        prisma.publication.create({
          data: {
            postRequestId: id,
            channelId: channel.id,
            status: 'queued',
          },
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        }),
      ),
    )

    // Queue publishing jobs
    try {
      const { getPublishQueue } = await import('../../../../server/utils/queue')
      const publishQueue = await getPublishQueue()
      
      for (const publication of publications) {
        await publishQueue.add('publish-post', {
          publicationId: publication.id,
        })
      }
    }
    catch (error) {
      console.error('Failed to queue publications:', error)
      // Continue even if queue fails - can be retried manually
    }

    return {
      success: true,
      message: 'Post queued for publishing',
      publications,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to publish post',
    })
  }
})
