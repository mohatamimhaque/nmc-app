'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClubPartner } from '@/types/database'
import { GlassCard } from './GlassCard'

interface ClubPartnersSettingsFormProps {
  initialPartners: ClubPartner[]
}

export function ClubPartnersSettingsForm({
  initialPartners,
}: ClubPartnersSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [partners, setPartners] = useState<ClubPartner[]>(initialPartners)
  const [dragPartnerId, setDragPartnerId] = useState<string | null>(null)
  const [activePartnerIndex, setActivePartnerIndex] = useState<number | null>(null)

  const updatePartner = (index: number, field: keyof ClubPartner, value: string | boolean | number | null) => {
    setPartners(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return items
    const copy = [...items]
    const [moved] = copy.splice(index, 1)
    copy.splice(nextIndex, 0, moved)
    return copy
  }

  const reorderById = <T extends { id: string }>(items: T[], dragId: string, targetId: string) => {
    if (dragId === targetId) return items
    const fromIndex = items.findIndex(item => item.id === dragId)
    const toIndex = items.findIndex(item => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return items
    const copy = [...items]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    return copy
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

    updatePartner(index, 'logo_url', data?.url ?? null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/admin/club-partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partners }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save club partners.')
      return
    }

    setSuccess('Club partners saved.')
    router.refresh()
  }

  const saveNow = async (message: string, onSuccess?: () => void, nextPartners?: ClubPartner[]) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = nextPartners ?? partners
    if (nextPartners) setPartners(nextPartners)

    const response = await fetch('/api/admin/club-partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partners: payload }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save club partners.')
      return
    }

    setSuccess(message)
    router.refresh()
    onSuccess?.()
  }

  const openPartnerEdit = (index: number) => {
    setActivePartnerIndex(index)
  }

  const closePartnerEdit = () => {
    setActivePartnerIndex(null)
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={eyebrowStyle}>Admin · Club Partners</div>
        <h1 style={titleStyle}>Club Partners</h1>
        <p style={subtitleStyle}>Manage club partner logos and links.</p>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <GlassCard>
          <SectionTitle title="Partners" subtitle="Edit each partner in a focused modal." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
            <button
              type="button"
              style={dashedButtonStyle}
              onClick={() => {
                setPartners(prev => {
                  const next = [...prev, {
                    id: crypto.randomUUID(),
                    name: 'New Partner',
                    logo_url: null,
                    website_url: null,
                    category_id: null,
                    display_mode: 'both',
                    logo_size: 'medium',
                    is_visible: true,
                    sort_order: prev.length + 1,
                  }]
                  setActivePartnerIndex(next.length - 1)
                  return next
                })
              }}
            >
              + Add Partner
            </button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {partners.map((partner, index) => (
              <div
                key={partner.id}
                style={{ ...listRowStyle, opacity: dragPartnerId === partner.id ? 0.6 : 1, cursor: 'grab' }}
                draggable
                onDragStart={() => setDragPartnerId(partner.id)}
                onDragEnd={() => setDragPartnerId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragPartnerId) return
                  setPartners(prev => reorderById(prev, dragPartnerId, partner.id))
                  setDragPartnerId(null)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid var(--admin-border)', display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,0.25)' }}>
                    {partner.logo_url ? (
                      <img src={partner.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>Logo</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
                      {partner.name || 'Untitled Partner'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', marginTop: 2 }}>
                      {partner.website_url ? partner.website_url : 'No website'} · {partner.is_visible ? 'Visible' : 'Hidden'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" style={ghostButtonStyle} onClick={() => openPartnerEdit(index)}>Edit</button>
                  <button type="button" style={ghostButtonStyle} onClick={() => setPartners(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={ghostButtonStyle} onClick={() => setPartners(prev => moveItem(prev, index, 1))}>↓</button>
                  <button
                    type="button"
                    style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                    onClick={() => {
                      const next = partners.filter((_, idx) => idx !== index)
                      saveNow('Partner deleted.', undefined, next)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button type="button" style={primaryButtonStyle} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Order'}
        </button>
      </div>

      {activePartnerIndex !== null && partners[activePartnerIndex] && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalEyebrowStyle}>Partner Editor</div>
                <div style={modalTitleStyle}>{partners[activePartnerIndex].name || 'Untitled Partner'}</div>
              </div>
              <button type="button" style={ghostButtonStyle} onClick={closePartnerEdit}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                <LabeledInput
                  label="Partner name"
                  value={partners[activePartnerIndex].name}
                  onChange={value => updatePartner(activePartnerIndex, 'name', value)}
                />
                <LabeledInput
                  label="Website URL"
                  value={partners[activePartnerIndex].website_url ?? ''}
                  onChange={value => updatePartner(activePartnerIndex, 'website_url', value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={labelStyle}>Display Mode</span>
                  <select
                    value={partners[activePartnerIndex].display_mode}
                    onChange={event => updatePartner(activePartnerIndex, 'display_mode', event.target.value)}
                    style={inputStyle}
                  >
                    <option value="logo">Logo</option>
                    <option value="name">Name</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span style={labelStyle}>Logo Size</span>
                  <select
                    value={partners[activePartnerIndex].logo_size}
                    onChange={event => updatePartner(activePartnerIndex, 'logo_size', event.target.value)}
                    style={inputStyle}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <CheckboxField
                  label="Visible"
                  checked={partners[activePartnerIndex].is_visible}
                  onChange={checked => updatePartner(activePartnerIndex, 'is_visible', checked)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) handleUpload(file, activePartnerIndex)
                  }}
                />
                {partners[activePartnerIndex].logo_url && (
                  <img src={partners[activePartnerIndex].logo_url ?? ''} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() => saveNow('Partner saved.', closePartnerEdit)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Partner'}
                </button>
                <button
                  type="button"
                  style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                  onClick={() => {
                    const next = partners.filter((_, idx) => idx !== activePartnerIndex)
                    saveNow('Partner deleted.', closePartnerEdit, next)
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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--admin-fg)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--admin-fg-muted)' }}>{subtitle}</div>
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

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={checkboxStyle}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      {label}
    </label>
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
  alignItems: 'flex-start',
  padding: '0.6rem',
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
  width: 'min(820px, 100%)',
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
