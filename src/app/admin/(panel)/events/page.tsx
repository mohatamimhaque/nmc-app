import { createClient } from '@/lib/supabase/server'
import type { Event, EventFaq, EventRegistration, InternalFormField, InternalFormSection } from '@/types/database'
import { EventsSettingsForm } from '@/components/admin/EventsSettingsForm'

export default async function EventsAdminPage() {
  const supabase = await createClient()

  const [eventsRes, faqsRes, sectionsRes, fieldsRes, registrationsRes] = await Promise.all([
    supabase.from('events').select('*').order('sort_order', { ascending: true }),
    supabase.from('event_faqs').select('*').order('sort_order', { ascending: true }),
    supabase.from('internal_form_sections').select('*').order('sort_order', { ascending: true }),
    supabase.from('internal_form_fields').select('*').order('sort_order', { ascending: true }),
    supabase.from('event_registrations').select('event_id, status'),
  ])

  const events = (eventsRes.data ?? []) as Event[]
  const faqs = (faqsRes.data ?? []) as EventFaq[]
  const sections = (sectionsRes.data ?? []) as InternalFormSection[]
  const fields = (fieldsRes.data ?? []) as InternalFormField[]
  const registrations = (registrationsRes.data ?? []) as Pick<EventRegistration, 'event_id' | 'status'>[]

  const registrationCounts = registrations.reduce<Record<string, { total: number; pending: number; confirmed: number; rejected: number }>>(
    (acc, row) => {
      if (!acc[row.event_id]) {
        acc[row.event_id] = { total: 0, pending: 0, confirmed: 0, rejected: 0 }
      }
      acc[row.event_id].total += 1
      acc[row.event_id][row.status] += 1
      return acc
    },
    {}
  )

  return (
    <EventsSettingsForm
      initialEvents={events}
      initialFaqs={faqs}
      initialSections={sections}
      initialFields={fields}
      initialRegistrationCounts={registrationCounts}
    />
  )
}
