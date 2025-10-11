import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID is required',
      })
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        channels: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        postRequests: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            publications: {
              include: {
                channel: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            postRequests: true,
            channels: true,
          },
        },
      },
    })

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      })
    }

    return {
      success: true,
      client,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch client',
    })
  }
})

