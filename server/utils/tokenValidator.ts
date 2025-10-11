/* eslint-disable no-console */
import axios from 'axios'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

interface TokenDebugInfo {
  isValid: boolean
  scopes: string[]
  type: string
  appId: string
  expiresAt?: number
  errors: string[]
}

/**
 * Validate Facebook/Instagram access token and check permissions
 */
export async function validateFacebookToken(
  accessToken: string,
  channelType: 'FACEBOOK_PAGE' | 'INSTAGRAM_BUSINESS',
): Promise<TokenDebugInfo> {
  const requiredPermissions = channelType === 'FACEBOOK_PAGE'
    ? ['pages_read_engagement', 'pages_manage_posts']
    : ['pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']

  const result: TokenDebugInfo = {
    isValid: false,
    scopes: [],
    type: '',
    appId: '',
    errors: [],
  }

  try {
    // Debug the token
    const response = await axios.get(
      `${GRAPH_API_BASE}/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: accessToken, // Can use the same token for debugging
        },
      },
    )

    const data = response.data.data

    if (!data.is_valid) {
      result.errors.push('Token is invalid or expired')
      return result
    }

    result.isValid = data.is_valid
    result.scopes = data.scopes || []
    result.type = data.type
    result.appId = data.app_id
    result.expiresAt = data.expires_at

    // Check for required permissions
    const missingPermissions = requiredPermissions.filter(
      perm => !result.scopes.includes(perm),
    )

    if (missingPermissions.length > 0) {
      result.errors.push(
        `Missing required permissions: ${missingPermissions.join(', ')}`,
      )
    }

    // Check token type
    if (channelType === 'FACEBOOK_PAGE' && result.type !== 'PAGE') {
      result.errors.push(
        `Wrong token type: expected PAGE token, got ${result.type}. You need to use a Page Access Token, not a User Access Token.`,
      )
    }

    return result
  }
  catch (error: any) {
    result.errors.push(
      error.response?.data?.error?.message || error.message || 'Failed to validate token',
    )
    return result
  }
}

/**
 * Generate helpful instructions for getting the correct token
 */
export function getTokenInstructions(channelType: 'FACEBOOK_PAGE' | 'INSTAGRAM_BUSINESS'): string {
  if (channelType === 'FACEBOOK_PAGE') {
    return `
📋 HOW TO GET A FACEBOOK PAGE ACCESS TOKEN:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your Facebook App from dropdown
3. Click "Get Token" → "Get Page Access Token"
4. Select your Facebook Page
5. Grant these permissions:
   ✓ pages_read_engagement
   ✓ pages_manage_posts
6. Copy the generated token
7. IMPORTANT: Convert to long-lived token (60 days):

   GET https://graph.facebook.com/v21.0/oauth/access_token?
       grant_type=fb_exchange_token&
       client_id=YOUR_APP_ID&
       client_secret=YOUR_APP_SECRET&
       fb_exchange_token=SHORT_LIVED_TOKEN

8. Update your channel with the long-lived token

🔗 Detailed Guide: https://developers.facebook.com/docs/pages/access-tokens
`
  }

  return `
📋 HOW TO GET AN INSTAGRAM BUSINESS ACCOUNT TOKEN:

1. You need a Facebook Page connected to your Instagram Business Account
2. Get a Page Access Token (see Facebook instructions)
3. The Page token will work for Instagram if:
   ✓ Your Instagram account is a Business account
   ✓ It's connected to your Facebook Page
   ✓ Token has: pages_read_engagement, pages_manage_posts, 
     instagram_basic, instagram_content_publish

🔗 Guide: https://developers.facebook.com/docs/instagram-api/getting-started
`
}

