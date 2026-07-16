import { NextResponse } from 'next/server'
import { requireRegistrationWriteAccess } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/admin/registrations/import-rooms
 * Bulk update allocated rooms for multiple registrations.
 * Uses a PL/pgSQL database RPC function to process updates in a single query.
 */
export async function POST(request: Request) {
  const guard = await requireRegistrationWriteAccess()
  if ('response' in guard) return guard.response

  try {
    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array of objects.' }, { status: 400 })
    }

    // Sanitize and validate inputs
    const cleanUpdates = updates
      .filter((u: any) => u && typeof u.serial === 'string' && u.serial.trim() !== '')
      .map((u: any) => ({
        serial: u.serial.trim(),
        allocated_room: u.allocated_room === null || String(u.allocated_room).trim() === ''
          ? null
          : String(u.allocated_room).trim()
      }))

    if (cleanUpdates.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    // Fetch admin name/email to track who performed the update
    const supabase = guard.supabase
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    // Use service role client to run the secure RPC function
    const serviceClient = createServiceClient()
    const { error } = await serviceClient.rpc('update_allocated_rooms', {
      updates: cleanUpdates,
      admin_user: adminName
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: cleanUpdates.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
