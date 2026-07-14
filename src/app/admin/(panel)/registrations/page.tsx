import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Processed Registrations' }

import { createClient } from '@/lib/supabase/server'
import { RegistrationsTable } from '@/components/admin/RegistrationsTable'

export default async function RegistrationsPage() {
  const supabase = await createClient()
  const { data: registrations, error } = await supabase
    .from('processed_registrations')
    .select('*')
    .order('serial')

  if (error) {
    console.error('Failed to fetch registrations for SSR:', error.message)
  }

  return (
    <RegistrationsTable initialRegistrations={registrations ?? []} />
  )
}
