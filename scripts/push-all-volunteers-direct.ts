import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'node:child_process'

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

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey || !dbUrl) {
  console.error('Missing env vars')
  process.exit(1)
}

// 1. Drop unique constraint on email if present
console.log('Dropping volunteers_email_key constraint if exists...')
spawnSync('cmd', ['/c', 'npx', 'supabase', 'db', 'query', '--db-url', dbUrl], {
  input: 'ALTER TABLE public.volunteers DROP CONSTRAINT IF EXISTS volunteers_email_key;',
  stdio: 'inherit',
})

const supabase = createClient(supabaseUrl, serviceKey)

async function main() {
  const sqlPath = resolve('d:/PY/NMC/insert_volunteers.sql')
  const sql = readFileSync(sqlPath, 'utf8')

  const lines = sql.split(/\r?\n/)
  const insertLines = lines.filter(l => l.trim().startsWith('INSERT INTO volunteers'))

  console.log(`Found ${insertLines.length} INSERT statements in insert_volunteers.sql`)

  let count = 0
  let errCount = 0

  for (const line of insertLines) {
    const match = line.match(/VALUES\s*\((.*)\);?$/i)
    if (!match) continue

    const rawValuesStr = match[1]

    const values: string[] = []
    let current = ''
    let inString = false

    for (let i = 0; i < rawValuesStr.length; i++) {
      const char = rawValuesStr[i]
      if (char === "'" && (i === 0 || rawValuesStr[i - 1] !== '\\')) {
        inString = !inString
        current += char
      } else if (char === ',' && !inString) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    if (current.trim()) {
      values.push(current.trim())
    }

    if (values.length >= 17) {
      const parseVal = (v: string) => {
        let s = v.trim()
        if (s.toUpperCase() === 'NULL') return null
        if (s.toUpperCase() === 'FALSE') return false
        if (s.toUpperCase() === 'TRUE') return true
        if (s.startsWith("'") && s.endsWith("'")) {
          s = s.slice(1, -1).replace(/''/g, "'")
        }
        return s
      }

      const unique_id = parseVal(values[0]) as string
      const serial_no = parseVal(values[1]) as string
      const name = parseVal(values[2]) as string
      let email = parseVal(values[3]) as string
      const number = parseVal(values[4]) as string | null
      const image_url = parseVal(values[5]) as string | null
      const segment = parseVal(values[6]) as string | null
      const department = parseVal(values[7]) as string | null
      const student_id = parseVal(values[8]) as string | null
      const year = parseVal(values[9]) as string | null
      const t_shirt_size = parseVal(values[10]) as string | null
      const is_present = !!parseVal(values[11])
      const is_gift_collected = !!parseVal(values[12])
      const is_lunch_collected = !!parseVal(values[13])
      const created_at = parseVal(values[14]) as string | null
      const updated_at = parseVal(values[15]) as string | null
      const updated_by = parseVal(values[16]) as string | null

      // If email is dummy or missing, ensure unique email per unique_id
      if (!email || email === '@example.com') {
        email = `vol_${unique_id.toLowerCase()}@example.com`
      }

      const row = {
        unique_id,
        serial_no,
        name,
        email,
        number,
        image_url,
        segment,
        department,
        student_id,
        year,
        t_shirt_size,
        is_present,
        is_gift_collected,
        is_lunch_collected,
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString(),
        updated_by: updated_by || 'system',
      }

      const { error } = await supabase
        .from('volunteers')
        .upsert(row, { onConflict: 'unique_id' })

      if (error) {
        console.error(`Failed to upsert volunteer ${serial_no} (${name}):`, error.message)
        errCount++
      } else {
        count++
      }
    }
  }

  console.log(`Finished! Upserted ${count} of ${insertLines.length} volunteers into database (Errors: ${errCount}).`)
}

main().catch(console.error)
