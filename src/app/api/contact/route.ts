import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim()
  const subject = String(body?.subject ?? '').trim()
  const message = String(body?.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    subject: subject || null,
    message,
    status: 'unread',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const referrer = request.headers.get('referer')
  let pagePath = '/contact'
  if (referrer) {
    try {
      pagePath = new URL(referrer).pathname
    } catch {
      pagePath = '/contact'
    }
  }
  await supabase
    .from('analytics_events')
    .insert({
      event_type: 'form_submit',
      page_path: pagePath,
      referrer: referrer ?? null,
      user_agent_hash: null,
      screen_width: null,
      country_code: null,
      session_id: null,
    })

  return NextResponse.json({ ok: true })
}
