import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        channels: {
          select: {
            id: true,
            type: true,
            name: true,
            isEnabled: true,
            externalId: true,
          },
        },
        _count: {
          select: {
            postRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      clients,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch clients',
    })
  }
})

