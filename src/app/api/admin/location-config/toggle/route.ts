import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  const { searchParams } = new URL(request.url)
  const enabledParam = searchParams.get('enabled')
  
  if (enabledParam === null) {
    return NextResponse.json({ success: false, error: 'Query parameter "enabled" is required.' }, { status: 400 })
  }

  const live_map_enabled = enabledParam === 'true'

  const { supabase, user } = guard
  const { error } = await supabase
    .from('location_config')
    .update({
      live_map_enabled,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    live_map_enabled
  })
}
