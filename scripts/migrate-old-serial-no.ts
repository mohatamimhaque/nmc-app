import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Original mapping of sequential IDs by email
const originalSerials: Record<string, string> = {
  'nabil@example.com': 'V260001',
  'fariha@example.com': 'V260002',
  'tanvir@example.com': 'V260003',
  'anika@example.com': 'V260004',
  'zahid@example.com': 'V260005',
  'rashedul@example.com': 'V260006',
  'tasnim@example.com': 'V260007',
  'faisal@example.com': 'V260008',
}

async function run() {
  console.log('Fetching volunteers to migrate serial_no values...')
  const { data: volunteers, error: fetchErr } = await supabase
    .from('volunteers')
    .select('unique_id, name, email')

  if (fetchErr || !volunteers) {
    console.error('Failed to fetch volunteers:', fetchErr?.message)
    process.exit(1)
  }

  console.log(`Found ${volunteers.length} volunteers. Migrating serial_no values...`)

  let migratedCount = 0

  for (const volunteer of volunteers) {
    const emailKey = volunteer.email.trim().toLowerCase()
    const serialNo = originalSerials[emailKey]

    if (serialNo) {
      console.log(`Setting serial_no for '${volunteer.name}' (${volunteer.email}) -> ${serialNo}`)
      const { error: updateErr } = await supabase
        .from('volunteers')
        .update({ serial_no: serialNo })
        .eq('unique_id', volunteer.unique_id)

      if (updateErr) {
        console.error(`  Failed to set serial_no for ${volunteer.email}:`, updateErr.message)
      } else {
        migratedCount += 1
      }
    } else {
      console.log(`No original serial_no mapping found for '${volunteer.name}' (${volunteer.email}). Skipping.`)
    }
  }

  console.log(`Migration complete! Successfully migrated ${migratedCount} volunteer serial numbers.`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
