import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/admin/login
 * Standard REST API login for external clients (like the Android App).
 * Accepts email and password, authenticates with Supabase, verifies admin role,
 * and returns the session tokens + user profile role.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Sign in to Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user || !authData.session) {
      return NextResponse.json({ error: authError?.message || 'Authentication failed.' }, { status: 401 })
    }

    // Verify user has an active admin record
    const { data: adminRecord, error: dbError } = await supabase
      .from('admin_users')
      .select('role, display_name')
      .eq('id', authData.user.id)
      .single()

    if (dbError || !adminRecord) {
      // User is authenticated but is not an authorized administrator. Sign out immediately.
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'Access denied: User is not an authorized administrator.' }, { status: 403 })
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
        display_name: adminRecord.display_name || 'Admin',
        role: adminRecord.role,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
