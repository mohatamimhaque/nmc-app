import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const linksInput = Array.isArray(body?.links) ? body.links : []

  const { supabase } = guard

  const { error: deleteError } = await supabase
    .from('nav_links')
    .delete()
    .gte('sort_order', 0)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  const links = linksInput
    .filter((item: any) => item?.id)
    .map((item: any, index: number) => ({
      id: String(item.id),
      label: String(item.label ?? 'Link'),
      url: String(item.url ?? '/'),
      is_external: item?.is_external === true,
      is_visible: item?.is_visible !== false,
      is_cta: item?.is_cta === true,
      sort_order: index + 1,
    }))

  if (links.length) {
    const { error: insertError } = await supabase.from('nav_links').insert(links)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
