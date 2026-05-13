import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CampusAmbassador } from '@/types/database'
import { CampusAmbassadorsSettingsForm } from '@/components/admin/CampusAmbassadorsSettingsForm'

export const metadata: Metadata = { title: 'Campus Ambassadors' }

export default async function CampusAmbassadorsAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('campus_ambassadors')
    .select('*')
    .order('sort_order', { ascending: true })

  const ambassadors = (data ?? []) as CampusAmbassador[]
  return <CampusAmbassadorsSettingsForm initialAmbassadors={ambassadors} />
}
