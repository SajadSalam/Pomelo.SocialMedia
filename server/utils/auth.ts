import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  const config = useRuntimeConfig()
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: '30d' },
  )
}

export function verifyToken(token: string): { userId: string, email: string } {
  const config = useRuntimeConfig()
  try {
    return jwt.verify(token, config.jwtSecret) as { userId: string, email: string }
  }
  catch (error) {
    throw new Error('Invalid token')
  }
}

