import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Event, InternalFormField, InternalFormSection } from '@/types/database'
import { EventRegistrationForm } from '@/components/public/EventRegistrationForm'
import { RichHtml } from '@/components/public/RichHtml'

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

  if (!event) return { title: 'Registration' }
  return {
    title: `${event.title} Registration`,
    description: event.short_description ?? undefined,
  }
}

export const dynamic = 'force-dynamic'

export default async function EventRegistrationPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const [{ data: sectionsData }, { data: fieldsData }] = await Promise.all([
    supabase
      .from('internal_form_sections')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('internal_form_fields')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true }),
  ])

  const sections = (sectionsData ?? []) as InternalFormSection[]
  const fields = (fieldsData ?? []) as InternalFormField[]
  const showGoogleForm = event.registration_type === 'google_form' && !!event.registration_url

  if (showGoogleForm) {
    redirect(event.registration_url!)
  }

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .registration-grid {
          display: grid;
          gap: 2rem;
          grid-template-columns: minmax(0, 1fr);
        }
        @media (min-width: 1024px) {
          .registration-grid { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
        }
      `}</style>
      <section style={{ padding: '4.5rem 1.5rem 3rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ borderRadius: 24, padding: '2.5rem', background: 'linear-gradient(135deg, rgba(79,70,229,0.95), rgba(20,184,166,0.9))', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 55%)',
              opacity: 0.6,
            }}
          />
          <div style={{ position: 'relative', maxWidth: 720 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
              Registration
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,5vw,3rem)', fontWeight: 800, margin: 0 }}>
              {event.title}
            </h1>
            {event.short_description && (
              <div style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.85)', marginTop: '0.9rem', lineHeight: 1.6 }}>
                <RichHtml html={event.short_description} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1100, margin: '0 auto' }}>
        <div className="registration-grid">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem' }}>
            {fields.length ? (
              <EventRegistrationForm event={event as Event} fields={fields} sections={sections} />
            ) : (
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>Registration form coming soon</h2>
                <p style={sectionBodyStyle}>Please check back later for the registration form.</p>
              </div>
            )}
          </div>
          <aside style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: '1.25rem', background: 'var(--surface)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Event Details</div>
              <div style={{ display: 'grid', gap: '0.4rem', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--foreground)' }}>Category:</strong> {event.category}</div>
                {event.registration_deadline && (
                  <div><strong style={{ color: 'var(--foreground)' }}>Deadline:</strong> {new Date(event.registration_deadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                )}
                <div><strong style={{ color: 'var(--foreground)' }}>Registration:</strong> Internal Form</div>
              </div>
            </div>
            {(event.organiser_name || event.organiser_email) && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: '1.25rem', background: 'var(--surface)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Event Contact</div>
                {event.organiser_name && <div style={{ color: 'var(--foreground-muted)' }}>{event.organiser_name}</div>}
                {event.organiser_email && (
                  <a href={`mailto:${event.organiser_email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{event.organiser_email}</a>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <Link href={`/events/${event.slug}`} style={secondaryLinkStyle}>
          Back to Event
        </Link>
      </section>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '2rem',
  textAlign: 'center',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
}

const sectionBodyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--foreground-muted)',
  marginBottom: '1.5rem',
}

const secondaryLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  color: 'var(--color-primary)',
  textDecoration: 'none',
  border: '1.5px solid var(--color-primary)',
  padding: '0.6rem 1.5rem',
  borderRadius: 8,
}

