'use client'

import { useState } from 'react'
import Link from 'next/link'


interface LocationInfo {
  lat: number
  lng: number
  location_name: string
  venue: string
}

interface ParticipantRoomData {
  unique_id: string
  serial: string
  registration_id: string
  name: string
  category: string
  institution: string
  allocated_room: string | null
  is_allocated: boolean
  location: LocationInfo
}

export function RoomFinderView() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParticipantRoomData | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/registrations/find-room?query=${encodeURIComponent(query.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Participant record not found.')
      }

      setResult(data.data)
    } catch (err: any) {
      setError(err.message || 'Error looking up room allocation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 1rem',
          borderRadius: 999,
          background: 'var(--surface-2, rgba(99, 102, 241, 0.12))',
          border: '1px solid var(--border, rgba(99, 102, 241, 0.25))',
          color: 'var(--color-primary, #6366f1)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_searching</span>
          NMC 2026 · Exam Venue Locator
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.8rem, 4.5vw, 2.75rem)',
          fontWeight: 800,
          color: 'var(--foreground, #0f172a)',
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          Find Your Exam Room
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          color: 'var(--foreground-muted, #64748b)',
          marginTop: '0.5rem',
          maxWidth: 620,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.5,
        }}>
          Enter your <strong style={{ color: 'var(--foreground, #1e293b)' }}>Registration Serial Number</strong> to locate your assigned room & venue map.
        </p>
        <div style={{ marginTop: '0.75rem' }}>
          <Link
            href="/schedule"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--color-primary, #6366f1)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>calendar_month</span>
            View Event Schedule (কার্নিভাল সূচী)
          </Link>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div
          className="interactive-element"
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 20,
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.06))',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}>
            <div style={{ flex: '1 1 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--foreground-muted, #94a3b8)',
                  fontSize: '1.25rem',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="NMC26-X-XX-XXX"
                style={{
                  width: '100%',
                  background: 'var(--surface-2, #f8fafc)',
                  border: '1px solid var(--border, #cbd5e1)',
                  borderRadius: 12,
                  padding: '0.85rem 1.1rem 0.85rem 2.6rem',
                  color: 'var(--foreground, #0f172a)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                flex: '0 0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.85rem 1.75rem',
                borderRadius: 12,
                background: 'var(--color-primary, #6366f1)',
                color: '#ffffff',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !query.trim() ? 0.65 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                {loading ? 'progress_activity' : 'search'}
              </span>
              {loading ? 'Searching...' : 'Find Room'}
            </button>
          </div>
        </div>
      </form>

      {/* Error Notice */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem 1.25rem',
          borderRadius: 14,
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.3rem', flexShrink: 0 }}>warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Search Result View */}
      {result && (
        <div style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 20,
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(0,0,0,0.08))',
        }}>
          {/* Top Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border, #e2e8f0)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>person</span>
                Participant Name
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground, #0f172a)', marginTop: '0.2rem' }}>
                {result.name}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>badge</span>
                Serial Number
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary, #6366f1)', marginTop: '0.2rem' }}>
                {result.serial}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--foreground-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>school</span>
                Category / Institution
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground, #1e293b)', marginTop: '0.2rem' }}>
                {result.category} · <span style={{ color: 'var(--foreground-muted, #64748b)' }}>{result.institution || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Allocated Room Highlight Box */}
          <div style={{
            background: result.is_allocated
              ? 'linear-gradient(135deg, rgba(32, 201, 151, 0.12) 0%, rgba(13, 148, 136, 0.2) 100%)'
              : 'rgba(234, 179, 8, 0.1)',
            border: result.is_allocated
              ? '1px solid rgba(32, 201, 151, 0.4)'
              : '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 16,
            padding: '1.5rem 1rem',
            textAlign: 'center',
            marginBottom: '1.75rem',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: result.is_allocated ? '#10b981' : '#d97706',
              fontWeight: 700,
              marginBottom: '0.35rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                {result.is_allocated ? 'meeting_room' : 'pending'}
              </span>
              {result.is_allocated ? 'ROOM ALLOCATION ASSIGNED' : 'ROOM PENDING ALLOCATION'}
            </div>

            <div style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--foreground, #0f172a)',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
            }}>
              {result.allocated_room || 'Room Not Allocated Yet'}
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--foreground-muted, #475569)',
              marginTop: '0.4rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#ef4444' }}>location_on</span>
              <span>{result.location.location_name}</span>
            </div>
          </div>

          {/* Interactive Map Box */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}>
              <a
                href={`https://maps.google.com/?q=${result.location.lat},${result.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-primary, #6366f1)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                Open in Google Maps
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
              </a>
            </div>

            <div style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid var(--border, #cbd5e1)',
              boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(0,0,0,0.05))',
            }}>
              <iframe
                width="100%"
                height="340"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${result.location.lat},${result.location.lng}&z=18&output=embed`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
