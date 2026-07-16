import { NextResponse } from 'next/server'
import { requireAdmin, requireAdminRole } from '@/lib/admin-auth'

export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) {
    return guard.response
  }

  const { supabase } = guard
  const { data, error } = await supabase
    .from('location_config')
    .select('supabase_url, supabase_anon_key, live_map_enabled')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    supabase_url: data?.supabase_url,
    supabase_anon_key: data?.supabase_anon_key,
    live_map_enabled: data?.live_map_enabled,
  })
}

export async function POST(request: Request) {
  const guard = await requireAdminRole(['super_admin'])
  if ('response' in guard) {
    return guard.response
  }

  try {
    const body = await request.json()
    const { supabase_url, supabase_anon_key, live_map_enabled } = body

    if (!supabase_url || !supabase_anon_key) {
      return NextResponse.json({ success: false, error: 'URL and Anon Key are required.' }, { status: 400 })
    }

    const { supabase, user } = guard
    const { error } = await supabase
      .from('location_config')
      .upsert({
        id: 1,
        supabase_url,
        supabase_anon_key,
        live_map_enabled: !!live_map_enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Location configuration updated successfully.',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
