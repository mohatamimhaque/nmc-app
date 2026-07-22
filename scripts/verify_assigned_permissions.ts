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
  console.log('--- Verifying Admin Users Table Structure & Records ---')

  const { data: admins, error } = await supabase
    .from('admin_users')
    .select('*')
    .limit(5)

  if (error) {
    console.error(error)
    return
  }

  if (admins && admins.length > 0) {
    console.log('Sample record keys:', Object.keys(admins[0]))
  }

  console.table(admins)
}

main().catch(console.error)
