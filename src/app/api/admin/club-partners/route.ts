import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin', 'moderator'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const partnersInput = Array.isArray(body?.partners) ? body.partners : []

  const service = createServiceClient()

  const partners = partnersInput.map((item: any, index: number) => ({
    id: String(item.id ?? crypto.randomUUID()),
    name: String(item.name ?? '').trim() || 'Untitled Partner',
    logo_url: item.logo_url || null,
    website_url: item.website_url ? String(item.website_url).trim() : null,
    category_id: null,
    display_mode: item.display_mode ?? 'both',
    logo_size: item.logo_size ?? 'medium',
    is_visible: item.is_visible !== false,
    sort_order: index + 1,
  }))

  if (partners.length) {
    const { error: upsertError } = await service
      .from('club_partners')
      .upsert(partners, { onConflict: 'id' })
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    const idsList = partners.map((item: { id: string }) => `"${item.id}"`).join(',')
    const { error: pruneError } = await service
      .from('club_partners')
      .delete()
      .not('id', 'in', `(${idsList})`)

    if (pruneError) {
      return NextResponse.json({ error: pruneError.message }, { status: 400 })
    }
  } else {
    const { error: clearError } = await service
      .from('club_partners')
      .delete()
      .neq('id', '')

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
