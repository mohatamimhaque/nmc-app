import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin'])
  if ('response' in guard) {
    return guard.response
  }

  const body = await request.json()
  const categoriesInput = Array.isArray(body?.categories) ? body.categories : []
  const imagesInput = Array.isArray(body?.images) ? body.images : []

  const { supabase } = guard

  const { error: deleteImagesError } = await supabase
    .from('gallery_images')
    .delete()
    .gte('sort_order', 0)

  if (deleteImagesError) {
    return NextResponse.json({ error: deleteImagesError.message }, { status: 400 })
  }

  const { error: deleteCategoriesError } = await supabase
    .from('gallery_categories')
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
      sort_order: index + 1,
    }))

  if (categories.length) {
    const { error: insertCategoriesError } = await supabase
      .from('gallery_categories')
      .insert(categories)

    if (insertCategoriesError) {
      return NextResponse.json({ error: insertCategoriesError.message }, { status: 400 })
    }
  }

  const images = imagesInput
    .filter((item: any) => item?.url)
    .map((item: any, index: number) => ({
      id: String(item.id),
      url: String(item.url),
      caption: item?.caption ? String(item.caption) : null,
      alt_text: item?.alt_text ? String(item.alt_text) : '',
      category_id: item?.category_id ? String(item.category_id) : null,
      is_visible: item?.is_visible !== false,
      sort_order: index + 1,
    }))

  if (images.length) {
    const { error: insertImagesError } = await supabase
      .from('gallery_images')
      .insert(images)

    if (insertImagesError) {
      return NextResponse.json({ error: insertImagesError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
