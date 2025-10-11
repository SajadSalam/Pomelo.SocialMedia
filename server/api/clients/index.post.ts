import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, notes } = body

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client name is required',
      })
    }

    const client = await prisma.client.create({
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
      statusMessage: error.message || 'Failed to create client',
    })
  }
})

