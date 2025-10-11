import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Get total posts count
    const totalPosts = await prisma.postRequest.count()

    // Get posts by status
    const publishedPosts = await prisma.postRequest.count({
      where: { status: 'PUBLISHED' },
    })

    const scheduledPosts = await prisma.postRequest.count({
      where: {
        status: 'READY',
        scheduledAt: {
          not: null,
        },
      },
    })

    const draftPosts = await prisma.postRequest.count({
      where: { status: 'DRAFT' },
    })

    // Get total reach and impressions
    const reachInsights = await prisma.insight.findMany({
      where: {
        metric: {
          in: ['reach', 'post_impressions', 'impressions'],
        },
      },
    })

    const totalReach = reachInsights.reduce((sum, insight) => sum + insight.value, 0)

    // Get total engagement
    const engagementInsights = await prisma.insight.findMany({
      where: {
        metric: {
          in: ['engagement', 'post_engaged_users', 'likes', 'comments', 'shares', 'saves'],
        },
      },
    })

    const totalEngagement = engagementInsights.reduce((sum, insight) => sum + insight.value, 0)

    // Calculate engagement rate
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0

    // Get platform breakdown
    const facebookPublications = await prisma.publication.count({
      where: {
        status: 'published',
        channel: {
          type: 'FACEBOOK_PAGE',
        },
      },
    })

    const instagramPublications = await prisma.publication.count({
      where: {
        status: 'published',
        channel: {
          type: 'INSTAGRAM_BUSINESS',
        },
      },
    })

    return {
      success: true,
      summary: {
        totalPosts,
        publishedPosts,
        scheduledPosts,
        draftPosts,
        totalReach: Math.round(totalReach),
        totalEngagement: Math.round(totalEngagement),
        engagementRate: engagementRate.toFixed(2),
        platformBreakdown: {
          facebook: facebookPublications,
          instagram: instagramPublications,
        },
      },
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch insights summary',
    })
  }
})

