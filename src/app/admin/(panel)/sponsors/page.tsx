import { createClient } from '@/lib/supabase/server'
import { SponsorsSettingsForm } from '@/components/admin/SponsorsSettingsForm'
import type { Sponsor, SponsorCategory } from '@/types/database'

export default async function SponsorsAdminPage() {
  const supabase = await createClient()

  const [categoriesRes, sponsorsRes] = await Promise.all([
    supabase.from('sponsor_categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('sponsors').select('*').order('sort_order', { ascending: true }),
  ])

  const categories = (categoriesRes.data ?? []) as SponsorCategory[]
  const sponsors = (sponsorsRes.data ?? []) as Sponsor[]

  return (
    <SponsorsSettingsForm
      initialCategories={categories}
      initialSponsors={sponsors}
    />
  )
}
