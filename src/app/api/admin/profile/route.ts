import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const runtime = 'nodejs'

/**
 * GET /api/admin/profile
 * Retrieves the currently logged-in user's profile info.
 * Handles both admins (admin_users table) and volunteers (volunteers + admin_users tables).
 */
export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) {
    return guard.response
  }

  const { supabase, user, role } = guard

  // Get admin_users record
  const { data: adminRecord, error: dbError } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, can_manage_volunteers, can_manage_registrations, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast, created_at')
    .eq('id', user.id)
    .single()

  if (dbError || !adminRecord) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  if (role === 'volunteer') {
    // Also fetch volunteer details from the volunteers table by email
    const { data: volunteerRecord } = await supabase
      .from('volunteers')
      .select('*')
      .eq('email', adminRecord.email.trim().toLowerCase())
      .maybeSingle()

    const volunteerWithQr = volunteerRecord ? {
      ...volunteerRecord,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(volunteerRecord.unique_id)}`
    } : null

    return NextResponse.json({
      success: true,
      profile: {
        ...adminRecord,
        volunteer_details: volunteerWithQr,
      },
    })
  }

  return NextResponse.json({
    success: true,
    profile: adminRecord,
  })
}

/**
 * PATCH /api/admin/profile
 * Allows the logged-in user to update their own profile:
 * - name (updates display_name in admin_users and name in volunteers)
 * - image_url (updates image_url in volunteers for volunteer roles)
 * - password (updates Supabase auth password)
 * Strictly restricted to updating ONLY the logged-in user's own details.
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin()
  if ('response' in guard) {
    return guard.response
  }

  try {
    const { supabase, user, role } = guard
    const { name, image_url, password } = await request.json()

    // 1. Get current admin_users email to match volunteers table
    const { data: adminRecord, error: fetchErr } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (fetchErr || !adminRecord) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    const cleanEmail = adminRecord.email.trim().toLowerCase()

    // 2. Update Name if provided
    if (name !== undefined) {
      const cleanName = String(name).trim()
      if (cleanName === '') {
        return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
      }

      // Update admin_users table
      const { error: adminUpdateErr } = await supabase
        .from('admin_users')
        .update({ display_name: cleanName })
        .eq('id', user.id)

      if (adminUpdateErr) {
        return NextResponse.json({ error: adminUpdateErr.message }, { status: 400 })
      }

      // If volunteer, also update volunteers table
      if (role === 'volunteer') {
        await supabase
          .from('volunteers')
          .update({ name: cleanName })
          .eq('email', cleanEmail)
      }
    }

    // 3. Update Profile Photo (image_url) if provided (for volunteers)
    if (image_url !== undefined && role === 'volunteer') {
      const cleanUrl = image_url ? String(image_url).trim() : null
      await supabase
        .from('volunteers')
        .update({ image_url: cleanUrl })
        .eq('email', cleanEmail)
    }

    // 4. Update password if provided
    if (password !== undefined) {
      const cleanPassword = String(password)
      if (cleanPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: cleanPassword,
      })

      if (passwordError) {
        return NextResponse.json({ error: passwordError.message }, { status: 400 })
      }
    }

    // Return the updated profile
    // Fetch refreshed admin record
    const { data: updatedAdmin } = await supabase
      .from('admin_users')
      .select('id, email, display_name, role, can_manage_volunteers, can_manage_registrations, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast, created_at')
      .eq('id', user.id)
      .single()

    if (role === 'volunteer') {
      const { data: updatedVolunteer } = await supabase
        .from('volunteers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        profile: {
          ...updatedAdmin,
          volunteer_details: updatedVolunteer || null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      profile: updatedAdmin,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
