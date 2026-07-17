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

const demoVolunteers = [
  {
    unique_id: 'CY6NGPU3',
    serial_no: 'V260001',
    name: 'Nabil Rahman',
    email: 'nabil@example.com',
    number: '01711223344',
    image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    segment: 'Logistics',
    department: 'CSE',
    student_id: '2021331045',
    year: '3rd Year',
    t_shirt_size: 'L',
    is_present: true,
    is_gift_collected: true,
    is_lunch_collected: true,
    updated_by: 'Super Admin'
  },
  {
    unique_id: 'N7YTT6YJ',
    serial_no: 'V260002',
    name: 'Fariha Tasnim',
    email: 'fariha@example.com',
    number: '01822334455',
    image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    segment: 'Registration',
    department: 'EEE',
    student_id: '2022441088',
    year: '2nd Year',
    t_shirt_size: 'M',
    is_present: true,
    is_gift_collected: true,
    is_lunch_collected: false,
    updated_by: 'Super Admin'
  },
  {
    unique_id: 'N663D6L2',
    serial_no: 'V260003',
    name: 'Tanvir Ahmed',
    email: 'tanvir@example.com',
    number: '01933445566',
    image_url: null,
    segment: 'Logistics',
    department: 'Civil Engineering',
    student_id: '2020221012',
    year: '4th Year',
    t_shirt_size: 'XL',
    is_present: true,
    is_gift_collected: false,
    is_lunch_collected: false,
    updated_by: 'Super Admin'
  },
  {
    unique_id: '34DVPRFX',
    serial_no: 'V260004',
    name: 'Anika Tabassum',
    email: 'anika@example.com',
    number: '01544556677',
    image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    segment: 'Public Relations',
    department: 'Architecture',
    student_id: '2023331005',
    year: '1st Year',
    t_shirt_size: 'S',
    is_present: false,
    is_gift_collected: false,
    is_lunch_collected: false,
    updated_by: 'Super Admin'
  },
  {
    unique_id: 'U5BBKZAE',
    serial_no: 'V260005',
    name: 'Zahid Hasan',
    email: 'zahid@example.com',
    number: '01655667788',
    image_url: null,
    segment: 'Media & Tech',
    department: 'Mathematics',
    student_id: '2021111003',
    year: '3rd Year',
    t_shirt_size: 'L',
    is_present: true,
    is_gift_collected: true,
    is_lunch_collected: true,
    updated_by: 'Super Admin'
  },
  {
    unique_id: 'JNT2D8SR',
    serial_no: 'V260006',
    name: 'Rashedul Islam',
    email: 'rashedul@example.com',
    number: '01766778899',
    image_url: null,
    segment: 'Decoration',
    department: 'Mechanical',
    student_id: '2022115024',
    year: '2nd Year',
    t_shirt_size: 'XL',
    is_present: false,
    is_gift_collected: false,
    is_lunch_collected: false,
    updated_by: 'Super Admin'
  },
  {
    unique_id: 'B4MSAXL7',
    serial_no: 'V260007',
    name: 'Tasnim Jahan',
    email: 'tasnim@example.com',
    number: '01877889900',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    segment: 'Registration',
    department: 'CSE',
    student_id: '2023331021',
    year: '1st Year',
    t_shirt_size: 'M',
    is_present: true,
    is_gift_collected: true,
    is_lunch_collected: true,
    updated_by: 'Super Admin'
  },
  {
    unique_id: '4RH2PLZ7',
    serial_no: 'V260008',
    name: 'Faisal Mahmud',
    email: 'faisal@example.com',
    number: '01988990011',
    image_url: null,
    segment: 'Food & Catering',
    department: 'IPE',
    student_id: '2021445009',
    year: '3rd Year',
    t_shirt_size: 'XXL',
    is_present: true,
    is_gift_collected: false,
    is_lunch_collected: true,
    updated_by: 'Super Admin'
  }
]

async function run() {
  // First clear any existing seeded test rows if needed or just upsert them
  const { error } = await supabase
    .from('volunteers')
    .upsert(demoVolunteers, { onConflict: 'unique_id' })

  if (error) {
    console.error('Failed to seed volunteers:', error.message)
    process.exit(1)
  }

  console.log(`Seeded ${demoVolunteers.length} demo volunteers successfully!`)
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
