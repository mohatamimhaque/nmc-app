import { createClient } from '@/lib/supabase/server'
import type { Adviser } from '@/types/database'
import { AdvisersSettingsForm } from '@/components/admin/AdvisersSettingsForm'

export default async function AdvisersAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('advisers').select('*').order('sort_order', { ascending: true })

  const advisers = (data ?? []) as Adviser[]

  return <AdvisersSettingsForm initialAdvisers={advisers} />
}
