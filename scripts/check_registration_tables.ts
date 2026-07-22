import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envPath = resolve(process.cwd(), '.env.local')

if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function main() {
  console.log('Searching for NMC26-I-AW-001 in database...')

  // 1. Check processed_registrations
  const { data: proc, error: procErr } = await supabase
    .from('processed_registrations')
    .select('unique_id, serial, registration_id, name, allocated_room, category, institution')
    .or('serial.ilike.%NMC26-I-AW-001%,unique_id.ilike.%NMC26-I-AW-001%,registration_id.ilike.%NMC26-I-AW-001%')

  console.log('processed_registrations match:', proc, procErr)

  // 2. Check all processed_registrations sample serials
  const { data: sampleProc } = await supabase
    .from('processed_registrations')
    .select('unique_id, serial, registration_id, name, allocated_room')
    .limit(10)

  console.log('\nSample processed_registrations:', sampleProc)

  // 3. Check event_registrations
  const { data: evReg, error: evErr } = await supabase
    .from('event_registrations')
    .select('*')
    .or('serial_no.ilike.%NMC26-I-AW-001%,registration_id.ilike.%NMC26-I-AW-001%,unique_id.ilike.%NMC26-I-AW-001%')

  console.log('\nevent_registrations match:', evReg, evErr)
}

main().catch(console.error)
