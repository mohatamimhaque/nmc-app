'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Event } from '@/types/database'
import { RichHtml } from './RichHtml'

interface EventsPublicViewProps {
  events: Event[]
}

type StatusFilter = 'all' | 'open' | 'closed' | 'upcoming'

const CATEGORY_COLORS: Record<Event['category'], string> = {
  university: '#6366f1',
  college: '#14b8a6',
  school: '#f59e0b',

}

export function EventsPublicView({ events }: EventsPublicViewProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Event['category']>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return events
      .filter(event => {
        if (categoryFilter === 'all') return true
        return event.category === categoryFilter
      })
      .filter(event => {
        if (!text) return true
        return event.title.toLowerCase().includes(text)
      })
      .filter(event => {
        if (statusFilter === 'all') return true
        const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null
        const isClosed = deadline ? now.getTime() > deadline.getTime() : false
        if (statusFilter === 'open') return deadline ? !isClosed : false
        if (statusFilter === 'closed') return deadline ? isClosed : false
        return !deadline
      })
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [events, query, categoryFilter, statusFilter, now])

  return (
    <div>
      <style>{`
        .events-filter-bar {
          position: sticky;
          top: 0;
          z-index: 12;
          background: color-mix(in srgb, var(--surface) 85%, transparent);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.2rem 1.5rem;
          margin-bottom: 2rem;
        }
        .events-filter-stack {
          display: grid;
          gap: 1rem;
        }
        .events-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .events-pill-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--foreground-muted);
          margin-right: 0.35rem;
        }
        .events-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          .events-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 768px) {
          .events-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .events-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .event-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: fade-up 0.4s ease;
        }
        .event-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 45px rgba(15,23,42,0.15);
        }
        .event-cover {
          height: 200px;
          position: relative;
          background: linear-gradient(135deg, #4f46e5, #8b5cf6);
        }
        .event-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-cover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,17,23,0) 55%, rgba(15,17,23,0.55) 100%);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .event-desc {
          font-family: var(--font-body);
          font-size: 0.82rem;
          color: var(--foreground-muted);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .event-desc p {
          margin: 0;
        }
        .event-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--foreground-muted);
        }
        .event-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
        }
        @media (max-width: 560px) {
          .event-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="events-filter-bar">
        <div className="events-filter-stack">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search events"
                style={searchStyle}
              />
              <span style={searchIconStyle}>🔍</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>
              Showing {filtered.length} events
            </div>
          </div>
          <div className="events-pill-group">
            <span className="events-pill-label">Category</span>
            {['all', 'university', 'college', 'school'].map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category as typeof categoryFilter)}
                style={{ ...pillStyle, background: categoryFilter === category ? 'var(--color-primary)' : 'transparent', color: categoryFilter === category ? '#fff' : 'var(--foreground)' }}
              >
                {category === 'all' ? 'All' : category[0].toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <div className="events-pill-group">
            <span className="events-pill-label">Status</span>
            {(['all', 'open', 'closed', 'upcoming'] as StatusFilter[]).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{ ...pillStyle, background: statusFilter === status ? 'var(--color-accent)' : 'transparent', color: statusFilter === status ? '#fff' : 'var(--foreground)' }}
              >
                {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!filtered.length && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--foreground-muted)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>No events found</div>
          <button type="button" onClick={() => { setQuery(''); setCategoryFilter('all'); setStatusFilter('all') }} style={ghostButtonStyle}>
            Clear filters
          </button>
        </div>
      )}

      <div className="events-grid">
        {filtered.map(event => {
          const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null
          const isClosed = deadline ? now.getTime() > deadline.getTime() : false
          const isSoon = deadline ? deadline.getTime() - now.getTime() < 24 * 60 * 60 * 1000 : false
          const countdown = deadline && !isClosed ? formatCountdown(deadline.getTime() - now.getTime()) : null
          const statusLabel = deadline ? (isClosed ? 'Closed' : 'Open') : 'Upcoming'
          const statusColor = deadline ? (isClosed ? '#ef4444' : '#22c55e') : '#94a3b8'

          return (
            <div key={event.id} className="event-card">
              <div className="event-cover">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt={event.title} />
                ) : (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#fff' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="3" />
                      <path d="M16 2v4" />
                      <path d="M8 2v4" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
                  <span className="badge" style={{ background: `${CATEGORY_COLORS[event.category]}1a`, color: CATEGORY_COLORS[event.category] }}>
                    {event.category}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1 }}>
                  <span className="badge" style={{ background: `${statusColor}1a`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1.1rem 1.25rem 1.25rem', display: 'grid', gap: '0.75rem' }}>
                <Link
                  href={`/events/${event.slug}`}
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}
                >
                  {event.title}
                </Link>
                <div className="event-desc">
                  {event.short_description ? (
                    <RichHtml html={event.short_description} />
                  ) : (
                    'No description available.'
                  )}
                </div>
                <div className="event-meta">
                  <span style={{ color: isSoon ? '#ef4444' : 'var(--foreground-muted)' }}>
                    {deadline ? (isClosed ? 'Registration Closed' : countdown) : 'Deadline TBA'}
                  </span>
                  {event.registration_type === 'google_form' ? 'Google Form' : 'Internal Form'}
                </div>
                <div className="event-actions">
                  <Link href={`/events/${event.slug}`} style={secondaryButtonStyle}>
                    Details
                  </Link>
                  <Link
                    href={`/events/${event.slug}/register`}
                    style={{
                      ...primaryButtonStyle,
                      pointerEvents: isClosed ? 'none' : 'auto',
                      opacity: isClosed ? 0.6 : 1,
                    }}
                  >
                    {isClosed ? 'Closed' : event.registration_button_label || 'Register'}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatCountdown(diffMs: number) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(days).padStart(2, '0')} days ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const searchStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 999,
  border: '1px solid var(--border)',
  padding: '0.75rem 1rem 0.75rem 2.5rem',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
}

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--foreground-muted)',
}

const pillStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '0.35rem 0.9rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '0.75rem 1.2rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 700,
  textAlign: 'center',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-primary)',
  borderRadius: 12,
  padding: '0.75rem 1.2rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
}

const ghostButtonStyle: React.CSSProperties = {
  marginTop: '1rem',
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '0.5rem 1.2rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'transparent',
  cursor: 'pointer',
}

