import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPageVisible } from '@/lib/visibility'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')?.trim()

    if (!serial) {
      return NextResponse.json(
        { success: false, error: 'Serial number is required.' },
        { status: 400 }
      )
    }

    // Check page visibility
    const visible = await isPageVisible('certificate')
    if (!visible) {
      return NextResponse.json(
        { success: false, error: 'Certificate download is currently disabled by administrator.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { data: participant, error } = await supabase
      .from('processed_registrations')
      .select('serial, full_name, level, event, institution')
      .ilike('serial', serial)
      .single()

    if (error || !participant) {
      return NextResponse.json(
        { success: false, error: 'No certificate found matching this serial number.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      participant: {
        serial: participant.serial,
        full_name: participant.full_name,
        level: participant.level,
        event: participant.event,
        institution: participant.institution,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'An internal error occurred while verifying certificate.' },
      { status: 500 }
    )
  }
}
