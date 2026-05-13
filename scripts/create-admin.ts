import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')

if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) {
      continue
    }
    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: npx tsx scripts/create-admin.ts <email> <password>')
  process.exit(1)
}

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const maskValue = (value: string, start = 6, end = 4) => {
  if (value.length <= start + end) {
    return `${value.slice(0, 2)}...`
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

const extractProjectRef = (supabaseUrl: string) => {
  try {
    const parsed = new URL(supabaseUrl)
    return parsed.hostname.split('.')[0] ?? null
  } catch {
    return null
  }
}

const decodeJwtPayload = (token: string) => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

if (serviceKey.startsWith('sb_')) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY looks like a publishable/secret key (sb_*). Use the service_role JWT key from Supabase API settings.'
  )
}

const envRef = extractProjectRef(url)
const jwtPayload = decodeJwtPayload(serviceKey)
if (envRef && jwtPayload?.ref && jwtPayload.ref !== envRef) {
  console.warn(
    `SUPABASE_SERVICE_ROLE_KEY ref (${jwtPayload.ref}) does not match SUPABASE_URL (${envRef}).`
  )
}

console.log(`Using SUPABASE_URL=${url} and SUPABASE_SERVICE_ROLE_KEY=${maskValue(serviceKey)}`)

const supabase = createClient(url, serviceKey)

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data?.user) {
    console.error(error?.message ?? 'Failed to create user')
    process.exit(1)
  }

  const { error: adminError } = await supabase
    .from('admin_users')
    .upsert({
      id: data.user.id,
      email,
      role: 'super_admin',
    })

  if (adminError) {
    console.error(adminError.message)
    process.exit(1)
  }

  console.log('Admin created:', data.user.id)
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
