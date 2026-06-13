import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Event, EventFaq } from '@/types/database'
import { EventDetailView } from '@/components/public/EventDetailView'
import { getSeoTitle, getSeoDescription, getEventKeywords } from '@/lib/seo'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, short_description, category')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) return { title: getSeoTitle('Event Not Found') }
  return {
    title: getSeoTitle(event.title),
    description: getSeoDescription(event.short_description || `Detail page for the competitive event ${event.title} at NMC 2026.`),
    keywords: getEventKeywords(event.title, event.category, event.short_description || undefined),
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": event.title,
            "description": event.short_description || event.title,
            "url": `https://www.nmcbd.app/events/${event.slug}`,
            "organizer": {
              "@type": "Organization",
              "name": event.organiser_name || "Math Club, DUET",
              "url": "https://www.nmcbd.app"
            },
            "performer": {
              "@type": "Organization",
              "name": event.organiser_name || "Math Club, DUET",
              "url": "https://www.nmcbd.app"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://www.nmcbd.app/events/${event.slug}`,
              "price": "0",
              "priceCurrency": "BDT",
              "availability": "https://schema.org/InStock",
              "validFrom": "2026-01-01T00:00:00+06:00"
            },
            "eventStatus": event.status === 'published' ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
              "@type": "Place",
              "name": "DUET Campus",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Gazipur",
                "addressCountry": "BD"
              }
            },
            "image": event.cover_image_url ? [event.cover_image_url] : []
          })
        }}
      />
    </main>
  )
}
