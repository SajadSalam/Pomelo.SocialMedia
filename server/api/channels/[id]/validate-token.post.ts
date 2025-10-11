import prisma from '../../../utils/prisma'
import { getTokenInstructions, validateFacebookToken } from '../../../utils/tokenValidator'

export default defineEventHandler(async (event) => {
  try {
    const channelId = getRouterParam(event, 'id')

    if (!channelId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Channel ID is required',
      })
    }

    // Get the channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found',
      })
    }

    if (!channel.accessToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Channel does not have an access token configured',
      })
    }

    // Validate the token
    const validation = await validateFacebookToken(
      channel.accessToken,
      channel.type as 'FACEBOOK_PAGE' | 'INSTAGRAM_BUSINESS',
    )

    return {
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        externalId: channel.externalId,
      },
      validation: {
        isValid: validation.isValid,
        hasAllPermissions: validation.errors.length === 0,
        tokenType: validation.type,
        appId: validation.appId,
        scopes: validation.scopes,
        errors: validation.errors,
        expiresAt: validation.expiresAt,
      },
      instructions: validation.errors.length > 0
        ? getTokenInstructions(channel.type as 'FACEBOOK_PAGE' | 'INSTAGRAM_BUSINESS')
        : null,
    }
  }
  catch (error: any) {
    console.error('Failed to validate token:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate token',
    })
  }
})
