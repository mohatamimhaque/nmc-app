import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const categoriesInput = Array.isArray(body?.categories) ? body.categories : []
  const sponsorsInput = Array.isArray(body?.sponsors) ? body.sponsors : []

  const { supabase } = guard

  const { error: deleteSponsorsError } = await supabase
    .from('sponsors')
    .delete()
    .gte('sort_order', 0)

  if (deleteSponsorsError) {
    return NextResponse.json({ error: deleteSponsorsError.message }, { status: 400 })
  }

  const { error: deleteCategoriesError } = await supabase
    .from('sponsor_categories')
    .delete()
    .gte('sort_order', 0)

  if (deleteCategoriesError) {
    return NextResponse.json({ error: deleteCategoriesError.message }, { status: 400 })
  }

  const categories = categoriesInput
    .filter((item: any) => item?.name)
    .map((item: any, index: number) => ({
      id: String(item.id),
      name: String(item.name),
      is_visible: item?.is_visible !== false,
      sort_order: index + 1,
    }))

  if (categories.length) {
    const { error: insertCategoriesError } = await supabase
      .from('sponsor_categories')
      .insert(categories)

    if (insertCategoriesError) {
      return NextResponse.json({ error: insertCategoriesError.message }, { status: 400 })
    }
  }

  const sponsors = sponsorsInput
    .filter((item: any) => item?.name)
    .map((item: any, index: number) => ({
      id: String(item.id),
      name: String(item.name),
      logo_url: item?.logo_url ? String(item.logo_url) : null,
      website_url: item?.website_url ? String(item.website_url) : null,
      category_id: item?.category_id ? String(item.category_id) : null,
      display_mode: item?.display_mode ?? 'logo',
      logo_size: item?.logo_size ?? 'medium',
      is_visible: item?.is_visible !== false,
      sort_order: index + 1,
    }))

  if (sponsors.length) {
    const { error: insertSponsorsError } = await supabase
      .from('sponsors')
      .insert(sponsors)

    if (insertSponsorsError) {
      return NextResponse.json({ error: insertSponsorsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
