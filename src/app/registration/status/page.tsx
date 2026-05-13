'use client'

import { useState } from 'react'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'

export default function RegistrationStatusPage() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleLookup = async () => {
    const value = code.trim().toUpperCase()
    if (value.length !== 8) {
      setStatus('error')
      setError('Enter an 8-character tracking ID.')
      return
    }
    setStatus('loading')
    setError('')
    setResult(null)

    const response = await fetch(`/api/registrations/status?code=${encodeURIComponent(value)}`)
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setStatus('error')
      setError(data?.error ?? 'Tracking ID not found.')
      return
    }

    setResult(data)
    setStatus('success')
  }

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <section style={{ padding: '4rem 1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
            Registration Status
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 800, margin: '0.6rem 0' }}>
            Track Your Submission
          </h1>
          <p style={{ color: 'var(--foreground-muted)', maxWidth: 620, margin: '0 auto' }}>
            Enter your 8-character tracking ID to view your registration status and details.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 3rem', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={code}
            onChange={event => setCode(event.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
            maxLength={8}
            style={{
              flex: '1 1 220px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
            }}
          />
          <button
            type="button"
            onClick={handleLookup}
            style={{
              borderRadius: 10,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {status === 'loading' ? 'Checking...' : 'Check Status'}
          </button>
        </div>
        {status === 'error' && (
          <div style={{ color: '#ef4444', marginTop: '0.75rem' }}>{error}</div>
        )}
      </section>

      {status === 'success' && result && (
        <section style={{ padding: '0 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
          <PublicMathDivider />
          <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                  Tracking ID
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>{result.public_id}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                  Status
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>{String(result.status).toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                  Event
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>{result.event?.title ?? 'Event'}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                  Submitted
                </div>
                <div style={{ fontFamily: 'var(--font-body)' }}>{result.submitted_at ? new Date(result.submitted_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
              {(result.form_data?.fields ?? []).map((field: any) => (
                <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.6rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{field.label}</div>
                  <div style={{ fontFamily: 'var(--font-body)', textAlign: 'right' }}>{String(field.value ?? '')}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
