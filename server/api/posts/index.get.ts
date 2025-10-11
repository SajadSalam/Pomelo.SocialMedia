import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { status, clientId, dateFrom, dateTo, limit = '50' } = query

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom as string)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo as string)
      }
    }

    const posts = await prisma.postRequest.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: Number.parseInt(limit as string) || 50,
    })

    return {
      success: true,
      posts,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch posts',
    })
  }
})
