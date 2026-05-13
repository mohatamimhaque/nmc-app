import { createClient } from '@/lib/supabase/server'
import { GallerySettingsForm } from '@/components/admin/GallerySettingsForm'
import type { GalleryCategory, GalleryImage } from '@/types/database'

export default async function GalleryAdminPage() {
  const supabase = await createClient()

  const [categoriesRes, imagesRes] = await Promise.all([
    supabase.from('gallery_categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('gallery_images').select('*').order('sort_order', { ascending: true }),
  ])

  const categories = (categoriesRes.data ?? []) as GalleryCategory[]
  const images = (imagesRes.data ?? []) as GalleryImage[]

  return (
    <GallerySettingsForm
      initialCategories={categories}
      initialImages={images}
    />
  )
}
