import { createClient } from '@/lib/supabase/server'
import { NoticesSettingsForm } from '@/components/admin/NoticesSettingsForm'
import type { Notice } from '@/types/database'

export default async function NoticesAdminPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('publish_at', { ascending: false })

  const notices = (data ?? []) as Notice[]

  return <NoticesSettingsForm initialNotices={notices} />
}
