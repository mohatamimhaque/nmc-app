import { NextResponse } from 'next/server'
import { requireKitWriteAccess } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * PATCH /api/admin/registrations/kit
 * Updates kit collection status (is_kit_coollect) for a single registration using its serial number.
 * Authorized: super_admin, admin, registration_editor, permitted_volunteer
 */
export async function PATCH(request: Request) {
  const guard = await requireKitWriteAccess()
  if ('response' in guard) return guard.response

  try {
    const { serial, is_kit_coollect } = await request.json()

    if (!serial || typeof serial !== 'string' || is_kit_coollect === undefined) {
      return NextResponse.json({ error: 'Missing or invalid serial or is_kit_coollect parameters.' }, { status: 400 })
    }

    const supabase = guard.supabase

    // Fetch active admin name
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    const updatePayload = {
      is_kit_coollect: !!is_kit_coollect,
      updated_by: adminName,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('processed_registrations')
      .update(updatePayload)
      .eq('serial', serial.trim())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated: true,
      serial: serial.trim(),
      updatedBy: adminName,
      updatedAt: updatePayload.updated_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
