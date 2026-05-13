'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CampusAmbassador } from '@/types/database'
import { GlassCard } from './GlassCard'
import { RichTextField } from '@/components/shared/RichTextField'

interface CampusAmbassadorsSettingsFormProps {
  initialAmbassadors: CampusAmbassador[]
}

export function CampusAmbassadorsSettingsForm({ initialAmbassadors }: CampusAmbassadorsSettingsFormProps) {
  const router = useRouter()
  const [ambassadors, setAmbassadors] = useState<CampusAmbassador[]>(initialAmbassadors)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeAmbassadorIndex, setActiveAmbassadorIndex] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...ambassadors].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [ambassadors]
  )

  const updateAmbassador = (index: number, field: keyof CampusAmbassador, value: string | boolean | number | null) => {
    setAmbassadors(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= ambassadors.length) return
    const copy = [...ambassadors]
    const [moved] = copy.splice(index, 1)
    copy.splice(nextIndex, 0, moved)
    setAmbassadors(copy)
  }

  const handleUpload = async (file: File, index: number) => {
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setError(data?.error ?? 'Upload failed.')
      return
    }

    updateAmbassador(index, 'photo_url', data?.url ?? null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = ambassadors.map((item, index) => ({
      ...item,
      name: item.name?.trim() || null,
      role: item.role?.trim() || null,
      institution: item.institution?.trim() || null,
      department: item.department?.trim() || null,
      designation: item.designation?.trim() || null,
      bio: item.bio?.trim() || null,
      email: item.email?.trim() || null,
      phone: item.phone?.trim() || null,
      facebook_url: item.facebook_url?.trim() || null,
      linkedin_url: item.linkedin_url?.trim() || null,
      sort_order: index + 1,
      is_visible: item.is_visible !== false,
      is_disabled: item.is_disabled === true,
    }))

    const response = await fetch('/api/admin/campus-ambassadors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambassadors: payload }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save campus ambassadors.')
      return
    }

    setSuccess('Campus ambassadors saved.')
    router.refresh()
  }

  const saveNow = async (message: string, onSuccess?: () => void, nextAmbassadors?: CampusAmbassador[]) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const list = nextAmbassadors ?? ambassadors
    if (nextAmbassadors) setAmbassadors(nextAmbassadors)

    const payload = list.map((item, index) => ({
      ...item,
      name: item.name?.trim() || null,
      role: item.role?.trim() || null,
      institution: item.institution?.trim() || null,
      department: item.department?.trim() || null,
      designation: item.designation?.trim() || null,
      bio: item.bio?.trim() || null,
      email: item.email?.trim() || null,
      phone: item.phone?.trim() || null,
      facebook_url: item.facebook_url?.trim() || null,
      linkedin_url: item.linkedin_url?.trim() || null,
      sort_order: index + 1,
      is_visible: item.is_visible !== false,
      is_disabled: item.is_disabled === true,
    }))

    const response = await fetch('/api/admin/campus-ambassadors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambassadors: payload }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save campus ambassadors.')
      return
    }

    setSuccess(message)
    router.refresh()
    onSuccess?.()
  }

  const openAmbassadorEdit = (index: number) => {
    setActiveAmbassadorIndex(index)
  }

  const closeAmbassadorEdit = () => {
    setActiveAmbassadorIndex(null)
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={eyebrowStyle}>Admin · Campus Ambassadors</div>
        <h1 style={titleStyle}>Campus Ambassadors</h1>
        <p style={subtitleStyle}>Manage campus ambassador profiles and visibility.</p>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <GlassCard>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
          <button
            type="button"
            style={dashedButtonStyle}
            onClick={() => {
              setAmbassadors(prev => {
                const next = [...prev, {
                  id: crypto.randomUUID(),
                  name: '',
                  role: '',
                  institution: '',
                  department: '',
                  designation: '',
                  bio: '',
                  photo_url: null,
                  email: '',
                  phone: '',
                  facebook_url: '',
                  linkedin_url: '',
                  is_visible: true,
                  is_disabled: false,
                  sort_order: prev.length + 1,
                  created_at: '',
                  updated_at: '',
                }]
                setActiveAmbassadorIndex(next.length - 1)
                return next
              })
            }}
          >
            + Add Ambassador
          </button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {sorted.map((ambassador) => {
            const index = ambassadors.findIndex(item => item.id === ambassador.id)
            return (
              <div key={ambassador.id} style={listRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, border: '1px solid var(--admin-border)', overflow: 'hidden', background: 'rgba(15,23,42,0.25)', display: 'grid', placeItems: 'center' }}>
                    {ambassador.photo_url ? (
                      <img src={ambassador.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>Photo</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
                      {ambassador.name || 'Unnamed Ambassador'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', marginTop: 2 }}>
                      {ambassador.institution || 'No institution'} · {ambassador.is_visible ? 'Visible' : 'Hidden'}
                      {ambassador.is_disabled ? ' · Disabled' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" style={ghostButtonStyle} onClick={() => openAmbassadorEdit(index)}>Edit</button>
                  <button type="button" style={ghostButtonStyle} onClick={() => moveItem(index, -1)}>↑</button>
                  <button type="button" style={ghostButtonStyle} onClick={() => moveItem(index, 1)}>↓</button>
                  <button
                    type="button"
                    style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                    onClick={() => {
                      const next = ambassadors.filter((_, idx) => idx !== index)
                      saveNow('Ambassador deleted.', undefined, next)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button type="button" style={primaryButtonStyle} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Order'}
        </button>
      </div>

      {activeAmbassadorIndex !== null && ambassadors[activeAmbassadorIndex] && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalEyebrowStyle}>Ambassador Editor</div>
                <div style={modalTitleStyle}>{ambassadors[activeAmbassadorIndex].name || 'Campus Ambassador'}</div>
              </div>
              <button type="button" style={ghostButtonStyle} onClick={closeAmbassadorEdit}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <LabeledInput label="Name" value={ambassadors[activeAmbassadorIndex].name ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'name', value)} />
                <LabeledInput label="Role" value={ambassadors[activeAmbassadorIndex].role ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'role', value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <LabeledInput label="Institution" value={ambassadors[activeAmbassadorIndex].institution ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'institution', value)} />
                <LabeledInput label="Department" value={ambassadors[activeAmbassadorIndex].department ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'department', value)} />
                <LabeledInput label="Designation" value={ambassadors[activeAmbassadorIndex].designation ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'designation', value)} />
              </div>
              <LabeledTextArea label="Bio" value={ambassadors[activeAmbassadorIndex].bio ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'bio', value)} rows={3} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <LabeledInput label="Email" value={ambassadors[activeAmbassadorIndex].email ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'email', value)} />
                <LabeledInput label="Phone" value={ambassadors[activeAmbassadorIndex].phone ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'phone', value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <LabeledInput label="Facebook URL" value={ambassadors[activeAmbassadorIndex].facebook_url ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'facebook_url', value)} />
                <LabeledInput label="LinkedIn URL" value={ambassadors[activeAmbassadorIndex].linkedin_url ?? ''} onChange={value => updateAmbassador(activeAmbassadorIndex, 'linkedin_url', value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={ambassadors[activeAmbassadorIndex].is_visible}
                    onChange={event => updateAmbassador(activeAmbassadorIndex, 'is_visible', event.target.checked)}
                  />
                  Visible
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={ambassadors[activeAmbassadorIndex].is_disabled}
                    onChange={event => updateAmbassador(activeAmbassadorIndex, 'is_disabled', event.target.checked)}
                  />
                  Disabled
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) handleUpload(file, activeAmbassadorIndex)
                  }}
                />
                {ambassadors[activeAmbassadorIndex].photo_url && (
                  <img src={ambassadors[activeAmbassadorIndex].photo_url ?? ''} alt="Avatar" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() => saveNow('Ambassador saved.', closeAmbassadorEdit)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Ambassador'}
                </button>
                <button
                  type="button"
                  style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                  onClick={() => {
                    const next = ambassadors.filter((_, idx) => idx !== activeAmbassadorIndex)
                    saveNow('Ambassador deleted.', closeAmbassadorEdit, next)
                  }}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} style={inputStyle} />
    </label>
  )
}

function LabeledTextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      minHeight={Math.max(100, rows * 28)}
    />
  )
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--admin-accent)',
  marginBottom: '0.4rem',
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--admin-fg-muted)',
  marginTop: '0.35rem',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.5rem 0.65rem',
  background: 'rgba(15,23,42,0.25)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
}

const listRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  padding: '0.7rem',
  border: '1px solid var(--admin-border)',
  borderRadius: 16,
  background: 'var(--admin-surface-blur)',
}

const checkboxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  fontSize: '0.8rem',
  color: 'var(--admin-fg)',
}

const ghostButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--admin-border)',
  borderRadius: 12,
  padding: '0.35rem 0.75rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--admin-fg)',
}

const dashedButtonStyle: CSSProperties = {
  border: '1px dashed var(--admin-border)',
  borderRadius: 14,
  padding: '0.45rem 0.9rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--admin-fg)',
  cursor: 'pointer',
}

const primaryButtonStyle: CSSProperties = {
  background: 'var(--admin-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '0.55rem 1.2rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  boxShadow: '0 12px 28px rgba(3,7,18,0.25)',
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6,8,16,0.6)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  zIndex: 200,
}

const modalCardStyle: CSSProperties = {
  width: 'min(920px, 100%)',
  maxHeight: '85vh',
  overflowY: 'auto',
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 20,
  padding: '1.25rem',
  boxShadow: '0 24px 60px rgba(3,7,18,0.35)',
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const modalEyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--admin-accent)',
}

const modalTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.4rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
}

const errorStyle: CSSProperties = {
  marginBottom: '1rem',
  color: '#f87171',
  fontSize: '0.85rem',
}

const successStyle: CSSProperties = {
  marginBottom: '1rem',
  color: '#34d399',
  fontSize: '0.85rem',
}
