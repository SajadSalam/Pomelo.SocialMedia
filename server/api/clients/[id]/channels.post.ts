import prisma from '../../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const clientId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { type, externalId, accessToken, name, pageUsername } = body

    if (!clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Client ID is required',
      })
    }

    if (!type || !externalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Channel type and external ID are required',
      })
    }

    // Validate channel type
    const validTypes = ['FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS']
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid channel type',
      })
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      })
    }

    const channel = await prisma.channel.create({
      data: {
        clientId,
        type,
        externalId,
        accessToken: accessToken || null,
        name: name || null,
        pageUsername: pageUsername || null,
        isEnabled: true,
      },
    })

    return {
      success: true,
      channel,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create channel',
    })
  }
})

