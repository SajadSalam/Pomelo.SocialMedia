import formidable from 'formidable'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import prisma from '../../../server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
      multiples: true,
    })

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const uploadedFiles = files.files || files.file
    if (!uploadedFiles) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files uploaded',
      })
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    const mediaAssets = []

    for (const file of fileArray) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
      ]

      if (!allowedTypes.includes(file.mimetype || '')) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid file type: ${file.mimetype}`,
        })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const ext = file.originalFilename?.split('.').pop() || 'jpg'
      const filename = `${timestamp}-${random}.${ext}`
      const filepath = join(uploadDir, filename)

      // Read file data and write to public/uploads
      const fileData = await readFile(file.filepath)
      await writeFile(filepath, fileData)

      // Create MediaAsset record
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          filename,
          mimeType: file.mimetype || 'application/octet-stream',
          bytes: file.size,
          url: `/uploads/${filename}`,
          thumbUrl: file.mimetype?.startsWith('video/') ? null : `/uploads/${filename}`,
        },
      })

      mediaAssets.push(mediaAsset)
    }

    return {
      success: true,
      mediaAssets,
    }
  }
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to upload files',
    })
  }
})

async function readFile(filepath: string): Promise<Buffer> {
  const fs = await import('node:fs/promises')
  return fs.readFile(filepath)
}

