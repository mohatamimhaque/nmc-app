import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/registrations/admit-card
 * Public lookup endpoint for checking registration status and obtaining admit card links.
 * Employs strict input sanitization and limits results to prevent scanning/scraping.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const event = searchParams.get('event')
    const query = searchParams.get('query')?.trim()

    if (!query) {
      return NextResponse.json({ error: 'Search query parameter is required.' }, { status: 400 })
    }

    // Sanitize input to only alphanumeric characters and spaces to prevent PostgREST syntax injection
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s\-]/g, '').trim()
    if (sanitizedQuery.length < 3) {
      return NextResponse.json({ error: 'Search query must be at least 3 characters long.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    let dbQuery = serviceClient
      .from('processed_registrations')
      .select('serial, full_name, level, event, phone_number, admit_card_url')

    if (level && level !== 'all') {
      dbQuery = dbQuery.eq('level', level)
    }
    if (event && event !== 'all') {
      dbQuery = dbQuery.eq('event', event)
    }

    // Filter by name (case-insensitive partial match), phone number (suffix/partial match), or serial number
    dbQuery = dbQuery.or(`full_name.ilike.%${sanitizedQuery}%,phone_number.ilike.%${sanitizedQuery}%,serial.ilike.%${sanitizedQuery}%`)

    // Limit to maximum 10 matching records for data protection
    const { data, error } = await dbQuery.limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, registrations: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
