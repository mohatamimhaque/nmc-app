import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin', 'moderator'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const noticesInput = Array.isArray(body?.notices) ? body.notices : []

  const { supabase } = guard

  const { error: deleteError } = await supabase
    .from('notices')
    .delete()
    .gte('sort_order', 0)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  const notices = noticesInput
    .filter((item: any) => item?.title)
    .map((item: any, index: number) => ({
      id: String(item.id),
      title: String(item.title),
      body: item?.body ? String(item.body) : null,
      category: item?.category ? String(item.category) : null,
      is_pinned: item?.is_pinned === true,
      is_visible: item?.is_visible !== false,
      publish_at: item?.publish_at ? String(item.publish_at) : new Date().toISOString(),
      expires_at: item?.expires_at ? String(item.expires_at) : null,
      view_count: Number.isFinite(item?.view_count) ? Number(item.view_count) : 0,
      sort_order: index + 1,
    }))

  if (notices.length) {
    const { error: insertError } = await supabase
      .from('notices')
      .insert(notices)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
