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
  const { data: evSample } = await supabase.from('event_registrations').select('*').limit(1)
  console.log('event_registrations columns:', evSample && evSample[0] ? Object.keys(evSample[0]) : 'None')

  const { data: searchNmc } = await supabase
    .from('processed_registrations')
    .select('serial, full_name, level, event, allocated_room')
    .ilike('serial', '%NMC26-I-AW-001%')
  console.log('Search NMC26-I-AW-001 in processed_registrations:', searchNmc)
}

main().catch(console.error)
