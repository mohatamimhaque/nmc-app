import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Visibility Controls' }

import { VisibilityPanel } from '@/components/admin/VisibilityPanel'
import { createClient } from '@/lib/supabase/server'

export default async function VisibilityPage() {
  const supabase = await createClient()
  const [pagesRes, sectionsRes] = await Promise.all([
    supabase.from('page_visibility').select('*').order('label'),
    supabase.from('page_sections').select('*').order('page').order('sort_order'),
  ])
  return <VisibilityPanel pages={pagesRes.data ?? []} sections={sectionsRes.data ?? []} />
}
