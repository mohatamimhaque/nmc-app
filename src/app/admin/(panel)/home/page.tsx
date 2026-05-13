import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'
import { HeroSettingsForm } from '@/components/admin/HeroSettingsForm'
import { HomeSectionsOrderPanel } from '@/components/admin/HomeSectionsOrderPanel'

export default async function AdminHomePage() {
  const supabase = await createClient()
  const [settingsRes, sectionsRes] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase.from('page_sections').select('*').eq('page', 'home').order('sort_order', { ascending: true }),
  ])
  const { data } = settingsRes
  const settings = (data ?? DEFAULT_SITE_SETTINGS)

  return (
    <>
      <HeroSettingsForm initialSettings={settings} />
      <HomeSectionsOrderPanel sections={sectionsRes.data ?? []} />
    </>
  )
}
