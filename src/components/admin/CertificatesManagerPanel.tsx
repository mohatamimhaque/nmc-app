'use client'

import { useState, useTransition } from 'react'
import { GlassCard } from './GlassCard'
import { MathDivider } from './MathDivider'

interface CertificatesManagerPanelProps {
  initialIsVisible: boolean
  totalRegistrationsCount: number
}

const TEMPLATE_FILES = [
  { name: 'School Level Math Game', file: 'School Level Math Game.pptx', level: 'School level', event: 'Math Game' },
  { name: 'School Level Math Olympiad', file: 'School Level Math Olympiad.pptx', level: 'School level', event: 'Math Olympiad' },
  { name: 'Intermediate Level Article Writing', file: 'Intermediate Level Article Writing.pptx', level: 'Intermediate level', event: 'Article Writing' },
  { name: 'Intermediate Level Math Olympiad', file: 'Intermediate Level Math Olympiad.pptx', level: 'Intermediate level', event: 'Math Olympiad' },
  { name: 'University Level Math Olympiad', file: 'University Level Math Olympiad.pptx', level: 'University level', event: 'Math Olympiad' },
  { name: 'University Level Poster Presentation', file: 'University Level Poster Presentation.pptx', level: 'University level', event: 'Poster Presentation' },
]

export function CertificatesManagerPanel({
  initialIsVisible,
  totalRegistrationsCount,
}: CertificatesManagerPanelProps) {
  const [isVisible, setIsVisible] = useState(initialIsVisible)
  const [pending, startTransition] = useTransition()

  // Serial search test state
  const [testSerial, setTestSerial] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  const toggleVisibility = () => {
    const next = !isVisible
    setIsVisible(next)
    startTransition(async () => {
      await fetch('/api/admin/visibility/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: 'certificate', is_visible: next }),
      })
    })
  }

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testSerial.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResult(null)

    try {
      const res = await fetch(`/api/certificates/verify?serial=${encodeURIComponent(testSerial.trim())}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setSearchError(data.error || 'No registration found.')
      } else {
        setSearchResult(data.participant)
      }
    } catch {
      setSearchError('Error testing certificate serial.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem', opacity: 0.7 }}>
          Admin · Certificates
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--admin-fg)', margin: 0 }}>
          Certificate Management & Security
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--admin-fg-muted)', margin: '0.4rem 0 0' }}>
          Control public certificate access, preview event templates, and verify participant PDF certificate generation.
        </p>
      </div>

      {/* Control Strip Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <GlassCard padding="1.25rem" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
              Public Page Access
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '2px' }}>
              /certificate
            </div>
            <div style={{ marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: isVisible ? '#20c997' : '#ef4444' }}>
              <span>{isVisible ? '🟢' : '🔴'}</span>
              {isVisible ? 'Live & Accessible' : 'Hidden (404 Blocked)'}
            </div>
          </div>
          <button
            onClick={toggleVisibility}
            role="switch"
            aria-checked={isVisible}
            disabled={pending}
            style={{
              width: 48,
              height: 26,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 3,
              background: isVisible ? 'var(--admin-accent)' : 'var(--admin-border)',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isVisible ? 'flex-end' : 'flex-start',
              boxShadow: isVisible ? '0 0 8px var(--admin-accent-glow)' : 'none',
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </button>
        </GlassCard>

        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
            Processed Registrations
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--admin-accent)', margin: '0.2rem 0 0' }}>
            {totalRegistrationsCount}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '2px' }}>
            Participants eligible for certificates
          </div>
        </GlassCard>
      </div>

      {/* Certificate Tester & Search */}
      <div style={{ marginBottom: '2.5rem' }}>
        <MathDivider formula="// Test Certificate Verification & Preview" dim />
        <GlassCard padding="1.5rem">
          <form onSubmit={handleTestSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={testSerial}
              onChange={e => setTestSerial(e.target.value)}
              placeholder="Enter Serial Number (e.g. NMC26-S-MO-086)"
              style={{
                flex: 1,
                minWidth: 260,
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                padding: '0.6rem 1rem',
                color: 'var(--admin-fg)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                background: 'var(--admin-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.25rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: searching ? 'not-allowed' : 'pointer',
              }}
            >
              {searching ? 'Testing…' : 'Test Certificate'}
            </button>
          </form>

          {searchError && (
            <div style={{ color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              ⚠ {searchError}
            </div>
          )}

          {searchResult && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>SERIAL</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-accent)' }}>{searchResult.serial}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>FULL NAME</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-fg)' }}>{searchResult.full_name}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>LEVEL / EVENT</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--admin-fg)' }}>{searchResult.level} · {searchResult.event}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href={`/api/certificates/download?serial=${encodeURIComponent(searchResult.serial)}&mode=preview&format=png`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(34,211,238,0.1)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    color: 'var(--admin-accent)',
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  👁 View Rendered Certificate
                </a>
                <a
                  href={`/api/certificates/download?serial=${encodeURIComponent(searchResult.serial)}&mode=download&format=pdf`}
                  download={`Certificate_${searchResult.serial}.pdf`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--admin-accent)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  📄 Download PDF
                </a>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Templates Security Information */}
      <div>
        <MathDivider formula="// Registered PowerPoint Templates (Server-Side Only)" dim />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {TEMPLATE_FILES.map(tmpl => (
            <GlassCard key={tmpl.file} padding="1.1rem">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📜</span>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--admin-fg)' }}>
                  {tmpl.name}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
                {tmpl.file}
              </div>
              <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#20c997', background: 'rgba(32,201,151,0.08)', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                🔒 Protected Server Asset
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
