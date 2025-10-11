import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { isEnabled, accessToken, name, pageUsername } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Channel ID is required',
      })
    }

    const updateData: any = {}
    
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled
    if (accessToken !== undefined) updateData.accessToken = accessToken
    if (name !== undefined) updateData.name = name
    if (pageUsername !== undefined) updateData.pageUsername = pageUsername

    const channel = await prisma.channel.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
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
      statusMessage: error.message || 'Failed to update channel',
    })
  }
})

