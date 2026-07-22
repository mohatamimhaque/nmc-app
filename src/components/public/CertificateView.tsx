'use client'

import { useState, useRef, useEffect } from 'react'
import { CertificateSecurityGuard } from './CertificateSecurityGuard'
import { PublicMathDivider } from './PublicMathDivider'

interface ParticipantData {
  serial: string
  full_name: string
  level: string
  event: string
  institution: string | null
}

export function CertificateView() {
  const [serialQuery, setSerialQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [participant, setParticipant] = useState<ParticipantData | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanSerial = serialQuery.trim()

    if (!cleanSerial) {
      setStatus('error')
      setErrorMsg('Please enter your Certificate / Registration Serial Number.')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    setParticipant(null)
    setImgLoaded(false)

    try {
      const res = await fetch(`/api/certificates/verify?serial=${encodeURIComponent(cleanSerial)}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setStatus('error')
        setErrorMsg(data.error || 'No matching certificate found for this serial number.')
        return
      }

      setParticipant(data.participant)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('An unexpected error occurred while searching. Please try again.')
    }
  }

  // Draw certificate on canvas when participant matches
  useEffect(() => {
    if (!participant || status !== 'success') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `/api/certificates/download?serial=${encodeURIComponent(participant.serial)}&mode=preview&format=png&t=${Date.now()}`

    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      setImgLoaded(true)
    }
  }, [participant, status])

  return (
    <main style={{ position: 'relative', minHeight: '80vh', paddingBottom: '5rem', zIndex: 1 }}>
      {/* Activate Anti-Inspection Security Guard */}
      <CertificateSecurityGuard />

      {/* Page Header */}
      <section style={{ padding: '4rem 1.5rem 2rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
          National Mathematics Carnival 2026
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 800, margin: '0.6rem 0', color: 'var(--foreground)' }}>
          Certificate Download & Verification
        </h1>
        <p style={{ color: 'var(--foreground-muted)', maxWidth: 620, margin: '0 auto', fontSize: '1rem', lineHeight: '1.5' }}>
          Enter your official Serial Number to verify and download your Certificate as PDF.
        </p>
      </section>

      {/* Search Form Card */}
      <section style={{ padding: '0 1.5rem 2.5rem', maxWidth: 750, margin: '0 auto' }}>
        <form
          onSubmit={handleSearch}
          className="interactive-element"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '2rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--foreground-muted)', fontWeight: 600 }}>
              Enter Serial Number
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={serialQuery}
                onChange={e => setSerialQuery(e.target.value)}
                placeholder="NMC26-X-XX-XXX"
                maxLength={40}
                className="interactive-element"
                style={{
                  flex: 1,
                  minWidth: 240,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  padding: '0.8rem 1.1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  background: 'var(--surface-2, #fff)',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="interactive-element"
                style={{
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  padding: '0.8rem 2rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                {status === 'loading' ? 'Verifying…' : 'Verify & Search'}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div style={{ color: '#ef4444', marginTop: '1.25rem', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(239,68,68,0.08)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {errorMsg}
            </div>
          )}
        </form>
      </section>

      {/* Verified Certificate Section */}
      {status === 'success' && participant && (
        <section style={{ padding: '0 1.5rem', maxWidth: 950, margin: '0 auto' }}>
          <PublicMathDivider />

          <div style={{ marginTop: '2.5rem' }}>
            {/* Participant Details Summary */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '1.5rem 2rem',
                marginBottom: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Participant Name</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', marginTop: 2 }}>{participant.full_name}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Serial Number</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>{participant.serial}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Category / Level</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{participant.level || 'General'}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Event</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginTop: 2 }}>{participant.event || 'Olympiad'}</div>
              </div>
            </div>

            {/* Canvas Preview Container (DOM-Secure) */}
            <div
              style={{
                background: 'var(--surface-2, #1e293b)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--foreground-muted)', letterSpacing: '0.1em' }}>
                  Secure Canvas Preview
                </span>
                <a
                  href={`/api/certificates/download?serial=${encodeURIComponent(participant.serial)}&mode=download&format=pdf`}
                  download={`Certificate_${participant.serial}.pdf`}
                  className="interactive-element"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    padding: '0.65rem 1.6rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📄 Download Certificate (PDF)
                </a>
              </div>

              {!imgLoaded && (
                <div style={{ padding: '4rem 1rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  Rendering high-resolution secure certificate…
                </div>
              )}

              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 12,
                  display: imgLoaded ? 'block' : 'none',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
