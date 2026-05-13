import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = process.env

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_OUTPUT_SIZE_BYTES = 1 * 1024 * 1024
const MAX_IMAGE_WIDTH = 2400

const getR2Client = () => {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error('Missing R2 configuration in environment variables.')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_')

export async function POST(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are supported.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 5MB).' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg'
  const isPng = file.type === 'image/png'
  const isWebp = file.type === 'image/webp'

  let quality = 82
  let pipeline = sharp(buffer)
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })

  const encode = async (q: number) => {
    if (isPng) {
      return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
    }
    if (isWebp) {
      return pipeline.webp({ quality: q }).toBuffer()
    }
    return pipeline.jpeg({ quality: q, mozjpeg: true }).toBuffer()
  }

  let output = await encode(quality)

  while (output.length > MAX_OUTPUT_SIZE_BYTES && quality > 40 && !isPng) {
    quality -= 8
    output = await encode(quality)
  }

  const extension = isPng ? 'png' : isWebp ? 'webp' : 'jpg'
  const safeName = sanitizeFilename(file.name || 'upload')
  const objectKey = `site-settings/${Date.now()}-${safeName}.${extension}`

  try {
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: output,
        ContentType: isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const baseUrl = R2_PUBLIC_URL ?? `https://${R2_BUCKET_NAME}.r2.dev`
  return NextResponse.json({ url: `${baseUrl}/${objectKey}` })
}
