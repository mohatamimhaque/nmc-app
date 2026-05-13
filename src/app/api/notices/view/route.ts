import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const noticeId = body?.notice_id ? String(body.notice_id) : ''

  if (!noticeId) {
    return NextResponse.json({ error: 'Missing notice_id' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: notice } = await supabase
    .from('notices')
    .select('id, view_count')
    .eq('id', noticeId)
    .single()

  if (!notice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const nextCount = (notice.view_count ?? 0) + 1

  const { error: updateError } = await supabase
    .from('notices')
    .update({ view_count: nextCount })
    .eq('id', noticeId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  const { error: analyticsError } = await supabase
    .from('analytics_events')
    .insert({
      event_type: 'notice_view',
      page_path: body?.page_path ? String(body.page_path) : '/notices',
      referrer: body?.referrer ? String(body.referrer) : null,
      user_agent_hash: null,
      screen_width: Number.isFinite(body?.screen_width) ? Number(body.screen_width) : null,
      country_code: null,
      session_id: body?.session_id ? String(body.session_id) : null,
    })

  if (analyticsError) {
    return NextResponse.json({ error: analyticsError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, view_count: nextCount })
}
