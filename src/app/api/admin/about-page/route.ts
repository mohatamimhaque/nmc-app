import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { ABOUT_PAGE_ID } from '@/lib/siteSettings'
import { DEFAULT_ABOUT_PAGE } from '@/lib/aboutPage'

const ALLOWED_KEYS = new Set([
  'hero_title',
  'hero_subtitle',
  'overview_section_title',
  'overview_section_subtitle',
  'overview_title',
  'overview_body',
  'nmc_title',
  'nmc_eyebrow',
  'nmc_body',
  'nmc_cta_label',
  'nmc_cta_url',
  'mission_section_title',
  'mission_title',
  'mission_body',
  'vision_title',
  'vision_body',
  'team_title',
  'team_subtitle',
  'committee_cta_label',
  'committee_cta_url',
  'advisers_title',
  'advisers_subtitle',
  'advisers_cta_label',
  'advisers_cta_url',
  'milestones_title',
  'milestones_subtitle',
  'past_events_title',
  'past_events_subtitle',
  'past_events_cta_label',
  'past_events_cta_url',
])

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  for (const key of Object.keys(body?.page ?? {})) {
    if (ALLOWED_KEYS.has(key)) {
      updates[key] = body.page[key]
    }
  }

  const milestonesInput = Array.isArray(body?.milestones) ? body.milestones : []
  const highlightsInput = Array.isArray(body?.highlights) ? body.highlights : []
  const sectionsInput = Array.isArray(body?.sections) ? body.sections : []

  const { supabase } = guard

  const { data: pageData, error: pageError } = await supabase
    .from('about_page')
    .upsert({ id: ABOUT_PAGE_ID, ...updates })
    .select('*')
    .single()
  const allowedSectionKeys = new Set([
    'about_overview',
    'about_mission',
    'about_team_strip',
    'about_milestones',
    'about_advisers_strip',
    'about_past_events',
  ])

  if (sectionsInput.length) {
    const { error: deleteSectionsError } = await supabase
      .from('page_sections')
      .delete()
      .eq('page', 'about')

    if (deleteSectionsError) {
      return NextResponse.json({ error: deleteSectionsError.message }, { status: 400 })
    }

    const sections = sectionsInput
      .filter((item: any) => allowedSectionKeys.has(item?.section_key))
      .map((item: any, index: number) => ({
        page: 'about',
        section_key: String(item.section_key),
        label: String(item.label ?? item.section_key),
        is_visible: item?.is_visible !== false,
        sort_order: index + 1,
      }))

    if (sections.length) {
      const { error: insertSectionsError } = await supabase
        .from('page_sections')
        .insert(sections)

      if (insertSectionsError) {
        return NextResponse.json({ error: insertSectionsError.message }, { status: 400 })
      }
    }
  }


  if (pageError) {
    return NextResponse.json({ error: pageError.message }, { status: 400 })
  }

  const { error: deleteMilestonesError } = await supabase
    .from('about_milestones')
    .delete()
    .gte('sort_order', 0)

  if (deleteMilestonesError) {
    return NextResponse.json({ error: deleteMilestonesError.message }, { status: 400 })
  }

  const milestones = milestonesInput
    .filter((item: any) => item?.year && item?.title && item?.description)
    .map((item: any, index: number) => ({
      year: String(item.year),
      title: String(item.title),
      description: String(item.description),
      is_visible: item?.is_visible !== false,
      sort_order: index + 1,
    }))

  if (milestones.length) {
    const { error: insertMilestonesError } = await supabase
      .from('about_milestones')
      .insert(milestones)

    if (insertMilestonesError) {
      return NextResponse.json({ error: insertMilestonesError.message }, { status: 400 })
    }
  }

  const { error: deleteHighlightsError } = await supabase
    .from('about_highlights')
    .delete()
    .gte('sort_order', 0)

  if (deleteHighlightsError) {
    return NextResponse.json({ error: deleteHighlightsError.message }, { status: 400 })
  }

  const highlights = highlightsInput
    .filter((item: any) => item?.title && item?.detail)
    .map((item: any, index: number) => ({
      title: String(item.title),
      detail: String(item.detail),
      is_visible: item?.is_visible !== false,
      sort_order: index + 1,
    }))

  if (highlights.length) {
    const { error: insertHighlightsError } = await supabase
      .from('about_highlights')
      .insert(highlights)

    if (insertHighlightsError) {
      return NextResponse.json({ error: insertHighlightsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ data: pageData ?? DEFAULT_ABOUT_PAGE })
}
