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

function getLocationForRoom(room: string | null | undefined) {
  const normRoom = (room || '').toLowerCase().trim()
  if (normRoom.includes('twb')) {
    return {
      lat: 24.01685993912403,
      lng: 90.41899431404634,
      location_name: 'TWB Building (Teaching & Workshop Building)',
      venue: 'TWB Building Complex, DUET',
    }
  }
  if (normRoom.includes('school')) {
    return {
      lat: 24.019016943046,
      lng: 90.4180040764991,
      location_name: 'DUET High School Building',
      venue: 'DUET High School Campus, Gazipur',
    }
  }
  return {
    lat: 24.01741790711585,
    lng: 90.41896685216089,
    location_name: 'DUET Main Academic Building / Exam Center',
    venue: 'DUET Main Campus, Gazipur',
  }
}

async function main() {
  const cleanQuery = 'NMC26-I-AW-001'
  const { data: reg, error } = await supabase
    .from('processed_registrations')
    .select('serial, full_name, level, event, institution, allocated_room, email_address, phone_number')
    .or(`serial.ilike.${cleanQuery},email_address.ilike.${cleanQuery},phone_number.ilike.${cleanQuery}`)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('API Query Error:', error)
    return
  }

  if (reg) {
    const room = reg.allocated_room || null
    const location = getLocationForRoom(room)
    console.log('\nSUCCESS! Participant Found:')
    console.log({
      serial: reg.serial,
      name: reg.full_name,
      allocated_room: room,
      location,
    })
  } else {
    console.log('Not found')
  }
}

main().catch(console.error)
