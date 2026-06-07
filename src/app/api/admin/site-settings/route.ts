import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminRole } from '@/lib/admin-auth'
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_ID } from '@/lib/siteSettings'

const ALLOWED_KEYS = new Set([
  'site_title',
  'competition_name',
  'competition_slug',
  'competition_category',
  'competition_season',
  'competition_location',
  'organiser_name',
  'organiser_tagline',
  'logo_url',
  'favicon_url',
  'schedule_pdf_url',
  'event_date',
  'default_theme',
  'use_static_theme',
  'color_primary',
  'color_secondary',
  'color_accent',
  'color_button_bg',
  'color_button_text',
  'color_navbar_bg',
  'color_footer_bg',
  'footer_pattern',
  'font_heading',
  'font_body',
  'animations_enabled',
  'math_rain_enabled',
  'math_rain_speed',
  'math_rain_color',
  'math_rain_size',
  'math_rain_count',
  'hero_mode',
  'hero_title',
  'hero_subtitle',
  'hero_cta_label',
  'hero_cta_url',
  'hero_image_url',
  'hero_carousel_images',
  'hero_countdown_date',
  'hero_show_countdown',
  'hero_overlay_color',
  'hero_overlay_enabled',
  'hero_overlay_opacity',
])

const THEME_KEYS = new Set([
  'default_theme',
  'use_static_theme',
  'color_primary',
  'color_secondary',
  'color_accent',
  'color_button_bg',
  'color_button_text',
  'color_navbar_bg',
  'color_footer_bg',
  'footer_pattern',
  'font_heading',
  'font_body',
  'animations_enabled',
  'math_rain_enabled',
  'math_rain_speed',
  'math_rain_color',
  'math_rain_size',
  'math_rain_count',
])

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  for (const key of Object.keys(body ?? {})) {
    if (!ALLOWED_KEYS.has(key)) {
      continue
    }
    if (guard.role !== 'super_admin' && THEME_KEYS.has(key)) {
      continue
    }
    updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 })
  }

  const { supabase } = guard
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ id: SITE_SETTINGS_ID, ...updates })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  revalidatePath('/')
  revalidatePath('/admin/home')

  return NextResponse.json({ data: data ?? DEFAULT_SITE_SETTINGS })
}
