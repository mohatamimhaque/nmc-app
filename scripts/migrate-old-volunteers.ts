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

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRandomId(): string {
  let value = ''
  for (let i = 0; i < 8; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return value
}

async function run() {
  console.log('Fetching all volunteers to migrate unique_ids...')
  const { data: volunteers, error: fetchErr } = await supabase
    .from('volunteers')
    .select('unique_id, name, email')

  if (fetchErr || !volunteers) {
    console.error('Failed to fetch volunteers:', fetchErr?.message)
    process.exit(1)
  }

  console.log(`Found ${volunteers.length} volunteers. Starting migration to 8-character random IDs...`)

  const usedIds = new Set<string>()

  // Fetch all existing IDs to avoid any collision
  const { data: allExisting } = await supabase
    .from('volunteers')
    .select('unique_id')

  if (allExisting) {
    for (const v of allExisting) {
      usedIds.add(v.unique_id)
    }
  }

  let migratedCount = 0

  for (const volunteer of volunteers) {
    const oldId = volunteer.unique_id
    let newId = generateRandomId()
    while (usedIds.has(newId)) {
      newId = generateRandomId()
    }
    usedIds.add(newId)

    console.log(`Migrating '${volunteer.name}' (${volunteer.email}): ${oldId} -> ${newId}`)

    const { error: updateErr } = await supabase
      .from('volunteers')
      .update({ unique_id: newId })
      .eq('unique_id', oldId)

    if (updateErr) {
      console.error(`  Failed to migrate ${oldId} to ${newId}:`, updateErr.message)
    } else {
      migratedCount += 1
      usedIds.delete(oldId)
    }
  }

  console.log(`Migration complete! Successfully migrated ${migratedCount}/${volunteers.length} volunteers.`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
