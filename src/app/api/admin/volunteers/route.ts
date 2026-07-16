import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/volunteers
 * Fetch all volunteer records. Securely protected.
 */
export async function GET() {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  const supabase = guard.supabase
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .order('unique_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/admin/volunteers
 * Create a new volunteer record. Securely protected.
 */
export async function POST(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const body = await request.json()
    const {
      unique_id,
      name,
      email,
      number,
      image_url,
      segment,
      department,
      student_id,
      year,
      t_shirt_size,
    } = body

    if (!unique_id || !name || !email) {
      return NextResponse.json({ error: 'Unique ID, Name, and Email are required.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    const cleanEmail = String(email).trim().toLowerCase()

    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        unique_id: String(unique_id).trim(),
        name: String(name).trim(),
        email: cleanEmail,
        number: number ? String(number).trim() : null,
        image_url: image_url ? String(image_url).trim() : null,
        segment: segment ? String(segment).trim() : null,
        department: department ? String(department).trim() : null,
        student_id: student_id ? String(student_id).trim() : null,
        year: year ? String(year).trim() : null,
        t_shirt_size: t_shirt_size ? String(t_shirt_size).trim() : null,
        is_present: !!body.is_present,
        is_gift_collected: !!body.is_gift_collected,
        is_lunch_collected: !!body.is_lunch_collected,
        updated_by: adminName,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create credentials for the volunteer
    try {
      const service = createServiceClient()

      // Check if user already exists in admin_users or auth
      const { data: existingUser } = await service
        .from('admin_users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      let userId = existingUser?.id

      if (!userId) {
        const { data: authData, error: authError } = await service.auth.admin.createUser({
          email: cleanEmail,
          password: '12345678',
          email_confirm: true,
        })

        if (!authError && authData?.user) {
          userId = authData.user.id
        } else {
          console.warn('Supabase auth createUser warning:', authError?.message)
        }
      }

      if (userId) {
        await service
          .from('admin_users')
          .upsert({
            id: userId,
            email: cleanEmail,
            role: 'volunteer',
            display_name: String(name).trim(),
          })
      }
    } catch (authCreateErr) {
      console.error('Failed to create volunteer auth credentials:', authCreateErr)
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/volunteers
 * Bulk or individual update of status flags or textual fields. Securely protected.
 */
export async function PATCH(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const { unique_ids, data } = await request.json()

    if (unique_ids === undefined || data === undefined) {
      return NextResponse.json({ error: 'Missing unique_ids or data parameters.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('display_name, email')
      .eq('id', guard.user.id)
      .single()
    const adminName = adminRecord?.display_name || guard.user.email || 'Admin'

    const updatePayload: Record<string, any> = {
      updated_by: adminName,
      updated_at: new Date().toISOString()
    }

    if (data.is_present !== undefined) updatePayload.is_present = !!data.is_present
    if (data.is_gift_collected !== undefined) updatePayload.is_gift_collected = !!data.is_gift_collected
    if (data.is_lunch_collected !== undefined) updatePayload.is_lunch_collected = !!data.is_lunch_collected

    if (data.name !== undefined) updatePayload.name = data.name === null ? null : String(data.name).trim()
    if (data.email !== undefined) updatePayload.email = data.email === null ? null : String(data.email).trim().toLowerCase()
    if (data.number !== undefined) updatePayload.number = data.number === null ? null : String(data.number).trim()
    if (data.image_url !== undefined) updatePayload.image_url = data.image_url === null ? null : String(data.image_url).trim()
    if (data.segment !== undefined) updatePayload.segment = data.segment === null ? null : String(data.segment).trim()
    if (data.department !== undefined) updatePayload.department = data.department === null ? null : String(data.department).trim()
    if (data.student_id !== undefined) updatePayload.student_id = data.student_id === null ? null : String(data.student_id).trim()
    if (data.year !== undefined) updatePayload.year = data.year === null ? null : String(data.year).trim()
    if (data.t_shirt_size !== undefined) updatePayload.t_shirt_size = data.t_shirt_size === null ? null : String(data.t_shirt_size).trim()

    if (Object.keys(updatePayload).length <= 2) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    if (unique_ids === 'all') {
      const { error } = await supabase
        .from('volunteers')
        .update(updatePayload)
        .neq('unique_id', '')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (Array.isArray(unique_ids)) {
      if (unique_ids.length === 0) {
        return NextResponse.json({ success: true, updatedCount: 0 })
      }
      const { error } = await supabase
        .from('volunteers')
        .update(updatePayload)
        .in('unique_id', unique_ids)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (typeof unique_ids === 'string') {
      const { error } = await supabase
        .from('volunteers')
        .update(updatePayload)
        .eq('unique_id', unique_ids)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid unique_ids parameter format.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, updatedBy: adminName, updatedAt: updatePayload.updated_at })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/volunteers
 * Delete a volunteer by unique_id. Securely protected.
 */
export async function DELETE(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const { searchParams } = new URL(request.url)
    const unique_id = searchParams.get('unique_id')

    if (!unique_id) {
      return NextResponse.json({ error: 'Missing unique_id parameter.' }, { status: 400 })
    }

    const supabase = guard.supabase
    const { error } = await supabase
      .from('volunteers')
      .delete()
      .eq('unique_id', unique_id.trim())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
