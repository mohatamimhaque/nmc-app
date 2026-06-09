import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')

const normalizeDeadline = (value: unknown) => {
  if (!value) return null
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const action = body?.action as string | undefined
  const { supabase } = guard

  if (action === 'bulkStatus') {
    const ids = Array.isArray(body?.ids) ? body.ids : []
    const status = body?.status
    if (!ids.length || !status) {
      return NextResponse.json({ error: 'Missing ids or status.' }, { status: 400 })
    }
    const { error } = await supabase
      .from('events')
      .update({ status })
      .in('id', ids)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'reorder') {
    const items = Array.isArray(body?.items) ? body.items : []
    if (!items.length) {
      return NextResponse.json({ error: 'Missing reorder items.' }, { status: 400 })
    }
    const payload = items.map((item: any, index: number) => ({
      id: String(item.id),
      sort_order: Number.isFinite(item.sort_order) ? Number(item.sort_order) : index + 1,
    }))
    const { error } = await supabase
      .from('events')
      .upsert(payload)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action !== 'save') {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  }

  const eventInput = body?.event ?? null
  if (!eventInput?.title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  }

  const eventId = String(eventInput.id ?? '') || crypto.randomUUID()
  const baseSlug = eventInput.slug ? String(eventInput.slug) : slugify(String(eventInput.title))
  let slug = baseSlug || slugify(String(eventInput.title))

  if (slug) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .neq('id', eventId)

    if (existing && existing.length) {
      slug = `${slug}-${eventId.slice(0, 6)}`
    }
  }

  const payload = {
    id: eventId,
    slug,
    title: String(eventInput.title),
    category: eventInput.category,
    cover_image_url: eventInput.cover_image_url || null,
    short_description: eventInput.short_description || null,
    description: eventInput.description || null,
    eligibility: eventInput.eligibility || null,
    prize_details: eventInput.prize_details || null,
    registration_type: eventInput.registration_type,
    registration_url: eventInput.registration_type === 'google_form'
      ? (eventInput.registration_url || null)
      : null,
    registration_button_label: eventInput.registration_button_label || 'Register Now',
    registration_deadline: normalizeDeadline(eventInput.registration_deadline),
    registration_limit_total: Number.isFinite(eventInput.registration_limit_total)
      ? Number(eventInput.registration_limit_total)
      : null,
    registration_limit_per_email: eventInput.registration_limit_per_email === true,
    registration_limit_per_phone: eventInput.registration_limit_per_phone === true,
    rulebook_url: eventInput.rulebook_url || null,
    organiser_name: eventInput.organiser_name || null,
    organiser_email: eventInput.organiser_email || null,
    status: eventInput.status,
    sort_order: Number.isFinite(eventInput.sort_order) ? Number(eventInput.sort_order) : 0,
  }

  const { error: eventError } = await supabase
    .from('events')
    .upsert(payload)

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 400 })
  }

  const faqsInput = Array.isArray(body?.faqs) ? body.faqs : []
  const fieldsInput = Array.isArray(body?.fields) ? body.fields : []
  const sectionsInput = Array.isArray(body?.sections) ? body.sections : []

  const { error: deleteFaqsError } = await supabase
    .from('event_faqs')
    .delete()
    .eq('event_id', eventId)

  if (deleteFaqsError) {
    return NextResponse.json({ error: deleteFaqsError.message }, { status: 400 })
  }

  const faqs = faqsInput
    .filter((item: any) => item?.question)
    .map((item: any, index: number) => ({
      id: String(item.id ?? crypto.randomUUID()),
      event_id: eventId,
      question: String(item.question).trim(),
      answer: item?.answer ? String(item.answer) : null,
      sort_order: Number.isFinite(item.sort_order) ? Number(item.sort_order) : index + 1,
    }))

  if (faqs.length) {
    const { error } = await supabase
      .from('event_faqs')
      .insert(faqs)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  const { error: deleteFieldsError } = await supabase
    .from('internal_form_fields')
    .delete()
    .eq('event_id', eventId)

  if (deleteFieldsError) {
    return NextResponse.json({ error: deleteFieldsError.message }, { status: 400 })
  }

  const { error: deleteSectionsError } = await supabase
    .from('internal_form_sections')
    .delete()
    .eq('event_id', eventId)

  if (deleteSectionsError) {
    return NextResponse.json({ error: deleteSectionsError.message }, { status: 400 })
  }

  const sections = sectionsInput
    .filter((item: any) => item?.title)
    .map((item: any, index: number) => ({
      id: String(item.id ?? crypto.randomUUID()),
      event_id: eventId,
      title: String(item.title).trim(),
      description: item?.description ? String(item.description).trim() : null,
      is_visible: item?.is_visible !== false,
      sort_order: Number.isFinite(item.sort_order) ? Number(item.sort_order) : index + 1,
    }))

  if (sections.length) {
    const { error } = await supabase
      .from('internal_form_sections')
      .insert(sections)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  const sectionIds = new Set(sections.map((section: { id: string }) => section.id))

  const fields = fieldsInput
    .filter((item: any) => item?.label)
    .map((item: any, index: number) => ({
      id: String(item.id ?? crypto.randomUUID()),
      event_id: eventId,
      section_id: sectionIds.has(String(item.section_id)) ? String(item.section_id) : null,
      label: String(item.label).trim(),
      field_type: item.field_type ?? 'short',
      options: Array.isArray(item.options) ? item.options.map((opt: any) => String(opt).trim()).filter(Boolean) : [],
      helper_text: item?.helper_text ? String(item.helper_text).trim() : null,
      is_required: item.is_required === true,
      config: item?.config ?? {},
      validation: item?.validation ?? {},
      logic: item?.logic ?? [],
      is_visible: item?.is_visible !== false,
      sort_order: Number.isFinite(item.sort_order) ? Number(item.sort_order) : index + 1,
    }))

  if (fields.length) {
    const { error } = await supabase
      .from('internal_form_fields')
      .insert(fields)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true, eventId })
}

export async function DELETE(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json().catch(() => null)
  const eventId = body?.eventId
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId.' }, { status: 400 })
  }

  const { supabase } = guard
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
