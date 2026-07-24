import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPageVisible } from '@/lib/visibility'
import { createServiceClient } from '@/lib/supabase/server'
import { PublicVolunteerPortal } from '@/components/public/PublicVolunteerPortal'

export const metadata: Metadata = {
  title: 'Volunteers | National Mathematics Carnival 2026',
  description: 'View the organizing committee volunteers of the National Mathematics Carnival 2026.',
}

export default async function VolunteerPortalPage() {
  // Check if public volunteer list page is visible
  const visible = await isPageVisible('volunteer_show')
  if (!visible) {
    notFound()
  }

  // Check if public volunteer registration (add modal) is enabled
  const allowAdd = await isPageVisible('volunteer_add_modal')

  // Fetch all volunteers using the service role client
  const supabase = createServiceClient()
  const [volunteersRes, segmentsRes] = await Promise.all([
    supabase.from('volunteers').select('unique_id, name, department, segment, year').order('created_at', { ascending: false }),
    supabase.from('volunteers').select('segment'),
  ])

  const defaultSegments = ['Registration', 'Logistics', 'Stage Management', 'Public Relations', 'Graphics & IT', 'Decoration']
  const dbSegments = (segmentsRes.data ?? [])
    .map((v: { segment: string | null }) => v.segment?.trim())
    .filter((s: string | undefined): s is string => !!s)
  const allSegments = Array.from(new Set([...defaultSegments, ...dbSegments])).sort()

  return (
    <main style={{ minHeight: '80vh', padding: '2rem 0' }}>
      <PublicVolunteerPortal 
        initialVolunteers={volunteersRes.data ?? []} 
        allowAdd={allowAdd} 
        segments={allSegments}
      />
    </main>
  )
}
