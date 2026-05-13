'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminLoginPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(
    params.get('error') === 'unauthorized'
      ? 'Access denied. Your account does not have admin privileges.'
      : ''
  )
  const [loading, setLoading]   = useState(false)
  const wasRedirected = params.get('redirected') === '1' && !params.get('error')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/admin')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--admin-border)', borderRadius: 8,
    padding: '0.65rem 0.9rem', color: 'var(--admin-fg)',
    fontFamily: 'var(--font-body)', fontSize: '0.875rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}>
      <div style={{ background: 'var(--admin-surface)', backdropFilter: 'blur(20px) saturate(1.8)', WebkitBackdropFilter: 'blur(20px) saturate(1.8)', border: '1px solid var(--admin-border)', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 24,8 24,20 14,26 4,20 4,8" stroke="var(--admin-accent)" strokeWidth="1.5" fill="none" />
            <polygon points="14,8 20,19 8,19" stroke="var(--admin-accent)" strokeWidth="1" fill="var(--admin-accent)" opacity="0.25" />
            <circle cx="14" cy="14" r="2" fill="var(--admin-accent)" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-fg)', letterSpacing: '0.04em', lineHeight: 1 }}>NMC 2026</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-accent)', letterSpacing: '0.1em', marginTop: 3 }}>ADMIN PORTAL</div>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-accent)', opacity: 0.35, marginBottom: '1.75rem', letterSpacing: '0.06em' }}>
          e^(iπ) + 1 = 0 &nbsp;·&nbsp; ∑ · ∫ · π · √2
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--admin-border)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Authorised Access Only</span>
          <div style={{ flex: 1, height: 1, background: 'var(--admin-border)' }} />
        </div>

        {/* Session expired notice */}
        {wasRedirected && (
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 8, padding: '0.65rem 0.9rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#fbbf24' }}>
            Session expired. Please sign in again.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '0.65rem 0.9rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Email</label>
            <input
              type="email" id="admin-email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@duet.ac.bd"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--admin-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(116,143,252,0.25)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Password</label>
            <input
              type="password" id="admin-password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--admin-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(116,143,252,0.25)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <button
            type="submit" id="admin-login-btn" disabled={loading}
            style={{ width: '100%', background: 'var(--admin-accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(116,143,252,0.4)', transition: 'opacity 0.15s, transform 0.15s' }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--admin-fg-muted)', opacity: 0.4, marginTop: '1.5rem', letterSpacing: '0.06em' }}>
          φ = (1 + √5) / 2 &nbsp;·&nbsp; Math Club, DUET
        </div>
      </div>
    </div>
  )
}
