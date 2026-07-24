import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/admin/login
 * Unified Login API for Web & Android App.
 * Supports authentication via Email OR Mobile/Phone Number.
 * Auto-provisions volunteer/editor accounts with default password if needed.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawInput = String(body.email || body.identifier || body.phone || body.mobile || body.username || '').trim()
    const passwordInput = String(body.password || '').trim() || '12345678'

    if (!rawInput) {
      return NextResponse.json(
        { error: 'Email or Mobile Number is required.' },
        { status: 400 }
      )
    }

    const service = createServiceClient()
    let targetEmail = rawInput.toLowerCase()
    let resolvedName: string | null = null

    const isPhone = !rawInput.includes('@') && /^\+?[0-9\s\-]{8,18}$/.test(rawInput)

    if (isPhone) {
      const digits = rawInput.replace(/\D/g, '')
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits

      // 1. Search in volunteers table by mobile number
      const { data: volByPhone } = await service
        .from('volunteers')
        .select('name, email, number')
        .or(`number.ilike.%${last10}%,number.eq.${rawInput}`)
        .limit(1)
        .maybeSingle()

      if (volByPhone?.email) {
        targetEmail = volByPhone.email.trim().toLowerCase()
        resolvedName = volByPhone.name
      } else {
        // 2. Search in admin_users by email prefix or display_name
        const { data: adminByPhone } = await service
          .from('admin_users')
          .select('email, display_name')
          .ilike('email', `%${last10}%`)
          .limit(1)
          .maybeSingle()

        if (adminByPhone?.email) {
          targetEmail = adminByPhone.email.trim().toLowerCase()
          resolvedName = adminByPhone.display_name
        } else {
          // 3. Search in processed_registrations by phone_number
          const { data: regByPhone } = await service
            .from('processed_registrations')
            .select('full_name, email_address, phone_number')
            .or(`phone_number.ilike.%${last10}%,phone_number.eq.${rawInput}`)
            .limit(1)
            .maybeSingle()

          if (regByPhone?.email_address) {
            targetEmail = regByPhone.email_address.trim().toLowerCase()
            resolvedName = regByPhone.full_name
          } else {
            // Synthesize standard volunteer email format if only phone is available
            targetEmail = `${digits}@volunteers.nmcbd.app`
          }
        }
      }
    }

    // ── VOLUNTEER & ADMIN AUTO-PROVISIONING ON LOGIN ──────────────────────
    const { data: existingAdmin } = await service
      .from('admin_users')
      .select('id, role, display_name')
      .eq('email', targetEmail)
      .maybeSingle()

    if (!existingAdmin) {
      // Check if user exists in volunteers table
      const { data: volunteerRecord } = await service
        .from('volunteers')
        .select('name, email')
        .eq('email', targetEmail)
        .maybeSingle()

      const displayName = resolvedName || volunteerRecord?.name || targetEmail.split('@')[0]

      // Check if Supabase Auth user exists
      const { data: userList } = await service.auth.admin.listUsers()
      let matchedAuthUser = userList?.users?.find(
        (u: any) => u.email?.toLowerCase() === targetEmail
      )

      if (!matchedAuthUser) {
        const { data: newAuthData } = await service.auth.admin.createUser({
          email: targetEmail,
          password: passwordInput,
          email_confirm: true,
        })
        matchedAuthUser = newAuthData?.user ?? undefined
      }

      if (matchedAuthUser?.id) {
        await service.from('admin_users').upsert({
          id: matchedAuthUser.id,
          email: targetEmail,
          role: 'volunteer',
          display_name: displayName,
        })
      }
    }

    const supabase = await createClient()

    // ── SUPABASE AUTHENTICATION ───────────────────────────────────────────
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: passwordInput,
    })

    // If initial password attempt fails and password wasn't default, attempt fallback with default password '12345678'
    if ((authError || !authData.session) && passwordInput !== '12345678') {
      const fallbackRes = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: '12345678',
      })
      if (fallbackRes.data.session) {
        authData = fallbackRes.data
        authError = null
      }
    }

    if (authError || !authData.user || !authData.session) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid credentials. Please verify your Email/Mobile and Password.' },
        { status: 401 }
      )
    }

    let { data: adminRecord } = await supabase
      .from('admin_users')
      .select('role, display_name, can_manage_volunteers, can_manage_kit, can_manage_presents, can_manage_lunch, can_manage_breakfast')
      .eq('id', authData.user.id)
      .single()

    if (!adminRecord) {
      // Auto-insert default volunteer role if not present
      const defaultName = resolvedName || targetEmail.split('@')[0]
      const { data: newAdmin } = await service
        .from('admin_users')
        .upsert({
          id: authData.user.id,
          email: targetEmail,
          role: 'volunteer',
          display_name: defaultName,
        })
        .select()
        .single()

      adminRecord = newAdmin
    }

    if (!adminRecord) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied: Account is not registered as an authorized user.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
      },
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: adminRecord.display_name || 'User',
        role: adminRecord.role,
        can_manage_volunteers: !!adminRecord.can_manage_volunteers,
        can_manage_registrations: adminRecord.role !== 'volunteer' || !!(adminRecord as any).can_manage_registrations,
        can_manage_kit: !!adminRecord.can_manage_kit,
        can_manage_presents: !!adminRecord.can_manage_presents,
        can_manage_lunch: !!adminRecord.can_manage_lunch,
        can_manage_breakfast: !!adminRecord.can_manage_breakfast,
      },
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: err.message || 'An unexpected error occurred during login.' }, { status: 500 })
  }
}
