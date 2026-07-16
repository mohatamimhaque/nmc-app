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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const service = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function run() {
  console.log('Fetching all volunteers from database...')
  const { data: volunteers, error: fetchErr } = await service
    .from('volunteers')
    .select('name, email')

  if (fetchErr || !volunteers) {
    console.error('Failed to fetch volunteers:', fetchErr?.message)
    process.exit(1)
  }

  console.log(`Found ${volunteers.length} volunteers. Migrating...`)

  // Fetch all existing auth users to avoid repeated calls
  const { data: userList } = await service.auth.admin.listUsers()
  const authUsersByEmail = new Map(
    userList?.users?.map(u => [u.email?.toLowerCase() || '', u.id]) || []
  )

  // Fetch all existing admin_users
  const { data: adminUsers } = await service
    .from('admin_users')
    .select('id, email')

  const adminUsersByEmail = new Map(
    adminUsers?.map(u => [u.email?.toLowerCase() || '', u.id]) || []
  )

  for (const volunteer of volunteers) {
    const email = volunteer.email.trim().toLowerCase()
    const name = volunteer.name.trim()

    if (adminUsersByEmail.has(email)) {
      console.log(`- Volunteer ${email} is already in admin_users. Skipping.`)
      continue
    }

    console.log(`- Migrating volunteer: ${email} (${name})`)

    let userId = authUsersByEmail.get(email)

    if (!userId) {
      // Create auth user
      const { data: authData, error: authError } = await service.auth.admin.createUser({
        email,
        password: '12345678',
        email_confirm: true,
      })

      if (authError) {
        console.error(`  Failed to create auth user for ${email}:`, authError.message)
        continue
      }
      userId = authData?.user?.id
    }

    if (userId) {
      // Insert to admin_users
      const { error: insertErr } = await service
        .from('admin_users')
        .upsert({
          id: userId,
          email,
          role: 'volunteer',
          display_name: name,
        })

      if (insertErr) {
        console.error(`  Failed to upsert admin_users for ${email}:`, insertErr.message)
      } else {
        console.log(`  Successfully migrated ${email}`)
      }
    }
  }

  console.log('Volunteer migration complete!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
