'use client'

import type { CampusAmbassador } from '@/types/database'
import { RichHtml } from '@/components/public/RichHtml'

interface CampusAmbassadorsPublicViewProps {
  ambassadors: CampusAmbassador[]
}

export function CampusAmbassadorsPublicView({ ambassadors }: CampusAmbassadorsPublicViewProps) {
  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .ambassador-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          .ambassador-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 768px) {
          .ambassador-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .ambassador-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .ambassador-card {
          background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.8rem 1.35rem 1.5rem;
          text-align: center;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: var(--shadow-md);
          opacity: 0;
          transform: translateY(10px);
          animation: card-fade 500ms ease forwards;
        }
        .ambassador-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
        }
        .ambassador-avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 3px solid var(--color-primary);
          overflow: hidden;
          display: grid;
          place-items: center;
          margin: -3.6rem auto 0.75rem;
          background: linear-gradient(135deg, #2563eb, #22d3ee);
        }
        .ambassador-avatar.has-image {
          background: transparent;
        }
        .ambassador-card.disabled {
          filter: grayscale(1);
          opacity: 0.7;
        }
        .ambassador-disabled-badge {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(148,163,184,0.55);
          color: #fff;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
          border-radius: 16px;
        }
      `}</style>

      <section style={{ padding: '2.5rem 1.5rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={heroCardStyle}>
          <div style={eyebrowStyle}>Campus Ambassadors</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.3rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Campus Ambassador Network
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Meet the student leaders helping NMC 2026 across campuses.
          </p>
        </div>
      </section>

      <section style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        {ambassadors.length ? (
          <div className="ambassador-grid">
            {ambassadors.map((ambassador, index) => (
              <div
                key={ambassador.id}
                className={`ambassador-card ${ambassador.is_disabled ? 'disabled' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className={`ambassador-avatar ${ambassador.photo_url ? 'has-image' : ''}`}>
                  {ambassador.photo_url ? (
                    <img
                      src={ambassador.photo_url}
                      alt={ambassador.name || 'NMC 2026'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c2.5-3.5 13.5-3.5 16 0" />
                    </svg>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
                  {ambassador.name ?? 'Unnamed Ambassador'}
                </div>
                {ambassador.role && (
                  <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                    {ambassador.role}
                  </div>
                )}
                {(ambassador.department || ambassador.institution || ambassador.designation) && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                    {[ambassador.designation, ambassador.department, ambassador.institution].filter(Boolean).join(' • ')}
                  </div>
                )}
                {ambassador.bio && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                    <RichHtml html={ambassador.bio} />
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                  {ambassador.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4 6h16v12H4z" />
                        <path d="M4 6l8 7 8-7" />
                      </svg>
                      {ambassador.email}
                    </span>
                  )}
                  {ambassador.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4.5 3.5h3l2 5-2.5 1.5c1 2 2.5 3.5 4.5 4.5L13 12l5 2v3c0 .6-.4 1-1 1-6.6 0-12-5.4-12-12 0-.6.4-1 1-1Z" />
                      </svg>
                      {ambassador.phone}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                  {ambassador.facebook_url && (
                    <a href={ambassador.facebook_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>Facebook</a>
                  )}
                  {ambassador.linkedin_url && (
                    <a href={ambassador.linkedin_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>LinkedIn</a>
                  )}
                </div>
                {ambassador.is_disabled && (
                  <div className="ambassador-disabled-badge">Currently Unavailable</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--foreground-muted)', padding: '3rem 0' }}>
            <div style={{ fontFamily: 'var(--font-body)' }}>No ambassadors yet</div>
          </div>
        )}
      </section>

      <style>{`
        @keyframes card-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
}

const heroCardStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'transparent',
  padding: '2.25rem 2rem',
}
