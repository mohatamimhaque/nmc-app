import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'moderator', 'registration_editor', 'volunteer'])

export async function GET() {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  const { supabase } = guard
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, can_manage_volunteers, can_manage_registrations, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast, last_login_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const email = body?.email ? String(body.email).trim() : ''
  const password = body?.password ? String(body.password) : ''
  const role = body?.role ? String(body.role) : ''
  const displayName = body?.display_name ? String(body.display_name).trim() : null

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData?.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user.' }, { status: 400 })
  }

  const canManageVolunteers = body?.can_manage_volunteers !== undefined ? !!body.can_manage_volunteers : false
  const canManageKit = body?.can_manage_kit !== undefined ? !!body.can_manage_kit : false
  const canManagePresents = body?.can_manage_presents !== undefined ? !!body.can_manage_presents : false
  const canManageLunch = body?.can_manage_lunch !== undefined ? !!body.can_manage_lunch : false
  const canManageBreakfast = body?.can_manage_breakfast !== undefined ? !!body.can_manage_breakfast : false

  const { error: adminError, data: adminData } = await service
    .from('admin_users')
    .upsert({
      id: authData.user.id,
      email,
      role,
      display_name: displayName,
      can_manage_volunteers: (role === 'super_admin' || role === 'admin') ? true : canManageVolunteers,
      can_manage_kit: (role === 'super_admin' || role === 'admin') ? true : canManageKit,
      can_manage_presents: (role === 'super_admin' || role === 'admin') ? true : canManagePresents,
      can_manage_lunch: (role === 'super_admin' || role === 'admin') ? true : canManageLunch,
      can_manage_breakfast: (role === 'super_admin' || role === 'admin') ? true : canManageBreakfast,
    })
    .select('id, email, display_name, role, can_manage_volunteers, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast, created_at')
    .single()

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 400 })
  }

  return NextResponse.json({ data: adminData })
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const id = body?.id ? String(body.id).trim() : ''
  const role = body?.role ? String(body.role) : undefined
  const displayName = body?.display_name !== undefined ? (body.display_name === null ? null : String(body.display_name).trim()) : undefined
  const canManageVolunteers = body?.can_manage_volunteers !== undefined ? !!body.can_manage_volunteers : undefined
  const canManageKit = body?.can_manage_kit !== undefined ? !!body.can_manage_kit : undefined
  const canManagePresents = body?.can_manage_presents !== undefined ? !!body.can_manage_presents : undefined
  const canManageLunch = body?.can_manage_lunch !== undefined ? !!body.can_manage_lunch : undefined
  const canManageBreakfast = body?.can_manage_breakfast !== undefined ? !!body.can_manage_breakfast : undefined

  if (!id) {
    return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 })
  }

  const updatePayload: Record<string, any> = {}
  if (role !== undefined) {
    const VALID_ROLES = new Set(['super_admin', 'admin', 'moderator', 'registration_editor', 'volunteer'])
    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    updatePayload.role = role
    if (role === 'super_admin' || role === 'admin') {
      updatePayload.can_manage_volunteers = true
      updatePayload.can_manage_kit = true
      updatePayload.can_manage_presents = true
      updatePayload.can_manage_lunch = true
      updatePayload.can_manage_breakfast = true
    }
  }
  if (displayName !== undefined) {
    updatePayload.display_name = displayName
  }
  if (canManageVolunteers !== undefined && role !== 'super_admin' && role !== 'admin') {
    updatePayload.can_manage_volunteers = canManageVolunteers
  }
  if (canManageKit !== undefined && role !== 'super_admin' && role !== 'admin') {
    updatePayload.can_manage_kit = canManageKit
  }
  if (canManagePresents !== undefined && role !== 'super_admin' && role !== 'admin') {
    updatePayload.can_manage_presents = canManagePresents
  }
  if (canManageLunch !== undefined && role !== 'super_admin' && role !== 'admin') {
    updatePayload.can_manage_lunch = canManageLunch
  }
  if (canManageBreakfast !== undefined && role !== 'super_admin' && role !== 'admin') {
    updatePayload.can_manage_breakfast = canManageBreakfast
  }
  const canManageRegistrations = body?.can_manage_registrations !== undefined ? !!body.can_manage_registrations : undefined
  if (canManageRegistrations !== undefined) {
    updatePayload.can_manage_registrations = canManageRegistrations
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error, data } = await service
    .from('admin_users')
    .update(updatePayload)
    .eq('id', id)
    .select('id, email, display_name, role, can_manage_volunteers, can_manage_registrations, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast, last_login_at, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 })
    }

    if (id.trim() === guard.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
    }

    const service = createServiceClient()

    // Retrieve the user to check their role
    const { data: targetUser, error: fetchError } = await service
      .from('admin_users')
      .select('role')
      .eq('id', id.trim())
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Admin user not found.' }, { status: 404 })
    }

    // If target user is a super_admin, verify there is at least one other super_admin remaining
    if (targetUser.role === 'super_admin') {
      const { count, error: countError } = await service
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')

      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 })
      }

      if (count !== null && count <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last Super Admin. At least one Super Admin must always exist.' }, { status: 400 })
      }
    }

    // Delete user from auth.users (cascades to admin_users table)
    const { error: deleteError } = await service.auth.admin.deleteUser(id.trim())

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


