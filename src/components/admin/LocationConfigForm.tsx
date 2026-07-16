'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from './GlassCard'

interface LocationConfigFormProps {
  initialConfig: {
    supabase_url: string
    supabase_anon_key: string
    live_map_enabled: boolean
  }
}

type UrlStatus = 'idle' | 'checking' | 'valid' | 'invalid'

export function LocationConfigForm({ initialConfig }: LocationConfigFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Input states
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.supabase_url)
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig.supabase_anon_key)
  const [liveMapEnabled, setLiveMapEnabled] = useState(initialConfig.live_map_enabled)

  // Validation state
  const [urlStatus, setUrlStatus] = useState<UrlStatus>('idle')

  // Debounced URL check
  useEffect(() => {
    if (!supabaseUrl) {
      setUrlStatus('idle')
      return
    }
    if (!/^https?:\/\/.+/.test(supabaseUrl)) {
      setUrlStatus('invalid')
      return
    }

    setUrlStatus('checking')
    const debounce = setTimeout(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)
        
        // Mode 'no-cors' allows us to fetch cross-origin without CORS failure blocking the check
        await fetch(supabaseUrl, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        setUrlStatus('valid')
      } catch (err) {
        setUrlStatus('invalid')
      }
    }, 600)

    return () => clearTimeout(debounce)
  }, [supabaseUrl])

  // Save full configuration
  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/location-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabase_url: supabaseUrl,
          supabase_anon_key: supabaseAnonKey,
          live_map_enabled: liveMapEnabled,
        }),
      })

      const data = await response.json()
      setSaving(false)

      if (!response.ok) {
        setError(data?.error || 'Failed to save configuration.')
        return
      }

      setSuccess('Location configuration saved successfully.')
      router.refresh()
    } catch (err: any) {
      setSaving(false)
      setError(err.message || 'An error occurred.')
    }
  }

  // Toggle tracking status immediately
  const handleToggleTracking = async () => {
    if (toggling) return
    setToggling(true)
    setError('')
    setSuccess('')

    const nextState = !liveMapEnabled

    try {
      const response = await fetch(`/api/admin/location-config/toggle?enabled=${nextState}`, {
        method: 'POST',
      })

      const data = await response.json()
      setToggling(false)

      if (!response.ok) {
        setError(data?.error || 'Failed to toggle tracking status.')
        return
      }

      setLiveMapEnabled(data.live_map_enabled)
      setSuccess(`Tracking status globally ${data.live_map_enabled ? 'enabled' : 'disabled'}.`)
      router.refresh()
    } catch (err: any) {
      setToggling(false)
      setError(err.message || 'An error occurred while toggling status.')
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
      
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          Admin · Tracking Settings
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--admin-fg)',
            margin: 0,
          }}
        >
          Location & Messaging Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Configure secondary database credentials and toggle coordinate tracking controls for staff.
        </p>
      </div>

      {/* Messaging Banners */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            color: '#f87171',
            fontSize: '0.85rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            marginBottom: '1rem',
            color: '#34d399',
            fontSize: '0.85rem',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      <GlassCard accent>
        {/* Global Map Switch Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--admin-accent)', display: 'inline-flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--admin-accent)',
              }}
            >
              Global Map System Switch
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--admin-border)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--admin-fg)' }}>Active Tracking Status:</span>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: liveMapEnabled ? '#34d399' : '#94a3b8',
                    textShadow: liveMapEnabled ? '0 0 10px rgba(52, 211, 153, 0.3)' : 'none',
                  }}
                >
                  {liveMapEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '0.25rem' }}>
                Turning this switch off halts coordinate uploads on all volunteer devices.
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTracking}
              disabled={toggling}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                background: liveMapEnabled ? 'var(--admin-accent, #00e5ff)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                position: 'relative',
                cursor: toggling ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                boxShadow: liveMapEnabled ? '0 0 12px var(--admin-accent-glow, rgba(0,229,255,0.3))' : 'none',
                opacity: toggling ? 0.7 : 1,
              }}
              aria-label="Toggle Tracking System"
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  left: liveMapEnabled ? '26px' : '4px',
                  transition: 'left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {toggling && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '1.5rem 0' }} />

        {/* Credentials Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--admin-accent)', display: 'inline-flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--admin-accent)',
              }}
            >
              Secondary Supabase Configuration
            </span>
          </div>

          {/* URL Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--admin-fg-muted)',
                }}
              >
                Supabase Project REST URL
              </span>

              {/* Instant Validation Bubble */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {urlStatus === 'checking' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    </svg>
                    checking...
                  </span>
                )}
                {urlStatus === 'valid' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      color: '#34d399',
                      background: 'rgba(52, 211, 153, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                    }}
                  >
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                    Reachable
                  </span>
                )}
                {urlStatus === 'invalid' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      color: '#f87171',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f87171' }} />
                    Offline / Invalid
                  </span>
                )}
              </div>
            </div>
            <input
              type="text"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              style={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid var(--admin-border)',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--admin-fg)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Anon Key Input */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--admin-fg-muted)',
                }}
              >
                Supabase Public/Anon API Key
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border)',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--admin-fg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--admin-fg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                }}
                title={showKey ? 'Hide credentials' : 'Show credentials'}
              >
                {showKey ? (
                  // Eye off icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, var(--admin-accent) 0%, var(--admin-accent-glow) 100%)',
                color: '#0b1120',
                border: 'none',
                borderRadius: 12,
                padding: '0.65rem 1.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px var(--admin-accent-glow)',
                opacity: saving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseDown={e => { if(!saving) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { if(!saving) e.currentTarget.style.transform = 'scale(1)' }}
            >
              {saving ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  SAVE CONFIGURATION
                </>
              )}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
