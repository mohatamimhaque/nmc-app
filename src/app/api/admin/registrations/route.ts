import { NextResponse } from 'next/server'
import { requireRegistrationAccess, requireRegistrationWriteAccess } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/registrations
 * Fetch all processed registration records. Securely protected.
 */
export async function GET() {
  const guard = await requireRegistrationAccess()
  if ('response' in guard) return guard.response

  const supabase = guard.supabase
  const { data, error } = await supabase
    .from('processed_registrations')
    .select('*')
    .order('serial')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * PATCH /api/admin/registrations
 * Bulk or individual update of status flags: is_kit_coollect, is_present, is_collect_launch, and allocated_room.
 */
export async function PATCH(request: Request) {
  const guard = await requireRegistrationWriteAccess()
  if ('response' in guard) return guard.response

  try {
    const { serials, data } = await request.json()

    if (serials === undefined || data === undefined) {
      return NextResponse.json({ error: 'Missing serials or data parameters.' }, { status: 400 })
    }

    const supabase = guard.supabase

    // Fetch admin name/email to track who performed the update
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    // Filter valid updates to avoid modifying unintended fields
    const updatePayload: Record<string, any> = {
      updated_by: adminName,
      updated_at: new Date().toISOString()
    }
    if (data.is_kit_coollect !== undefined) updatePayload.is_kit_coollect = !!data.is_kit_coollect
    if (data.is_present !== undefined) updatePayload.is_present = !!data.is_present
    if (data.is_collect_launch !== undefined) updatePayload.is_collect_launch = !!data.is_collect_launch
    if (data.allocated_room !== undefined) {
      updatePayload.allocated_room = data.allocated_room === null || String(data.allocated_room).trim() === ''
        ? null
        : String(data.allocated_room).trim()
    }
    if (data.admit_card_url !== undefined) {
      updatePayload.admit_card_url = data.admit_card_url === null || String(data.admit_card_url).trim() === ''
        ? null
        : String(data.admit_card_url).trim()
    }
    if (data.full_name !== undefined) updatePayload.full_name = data.full_name === null ? null : String(data.full_name).trim()
    if (data.email_address !== undefined) updatePayload.email_address = data.email_address === null ? null : String(data.email_address).trim()
    if (data.phone_number !== undefined) updatePayload.phone_number = data.phone_number === null ? null : String(data.phone_number).trim()
    if (data.gender !== undefined) updatePayload.gender = data.gender === null ? null : String(data.gender).trim()
    if (data.t_shirt_size !== undefined) updatePayload.t_shirt_size = data.t_shirt_size === null ? null : String(data.t_shirt_size).trim()
    if (data.institution !== undefined) updatePayload.institution = data.institution === null ? null : String(data.institution).trim()
    if (data.class_year_student_of !== undefined) updatePayload.class_year_student_of = data.class_year_student_of === null ? null : String(data.class_year_student_of).trim()
    if (data.event !== undefined) updatePayload.event = data.event === null ? null : String(data.event).trim()
    if (data.payment_method !== undefined) updatePayload.payment_method = data.payment_method === null ? null : String(data.payment_method).trim()
    if (data.payment_number !== undefined) updatePayload.payment_number = data.payment_number === null ? null : String(data.payment_number).trim()
    if (data.transaction_id !== undefined) updatePayload.transaction_id = data.transaction_id === null ? null : String(data.transaction_id).trim()

    // Ensure we are updating at least one field other than updated_by
    if (Object.keys(updatePayload).length <= 1) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    if (serials === 'all') {
      // Update all rows
      const { error } = await supabase
        .from('processed_registrations')
        .update(updatePayload)
        .neq('serial', '')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (Array.isArray(serials)) {
      if (serials.length === 0) {
        return NextResponse.json({ success: true, updatedCount: 0 })
      }
      // Update list of specific serials
      const { error } = await supabase
        .from('processed_registrations')
        .update(updatePayload)
        .in('serial', serials)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (typeof serials === 'string') {
      // Update a single registration
      const { error } = await supabase
        .from('processed_registrations')
        .update(updatePayload)
        .eq('serial', serials)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid serials parameter format.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, updatedBy: adminName, updatedAt: updatePayload.updated_at })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/registrations
 * Delete one or more registration records. Securely protected (requires write access).
 */
export async function DELETE(request: Request) {
  const guard = await requireRegistrationWriteAccess()
  if ('response' in guard) return guard.response

  try {
    const { serials } = await request.json()

    if (serials === undefined) {
      return NextResponse.json({ error: 'Missing serials parameter.' }, { status: 400 })
    }

    const supabase = guard.supabase

    // 1. Fetch emails of registrations to be deleted
    let emails: string[] = []
    if (Array.isArray(serials)) {
      const { data: regs } = await supabase
        .from('processed_registrations')
        .select('email_address')
        .in('serial', serials)
      if (regs) {
        emails = regs.map(r => r.email_address).filter((e): e is string => !!e)
      }
    } else if (typeof serials === 'string') {
      const { data: reg } = await supabase
        .from('processed_registrations')
        .select('email_address')
        .eq('serial', serials)
        .maybeSingle()
      if (reg?.email_address) {
        emails = [reg.email_address]
      }
    }

    // 2. Delete associated admin_users/auth.users if they exist
    if (emails.length > 0) {
      const serviceClient = createServiceClient()
      const { data: adminUsers } = await serviceClient
        .from('admin_users')
        .select('id, email')
        .in('email', emails)

      if (adminUsers && adminUsers.length > 0) {
        for (const adminUser of adminUsers) {
          const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(
            adminUser.id
          )
          if (authDeleteError) {
            console.error('Failed to delete auth user, attempting direct admin_users deletion:', authDeleteError.message)
            await serviceClient
              .from('admin_users')
              .delete()
              .eq('id', adminUser.id)
          }
        }
      }
    }

    // 3. Delete the registrations
    if (Array.isArray(serials)) {
      if (serials.length === 0) {
        return NextResponse.json({ success: true, deletedCount: 0 })
      }
      const { error } = await supabase
        .from('processed_registrations')
        .delete()
        .in('serial', serials)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, deletedCount: serials.length })
    } else if (typeof serials === 'string') {
      const { error } = await supabase
        .from('processed_registrations')
        .delete()
        .eq('serial', serials)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, deletedCount: 1 })
    } else {
      return NextResponse.json({ error: 'Invalid serials parameter format.' }, { status: 400 })
    }
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/registrations
 * Add a new registration record individually. Securely protected (requires write access).
 */
export async function POST(request: Request) {
  const guard = await requireRegistrationWriteAccess()
  if ('response' in guard) return guard.response

  try {
    const data = await request.json()

    if (!data.serial || String(data.serial).trim() === '') {
      return NextResponse.json({ error: 'Serial / Registration ID is required.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const serial = String(data.serial).trim()

    // 1. Check if serial already exists
    const { data: existing, error: checkError } = await supabase
      .from('processed_registrations')
      .select('serial')
      .eq('serial', serial)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: `Registration with serial "${serial}" already exists.` }, { status: 400 })
    }

    // 2. Fetch admin name/email to track who created the record
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    // 3. Prepare insertion payload
    const insertPayload = {
      serial: serial,
      full_name: data.full_name ? String(data.full_name).trim() : null,
      email_address: data.email_address ? String(data.email_address).trim() : null,
      phone_number: data.phone_number ? String(data.phone_number).trim() : null,
      gender: data.gender ? String(data.gender).trim() : null,
      t_shirt_size: data.t_shirt_size ? String(data.t_shirt_size).trim() : null,
      level: data.level ? String(data.level).trim() : null,
      institution: data.institution ? String(data.institution).trim() : null,
      class_year_student_of: data.class_year_student_of ? String(data.class_year_student_of).trim() : null,
      event: data.event ? String(data.event).trim() : null,
      payment_method: data.payment_method ? String(data.payment_method).trim() : null,
      payment_number: data.payment_number ? String(data.payment_number).trim() : null,
      transaction_id: data.transaction_id ? String(data.transaction_id).trim() : null,
      is_kit_coollect: !!data.is_kit_coollect,
      is_present: !!data.is_present,
      is_collect_launch: !!data.is_collect_launch,
      allocated_room: data.allocated_room ? String(data.allocated_room).trim() : null,
      admit_card_url: data.admit_card_url ? String(data.admit_card_url).trim() : null,
      updated_by: adminName,
      updated_at: new Date().toISOString()
    }

    const { data: inserted, error: insertError } = await supabase
      .from('processed_registrations')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, registration: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


