import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, event_id, public_id, registrant_email, registrant_phone, form_data, status, submitted_at')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const ids = Array.isArray(body?.ids) ? body.ids : []
  const status = body?.status

  if (!ids.length || !status) {
    return NextResponse.json({ error: 'Missing ids or status.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('event_registrations')
    .update({ status })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length) {
    return NextResponse.json({ error: 'Missing ids.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
