import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const ALLOWED_ROLES = new Set(['admin', 'moderator', 'registration_editor'])

export async function GET() {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  const { supabase } = guard
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, last_login_at, created_at')
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

  const { error: adminError, data: adminData } = await service
    .from('admin_users')
    .upsert({
      id: authData.user.id,
      email,
      role,
      display_name: displayName,
    })
    .select('id, email, display_name, role, created_at')
    .single()

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 400 })
  }

  return NextResponse.json({ data: adminData })
}
