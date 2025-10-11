import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID is required',
      })
    }

    await prisma.postRequest.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Post deleted successfully',
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete post',
    })
  }
})
