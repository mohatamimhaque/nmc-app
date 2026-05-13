import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CampusAmbassador } from '@/types/database'
import { CampusAmbassadorsPublicView } from '@/components/public/CampusAmbassadorsPublicView'

export const metadata: Metadata = {
  title: 'Campus Ambassadors',
  description: 'Meet the campus ambassadors supporting NMC 2026.',
}

export const dynamic = 'force-dynamic'

export default async function CampusAmbassadorsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('campus_ambassadors')
    .select('*')
    .order('sort_order', { ascending: true })

  const ambassadors = (data ?? []) as CampusAmbassador[]
  return <CampusAmbassadorsPublicView ambassadors={ambassadors} />
}
