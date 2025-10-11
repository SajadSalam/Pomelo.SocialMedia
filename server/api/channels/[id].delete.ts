import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Channel ID is required',
      })
    }

    await prisma.channel.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Channel deleted successfully',
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete channel',
    })
  }
})

