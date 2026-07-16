import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'registration_editor'

export type AdminGuardResult =
  | { supabase: SupabaseClient; user: User; role: AdminRole }
  | { response: NextResponse }

export async function requireAdmin(): Promise<AdminGuardResult> {
  // Check if request has an Authorization: Bearer <JWT> token (standard for Android/REST clients)
  const headerStore = await headers()
  const authHeader = headerStore.get('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    const supabaseWithToken = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabaseWithToken.auth.getUser()
    
    if (user && !authError) {
      const { data: adminRecord } = await supabaseWithToken
        .from('admin_users')
        .select('id, role')
        .eq('id', user.id)
        .single()
        
      if (adminRecord) {
        return { supabase: supabaseWithToken, user, role: adminRecord.role as AdminRole }
      }
    }
  }

  // Fallback to cookie-based session (standard for admin dashboard web UI)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!adminRecord) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user, role: adminRecord.role as AdminRole }
}

export async function requireAdminRole(allowedRoles: AdminRole[]): Promise<AdminGuardResult> {
  const guard = await requireAdmin()
  if ('response' in guard) {
    return guard
  }

  if (!allowedRoles.includes(guard.role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return guard
}

export async function requireVolunteerAccess(): Promise<AdminGuardResult> {
  const guard = await requireAdmin()
  if ('response' in guard) {
    return guard
  }

  const { role, supabase, user } = guard
  if (role === 'super_admin' || role === 'admin') {
    return guard
  }

  if (role === 'registration_editor') {
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('can_manage_volunteers')
      .eq('id', user.id)
      .single()

    if (adminRecord?.can_manage_volunteers) {
      return guard
    }
  }

  return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

