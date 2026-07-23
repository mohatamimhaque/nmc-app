import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createServiceClient } from '@/lib/supabase/server'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  ADMIT_CARD_SECRET_KEY,
  ADMIT_CARD_GENERATOR_URL
} = process.env

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

export async function getOrCreateAdmitCardUrl(reg: {
  serial: string
  full_name: string | null
  institution: string | null
  phone_number: string | null
  level: string | null
  event: string | null
  admit_card_url?: string | null
}): Promise<string | null> {
  // If admit_card_url is already present, use it
  if (reg.admit_card_url && reg.admit_card_url.trim() !== '') {
    return reg.admit_card_url.trim()
  }

  // Double check in DB just in case it was updated since we fetched
  const serviceClient = createServiceClient()
  const { data: dbReg } = await serviceClient
    .from('processed_registrations')
    .select('admit_card_url')
    .eq('serial', reg.serial)
    .maybeSingle()

  if (dbReg?.admit_card_url && dbReg.admit_card_url.trim() !== '') {
    return dbReg.admit_card_url.trim()
  }

  // Not present, generate dynamically!
  const generatorUrl = ADMIT_CARD_GENERATOR_URL || 'http://127.0.0.1:8000'
  const secretKey = ADMIT_CARD_SECRET_KEY

  if (!secretKey) {
    throw new Error('ADMIT_CARD_SECRET_KEY is not configured in environment variables.')
  }

  // Call local FastAPI
  const res = await fetch(`${generatorUrl}/generate-admit-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': secretKey
    },
    body: JSON.stringify({
      full_name: reg.full_name || '',
      institution: reg.institution || '',
      phone_number: reg.phone_number || '',
      level: reg.level || '',
      event: reg.event || '',
      serial: reg.serial
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`FastAPI generation failed: ${errorText || res.statusText}`)
  }

  const pdfBuffer = Buffer.from(await res.arrayBuffer())

  // Upload to Cloudflare R2
  const client = getR2Client()
  const objectKey = `admit-cards/${reg.serial}.pdf`
  
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const baseUrl = R2_PUBLIC_URL ?? `https://${R2_BUCKET_NAME}.r2.dev`
  const newUrl = `${baseUrl}/${objectKey}`

  // Update admit_card_url in database
  const { error: updateError } = await serviceClient
    .from('processed_registrations')
    .update({
      admit_card_url: newUrl,
      updated_at: new Date().toISOString(),
      updated_by: 'System (Dynamic Generator)'
    })
    .eq('serial', reg.serial)

  if (updateError) {
    throw new Error(`Database update failed: ${updateError.message}`)
  }

  return newUrl
}
