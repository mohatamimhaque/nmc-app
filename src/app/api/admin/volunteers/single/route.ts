import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

/**
 * GET /api/admin/volunteers/single
 * Retrieve a single volunteer by unique_id query parameter. Securely protected.
 */
export async function GET(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const { searchParams } = new URL(request.url)
    const unique_id = searchParams.get('unique_id')

    if (!unique_id || unique_id.trim() === '') {
      return NextResponse.json({ error: 'Missing or empty unique_id parameter.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('unique_id', unique_id.trim())
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: `Volunteer with unique_id "${unique_id}" not found.` }, { status: 404 })
    }

    const volunteerWithQr = {
      ...data,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.unique_id)}`
    }

    return NextResponse.json({
      success: true,
      volunteer: volunteerWithQr
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
