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

const supabase = createClient(supabaseUrl!, serviceKey!)

async function main() {
  const { data: procSample } = await supabase.from('processed_registrations').select('*').limit(1)
  console.log('processed_registrations columns:', procSample && procSample[0] ? Object.keys(procSample[0]) : 'None')
  if (procSample && procSample[0]) {
    console.log('processed_registrations sample row:', procSample[0])
  }

  // Search by exact serial in processed_registrations
  const { data: searchResult, error } = await supabase
    .from('processed_registrations')
    .select('*')
    .or('serial.ilike.%NMC26-I-AW-001%,registration_id.ilike.%NMC26-I-AW-001%')
  console.log('Search for NMC26-I-AW-001 result:', searchResult, error)

  // Search by wildcard NMC26-I-AW
  const { data: wildResult } = await supabase
    .from('processed_registrations')
    .select('serial, registration_id, full_name, level, event, allocated_room')
    .ilike('serial', '%NMC26-I-AW%')
    .limit(5)
  console.log('Search for %NMC26-I-AW% sample:', wildResult)
}

main().catch(console.error)
