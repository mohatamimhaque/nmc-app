import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const ambassadorsInput = Array.isArray(body?.ambassadors) ? body.ambassadors : []

  const service = createServiceClient()

  const ambassadors = ambassadorsInput.map((item: any, index: number) => ({
    id: String(item.id ?? crypto.randomUUID()),
    name: item.name ? String(item.name).trim() : null,
    role: item.role ? String(item.role).trim() : null,
    institution: item.institution ? String(item.institution).trim() : null,
    department: item.department ? String(item.department).trim() : null,
    designation: item.designation ? String(item.designation).trim() : null,
    bio: item.bio ? String(item.bio).trim() : null,
    photo_url: item.photo_url || null,
    email: item.email ? String(item.email).trim() : null,
    phone: item.phone ? String(item.phone).trim() : null,
    facebook_url: item.facebook_url ? String(item.facebook_url).trim() : null,
    linkedin_url: item.linkedin_url ? String(item.linkedin_url).trim() : null,
    is_visible: item.is_visible !== false,
    is_disabled: item.is_disabled === true,
    sort_order: index + 1,
  }))

  if (ambassadors.length) {
    const { error: upsertError } = await service
      .from('campus_ambassadors')
      .upsert(ambassadors, { onConflict: 'id' })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    const idsList = ambassadors.map(item => `"${item.id}"`).join(',')
    const { error: pruneError } = await service
      .from('campus_ambassadors')
      .delete()
      .not('id', 'in', `(${idsList})`)

    if (pruneError) {
      return NextResponse.json({ error: pruneError.message }, { status: 400 })
    }
  } else {
    const { error: clearError } = await service
      .from('campus_ambassadors')
      .delete()
      .neq('id', '')

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
