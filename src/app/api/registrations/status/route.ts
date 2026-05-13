import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = String(searchParams.get('code') ?? '').trim().toUpperCase()

  if (!code || code.length !== 8) {
    return NextResponse.json({ error: 'Invalid tracking ID.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('public_id, status, submitted_at, form_data, events ( title, slug )')
    .eq('public_id', code)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Tracking ID not found.' }, { status: 404 })
  }

  return NextResponse.json({
    public_id: data.public_id,
    status: data.status,
    submitted_at: data.submitted_at,
    form_data: data.form_data,
    event: data.events,
  })
}
