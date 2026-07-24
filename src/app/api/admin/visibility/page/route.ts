import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const { page_key, is_visible } = await req.json()
  if (!page_key || typeof is_visible !== 'boolean')
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('page_visibility')
    .update({ is_visible })
    .eq('page_key', page_key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
