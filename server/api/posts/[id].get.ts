import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID is required',
      })
    }

    const post = await prisma.postRequest.findUnique({
      where: { id },
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
                externalId: true,
              },
            },
            insights: {
              orderBy: {
                capturedAt: 'desc',
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

    // Parse mediaIds
    const postWithParsedMedia = {
      ...post,
      mediaIds: JSON.parse(post.mediaIds),
    }

    return {
      success: true,
      post: postWithParsedMedia,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch post',
    })
  }
})

