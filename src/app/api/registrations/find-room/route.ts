import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isPageVisible } from '@/lib/visibility'

export const runtime = 'nodejs'

/**
 * Computes venue location coordinates based on allocated room text (case-insensitive substring check)
 */
export function getLocationForRoom(room: string | null | undefined): {
  lat: number
  lng: number
  location_name: string
  venue: string
} {
  const normRoom = (room || '').toLowerCase().trim()

  // 1. If allocated room includes 'twb' in any case (e.g. TwB, twb, TWB)
  if (normRoom.includes('twb')) {
    return {
      lat: 24.01685993912403,
      lng: 90.41899431404634,
      location_name: 'Textile Workshop Building (টেক্সটাইল ওয়ার্কশপ ভবন)',
      venue: 'Textile Workshop Building, DUET',
    }
  }

  // 2. If allocated room includes 'school' in any case (e.g. School, SCHOOL, DUET School)
  if (normRoom.includes('school')) {
    return {
      lat: 24.019016943046,
      lng: 90.4180040764991,
      location_name: 'DUET Engineering School (ডুয়েট ইঞ্জিনিয়ারিং স্কুল)',
      venue: 'DUET Engineering School Campus, Gazipur',
    }
  }

  // 3. Default fallback location
  return {
    lat: 24.01741790711585,
    lng: 90.41896685216089,
    location_name: 'New Academic Building (নতুন একাডেমিক ভবন)',
    venue: 'New Academic Building, DUET',
  }
}

/**
 * GET /api/registrations/find-room?query=...
 * Finds allocated room number & map coordinates for a participant or volunteer.
 * Blocked if room_finder page is hidden by admin.
 */
export async function GET(request: Request) {
  // Check admin visibility setting for 'room_finder'
  const visible = await isPageVisible('room_finder')
  if (!visible) {
    return NextResponse.json({ error: 'Page hidden by administrator' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('query') || searchParams.get('unique_id') || searchParams.get('serial')

  if (!rawQuery || !rawQuery.trim()) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 })
  }

  const cleanQuery = rawQuery.trim()
  const supabase = createServiceClient()

  // 1. Search in processed_registrations first by serial, email_address, or phone_number
  const { data: reg } = await supabase
    .from('processed_registrations')
    .select('serial, full_name, level, event, institution, allocated_room, email_address, phone_number')
    .or(`serial.ilike.${cleanQuery},email_address.ilike.${cleanQuery},phone_number.ilike.${cleanQuery}`)
    .limit(1)
    .maybeSingle()

  if (reg) {
    const room = reg.allocated_room || null
    const location = getLocationForRoom(room)

    return NextResponse.json({
      success: true,
      data: {
        unique_id: reg.serial,
        serial: reg.serial,
        registration_id: reg.serial,
        name: reg.full_name,
        category: `${reg.level || ''} ${reg.event ? `(${reg.event})` : ''}`.trim(),
        institution: reg.institution || '',
        allocated_room: room,
        is_allocated: !!room,
        location,
      }
    })
  }

  // 2. Search in volunteers table by unique_id, serial_no, email, or number
  const { data: vol } = await supabase
    .from('volunteers')
    .select('unique_id, serial_no, name, segment, department, email, number')
    .or(`unique_id.ilike.${cleanQuery},serial_no.ilike.${cleanQuery},email.ilike.${cleanQuery},number.ilike.${cleanQuery}`)
    .limit(1)
    .maybeSingle()

  if (vol) {
    const room = vol.segment || null
    const location = getLocationForRoom(room)

    return NextResponse.json({
      success: true,
      data: {
        unique_id: vol.unique_id,
        serial: vol.serial_no || vol.unique_id,
        registration_id: vol.unique_id,
        name: vol.name,
        category: `Volunteer - ${vol.segment || 'General'}`,
        institution: vol.department || 'DUET',
        allocated_room: room,
        is_allocated: !!room,
        location,
      }
    })
  }

  return NextResponse.json({
    error: 'No registration record found for the provided Serial Number. Please check your Registration Serial Number and try again.'
  }, { status: 404 })
}
