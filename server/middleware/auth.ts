export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/telegram/webhook',
    '/api/uploads', // Allow Facebook/Instagram to access media files
  ]

  const path = event.path || ''

  // Check if this is a public route
  if (publicRoutes.some(route => path.startsWith(route))) {
    return
  }

  // Skip auth for non-API routes
  if (!path.startsWith('/api/')) {
    return
  }

  // Extract token from Authorization header
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No token provided',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Verify token
    const payload = verifyToken(token)
    
    // Attach user info to event context
    event.context.user = {
      userId: payload.userId,
      email: payload.email,
    }
  }
  catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid token',
    })
  }
})

