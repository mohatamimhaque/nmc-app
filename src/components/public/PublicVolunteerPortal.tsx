'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

interface Volunteer {
  unique_id: string
  name: string
  department: string | null
  segment: string | null
  year: string | null
}

interface PublicVolunteerPortalProps {
  initialVolunteers: Volunteer[]
  allowAdd: boolean
  segments: string[]
}

export function PublicVolunteerPortal({ initialVolunteers, allowAdd, segments }: PublicVolunteerPortalProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers)
  const [libLoaded, setLibLoaded] = useState(false)
  
  // Registration Modal states
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formSegment, setFormSegment] = useState(segments[0] || 'Registration')
  const [formDepartment, setFormDepartment] = useState('')
  const [formStudentId, setFormStudentId] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formTShirt, setFormTShirt] = useState('L')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState<any | null>(null)

  const tableRef = useRef<HTMLTableElement | null>(null)
  const dataTableInstance = useRef<any>(null)

  // Load jQuery and DataTables CDN dynamically (same as admin tables)
  useEffect(() => {
    let isMounted = true

    const loadScripts = async () => {
      if (!(window as any).$) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://code.jquery.com/jquery-3.7.1.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load jQuery'))
          document.head.appendChild(script)
        })
      }

      if (!document.getElementById('datatables-css')) {
        const link = document.createElement('link')
        link.id = 'datatables-css'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css'
        document.head.appendChild(link)
      }

      const $ = (window as any).$
      if (!$.fn.dataTable) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load DataTables'))
          document.head.appendChild(script)
        })
      }

      if (isMounted) {
        setLibLoaded(true)
      }
    }

    loadScripts().catch(err => {
      console.error('Error loading DataTables CDN:', err)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize DataTables
  useEffect(() => {
    if (!libLoaded || !tableRef.current) return

    const $ = (window as any).$
    
    if (dataTableInstance.current) {
      dataTableInstance.current.destroy()
      dataTableInstance.current = null
    }

    const dt = $(tableRef.current).DataTable({
      destroy: true,
      pageLength: 25,
      lengthMenu: [10, 25, 50, 100],
      language: {
        search: "Search Volunteers:",
        lengthMenu: "Show _MENU_ entries"
      }
    })

    dataTableInstance.current = dt

    // Bind row click event to navigate to individual show page
    $(tableRef.current).off('click', 'tbody tr').on('click', 'tbody tr', (e: any) => {
      const uniqueId = $(e.currentTarget).data('id')
      if (uniqueId) {
        window.location.href = `/volunteer/${uniqueId}`
      }
    })
  }, [libLoaded, volunteers])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)
    
    if (!formName.trim() || !formNumber.trim()) {
      setRegError('Name and Phone Number are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail || null,
          number: formNumber,
          image_url: formImageUrl || null,
          segment: formSegment || null,
          department: formDepartment || null,
          student_id: formStudentId || null,
          year: formYear || null,
          t_shirt_size: formTShirt,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to register.')
      }

      setRegSuccess(payload.data)
      
      // Append the new volunteer locally to refresh the table
      setVolunteers(prev => [
        {
          unique_id: payload.data.unique_id,
          name: payload.data.name,
          department: payload.data.department,
          segment: payload.data.segment,
          year: payload.data.year,
        },
        ...prev
      ])

      // Reset form fields
      setFormName('')
      setFormEmail('')
      setFormNumber('')
      setFormImageUrl('')
      setFormSegment('')
      setFormDepartment('')
      setFormStudentId('')
      setFormYear('')
      setFormTShirt('L')
    } catch (err: any) {
      setRegError(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* CSS Styling for public DataTables integration */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dataTables_wrapper {
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #cbd5e1);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: var(--shadow-md, 0 10px 25px rgba(0,0,0,0.05));
          font-family: var(--font-body), sans-serif;
        }
        .dataTables_wrapper .dataTables_length,
        .dataTables_wrapper .dataTables_filter,
        .dataTables_wrapper .dataTables_info,
        .dataTables_wrapper .dataTables_paginate {
          color: var(--foreground-muted, #475569) !important;
          font-size: 0.85rem !important;
          margin-bottom: 1rem;
        }
        .dataTables_wrapper .dataTables_filter input {
          border: 1px solid var(--border, #cbd5e1);
          border-radius: 8px;
          padding: 0.4rem 0.75rem;
          margin-left: 0.5rem;
          outline: none;
          background: var(--surface-2, #f8fafc);
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button {
          border-radius: 8px !important;
          padding: 4px 10px !important;
          margin: 0 2px !important;
          border: 1px solid var(--border, #cbd5e1) !important;
          background: transparent !important;
          color: var(--foreground, #0f172a) !important;
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
          background: var(--color-primary, #6366f1) !important;
          color: #fff !important;
          border-color: var(--color-primary, #6366f1) !important;
        }
        .dataTables_wrapper .dataTables_paginate .paginate_button.current {
          background: var(--color-primary, #6366f1) !important;
          color: #white !important;
          border-color: var(--color-primary, #6366f1) !important;
          font-weight: bold;
        }
        table.dataTable {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1rem 0 !important;
        }
        table.dataTable thead th {
          border-bottom: 2px solid var(--border, #cbd5e1) !important;
          color: var(--foreground, #0f172a);
          font-family: var(--font-heading), sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 12px 10px !important;
          text-align: left;
        }
        table.dataTable tbody tr {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        table.dataTable tbody tr:hover {
          background-color: var(--surface-2, #f8fafc) !important;
        }
        table.dataTable tbody td {
          border-bottom: 1px solid var(--border, #cbd5e1) !important;
          padding: 12px 10px !important;
          font-size: 0.875rem;
          color: var(--foreground-muted, #334155);
        }
      ` }} />

      {/* Header Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
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
            marginBottom: '0.5rem',
          }}>
            Organizing team
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--foreground, #0f172a)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Festival Volunteers
          </h1>
        </div>

        {allowAdd && (
          <button
            onClick={() => {
              setRegSuccess(null)
              setRegError(null)
              setShowModal(true)
            }}
            style={{
              background: 'var(--color-primary, #6366f1)',
              color: '#white',
              border: 'none',
              borderRadius: 12,
              padding: '0.85rem 1.5rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            + Register as Volunteer
          </button>
        )}
      </div>

      {/* Datatable Loader & Table wrapper */}
      {libLoaded ? (
        <table ref={tableRef} className="display">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Segment</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map(vol => (
              <tr key={vol.unique_id} data-id={vol.unique_id}>
                <td style={{ fontWeight: 600, color: 'var(--foreground, #0f172a)' }}>{vol.name}</td>
                <td>{vol.department || '-'}</td>
                <td style={{ fontWeight: 500, color: 'var(--color-primary, #6366f1)' }}>{vol.segment || '-'}</td>
                <td>{vol.year || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground-muted, #64748b)' }}>
            Loading volunteer registry...
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}} />
        </div>
      )}

      {/* Registration Modal Overlay */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          boxSizing: 'border-box',
        }}>
          {/* Modal Container */}
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #cbd5e1)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative',
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground-muted, #64748b)',
                cursor: 'pointer',
                fontSize: '1.25rem',
              }}
            >
              ✕
            </button>

            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#10b981', margin: '0 0 0.5rem' }}>
                  Registration Successful!
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--foreground-muted, #64748b)', marginBottom: '1.5rem' }}>
                  Thank you for joining as a volunteer. Here are your credentials:
                </p>
                <div style={{
                  background: 'var(--surface-2, #f8fafc)',
                  border: '1px solid var(--border, #cbd5e1)',
                  borderRadius: 16,
                  padding: '1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <div><strong>Name:</strong> {regSuccess.name}</div>
                  <div><strong>Unique ID:</strong> <span style={{ color: 'var(--color-primary, #6366f1)', fontWeight: 'bold' }}>{regSuccess.unique_id}</span></div>
                  <div><strong>Serial No:</strong> {regSuccess.serial_no}</div>
                  <div><strong>Default Login Pass:</strong> <span style={{ color: '#ef4444' }}>12345678</span> (use your Email to login)</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <a
                    href={`/volunteer/${regSuccess.unique_id}`}
                    style={{
                      background: 'var(--color-primary, #6366f1)',
                      color: '#white',
                      textDecoration: 'none',
                      borderRadius: 10,
                      padding: '0.6rem 1.25rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      display: 'inline-block',
                    }}
                  >
                    View Profile Card
                  </a>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border, #cbd5e1)',
                      color: 'var(--foreground, #0f172a)',
                      borderRadius: 10,
                      padding: '0.6rem 1.25rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--foreground, #0f172a)' }}>
                  New Volunteer Registration
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--foreground-muted, #64748b)', marginBottom: '1.5rem' }}>
                  Please fill in your details to create your volunteer team membership. Unique ID and Serial No will be automatically generated.
                </p>

                {regError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 12,
                    padding: '0.75rem 1rem',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-body)',
                    marginBottom: '1rem',
                  }}>
                    {regError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Row 1: Name & Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="John Doe"
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Email Address</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="john@example.com"
                        style={modalInputStyle}
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Photo URL */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formNumber}
                        onChange={e => setFormNumber(e.target.value)}
                        placeholder="017XXXXXXXX"
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Photo URL</label>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        style={modalInputStyle}
                      />
                    </div>
                  </div>

                  {/* Row 3: Department & Segment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Department</label>
                      <input
                        type="text"
                        value={formDepartment}
                        onChange={e => setFormDepartment(e.target.value)}
                        placeholder="CSE, EEE, ME, etc."
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Event Segment</label>
                      <select
                        value={formSegment}
                        onChange={e => setFormSegment(e.target.value)}
                        style={modalSelectStyle}
                      >
                        {segments.map(seg => (
                          <option key={seg} value={seg}>{seg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Student ID, Year, T-Shirt */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Student ID</label>
                      <input
                        type="text"
                        value={formStudentId}
                        onChange={e => setFormStudentId(e.target.value)}
                        placeholder="1804001"
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>Academic Year</label>
                      <input
                        type="text"
                        value={formYear}
                        onChange={e => setFormYear(e.target.value)}
                        placeholder="4th, 3rd, etc."
                        style={modalInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground, #334155)', fontFamily: 'var(--font-body)' }}>T-Shirt Size</label>
                      <select
                        value={formTShirt}
                        onChange={e => setFormTShirt(e.target.value)}
                        style={modalSelectStyle}
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        background: 'var(--color-primary, #6366f1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        padding: '0.85rem 1rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border, #cbd5e1)',
                        color: 'var(--foreground, #334155)',
                        borderRadius: 12,
                        padding: '0.85rem 1.25rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const modalInputStyle = {
  background: 'var(--surface-2, #f8fafc)',
  border: '1px solid var(--border, #cbd5e1)',
  borderRadius: 10,
  padding: '0.65rem 0.85rem',
  color: 'var(--foreground, #0f172a)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

const modalSelectStyle = {
  background: 'var(--surface-2, #f8fafc)',
  border: '1px solid var(--border, #cbd5e1)',
  borderRadius: 10,
  padding: '0.65rem 0.85rem',
  color: 'var(--foreground, #0f172a)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}
