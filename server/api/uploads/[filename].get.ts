import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    const filename = getRouterParam(event, 'filename')

    if (!filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required',
      })
    }

    const filepath = join(process.cwd(), 'public', 'uploads', filename)

    if (!existsSync(filepath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
      })
    }

    // Read file
    const file = await readFile(filepath)

    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    }

    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    // Set headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000')

    return file
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to serve file',
    })
  }
})

