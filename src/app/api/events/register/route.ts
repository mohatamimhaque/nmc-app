import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = process.env

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

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

async function uploadFile(file: File, eventId: string) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File is too large (max 5MB).')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeName = sanitizeFilename(file.name || 'upload')
  const objectKey = `event-registrations/${eventId}/${Date.now()}-${safeName}`

  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const baseUrl = R2_PUBLIC_URL ?? `https://${R2_BUCKET_NAME}.r2.dev`
  return `${baseUrl}/${objectKey}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const eventId = String(formData.get('event_id') ?? '').trim()
    const valuesRaw = formData.get('values')

    if (!eventId || !valuesRaw) {
      return NextResponse.json({ error: 'Missing event data.' }, { status: 400 })
    }

    let values: Record<string, any> = {}
    try {
      values = JSON.parse(String(valuesRaw))
    } catch {
      return NextResponse.json({ error: 'Invalid form payload.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, status, registration_deadline, registration_type, registration_limit_total, registration_limit_per_email, registration_limit_per_phone')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (event.status !== 'published') {
      return NextResponse.json({ error: 'Event is not open for registration.' }, { status: 400 })
    }

    if (event.registration_type !== 'internal') {
      return NextResponse.json({ error: 'Registration is external for this event.' }, { status: 400 })
    }

    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline)
      if (!Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
        return NextResponse.json({ error: 'Registration is closed.' }, { status: 400 })
      }
    }

    const { data: fieldDefs, error: fieldError } = await supabase
      .from('internal_form_fields')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })

    if (fieldError) {
      return NextResponse.json({ error: fieldError.message }, { status: 400 })
    }

    const fields = fieldDefs ?? []
    const normalize = (value: string) => value.trim().toLowerCase()

    const findEmail = () => {
      const field = fields.find((item: any) => item.field_type === 'email')
      if (!field) return null
      const value = values[field.id]
      return value ? String(value).trim() : null
    }

    const findPhone = () => {
      const field = fields.find((item: any) => item.field_type === 'phone')
      if (!field) return null
      const value = values[field.id]
      return value ? String(value).trim() : null
    }

    const registrantEmail = findEmail()
    const registrantPhone = findPhone()

    if (event.registration_limit_total) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
      if ((count ?? 0) >= event.registration_limit_total) {
        return NextResponse.json({ error: 'Registration limit reached.' }, { status: 400 })
      }
    }

    if (event.registration_limit_per_email && registrantEmail) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('registrant_email', normalize(registrantEmail))
      if ((count ?? 0) > 0) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 400 })
      }
    }

    if (event.registration_limit_per_phone && registrantPhone) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('registrant_phone', normalize(registrantPhone))
      if ((count ?? 0) > 0) {
        return NextResponse.json({ error: 'Phone already registered.' }, { status: 400 })
      }
    }

    const enrichedFields = [] as Array<{ id: string; label: string; type: string; value: string | null }>

    for (const field of fields as any[]) {
      if (field.is_visible === false) continue
      const config = typeof field.config === 'object' && field.config ? field.config : {}
      const validation = typeof field.validation === 'object' && field.validation ? field.validation : {}
      const options = Array.isArray(config.options) && config.options.length ? config.options : field.options ?? []
      const value = values[field.id]

      if (field.is_required) {
        if (field.field_type === 'file') {
          const hasFile = formData.getAll(`file_${field.id}`).length > 0
          if (!hasFile) {
            return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
          }
        } else if (field.field_type === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
          }
        } else if (field.field_type === 'grid_radio') {
          const rows = Array.isArray(config.gridRows) ? config.gridRows : []
          const map = value ?? {}
          const missing = rows.find((row: string) => !map[row])
          if (missing) return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
        } else if (field.field_type === 'grid_checkbox') {
          const rows = Array.isArray(config.gridRows) ? config.gridRows : []
          const map = value ?? {}
          const missing = rows.find((row: string) => !Array.isArray(map[row]) || map[row].length === 0)
          if (missing) return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
        } else if (value === undefined || value === null || String(value).trim() === '') {
          return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
        }
      }

      if (field.field_type === 'number' && value !== undefined && value !== null && value !== '') {
        const num = Number(value)
        if (Number.isNaN(num)) {
          return NextResponse.json({ error: `${field.label} must be a number.` }, { status: 400 })
        }
        if (validation.min !== undefined && num < Number(validation.min)) {
          return NextResponse.json({ error: `${field.label} must be at least ${validation.min}.` }, { status: 400 })
        }
        if (validation.max !== undefined && num > Number(validation.max)) {
          return NextResponse.json({ error: `${field.label} must be at most ${validation.max}.` }, { status: 400 })
        }
      }

      if (typeof value === 'string') {
        if (validation.minLength && value.length < Number(validation.minLength)) {
          return NextResponse.json({ error: `${field.label} is too short.` }, { status: 400 })
        }
        if (validation.maxLength && value.length > Number(validation.maxLength)) {
          return NextResponse.json({ error: `${field.label} is too long.` }, { status: 400 })
        }
        if (validation.pattern) {
          try {
            const regex = new RegExp(String(validation.pattern))
            if (!regex.test(value)) {
              return NextResponse.json({ error: `${field.label} format is invalid.` }, { status: 400 })
            }
          } catch {
            // ignore invalid regex
          }
        }
      }

      if (['mcq', 'dropdown'].includes(field.field_type) && value && !options.includes(value) && !config.allowOther) {
        return NextResponse.json({ error: `${field.label} selection is invalid.` }, { status: 400 })
      }

      if (field.field_type === 'file') {
        const files = formData.getAll(`file_${field.id}`)
        const uploaded: string[] = []
        for (const file of files) {
          if (file instanceof File) {
            const url = await uploadFile(file, eventId)
            uploaded.push(url)
          }
        }
        enrichedFields.push({ id: field.id, label: field.label, type: field.field_type, value: uploaded })
      } else {
        enrichedFields.push({ id: field.id, label: field.label, type: field.field_type, value: value ?? null })
      }
    }

    const publicId = await generatePublicId(supabase)

    const { error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        public_id: publicId,
        registrant_email: registrantEmail ? normalize(registrantEmail) : null,
        registrant_phone: registrantPhone ? normalize(registrantPhone) : null,
        form_data: { fields: enrichedFields },
        status: 'pending',
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const referrer = request.headers.get('referer')
    let pagePath = `/events/${eventId}`
    if (referrer) {
      try {
        pagePath = new URL(referrer).pathname
      } catch {
        pagePath = `/events/${eventId}`
      }
    }
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'form_submit',
        page_path: pagePath,
        referrer: referrer ?? null,
        user_agent_hash: null,
        screen_width: null,
        country_code: null,
        session_id: null,
      })

    return NextResponse.json({ ok: true, public_id: publicId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function generatePublicId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let value = ''
    for (let i = 0; i < 8; i += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    const { data } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('public_id', value)
      .maybeSingle()
    if (!data) return value
  }
  return `${Date.now()}`.slice(-8)
}
