import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

function toBytesLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export async function GET() {
  const guard = await requireAdminRole(['super_admin', 'admin', 'moderator'])
  if ('response' in guard) {
    return guard.response
  }

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return NextResponse.json({ error: 'Missing R2 configuration.' }, { status: 500 })
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  let continuationToken: string | undefined
  let objectCount = 0
  let totalBytes = 0

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    })

    const response = await client.send(command)
    const contents = response.Contents ?? []
    for (const item of contents) {
      objectCount += 1
      totalBytes += Number(item.Size ?? 0)
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return NextResponse.json({
    bucket,
    objectCount,
    totalBytes,
    totalLabel: toBytesLabel(totalBytes),
    updatedAt: new Date().toISOString(),
  })
}
