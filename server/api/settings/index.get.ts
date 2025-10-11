import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    })

    // Create settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.userId,
        },
      })
    }

    return {
      success: true,
      settings,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch settings',
    })
  }
})

