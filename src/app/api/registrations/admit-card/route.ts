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

    // Determine if input is a valid email or phone number format
    const cleanPhone = query.replace(/[\s\-]/g, '')
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(query)
    const isPhone = /^\+?[0-9]{9,15}$/.test(cleanPhone)

    if (!isEmail && !isPhone) {
      return NextResponse.json({ error: 'Please enter a valid full Email address or Phone number.' }, { status: 400 })
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

    if (isEmail) {
      // Case-insensitive exact match for email address
      dbQuery = dbQuery.ilike('email_address', query)
    } else {
      // Normalize Bangladesh phone numbers (strip +880 or 880 prefix if present)
      let phoneToMatch = cleanPhone
      if (phoneToMatch.startsWith('+880') && phoneToMatch.length === 14) {
        phoneToMatch = phoneToMatch.substring(3)
      } else if (phoneToMatch.startsWith('880') && phoneToMatch.length === 13) {
        phoneToMatch = phoneToMatch.substring(2)
      }
      dbQuery = dbQuery.eq('phone_number', phoneToMatch)
    }

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
