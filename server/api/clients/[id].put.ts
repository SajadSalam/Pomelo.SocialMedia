import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { name, notes } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID is required',
      })
    }

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client name is required',
      })
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        notes: notes || null,
      },
      include: {
        channels: true,
        _count: {
          select: {
            postRequests: true,
          },
        },
      },
    })

    return {
      success: true,
      client,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update client',
    })
  }
})
