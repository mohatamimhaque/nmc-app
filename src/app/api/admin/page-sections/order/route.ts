import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

interface UpdatePayload {
  section_key: string
  sort_order: number
}

export async function POST(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const updates = Array.isArray(body?.updates) ? body.updates as UpdatePayload[] : []

  if (!updates.length) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const invalid = updates.some(item => !item.section_key || typeof item.sort_order !== 'number')
  if (invalid) {
    return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
  }

  const { supabase } = guard

  const results = await Promise.all(
    updates.map(item => (
      supabase
        .from('page_sections')
        .update({ sort_order: item.sort_order })
        .eq('section_key', item.section_key)
    ))
  )

  const error = results.find(result => result.error)?.error
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
