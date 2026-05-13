import { createClient } from '@/lib/supabase/server'
import type { NavLink } from '@/types/database'
import { NavLinksSettingsForm } from '@/components/admin/NavLinksSettingsForm'

export default async function NavigationAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('nav_links').select('*').order('sort_order', { ascending: true })

  const links = (data ?? []) as NavLink[]

  return <NavLinksSettingsForm initialLinks={links} />
}
