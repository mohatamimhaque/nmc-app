import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPageVisible } from '@/lib/visibility'
import { createServiceClient } from '@/lib/supabase/server'
import { PublicVolunteerRegisterForm } from '@/components/public/PublicVolunteerRegisterForm'

export const metadata: Metadata = {
  title: 'Register as Volunteer | National Mathematics Carnival 2026',
  description: 'Self-register as a volunteer for the National Mathematics Carnival 2026 organizing team.',
}

export default async function VolunteerRegisterPage() {
  // Check if public volunteer registration is enabled by admin
  const allowed = await isPageVisible('volunteer_add_modal')
  if (!allowed) {
    notFound()
  }

  // Fetch unique segments from database
  const supabase = createServiceClient()
  const { data: segmentsData } = await supabase
    .from('volunteers')
    .select('segment')

  const defaultSegments = ['Registration', 'Logistics', 'Stage Management', 'Public Relations', 'Graphics & IT', 'Decoration']
  const dbSegments = (segmentsData ?? [])
    .map((v: { segment: string | null }) => v.segment?.trim())
    .filter((s: string | undefined): s is string => !!s)
  const allSegments = Array.from(new Set([...defaultSegments, ...dbSegments])).sort()

  return (
    <main style={{ minHeight: '80vh', padding: '3rem 1rem' }}>
      <PublicVolunteerRegisterForm segments={allSegments} />
    </main>
  )
}
