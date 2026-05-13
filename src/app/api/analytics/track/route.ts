import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_EVENTS = new Set(['pageview', 'cta_click', 'notice_view', 'form_submit'])

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const eventType = body?.event_type ? String(body.event_type) : ''
  const pagePath = body?.page_path ? String(body.page_path) : ''

  if (!ALLOWED_EVENTS.has(eventType) || !pagePath) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const referrer = body?.referrer ? String(body.referrer) : request.headers.get('referer')

  const { error } = await supabase
    .from('analytics_events')
    .insert({
      event_type: eventType,
      page_path: pagePath,
      referrer: referrer ? String(referrer) : null,
      user_agent_hash: null,
      screen_width: Number.isFinite(body?.screen_width) ? Number(body.screen_width) : null,
      country_code: null,
      session_id: body?.session_id ? String(body.session_id) : null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
