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

const dbUrl = process.env.POSTGRES_URL_NON_POOLING

if (!dbUrl) {
  console.error('Missing POSTGRES_URL_NON_POOLING in env.')
  process.exit(1)
}

const migrationPath = resolve(process.cwd(), 'supabase/migrations/029_create_location_config.sql')
if (!existsSync(migrationPath)) {
  console.error(`Migration file not found at ${migrationPath}`)
  process.exit(1)
}

const sql = readFileSync(migrationPath, 'utf8')

// Clean up comments and split statements by semicolon
const statements = sql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => {
    // Remove comments
    const lines = stmt.split('\n').map(l => l.trim()).filter(l => !l.startsWith('--'))
    return lines.join(' ').trim().length > 0
  })

console.log(`Executing location config migration (${statements.length} statements)...`)

for (let idx = 0; idx < statements.length; idx++) {
  const statement = statements[idx] + ';'
  console.log(`Executing statement ${idx + 1} of ${statements.length}...`)
  
  const res = spawnSync('npx', ['supabase', 'db', 'query', '--db-url', dbUrl], {
    input: statement,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  })

  if (res.status !== 0) {
    console.error(`Failed to execute statement ${idx + 1}`)
    process.exit(res.status ?? 1)
  }
}

console.log('Location config migration executed successfully!')
