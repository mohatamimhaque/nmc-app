import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getOrCreateAdmitCardUrl } from '@/lib/admitCardGenerator'

export const runtime = 'nodejs'

/**
 * GET /api/registrations/admit-card/download
 * Public dynamic lookup & generation endpoint.
 * Accepts:
 *   - serial: string (required)
 *   - json: boolean (optional, if 'true' returns JSON payload, otherwise redirects to the PDF url)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')?.trim()
    const jsonFlag = searchParams.get('json') === 'true'

    if (!serial) {
      return NextResponse.json({ error: 'Serial parameter is required.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: reg, error } = await serviceClient
      .from('processed_registrations')
      .select('*')
      .eq('serial', serial)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!reg) {
      return NextResponse.json({ error: `Registration with serial "${serial}" not found.` }, { status: 404 })
    }

    // Dynamic check, generation, upload, DB update, and URL retrieval
    const admitCardUrl = await getOrCreateAdmitCardUrl(reg)

    if (!admitCardUrl) {
      return NextResponse.json({ error: 'Failed to generate admit card.' }, { status: 500 })
    }

    if (jsonFlag || request.headers.get('accept') === 'application/json') {
      return NextResponse.json({ success: true, url: admitCardUrl })
    }

    return NextResponse.redirect(admitCardUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
