import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Event, EventFaq } from '@/types/database'
import { EventDetailView } from '@/components/public/EventDetailView'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, short_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.title,
    description: event.short_description ?? undefined,
  }
}

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const [faqsRes, relatedRes] = await Promise.all([
    supabase.from('event_faqs').select('*').eq('event_id', event.id).order('sort_order', { ascending: true }),
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .eq('category', event.category)
      .neq('id', event.id)
      .order('sort_order', { ascending: true })
      .limit(6),
  ])

  const faqs = (faqsRes.data ?? []) as EventFaq[]
  const relatedEvents = (relatedRes.data ?? []) as Event[]

  return (
    <main style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
      <section style={{ maxWidth: 1100, margin: '0 auto' }}>
        <EventDetailView
          event={event as Event}
          faqs={faqs}
          relatedEvents={relatedEvents}
        />
      </section>
    </main>
  )
}
