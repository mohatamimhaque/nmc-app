'use client'

import { useState } from 'react'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'

interface RegistrationResult {
  serial: string
  full_name: string
  level: string
  event: string
  phone_number: string
  admit_card_url: string | null
}

export default function AdmitCardPage() {
  const [level, setLevel] = useState('all')
  const [event, setEvent] = useState('all')
  const [query, setQuery] = useState('')
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [results, setResults] = useState<RegistrationResult[]>([])
  
  // Modal Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const searchVal = query.trim()
    if (searchVal.length < 3) {
      setStatus('error')
      setError('Please enter at least 3 characters of your Name or Phone number.')
      return
    }

    setStatus('loading')
    setError('')
    setResults([])

    try {
      const url = `/api/registrations/admit-card?level=${encodeURIComponent(level)}&event=${encodeURIComponent(event)}&query=${encodeURIComponent(searchVal)}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Failed to retrieve registrations.')
        return
      }

      setResults(data.registrations || [])
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <main style={{ position: 'relative', zIndex: previewUrl ? 99999 : 1, minHeight: '80vh', paddingBottom: '5rem' }}>
      
      {/* Page Header */}
      <section style={{ padding: '4rem 1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
            National Mathematics Carnival 2026
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 800, margin: '0.6rem 0' }}>
            Download Admit Card
          </h1>
          <p style={{ color: 'var(--foreground-muted)', maxWidth: 620, margin: '0 auto', fontSize: '1rem', lineHeight: '1.5' }}>
            Select your Category and Event, then enter your Name or Phone number to retrieve your admit card.
          </p>
        </div>
      </section>

      {/* Search Panel Card */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: 850, margin: '0 auto' }}>
        <form 
          onSubmit={handleSearch}
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 20, 
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Level Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                Select Level
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: '0.75rem 1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  background: 'var(--surface-container, #fff)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Levels</option>
                <option value="School level">School level</option>
                <option value="Intermediate level">Intermediate level</option>
                <option value="University level">University level</option>
              </select>
            </div>

            {/* Event Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                Select Event
              </label>
              <select
                value={event}
                onChange={e => setEvent(e.target.value)}
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: '0.75rem 1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  background: 'var(--surface-container, #fff)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Events</option>
                <option value="Math Olympiad">Math Olympiad</option>
                <option value="Math Game">Math Game</option>
                <option value="Article Writing">Article Writing</option>
                <option value="Poster Presentation">Poster Presentation</option>
              </select>
            </div>

            {/* Name/Phone Search query */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                Name or Mobile Number
              </label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. mohatamim or 01518749114"
                maxLength={40}
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: '0.75rem 1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  background: 'var(--surface-container, #fff)',
                  color: 'var(--foreground)',
                  outline: 'none'
                }}
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                borderRadius: 10,
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                padding: '0.8rem 2rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {status === 'loading' ? 'Searching...' : 'Search Admit Card'}
            </button>
          </div>

          {status === 'error' && (
            <div style={{ color: '#ef4444', marginTop: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}
        </form>
      </section>

      {/* Results View */}
      {status === 'success' && (
        <section style={{ padding: '0 1.5rem', maxWidth: 900, margin: '0 auto' }}>
          <PublicMathDivider />
          
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Search Results ({results.length})
            </h2>

            {results.length === 0 ? (
              <div 
                style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1.5rem', 
                  border: '1px dashed var(--border)', 
                  borderRadius: 18,
                  color: 'var(--foreground-muted)'
                }}
              >
                No registrations matched your search criteria. Please verify your Name/Phone number spelling.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 18, background: 'var(--surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Serial</th>
                      <th style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Name</th>
                      <th style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Level / Event</th>
                      <th style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--foreground-muted)', textAlign: 'center' }}>Admit Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((reg) => (
                      <tr key={reg.serial} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>{reg.serial}</td>
                        <td style={{ padding: '1.25rem', fontWeight: 600 }}>
                          {reg.full_name}
                          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            Phone: ****{reg.phone_number ? reg.phone_number.slice(-4) : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem', fontSize: '0.9rem' }}>
                          <span style={{ display: 'block', fontWeight: 500 }}>{reg.event}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{reg.level}</span>
                        </td>
                        <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                          {reg.admit_card_url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewUrl(reg.admit_card_url)
                                setPreviewName(reg.full_name)
                              }}
                              style={{
                                borderRadius: 8,
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--color-primary)',
                                padding: '0.5rem 1rem',
                                fontFamily: 'var(--font-body)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              View & Print
                            </button>
                          ) : (
                            <span 
                              style={{ 
                                display: 'inline-block',
                                fontSize: '0.75rem', 
                                padding: '3px 8px', 
                                borderRadius: 6, 
                                background: 'rgba(0, 0, 0, 0.05)',
                                color: 'var(--foreground-muted)',
                                fontWeight: 500
                              }}
                            >
                              Not Ready Yet
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* High-Fidelity Preview Modal */}
      {previewUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewUrl(null)
            }
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: '850px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'var(--surface)'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
                  Admit Card
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                  Participant: {previewName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewUrl(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: PDF Container */}
            <div style={{ flex: 1, background: '#f3f4f6', position: 'relative' }}>
              <object
                data={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 'none' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#fff',
                    color: 'var(--foreground)'
                  }}
                >
                  <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</span>
                  <h4 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    PDF Preview Not Supported
                  </h4>
                  <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--foreground-muted)', maxWidth: '320px', lineHeight: '1.4' }}>
                    Your device or browser doesn't support rendering PDF files inline. Please use the button below to view it directly.
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 8,
                      background: 'var(--color-primary)',
                      color: '#fff',
                      padding: '0.6rem 1.5rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </object>
            </div>

            {/* Modal Footer */}
            <div 
              style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border)', 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'var(--surface)'
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  color: 'var(--foreground)',
                  padding: '0.5rem 1.25rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Admit Card Preview"]') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    try {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    } catch {
                      const w = window.open(previewUrl, '_blank');
                      if (w) {
                        w.focus();
                        w.print();
                      }
                    }
                  } else {
                    const w = window.open(previewUrl, '_blank');
                    if (w) {
                      w.focus();
                      w.print();
                    }
                  }
                }}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--color-primary)',
                  background: 'transparent',
                  color: 'var(--color-primary)',
                  padding: '0.5rem 1.5rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Print Card
              </button>
              <a
                href={previewUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 8,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  padding: '0.5rem 1.5rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Download PDF
              </a>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}} />
        </div>
      )}
    </main>
  )
}
