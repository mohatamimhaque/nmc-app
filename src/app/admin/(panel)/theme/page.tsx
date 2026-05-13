import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

export default async function AdminThemePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('*').single()
  const settings = (data ?? DEFAULT_SITE_SETTINGS)

  return <SiteSettingsForm initialSettings={settings} />
}
