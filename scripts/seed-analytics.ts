import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
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

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const pages = ['/', '/events', '/notices', '/gallery', '/about', '/contact']
const eventTypes = ['pageview', 'cta_click', 'notice_view', 'form_submit'] as const

const seedCount = 180
const today = new Date()

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randomItem = <T,>(list: readonly T[]) => list[randomInt(0, list.length - 1)]

const events = Array.from({ length: seedCount }, () => {
  const daysAgo = randomInt(0, 89)
  const timestamp = new Date(today)
  timestamp.setDate(today.getDate() - daysAgo)
  timestamp.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59), 0)

  return {
    event_type: randomItem(eventTypes),
    page_path: randomItem(pages),
    referrer: Math.random() > 0.6 ? 'https://google.com' : null,
    user_agent_hash: Math.random() > 0.5 ? 'seeded' : null,
    screen_width: randomInt(360, 1920),
    country_code: Math.random() > 0.7 ? 'BD' : null,
    session_id: `seed-${randomInt(1000, 9999)}`,
    created_at: timestamp.toISOString(),
  }
})

async function run() {
  const { error } = await supabase
    .from('analytics_events')
    .insert(events)

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(`Seeded ${events.length} analytics events.`)
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
