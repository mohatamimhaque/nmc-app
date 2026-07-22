import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPageVisible } from '@/lib/visibility'
import { CertificateView } from '@/components/public/CertificateView'

export const metadata: Metadata = {
  title: 'Certificate Download | NMC 2026',
  description: 'Verify and download your official National Mathematics Carnival 2026 certificate.',
  alternates: {
    canonical: '/certificate',
  },
}

export default async function CertificatePage() {
  const visible = await isPageVisible('certificate')
  if (!visible) {
    notFound()
  }

  return <CertificateView />
}
