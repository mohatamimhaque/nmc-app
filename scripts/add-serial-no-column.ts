import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')

let dbUrl = ''
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key === 'POSTGRES_URL_NON_POOLING') {
      dbUrl = value
      break
    }
  }
}

if (!dbUrl) {
  console.error('Missing POSTGRES_URL_NON_POOLING in env.')
  process.exit(1)
}

const statement = 'alter table public.volunteers add column if not exists serial_no text;'

console.log('Adding serial_no column to volunteers table...')
const res = spawnSync('npx', ['supabase', 'db', 'query', '--db-url', dbUrl], {
  input: statement,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
})

if (res.status !== 0) {
  console.error('Failed to add serial_no column')
  process.exit(res.status ?? 1)
}

console.log('Column serial_no added successfully!')
