import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

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

// 1. Run migrations first
console.log('Running database migrations...')
const dbUrl = process.env.POSTGRES_URL_NON_POOLING

if (!dbUrl) {
  console.error('Missing POSTGRES_URL_NON_POOLING in env.')
  process.exit(1)
}

const statements = [
  `create table if not exists public.processed_registrations (
    serial                 text primary key,
    full_name              text,
    email_address          text,
    phone_number           text,
    gender                 text,
    t_shirt_size           text,
    photos                 text,
    level                  text,
    institution            text,
    class_year_student_of  text,
    event                  text,
    payment_method         text,
    payment_number         text,
    transaction_id         text,
    is_kit_coollect        boolean not null default false,
    is_present             boolean not null default false,
    is_collect_launch      boolean not null default false,
    allocated_room         text default null
  );`,
  `alter table public.processed_registrations enable row level security;`,
  `drop policy if exists "admin_all_processed_registrations" on public.processed_registrations;`,
  `create policy "admin_all_processed_registrations"
    on public.processed_registrations for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');`,
  `create or replace function public.update_allocated_rooms(updates jsonb)
  returns void as $$
  begin
    update public.processed_registrations as p
    set allocated_room = nullif(u.allocated_room, '')
    from (
      select (x->>'serial')::text as serial, (x->>'allocated_room')::text as allocated_room
      from jsonb_array_elements(updates) as x
    ) as u
    where p.serial = u.serial;
  end;
  $$ language plpgsql security definer;`,
  `revoke execute on function public.update_allocated_rooms(jsonb) from public;`,
  `grant execute on function public.update_allocated_rooms(jsonb) to authenticated;`,
  `grant execute on function public.update_allocated_rooms(jsonb) to service_role;`
]

for (let idx = 0; idx < statements.length; idx++) {
  console.log(`Executing statement ${idx + 1} of ${statements.length}...`)
  const res = spawnSync('npx', ['supabase', 'db', 'query', '--db-url', dbUrl], {
    input: statements[idx],
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  })
  if (res.status !== 0) {
    console.error(`Failed to execute statement ${idx + 1}`)
    process.exit(res.status ?? 1)
  }
}

console.log('Migrations applied successfully!')

// 2. Initialize Supabase service-role client
const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function run() {
  const jsonPath = resolve(process.cwd(), 'National_Mathematics_Carnival_2026_Processed_Registrations.json')
  if (!existsSync(jsonPath)) {
    console.error(`Registrations file not found at ${jsonPath}`)
    process.exit(1)
  }

  console.log('Reading registrations JSON file...')
  const rawData = readFileSync(jsonPath, 'utf8')
  const rawRegistrations = JSON.parse(rawData)

  if (!Array.isArray(rawRegistrations)) {
    console.error('Invalid registrations format: expected an array.')
    process.exit(1)
  }

  console.log(`Found ${rawRegistrations.length} registrations. Mapping data...`)

  const mapped = rawRegistrations.map((item: any) => {
    // Check if Serial exists and is a string
    if (!item.Serial || typeof item.Serial !== 'string') {
      throw new Error(`Missing or invalid Serial column in record: ${JSON.stringify(item)}`)
    }

    return {
      serial: item.Serial.trim(),
      full_name: item['Full Name'] ? String(item['Full Name']).trim() : null,
      email_address: item['Email Address'] ? String(item['Email Address']).trim() : null,
      phone_number: item['Phone Number / WhatsApp Number'] ? String(item['Phone Number / WhatsApp Number']).trim() : null,
      gender: item.Gender ? String(item.Gender).trim() : null,
      t_shirt_size: item['T-shirts Size'] ? String(item['T-shirts Size']).trim() : null,
      photos: item.Photos ? String(item.Photos).trim() : null,
      level: item.Level ? String(item.Level).trim() : null,
      institution: item.Institution ? String(item.Institution).trim() : null,
      class_year_student_of: item['Class / Year / Student of'] ? String(item['Class / Year / Student of']).trim() : null,
      event: item.Event ? String(item.Event).trim() : null,
      payment_method: item['Payment Method'] ? String(item['Payment Method']).trim() : null,
      payment_number: item['Payment Number'] ? String(item['Payment Number']).trim() : null,
      transaction_id: item['Transaction ID'] ? String(item['Transaction ID']).trim() : null,
      is_kit_coollect: item.is_kit_coollect === true,
      is_present: item.is_present === true,
      is_collect_launch: item.is_collect_launch === true,
      allocated_room: item.allocated_room ? String(item.allocated_room).trim() : null,
    }
  })

  console.log('Beginning database migration. Seeding data in batches...')
  const BATCH_SIZE = 150
  let successCount = 0

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE)
    console.log(`Upserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)...`)

    const { error } = await supabase
      .from('processed_registrations')
      .upsert(batch, { onConflict: 'serial' })

    if (error) {
      console.error(`Error upserting batch starting at index ${i}:`, error.message)
      process.exit(1)
    }

    successCount += batch.length
  }

  console.log(`Seeding completed successfully! ${successCount} registrations imported.`)
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
