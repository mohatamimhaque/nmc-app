import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ClubPartner } from '@/types/database'
import { ClubPartnersSettingsForm } from '@/components/admin/ClubPartnersSettingsForm'

export const metadata: Metadata = { title: 'Club Partners' }

export default async function ClubPartnersAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('club_partners').select('*').order('sort_order', { ascending: true })
  const partners = (data ?? []) as ClubPartner[]

  return <ClubPartnersSettingsForm initialPartners={partners} />
}
