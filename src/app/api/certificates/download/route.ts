import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPageVisible } from '@/lib/visibility'
import { generateCertificateBuffer, generateCertificatePdfBuffer } from '@/lib/certificateGenerator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')?.trim()
    const mode = searchParams.get('mode') || 'download'
    const format = searchParams.get('format') || (mode === 'preview' ? 'png' : 'pdf')

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
      .select('serial, full_name, level, event')
      .ilike('serial', serial)
      .single()

    if (error || !participant) {
      return NextResponse.json(
        { success: false, error: 'No certificate found matching this serial number.' },
        { status: 404 }
      )
    }

    const options = {
      fullName: participant.full_name || 'Participant',
      serial: participant.serial,
      level: participant.level,
      event: participant.event,
    }

    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')

    if (format === 'pdf') {
      const pdfBuffer = await generateCertificatePdfBuffer(options)
      const filename = `Certificate_${participant.serial}.pdf`

      headers.set('Content-Type', 'application/pdf')
      if (mode === 'download') {
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      } else {
        headers.set('Content-Disposition', `inline; filename="${filename}"`)
      }

      return new NextResponse(Uint8Array.from(pdfBuffer), {
        status: 200,
        headers,
      })
    } else {
      const pngBuffer = await generateCertificateBuffer(options)
      const filename = `Certificate_${participant.serial}.png`

      headers.set('Content-Type', 'image/png')
      if (mode === 'download') {
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      } else {
        headers.set('Content-Disposition', `inline; filename="${filename}"`)
      }

      return new NextResponse(Uint8Array.from(pngBuffer), {
        status: 200,
        headers,
      })
    }
  } catch (err: any) {
    console.error('Certificate download error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to generate certificate.' },
      { status: 500 }
    )
  }
}
