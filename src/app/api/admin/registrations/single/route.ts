import { NextResponse } from 'next/server'
import { requireRegistrationAccess } from '@/lib/admin-auth'
import { getOrCreateAdmitCardUrl } from '@/lib/admitCardGenerator'

export const runtime = 'nodejs'

/**
 * GET /api/admin/registrations/single
 * Retrieve a single processed registration by its unique serial number.
 * Query Parameters:
 *   - serial: string (required)
 * Authorized: super_admin, admin, registration_editor, volunteer
 */
export async function GET(request: Request) {
  const guard = await requireRegistrationAccess()
  if ('response' in guard) return guard.response

  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')

    if (!serial || serial.trim() === '') {
      return NextResponse.json({ error: 'Missing or empty serial parameter.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { data, error } = await supabase
      .from('processed_registrations')
      .select('*')
      .eq('serial', serial.trim())
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: `Registration with serial "${serial}" not found.` }, { status: 404 })
    }

    if (!data.admit_card_url || data.admit_card_url.trim() === '') {
      try {
        data.admit_card_url = await getOrCreateAdmitCardUrl(data)
      } catch (e) {
        console.error(`Dynamic generation failed for single registration lookup ${data.serial}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      registration: data
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
