import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required',
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User already exists',
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with settings
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        settings: {
          create: {},
        },
      },
      include: {
        settings: true,
      },
    })

    // Generate JWT token
    const token = generateToken(user)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
    })
  }
})

