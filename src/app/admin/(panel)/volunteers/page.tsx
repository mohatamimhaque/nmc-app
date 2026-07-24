import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Volunteer Management' }

import { createClient } from '@/lib/supabase/server'
import { VolunteersTable } from '@/components/admin/VolunteersTable'

export default async function VolunteersPage() {
  const supabase = await createClient()
  const [volunteersRes, visibilityRes] = await Promise.all([
    supabase.from('volunteers').select('*').order('unique_id'),
    supabase.from('page_visibility').select('is_visible').eq('page_key', 'volunteer_add_modal').maybeSingle(),
  ])

  if (volunteersRes.error) {
    console.error('Failed to fetch volunteers for SSR:', volunteersRes.error.message)
  }

  return (
    <VolunteersTable 
      initialVolunteers={volunteersRes.data ?? []} 
      initialRegOpen={visibilityRes.data?.is_visible ?? false} 
    />
  )
}
