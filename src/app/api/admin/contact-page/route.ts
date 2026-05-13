import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'
import { CONTACT_PAGE_ID } from '@/lib/siteSettings'
import { DEFAULT_CONTACT_PAGE } from '@/lib/contactPage'

const ALLOWED_KEYS = new Set([
  'hero_title',
  'hero_subtitle',
  'form_title',
  'form_subtitle',
  'recipient_email',
  'location_title',
  'location_body',
  'map_embed_url',
  'social_title',
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

  const personsInput = Array.isArray(body?.persons) ? body.persons : []
  const sectionsInput = Array.isArray(body?.sections) ? body.sections : []

  const { supabase } = guard

  const { data: pageData, error: pageError } = await supabase
    .from('contact_page')
    .upsert({ id: CONTACT_PAGE_ID, ...updates })
    .select('*')
    .single()

  if (pageError) {
    return NextResponse.json({ error: pageError.message }, { status: 400 })
  }

  if (sectionsInput.length) {
    const { error: deleteSectionsError } = await supabase
      .from('page_sections')
      .delete()
      .eq('page', 'contact')

    if (deleteSectionsError) {
      return NextResponse.json({ error: deleteSectionsError.message }, { status: 400 })
    }

    const allowedSectionKeys = new Set([
      'contact_form',
      'contact_persons',
      'contact_location',
      'contact_social',
    ])

    const sections = sectionsInput
      .filter((item: any) => allowedSectionKeys.has(item?.section_key))
      .map((item: any, index: number) => ({
        page: 'contact',
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

  if (personsInput.length) {
    const { error: deletePersonsError } = await supabase
      .from('contact_persons')
      .delete()
      .gte('sort_order', 0)

    if (deletePersonsError) {
      return NextResponse.json({ error: deletePersonsError.message }, { status: 400 })
    }

    const persons = personsInput
      .filter((item: any) => item?.name)
      .map((item: any, index: number) => ({
        name: String(item.name),
        designation: item?.designation ? String(item.designation) : null,
        phone: item?.phone ? String(item.phone) : null,
        email: item?.email ? String(item.email) : null,
        photo_url: item?.photo_url ? String(item.photo_url) : null,
        show_phone: item?.show_phone !== false,
        show_email: item?.show_email !== false,
        is_visible: item?.is_visible !== false,
        sort_order: index + 1,
      }))

    if (persons.length) {
      const { error: insertPersonsError } = await supabase
        .from('contact_persons')
        .insert(persons)

      if (insertPersonsError) {
        return NextResponse.json({ error: insertPersonsError.message }, { status: 400 })
      }
    }
  }

  return NextResponse.json({ data: pageData ?? DEFAULT_CONTACT_PAGE })
}
