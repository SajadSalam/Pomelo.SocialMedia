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

    const body = await readBody(event)
    const { metaLongLivedToken, metaAppId, metaAppSecret } = body

    const updateData: any = {}

    if (metaLongLivedToken !== undefined)
      updateData.metaLongLivedToken = metaLongLivedToken
    if (metaAppId !== undefined)
      updateData.metaAppId = metaAppId
    if (metaAppSecret !== undefined)
      updateData.metaAppSecret = metaAppSecret

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.userId },
      update: updateData,
      create: {
        userId: user.userId,
        ...updateData,
      },
    })

    return {
      success: true,
      settings,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update settings',
    })
  }
})
