'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Event, EventFaq } from '@/types/database'
import { RichHtml } from './RichHtml'

interface EventDetailViewProps {
  event: Event
  faqs: EventFaq[]
  relatedEvents: Event[]
}

const CATEGORY_COLORS: Record<Event['category'], string> = {
  university: '#6366f1',
  college: '#14b8a6',
  school: '#f59e0b',
}

export function EventDetailView({ event, faqs, relatedEvents }: EventDetailViewProps) {
  const [now, setNow] = useState(() => new Date())
  const [mounted, setMounted] = useState(false)
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([])
  const carouselRef = useRef<HTMLDivElement | null>(null)

  const [showButtons, setShowButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      const hasOverflow = scrollWidth > clientWidth
      setShowButtons(hasOverflow)
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5)
    }
  }

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 1000)

    const el = carouselRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      checkScroll()
      const observer = new ResizeObserver(checkScroll)
      observer.observe(el)
      return () => {
        clearInterval(timer)
        el.removeEventListener('scroll', checkScroll)
        observer.disconnect()
      }
    }

    return () => clearInterval(timer)
  }, [relatedEvents])

  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null
  const isClosed = deadline ? now.getTime() > deadline.getTime() : false
  const isSoon = deadline ? deadline.getTime() - now.getTime() < 24 * 60 * 60 * 1000 : false
  const countdown = deadline && !isClosed ? formatCountdown(deadline.getTime() - now.getTime()) : null
  const statusLabel = deadline ? (isClosed ? 'Closed' : 'Open') : 'Upcoming'
  const statusColor = deadline ? (isClosed ? '#ef4444' : '#22c55e') : '#94a3b8'

  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  const sortedFaqs = useMemo(
    () => [...faqs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [faqs]
  )

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .event-detail-grid {
          display: grid;
          gap: 2.5rem;
          grid-template-columns: minmax(0, 1fr);
        }
        @media (min-width: 1024px) {
          .event-detail-grid { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
        }
        .event-sidebar {
          position: sticky;
          top: 96px;
          align-self: start;
          display: grid;
          gap: 1rem;
        }
      `}</style>
      <section style={{ padding: '2rem 1.5rem 1.5rem', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={eyebrowStyle}>Event</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.3rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
          {event.title}
        </h1>
        {event.short_description && (
          <div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            <RichHtml html={event.short_description} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span style={{ ...badgeStyle, background: `${CATEGORY_COLORS[event.category]}1a`, color: CATEGORY_COLORS[event.category] }}>
            {event.category}
          </span>
          <span style={pillStyle}>{deadline ? deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}</span>
          <span style={{ ...pillStyle, background: `${statusColor}1a`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </section>

      {event.cover_image_url && (
        <section style={{ padding: '0 1.5rem 2rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', borderRadius: 20, overflow: 'hidden' }}>
            <img src={event.cover_image_url} alt={event.title || 'NMC 2026'} style={{ width: '100%', height: 360, objectFit: 'cover' }} />
          </div>
        </section>
      )}

      <section style={{ padding: '0 1.5rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div className="event-detail-grid">
          <div>
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={sectionTitleStyle}>About This Event</h2>
              {event.description ? (
                <div style={richTextStyle}><RichHtml html={event.description} /></div>
              ) : (
                <div style={{ color: 'var(--foreground-muted)' }}>No description provided.</div>
              )}
            </section>

            {event.eligibility && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={sectionTitleStyle}>Eligibility & Rules</h2>
                <div style={richTextStyle}><RichHtml html={event.eligibility} /></div>
              </section>
            )}

            {event.prize_details && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={sectionTitleStyle}>Prizes</h2>
                <div style={richTextStyle}><RichHtml html={event.prize_details} /></div>
              </section>
            )}

            {sortedFaqs.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={sectionTitleStyle}>Frequently Asked Questions</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {sortedFaqs.map(faq => (
                    <div key={faq.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {faq.question}
                      </button>
                      {openFaqIds.includes(faq.id) && faq.answer && (
                        <div style={{ marginTop: '0.5rem', color: 'var(--foreground-muted)' }}>
                          <RichHtml html={faq.answer} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {relatedEvents.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={sectionTitleStyle}>More Events</h2>
                  {showButtons && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        style={{
                          ...ghostButtonStyle,
                          opacity: canScrollLeft ? 1 : 0.4,
                          cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                          pointerEvents: canScrollLeft ? 'auto' : 'none',
                        }}
                        onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                        aria-label="Scroll left"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        style={{
                          ...ghostButtonStyle,
                          opacity: canScrollRight ? 1 : 0.4,
                          cursor: canScrollRight ? 'pointer' : 'not-allowed',
                          pointerEvents: canScrollRight ? 'auto' : 'none',
                        }}
                        onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                        aria-label="Scroll right"
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
                <div ref={carouselRef} style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(240px, 1fr)', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {relatedEvents.map(item => (
                    <div
                      key={item.id}
                      style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}
                    >
                      {item.cover_image_url ? (
                        <img src={item.cover_image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: 140, background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }} />
                      )}
                      <div style={{ padding: '0.75rem 0.9rem' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
                          <Link href={`/events/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
                            {item.title}
                          </Link>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.35rem', position: 'relative', zIndex: 2 }}>
                          {item.short_description ? <RichHtml html={item.short_description} /> : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="event-sidebar">
            <div style={{ border: `1px solid ${isSoon ? '#ef4444' : 'var(--border)'}`, borderRadius: 18, padding: '1.5rem', background: 'var(--surface)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>Registration</div>
              <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.35rem' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Deadline</div>
                {deadline && !isClosed ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: mounted && isSoon ? '#ef4444' : 'var(--foreground)' }} aria-live="polite">
                    {mounted ? countdown : '-- : -- : -- : --'}
                  </div>
                ) : (
                  <div style={{ color: isClosed ? '#ef4444' : 'var(--foreground-muted)' }}>
                    {deadline ? 'Registration Closed' : 'Deadline TBA'}
                  </div>
                )}
                {deadline && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
                    {deadline.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1rem' }}>
                {isClosed ? (
                  <div style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', borderRadius: 999, background: 'rgba(148,163,184,0.3)', color: 'var(--foreground-muted)' }}>
                    Registration Closed
                  </div>
                ) : (
                  event.registration_type === 'google_form' && event.registration_url ? (
                    <a
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...primaryButtonStyle, width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}
                    >
                      {event.registration_button_label || 'Register Now'}
                      <span style={{ marginLeft: 6, fontSize: '0.9em' }} aria-hidden>↗</span>
                    </a>
                  ) : (
                    <Link href={`/events/${event.slug}/register`} style={{ ...primaryButtonStyle, width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                      {event.registration_button_label || 'Register Now'}
                    </Link>
                  )
                )}
              </div>
              {event.rulebook_url && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a
                    href={event.rulebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...ghostButtonStyle, width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.6rem', boxSizing: 'border-box' }}
                  >
                    View Rulebook <span style={{ marginLeft: 6, fontSize: '0.9em' }} aria-hidden>↗</span>
                  </a>
                </div>
              )}
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: '1.25rem', background: 'var(--surface)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.6rem' }}>Quick Info</div>
              <div style={{ display: 'grid', gap: '0.45rem', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--foreground)' }}>Category:</strong> {event.category}</div>
                {event.organiser_name && (
                  <div><strong style={{ color: 'var(--foreground)' }}>Contact:</strong> {event.organiser_name}</div>
                )}
                {event.organiser_email && (
                  <a href={`mailto:${event.organiser_email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    {event.organiser_email}
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

    </div>
  )
}

function formatCountdown(diffMs: number) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(days).padStart(2, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`
}

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '0.2rem 0.6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '0.3rem 0.8rem',
  background: 'rgba(148,163,184,0.2)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
}

const richTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--foreground)',
  lineHeight: 1.7,
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '0.9rem 1.4rem',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const ghostButtonStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.35rem 0.7rem',
  background: 'transparent',
  cursor: 'pointer',
}

