'use client'

import { useState } from 'react'

export function GoogleFormEmbed({ title, url }: { title: string; url: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <section style={{ position: 'relative', minHeight: '100vh', height: '100dvh', background: 'var(--surface)' }}>
      <style>{`
        @keyframes form-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {!loaded && (
        <div
          aria-live="polite"
          aria-busy="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'grid', gap: '0.75rem', placeItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '3px solid rgba(148,163,184,0.4)',
                borderTopColor: 'var(--color-primary)',
                animation: 'form-spin 0.9s linear infinite',
              }}
            />
            <div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
              Loading registration form…
            </div>
          </div>
        </div>
      )}
      <iframe
        title={title}
        src={url}
        style={{ width: '100%', height: '100%', border: 'none' }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      <div style={{ padding: '0.9rem 1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
        If the form does not load on mobile, open it in a new tab:{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Open form
        </a>
      </div>
    </section>
  )
}
