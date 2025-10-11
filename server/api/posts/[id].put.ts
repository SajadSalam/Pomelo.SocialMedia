import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { caption, mediaIds, thumbnailId, scheduledAt, status } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID is required',
      })
    }

    const updateData: any = {}

    if (caption !== undefined) updateData.caption = caption
    if (mediaIds !== undefined) updateData.mediaIds = JSON.stringify(mediaIds)
    if (thumbnailId !== undefined) updateData.thumbnailId = thumbnailId
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (status !== undefined) updateData.status = status

    const post = await prisma.postRequest.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        publications: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    return {
      success: true,
      post: {
        ...post,
        mediaIds: JSON.parse(post.mediaIds),
      },
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update post',
    })
  }
})

