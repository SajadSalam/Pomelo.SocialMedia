import { fetchFacebookInsights, fetchInstagramInsights } from '../utils/facebook'
import prisma from '../utils/prisma'

export async function fetchPostInsights(publicationId: string) {
  try {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: {
        channel: true,
      },
    })

    if (!publication || !publication.platformPostId) {
      throw new Error('Publication not found or not yet published')
    }

    if (!publication.channel.accessToken) {
      throw new Error('Channel access token not configured')
    }

    let insights: any[] = []

    if (publication.channel.type === 'FACEBOOK_PAGE') {
      const data = await fetchFacebookInsights(
        publication.platformPostId,
        publication.channel.accessToken,
      )
      insights = data.data || []
    }
    else if (publication.channel.type === 'INSTAGRAM_BUSINESS') {
      const data = await fetchInstagramInsights(
        publication.platformPostId,
        publication.channel.accessToken,
      )
      insights = data.data || []
    }

    // Store insights in database
    for (const insight of insights) {
      await prisma.insight.create({
        data: {
          publicationId,
          metric: insight.name,
          value: insight.values?.[0]?.value || 0,
          period: insight.period || 'lifetime',
          capturedAt: new Date(),
        },
      })
    }

    return insights
  }
  catch (error: any) {
    console.error('Failed to fetch insights:', error.message)
    throw error
  }
}

export async function fetchInsightsForAllPublications() {
  const publications = await prisma.publication.findMany({
    where: {
      status: 'published',
      platformPostId: {
        not: null,
      },
    },
    include: {
      channel: true,
    },
  })

  const results = []
  for (const publication of publications) {
    try {
      const insights = await fetchPostInsights(publication.id)
      results.push({ publicationId: publication.id, success: true, insights })
    }
    catch (error: any) {
      results.push({ publicationId: publication.id, success: false, error: error.message })
    }
  }

  return results
}

