'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { NavLink } from '@/types/database'
import { GlassCard } from './GlassCard'

interface NavLinksSettingsFormProps {
  initialLinks: NavLink[]
}

export function NavLinksSettingsForm({ initialLinks }: NavLinksSettingsFormProps) {
  const router = useRouter()
  const [links, setLinks] = useState<NavLink[]>(initialLinks)
  const [dragId, setDragId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const sortedLinks = useMemo(() => {
    return [...links]
  }, [links])

  const updateLink = (index: number, field: keyof NavLink, value: string | boolean | number) => {
    setLinks(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const moveItem = (items: NavLink[], dragItemId: string, targetItemId: string) => {
    if (dragItemId === targetItemId) return items
    const fromIndex = items.findIndex(item => item.id === dragItemId)
    const toIndex = items.findIndex(item => item.id === targetItemId)
    if (fromIndex < 0 || toIndex < 0) return items
    const copy = [...items]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    return copy
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = links.map((link, index) => ({
      ...link,
      label: link.label?.trim() || 'Link',
      url: link.url?.trim() || '/',
      sort_order: index + 1,
      is_visible: link.is_visible !== false,
      is_external: link.is_external === true,
      is_cta: link.is_cta === true,
    }))

    const response = await fetch('/api/admin/nav-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links: payload }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save navigation links.')
      return
    }

    setSuccess('Navigation links saved.')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <style>{`
        .nav-link-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: stretch;
        }
        .nav-drag {
          width: 36px;
          min-width: 36px;
          border-radius: 12px;
          border: 1px solid var(--admin-border);
          background: rgba(148,163,184,0.12);
          display: grid;
          place-items: center;
          color: var(--admin-fg-muted);
          cursor: grab;
        }
        .nav-pill {
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid var(--admin-border);
          background: rgba(148,163,184,0.08);
          color: var(--admin-fg-muted);
        }
        .nav-pill.active {
          border-color: var(--admin-accent);
          color: var(--admin-fg);
          background: rgba(79,70,229,0.15);
        }
      `}</style>
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
          Admin · Navigation
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
          Navbar Links
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Control visibility, slugs, and ordering for the public navbar.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '1rem', color: '#34d399', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <GlassCard>
          <SectionTitle title="Navbar Links" subtitle="Drag to reorder. Edit label or URL to change slugs." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sortedLinks.map((link, index) => (
              <div
                key={link.id}
                style={{
                  ...listRowStyle,
                  opacity: dragId === link.id ? 0.6 : 1,
                  cursor: 'grab',
                }}
                draggable
                onDragStart={() => setDragId(link.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragId) return
                  setLinks(prev => moveItem(prev, dragId, link.id))
                  setDragId(null)
                }}
              >
                <div className="nav-link-row">
                  <div className="nav-drag" aria-label="Drag to reorder">::</div>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span className={`nav-pill ${link.is_visible ? 'active' : ''}`}>Visible</span>
                      <span className={`nav-pill ${link.is_cta ? 'active' : ''}`}>CTA</span>
                      <span className={`nav-pill ${link.is_external ? 'active' : ''}`}>External</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
                        Preview: {link.label || 'Link'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      <LabeledInput
                        label="Label"
                        value={link.label}
                        onChange={value => updateLink(index, 'label', value)}
                      />
                      <LabeledInput
                        label="URL / slug"
                        value={link.url}
                        onChange={value => updateLink(index, 'url', value)}
                        placeholder="/advisers"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <CheckboxField
                        label="Visible"
                        checked={link.is_visible}
                        onChange={checked => updateLink(index, 'is_visible', checked)}
                      />
                      <CheckboxField
                        label="CTA button"
                        checked={link.is_cta}
                        onChange={checked => updateLink(index, 'is_cta', checked)}
                      />
                      <CheckboxField
                        label="External link"
                        checked={link.is_external}
                        onChange={checked => updateLink(index, 'is_external', checked)}
                      />
                    </div>
                  </div>
                  <div style={buttonColumnStyle}>
                    <button type="button" style={dangerButtonStyle} onClick={() => setLinks(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinks(prev => ([
                ...prev,
                {
                  id: crypto.randomUUID(),
                  label: 'New Link',
                  url: '/',
                  is_visible: true,
                  is_external: false,
                  is_cta: false,
                  sort_order: prev.length + 1,
                },
              ]))}
              style={addButtonStyle}
            >
              Add Link
            </button>
          </div>
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--admin-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '0.75rem 1.6rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px var(--admin-accent-glow)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Navigation'}
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--admin-accent)',
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>{subtitle}</div>
      )}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.5rem' }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        style={{ width: 16, height: 16 }}
      />
      <span style={labelStyle}>{label}</span>
    </label>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(15,23,42,0.25)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
}

const listRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
  border: '1px solid var(--admin-border)',
  borderRadius: 12,
  padding: '1rem',
  background: 'var(--admin-surface-blur)',
}

const buttonColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const dangerButtonStyle: React.CSSProperties = {
  background: 'rgba(248,113,113,0.15)',
  border: '1px solid rgba(248,113,113,0.4)',
  color: '#f87171',
  padding: '0.3rem 0.75rem',
  borderRadius: 999,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const addButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px dashed var(--admin-border)',
  color: 'var(--admin-fg)',
  borderRadius: 999,
  padding: '0.6rem 1.2rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}
