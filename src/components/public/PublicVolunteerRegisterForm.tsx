'use client'

import { useState } from 'react'

interface PublicVolunteerRegisterFormProps {
  segments: string[]
}

export function PublicVolunteerRegisterForm({ segments }: PublicVolunteerRegisterFormProps) {
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
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessData(null)

    if (!formName.trim() || !formNumber.trim()) {
      setError('Name and Phone Number are required.')
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
        throw new Error(payload.error || 'Failed to complete registration.')
      }

      setSuccessData(payload.data)
      
      // Reset form
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
      setError(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successData) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 24,
          padding: '3rem 2rem',
          boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.06))',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: '0 0 0.5rem' }}>
            Registration Successful!
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--foreground-muted, #64748b)', marginBottom: '2rem' }}>
            Your volunteer record has been registered. Please save your credentials:
          </p>

          <div style={{
            background: 'var(--surface-2, #f8fafc)',
            border: '1px solid var(--border, #cbd5e1)',
            borderRadius: 16,
            padding: '1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '2rem',
          }}>
            <div><strong>Name:</strong> {successData.name}</div>
            <div><strong>Unique ID:</strong> <span style={{ color: 'var(--color-primary, #6366f1)', fontWeight: 'bold' }}>{successData.unique_id}</span></div>
            <div><strong>Serial No:</strong> {successData.serial_no}</div>
            <div><strong>Default Password:</strong> <span style={{ color: '#ef4444' }}>12345678</span> (use your Email to login)</div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a
              href={`/volunteer/${successData.unique_id}`}
              style={{
                background: 'var(--color-primary, #6366f1)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 12,
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              View Profile Card
            </a>
            <a
              href="/volunteer"
              style={{
                background: 'transparent',
                border: '1px solid var(--border, #cbd5e1)',
                color: 'var(--foreground, #0f172a)',
                textDecoration: 'none',
                borderRadius: 12,
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Go to Portal
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface, #ffffff)',
        border: '1px solid var(--border, #cbd5e1)',
        borderRadius: 24,
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.06))',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
            Self Registration
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--foreground, #0f172a)' }}>
            Join the Organizing Team
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--foreground-muted, #64748b)', marginTop: '0.35rem' }}>
            Provide your details below to request volunteer team association.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            color: '#ef4444',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-body)',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Row 1: Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="e.g. john@domain.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2: Phone & Photo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formNumber}
                  onChange={e => setFormNumber(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Photo / Avatar URL</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  placeholder="https://domain.com/avatar.jpg"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 3: Department & Segment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Department</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={e => setFormDepartment(e.target.value)}
                  placeholder="e.g. CSE, ME, EEE, etc."
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Carnival Segment</label>
                <select
                  value={formSegment}
                  onChange={e => setFormSegment(e.target.value)}
                  style={selectStyle}
                >
                  {segments.map(seg => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Student ID, Academic Year & T-Shirt Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Student ID</label>
                <input
                  type="text"
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  placeholder="e.g. 1904002"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Academic Year</label>
                <input
                  type="text"
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  placeholder="e.g. 3rd Year"
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>T-Shirt Size</label>
                <select
                  value={formTShirt}
                  onChange={e => setFormTShirt(e.target.value)}
                  style={selectStyle}
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
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
                marginTop: '1rem',
              }}
            >
              {isSubmitting ? 'Submitting Details...' : 'Submit Registration Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.25rem',
}

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--foreground, #334155)',
  fontFamily: 'var(--font-body)',
}

const inputStyle = {
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

const selectStyle = {
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
