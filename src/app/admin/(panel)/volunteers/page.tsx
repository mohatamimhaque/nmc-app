import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Volunteer Management' }

import { createClient } from '@/lib/supabase/server'
import { VolunteersTable } from '@/components/admin/VolunteersTable'

export default async function VolunteersPage() {
  const supabase = await createClient()
  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select('*')
    .order('unique_id')

  if (error) {
    console.error('Failed to fetch volunteers for SSR:', error.message)
  }

  return (
    <VolunteersTable initialVolunteers={volunteers ?? []} />
  )
}
