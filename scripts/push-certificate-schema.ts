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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in env.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function pushCertificateSchema() {
  console.log('Ensuring page_visibility row for certificate...')
  const { data: pageVis, error: pageErr } = await supabase
    .from('page_visibility')
    .select('id')
    .eq('page_key', 'certificate')

  if (pageErr) {
    console.error('Error querying page_visibility:', pageErr)
  } else if (!pageVis || pageVis.length === 0) {
    const { error: insErr } = await supabase
      .from('page_visibility')
      .insert({
        page_key: 'certificate',
        label: 'Certificate Download',
        route: '/certificate',
        is_visible: true,
      })
    if (insErr) console.error('Failed to insert page_visibility:', insErr)
    else console.log('Successfully added page_visibility for certificate')
  } else {
    console.log('page_visibility row for certificate already exists.')
  }

  console.log('Ensuring nav_links row for certificate...')
  const { data: navData, error: navErr } = await supabase
    .from('nav_links')
    .select('id')
    .eq('url', '/certificate')

  if (navErr) {
    console.error('Error querying nav_links:', navErr)
  } else if (!navData || navData.length === 0) {
    const { error: insNavErr } = await supabase
      .from('nav_links')
      .insert({
        label: 'Certificate',
        url: '/certificate',
        sort_order: 11,
        is_visible: true,
        is_external: false,
        is_cta: false,
      })
    if (insNavErr) console.error('Failed to insert nav_links:', insNavErr)
    else console.log('Successfully added nav_link for certificate')
  } else {
    console.log('nav_links row for certificate already exists.')
  }

  console.log('Certificate schema update completed successfully!')
}

pushCertificateSchema()
