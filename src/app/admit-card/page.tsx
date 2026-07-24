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
    const cleanPhone = searchVal.replace(/[\s\-]/g, '')
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(searchVal)
    const isPhone = /^\+?[0-9]{9,15}$/.test(cleanPhone)
    const isSerial = /^[a-zA-Z0-9\-\/]{4,30}$/.test(searchVal)

    if (!isEmail && !isPhone && !isSerial) {
      setStatus('error')
      setError('Please enter a valid Email address, Phone number, or Serial Number.')
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
    <main style={{ position: 'relative', zIndex: previewUrl ? 99999 : 1, minHeight: '80vh' }}>
      <div className="admit-card-container">
        
        {/* Page Header */}
        <header className="admit-card-header">
          <div className="admit-card-subtitle">
            National Mathematics Carnival 2026
          </div>
          <h1 className="admit-card-title">
            Admit Card Portal
          </h1>
          <p className="admit-card-desc">
            Find and download your official participation admit card. Select your Category and Event, then look up via your Registration Serial Number, Email address, or Phone number.
          </p>
        </header>

        {/* Search Panel Card */}
        <section className="admit-card-card-wrapper">
          <form onSubmit={handleSearch}>
            <div className="admit-card-grid">
              
              {/* Level Selector */}
              <div className="admit-card-field">
                <label className="admit-card-label">
                  Category Level
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="admit-card-select"
                >
                  <option value="all">All Levels</option>
                  <option value="School level">School level</option>
                  <option value="Intermediate level">Intermediate level</option>
                  <option value="University level">University level</option>
                </select>
              </div>

              {/* Event Selector */}
              <div className="admit-card-field">
                <label className="admit-card-label">
                  Competition Event
                </label>
                <select
                  value={event}
                  onChange={e => setEvent(e.target.value)}
                  className="admit-card-select"
                >
                  <option value="all">All Events</option>
                  <option value="Math Olympiad">Math Olympiad</option>
                  <option value="Math Game">Math Game</option>
                  <option value="Article Writing">Article Writing</option>
                  <option value="Poster Presentation">Poster Presentation</option>
                </select>
              </div>

              {/* Search query input */}
              <div className="admit-card-field">
                <label className="admit-card-label">
                  Search Query
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Serial, Email or Phone (e.g. 01xxxxxxxxxx)"
                  maxLength={50}
                  className="admit-card-input"
                />
              </div>

            </div>

            <div className="admit-card-actions">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="admit-card-btn"
              >
                {status === 'loading' ? 'Searching...' : 'Search Admit Card'}
              </button>
            </div>

            {status === 'error' && (
              <div className="admit-card-error">
                <span>⚠</span> {error}
              </div>
            )}
          </form>
        </section>

        {/* Results View */}
        {status === 'success' && (
          <section style={{ marginTop: '3rem' }}>
            <div className="admit-card-divider">
              <PublicMathDivider />
            </div>
            
            <div>
              <h2 className="admit-card-results-title">
                Search Results ({results.length})
              </h2>

              {results.length === 0 ? (
                <div className="admit-card-empty-results">
                  No registrations matched your search criteria. Please verify your Serial Number, Email or Phone number.
                </div>
              ) : (
                <div className="admit-card-results-grid">
                  {results.map((reg) => (
                    <article key={reg.serial} className="reg-card">
                      <div className="reg-card-header">
                        <h3 className="reg-card-name">{reg.full_name}</h3>
                        <span className="reg-card-badge">{reg.event}</span>
                      </div>
                      
                      <div className="reg-card-body">
                        <div className="reg-card-info-row">
                          <span className="reg-card-info-label">Serial Number</span>
                          <span className="reg-card-info-value monospace">{reg.serial}</span>
                        </div>
                        <div className="reg-card-info-row">
                          <span className="reg-card-info-label">Level / Category</span>
                          <span className="reg-card-info-value">{reg.level}</span>
                        </div>
                        <div className="reg-card-info-row">
                          <span className="reg-card-info-label">Reference Phone</span>
                          <span className="reg-card-info-value">
                            ****{reg.phone_number ? reg.phone_number.slice(-4) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="reg-card-footer">
                        {reg.admit_card_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(reg.admit_card_url)
                              setPreviewName(reg.full_name)
                            }}
                            className="reg-card-download-btn"
                          >
                            View & Print Admit Card
                          </button>
                        ) : (
                          <div className="reg-card-not-ready">
                            Admit Card Not Ready Yet
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* High-Fidelity Preview Modal */}
      {previewUrl && (
        <div
          className="admit-card-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewUrl(null)
            }
          }}
        >
          <div className="admit-card-modal-card">
            {/* Modal Header */}
            <div className="admit-card-modal-header">
              <div>
                <h3 className="admit-card-modal-title">
                  Admit Card Preview
                </h3>
                <p className="admit-card-modal-subtitle">
                  Participant: {previewName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewUrl(null)}
                className="admit-card-modal-close"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: PDF Container */}
            <div className="admit-card-modal-body">
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
                    className="admit-card-modal-btn-download"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </object>
            </div>

            {/* Modal Footer */}
            <div className="admit-card-modal-footer">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="admit-card-modal-btn-close"
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
                className="admit-card-modal-btn-print"
              >
                Print Card
              </button>
              <a
                href={previewUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="admit-card-modal-btn-download"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Styled CSS Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .admit-card-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 4rem 1.5rem 6rem;
        }

        .admit-card-header {
          text-align: center;
          margin-bottom: 3.5rem;
        }
        .admit-card-subtitle {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .admit-card-title {
          font-family: var(--font-heading);
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 800;
          margin: 0.5rem 0;
          color: var(--foreground);
        }
        .admit-card-desc {
          color: var(--foreground-muted);
          max-width: 640px;
          margin: 0.75rem auto 0;
          font-size: 1rem;
          line-height: 1.6;
        }

        .admit-card-card-wrapper {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .admit-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .admit-card-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .admit-card-label {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--foreground-muted);
        }
        .admit-card-select, .admit-card-input {
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 0.85rem 1.1rem;
          font-family: var(--font-body);
          font-size: 0.95rem;
          background: var(--surface-container, #ffffff);
          color: var(--foreground);
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .admit-card-input {
          cursor: text;
        }
        .admit-card-select:focus, .admit-card-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .admit-card-actions {
          display: flex;
          justify-content: flex-end;
        }
        .admit-card-btn {
          border-radius: 12px;
          border: none;
          background: var(--color-primary);
          color: #ffffff;
          padding: 0.9rem 2.5rem;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
          transition: all 0.2s ease;
        }
        .admit-card-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.25);
        }
        .admit-card-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .admit-card-error {
          color: #ef4444;
          margin-top: 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admit-card-divider {
          margin: 3.5rem 0;
        }

        .admit-card-results-title {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 1.75rem;
          color: var(--foreground);
        }
        .admit-card-empty-results {
          text-align: center;
          padding: 4rem 2rem;
          border: 1px dashed var(--border);
          border-radius: 20px;
          color: var(--foreground-muted);
          font-size: 0.95rem;
          background: rgba(0, 0, 0, 0.01);
        }
        .admit-card-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .reg-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .reg-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
        }
        .reg-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .reg-card-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--foreground);
          line-height: 1.3;
          margin: 0;
        }
        .reg-card-badge {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-primary);
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .reg-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 1rem 0;
        }
        .reg-card-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }
        .reg-card-info-label {
          color: var(--foreground-muted);
        }
        .reg-card-info-value {
          font-weight: 600;
          color: var(--foreground);
        }
        .reg-card-info-value.monospace {
          font-family: var(--font-mono);
          color: var(--color-accent);
        }
        .reg-card-footer {
          margin-top: auto;
        }
        .reg-card-download-btn {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          background: rgba(99, 102, 241, 0.06);
          color: var(--color-primary);
          padding: 0.75rem 1rem;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          box-sizing: border-box;
        }
        .reg-card-download-btn:hover {
          background: var(--color-primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .reg-card-not-ready {
          width: 100%;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.04);
          color: var(--foreground-muted);
          padding: 0.75rem 1rem;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.85rem;
          text-align: center;
          box-sizing: border-box;
        }

        /* Modal Layout */
        .admit-card-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          box-sizing: border-box;
        }
        .admit-card-modal-card {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 850px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .admit-card-modal-header {
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          box-sizing: border-box;
        }
        .admit-card-modal-title {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
        }
        .admit-card-modal-subtitle {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: var(--foreground-muted);
        }
        .admit-card-modal-close {
          background: transparent;
          border: none;
          color: var(--foreground-muted);
          cursor: pointer;
          font-size: 1.25rem;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.15s ease;
        }
        .admit-card-modal-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .admit-card-modal-body {
          flex: 1;
          background: #f1f5f9;
          position: relative;
        }
        .admit-card-modal-footer {
          padding: 1.25rem 1.75rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: var(--surface);
          box-sizing: border-box;
        }
        .admit-card-modal-btn-close {
          border-radius: 10px;
          border: 1px solid var(--border);
          background: #ffffff;
          color: var(--foreground);
          padding: 0.6rem 1.5rem;
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .admit-card-modal-btn-close:hover {
          background: #f8fafc;
        }
        .admit-card-modal-btn-print {
          border-radius: 10px;
          border: 1px solid var(--color-primary);
          background: transparent;
          color: var(--color-primary);
          padding: 0.6rem 1.75rem;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .admit-card-modal-btn-print:hover {
          background: rgba(99, 102, 241, 0.04);
        }
        .admit-card-modal-btn-download {
          display: inline-flex;
          align-items: center;
          border-radius: 10px;
          background: var(--color-primary);
          color: #ffffff;
          padding: 0.6rem 1.75rem;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
          transition: all 0.2s ease;
        }
        .admit-card-modal-btn-download:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.25);
        }

        /* ─────────────────────────────────────────────
           MOBILE RESPONSIVENESS OVERRIDES
        ───────────────────────────────────────────── */
        @media (max-width: 640px) {
          .admit-card-container {
            padding: 2.5rem 1rem 4rem;
          }
          .admit-card-header {
            margin-bottom: 2rem;
          }
          .admit-card-card-wrapper {
            padding: 1.75rem 1.25rem;
            border-radius: 20px;
          }
          .admit-card-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            margin-bottom: 1.5rem;
          }
          .admit-card-actions {
            margin-top: 1rem;
          }
          .admit-card-btn {
            width: 100%;
            text-align: center;
            padding: 0.85rem 1.5rem;
          }
          .admit-card-divider {
            margin: 2.5rem 0;
          }
          .admit-card-results-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .reg-card {
            padding: 1.25rem;
            border-radius: 16px;
          }
          .admit-card-modal-overlay {
            padding: 0.5rem;
          }
          .admit-card-modal-card {
            height: 95vh;
            border-radius: 18px;
          }
          .admit-card-modal-header {
            padding: 1rem;
          }
          .admit-card-modal-footer {
            padding: 1rem;
            flex-direction: column-reverse;
            gap: 0.5rem;
          }
          .admit-card-modal-btn-close,
          .admit-card-modal-btn-print,
          .admit-card-modal-btn-download {
            width: 100%;
            justify-content: center;
            text-align: center;
            padding: 0.75rem 1rem;
          }
        }
      `}} />
    </main>
  )
}
