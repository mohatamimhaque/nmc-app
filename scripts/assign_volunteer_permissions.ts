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

const supabase = createClient(supabaseUrl!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const permissionMapping = [
  { unique_id: 'HZNFFXLV', serial_no: 'NMC26-V-071', perm: 'admin' },
  { unique_id: 'GHMHILW', serial_no: 'NMC26-V-005', perm: 'food manage' },
  { unique_id: 'ACZKOQD', serial_no: 'NMC26-V-034', perm: 'kit disrtutions' },
  { unique_id: 'QQJZCLAL', serial_no: 'NMC26-V-040', perm: 'kits distribution' },
  { unique_id: 'HLJKZMPV', serial_no: 'NMC26-V-042', perm: 'reg editor' },
  { unique_id: 'NJARPURT', serial_no: 'NMC26-V-001', perm: 'reg editor' },
  { unique_id: 'DCETNOJF', serial_no: 'NMC26-V-036', perm: 'regitrations editor' },
]

async function main() {
  console.log('--- Assigning Volunteer Permissions ---')

  // Fetch all volunteers from DB to match either serial_no or unique_id
  const { data: allVols, error: volErr } = await supabase
    .from('volunteers')
    .select('unique_id, serial_no, name, email, number')

  if (volErr) {
    console.error('Error fetching volunteers:', volErr)
    return
  }

  console.log(`Loaded ${allVols?.length || 0} total volunteers from DB.`)

  // List existing auth users to match emails
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (usersErr) {
    console.error('Error listing auth users:', usersErr)
    return
  }

  const userByEmail = new Map(users.map(u => [u.email?.toLowerCase(), u]))

  for (const item of permissionMapping) {
    // Match by serial_no or unique_id
    const vol = allVols?.find(
      v => v.serial_no?.trim() === item.serial_no || v.unique_id?.trim() === item.unique_id
    )

    if (!vol) {
      console.log(`⚠️ Volunteer ${item.unique_id} / ${item.serial_no} not found in DB!`)
      continue
    }

    const email = vol.email.toLowerCase()
    let authUser = userByEmail.get(email)

    // If user does not exist in auth, create account with default password '12345678'
    if (!authUser) {
      console.log(`Creating auth user for ${vol.name} (${email})...`)
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: '12345678',
        email_confirm: true,
        user_metadata: { name: vol.name, phone: vol.number }
      })

      if (createErr || !newUser.user) {
        console.error(`Failed to create user ${email}:`, createErr?.message)
        continue
      }
      authUser = newUser.user
    }

    // Determine admin_users record values based on permission
    let role = 'volunteer'
    let can_manage_volunteers = false
    let can_manage_registrations = false
    let can_manage_kit = false
    let can_manage_presents = false
    let can_manage_lunch = false

    const p = item.perm.toLowerCase()
    if (p.includes('admin')) {
      role = 'admin'
      can_manage_volunteers = true
      can_manage_registrations = true
      can_manage_kit = true
      can_manage_presents = true
      can_manage_lunch = true
    } else if (p.includes('food')) {
      role = 'volunteer'
      can_manage_lunch = true
      can_manage_volunteers = true
    } else if (p.includes('kit')) {
      role = 'volunteer'
      can_manage_kit = true
    } else if (p.includes('reg')) {
      role = 'registration_editor'
      can_manage_registrations = true
    }

    console.log(`Updating admin_users for ${vol.name} (${vol.serial_no || vol.unique_id}): role=${role}, permissions: [vol=${can_manage_volunteers}, reg=${can_manage_registrations}, kit=${can_manage_kit}, food=${can_manage_lunch}]`)

    const { error: upsertErr } = await supabase
      .from('admin_users')
      .upsert({
        id: authUser.id,
        email,
        display_name: vol.name,
        role,
        can_manage_volunteers,
        can_manage_registrations,
        can_manage_kit,
        can_manage_presents,
        can_manage_lunch
      })

    if (upsertErr) {
      console.error(`Error updating admin_users for ${email}:`, upsertErr.message)
    } else {
      console.log(`✅ Successfully updated permissions for ${vol.name} (${vol.serial_no || vol.unique_id})`)
    }
  }

  console.log('\n--- Done assigning permissions! ---')
}

main().catch(console.error)
