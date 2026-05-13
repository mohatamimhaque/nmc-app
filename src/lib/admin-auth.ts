import type { SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export type AdminGuardResult =
  | { supabase: SupabaseClient; user: User; role: AdminRole }
  | { response: NextResponse }

export async function requireAdmin(): Promise<AdminGuardResult> {
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
