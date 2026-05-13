import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { DEFAULT_FOOTER_SETTINGS, FOOTER_SETTINGS_ID } from '@/lib/siteSettings'

const ALLOWED_KEYS = new Set([
  'tagline',
  'organiser_text',
  'copyright_text',
  'developer_credit_text',
  'developer_credit_url',
  'show_developer_credit',
  'show_privacy_link',
  'privacy_url',
  'show_terms_link',
  'terms_url',
  'contact_phone',
  'contact_email',
  'contact_address',
  'show_phone',
  'show_email',
  'show_address',
  'show_sponsor_strip',
  'facebook_url',
  'youtube_url',
  'instagram_url',
  'linkedin_url',
  'twitter_url',
  'show_facebook',
  'show_youtube',
  'show_instagram',
  'show_linkedin',
  'show_twitter',
])

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  for (const key of Object.keys(body ?? {})) {
    if (ALLOWED_KEYS.has(key)) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 })
  }

  const { supabase } = guard
  const { data, error } = await supabase
    .from('footer_settings')
    .upsert({ id: FOOTER_SETTINGS_ID, ...updates })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: data ?? DEFAULT_FOOTER_SETTINGS })
}
