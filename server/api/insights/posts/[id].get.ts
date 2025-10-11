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

    // Get post with publications and insights
    const post = await prisma.postRequest.findUnique({
      where: { id },
      include: {
        publications: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true,
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

    // Aggregate insights by metric
    const insightsByMetric: Record<string, { value: number, publications: number }> = {}

    post.publications.forEach((publication) => {
      publication.insights.forEach((insight) => {
        if (!insightsByMetric[insight.metric]) {
          insightsByMetric[insight.metric] = { value: 0, publications: 0 }
        }
        insightsByMetric[insight.metric].value += insight.value
        insightsByMetric[insight.metric].publications += 1
      })
    })

    // Format insights
    const metrics = Object.entries(insightsByMetric).map(([metric, data]) => ({
      metric,
      totalValue: Math.round(data.value),
      averageValue: Math.round(data.value / data.publications),
      publicationsCount: data.publications,
    }))

    return {
      success: true,
      post: {
        id: post.id,
        caption: post.caption,
        status: post.status,
        createdAt: post.createdAt,
      },
      metrics,
      publications: post.publications.map(pub => ({
        id: pub.id,
        channel: pub.channel,
        status: pub.status,
        platformPostId: pub.platformPostId,
        insights: pub.insights,
      })),
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch post insights',
    })
  }
})

