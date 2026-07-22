import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CertificatesManagerPanel } from '@/components/admin/CertificatesManagerPanel'
import { isPageVisible } from '@/lib/visibility'

export const metadata: Metadata = {
  title: 'Certificate Management | NMC 2026 Admin',
}

export default async function AdminCertificatesPage() {
  const supabase = await createClient()

  const [visibilityRes, countRes] = await Promise.all([
    isPageVisible('certificate'),
    supabase.from('processed_registrations').select('*', { count: 'exact', head: true }),
  ])

  return (
    <CertificatesManagerPanel
      initialIsVisible={visibilityRes}
      totalRegistrationsCount={countRes.count ?? 0}
    />
  )
}
