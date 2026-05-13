import { createClient } from '@/lib/supabase/server'
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'
import { FooterSettingsForm } from '@/components/admin/FooterSettingsForm'

export default async function AdminFooterPage() {
  const supabase = await createClient()
  const [footerRes, siteRes] = await Promise.all([
    supabase.from('footer_settings').select('*').single(),
    supabase.from('site_settings').select('*').single(),
  ])

  const footerSettings = footerRes.data ?? DEFAULT_FOOTER_SETTINGS
  const siteSettings = siteRes.data ?? DEFAULT_SITE_SETTINGS

  return (
    <FooterSettingsForm
      initialSettings={footerSettings}
      footerPattern={siteSettings.footer_pattern}
    />
  )
}
