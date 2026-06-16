import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CampusAmbassador } from '@/types/database'
import { CampusAmbassadorsPublicView } from '@/components/public/CampusAmbassadorsPublicView'
import { getSeoTitle, getSeoDescription, getEventKeywords } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('campus_ambassadors')
    .select('name, role, department, institution')

  const names = (data ?? []).map(a => a.name).filter(Boolean)
  const roles = (data ?? []).map(a => a.role).filter(Boolean)
  const institutions = (data ?? []).map(a => a.institution).filter(Boolean)
  const depts = (data ?? []).map(a => a.department).filter(Boolean)

  const dynamicKeywords = [...names, ...roles, ...institutions, ...depts].join(', ')
  const keywords = getEventKeywords('Campus Ambassadors', 'Representatives', dynamicKeywords)

  return {
    title: getSeoTitle('Campus Ambassadors'),
    description: getSeoDescription('Connect with the passionate campus ambassadors representing the National Mathematics Carnival 2026 across various schools, colleges, and universities in BD.'),
    keywords,
    alternates: {
      canonical: '/campus-ambassadors',
    },
  }
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
