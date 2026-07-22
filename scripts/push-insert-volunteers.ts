import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
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

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

if (!dbUrl) {
  console.error('Missing POSTGRES_URL_NON_POOLING in env.')
  process.exit(1)
}

const sqlPath = resolve('d:/PY/NMC/insert_volunteers.sql')
if (!existsSync(sqlPath)) {
  console.error(`File not found at ${sqlPath}`)
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => {
    const lines = stmt.split('\n').map(l => l.trim()).filter(l => !l.startsWith('--'))
    return lines.join(' ').trim().length > 0
  })

console.log(`Executing ${statements.length} SQL statements from insert_volunteers.sql...`)

let successCount = 0
let failCount = 0

for (let idx = 0; idx < statements.length; idx++) {
  const statement = statements[idx] + ';'
  const res = spawnSync('npx', ['supabase', 'db', 'query', '--db-url', dbUrl], {
    input: statement,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  if (res.status === 0) {
    successCount++
  } else {
    failCount++
    const errText = res.stderr?.toString() || res.stdout?.toString() || ''
    console.warn(`Statement ${idx + 1} warning/notice:`, errText.slice(0, 150))
  }
}

console.log(`Finished executing volunteers SQL statements! Success: ${successCount}, Failed/Skipped: ${failCount}`)
