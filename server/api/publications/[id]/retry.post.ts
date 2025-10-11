import prisma from '../../../../server/utils/prisma'
import { publishQueue } from '../../../../server/utils/queue'

export default defineEventHandler(async (event) => {
  try {
    const publicationId = getRouterParam(event, 'id')

    if (!publicationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Publication ID is required',
      })
    }

    // Get the publication
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        postRequest: true,
        channel: true,
      },
    })

    if (!publication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Publication not found',
      })
    }

    // Only retry failed publications
    if (publication.status !== 'failed') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only failed publications can be retried',
      })
    }

    // Reset publication status and clear error
    await prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: 'queued',
        error: null,
        platformPostId: null,
      },
    })

    // Re-queue the job
    await publishQueue.add('publish-post', {
      publicationId,
      postRequestId: publication.postRequest.id,
      channelId: publication.channel.id,
    })

    // eslint-disable-next-line no-console
    console.log(`🔄 Retrying publication ${publicationId}`)

    return {
      success: true,
      message: 'Publication queued for retry',
    }
  }
  catch (error: any) {
    console.error('Failed to retry publication:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to retry publication',
    })
  }
})
