import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

/**
 * PATCH /api/admin/volunteers/gift
 * Updates is_gift_collected status for a single volunteer using their unique_id.
 */
export async function PATCH(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const { unique_id, is_gift_collected } = await request.json()

    if (!unique_id || typeof unique_id !== 'string' || is_gift_collected === undefined) {
      return NextResponse.json({ error: 'Missing or invalid unique_id or is_gift_collected parameters.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    const updatePayload = {
      is_gift_collected: !!is_gift_collected,
      updated_by: adminName,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('volunteers')
      .update(updatePayload)
      .eq('unique_id', unique_id.trim())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: true,
      unique_id: unique_id.trim(),
      updatedBy: adminName,
      updatedAt: updatePayload.updated_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
