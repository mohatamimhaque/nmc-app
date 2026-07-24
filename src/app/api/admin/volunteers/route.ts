import { NextResponse } from 'next/server'
import { requireVolunteerAccess, requireVolunteerReadAccess } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRandomId(): string {
  let value = ''
  for (let i = 0; i < 8; i += 1) {
    value += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return value
}

async function generateVolunteerUniqueId(supabase: any): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const value = generateRandomId()
    const { data } = await supabase
      .from('volunteers')
      .select('unique_id')
      .eq('unique_id', value)
      .maybeSingle()
    if (!data) return value
  }
  return `V-${Date.now()}`.slice(-8)
}

async function generateNextSerialNo(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('volunteers')
    .select('serial_no')
    .like('serial_no', 'NMC26-V-%')
    .order('serial_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data && data.serial_no) {
    const match = data.serial_no.match(/^NMC26-V-(\d+)$/)
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1
      return `NMC26-V-${String(nextNum).padStart(3, '0')}`
    }
  }
  return 'NMC26-V-001'
}

/**
 * GET /api/admin/volunteers
 * Fetch all volunteer records. Securely protected.
 */
export async function GET() {
  const guard = await requireVolunteerReadAccess()
  if ('response' in guard) return guard.response

  const supabase = guard.supabase
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .order('unique_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const volunteersWithQr = (data || []).map(v => ({
    ...v,
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(v.unique_id)}`
  }))

  return NextResponse.json(volunteersWithQr)
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
      serial_no,
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

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required.' }, { status: 400 })
    }

    const supabase = guard.supabase
    let finalUniqueId = unique_id ? String(unique_id).trim() : ''

    if (!finalUniqueId) {
      finalUniqueId = await generateVolunteerUniqueId(supabase)
    } else {
      // Check collision if manually provided
      const { data: existing } = await supabase
        .from('volunteers')
        .select('unique_id')
        .eq('unique_id', finalUniqueId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: `Volunteer with ID "${finalUniqueId}" already exists.` }, { status: 400 })
      }
    }

    let finalSerialNo = serial_no ? String(serial_no).trim() : ''
    if (!finalSerialNo) {
      finalSerialNo = await generateNextSerialNo(supabase)
    }

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
        unique_id: finalUniqueId,
        serial_no: finalSerialNo,
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

    const responseData = {
      ...data,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.unique_id)}`
    }

    return NextResponse.json({ success: true, data: responseData })
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
    if (data.serial_no !== undefined) updatePayload.serial_no = data.serial_no === null ? null : String(data.serial_no).trim()
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

    // 1. Fetch volunteer to check their name and email
    const { data: volunteer, error: fetchError } = await supabase
      .from('volunteers')
      .select('name, email')
      .eq('unique_id', unique_id.trim())
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found.' }, { status: 404 })
    }

    // 2. Delete matching admin users by email or name if they exist
    const serviceClient = createServiceClient()
    const adminUserIdsToDelete: string[] = []

    // Check by email
    if (volunteer.email) {
      const { data: byEmail } = await serviceClient
        .from('admin_users')
        .select('id')
        .eq('email', volunteer.email.trim())
        .maybeSingle()
      if (byEmail?.id) {
        adminUserIdsToDelete.push(byEmail.id)
      }
    }

    // Check by name
    if (volunteer.name) {
      const { data: byNames } = await serviceClient
        .from('admin_users')
        .select('id')
        .eq('name', volunteer.name.trim())
      if (byNames && byNames.length > 0) {
        byNames.forEach((admin: { id: string }) => {
          if (!adminUserIdsToDelete.includes(admin.id)) {
            adminUserIdsToDelete.push(admin.id)
          }
        })
      }
    }

    // Delete found admin users from auth.users (cascades to admin_users)
    if (adminUserIdsToDelete.length > 0) {
      for (const adminId of adminUserIdsToDelete) {
        const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(
          adminId
        )
        if (authDeleteError) {
          console.error('Failed to delete auth user, attempting direct admin_users deletion:', authDeleteError.message)
          // Fallback: manually delete from admin_users
          await serviceClient
            .from('admin_users')
            .delete()
            .eq('id', adminId)
        }
      }
    }

    // 3. Delete the volunteer record
    const { error: deleteVolError } = await supabase
      .from('volunteers')
      .delete()
      .eq('unique_id', unique_id.trim())

    if (deleteVolError) {
      return NextResponse.json({ error: deleteVolError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
