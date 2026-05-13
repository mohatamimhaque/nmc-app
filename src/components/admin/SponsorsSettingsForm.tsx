'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Sponsor, SponsorCategory } from '@/types/database'
import { GlassCard } from './GlassCard'

interface SponsorsSettingsFormProps {
  initialCategories: SponsorCategory[]
  initialSponsors: Sponsor[]
}

export function SponsorsSettingsForm({
  initialCategories,
  initialSponsors,
}: SponsorsSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState<SponsorCategory[]>(initialCategories)
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors)
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null)
  const [dragSponsorId, setDragSponsorId] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () => categories.map(category => ({
      id: category.id,
      name: category.name,
    })),
    [categories]
  )

  const updateCategory = (index: number, field: keyof SponsorCategory, value: string | boolean | number) => {
    setCategories(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const updateSponsor = (index: number, field: keyof Sponsor, value: string | boolean | number | null) => {
    setSponsors(prev => prev.map((item, idx) => (
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

    const data = await response.json()
    if (!response.ok) {
      setError(data?.error ?? 'Upload failed.')
      return
    }

    updateSponsor(index, 'logo_url', data.url)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    if (sponsors.some(sponsor => !sponsor.category_id)) {
      setSaving(false)
      setError('Every sponsor must have a category.')
      return
    }

    const response = await fetch('/api/admin/sponsors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories,
        sponsors,
      }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save sponsor settings.')
      return
    }

    setSuccess('Sponsor settings saved.')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
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
          Admin · Sponsors
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
          Sponsors & Partners
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Manage sponsor categories, logos, and visibility.
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
          <SectionTitle title="Categories" subtitle="Sponsor tiers and ordering." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {categories.map((category, index) => (
              <div
                key={category.id}
                style={{
                  ...listRowStyle,
                  opacity: dragCategoryId === category.id ? 0.6 : 1,
                  cursor: 'grab',
                }}
                draggable
                onDragStart={() => setDragCategoryId(category.id)}
                onDragEnd={() => setDragCategoryId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragCategoryId) return
                  setCategories(prev => reorderById(prev, dragCategoryId, category.id))
                  setDragCategoryId(null)
                }}
              >
                <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                  <CheckboxField
                    label="Visible"
                    checked={category.is_visible}
                    onChange={checked => updateCategory(index, 'is_visible', checked)}
                  />
                  <LabeledInput
                    label="Category name"
                    value={category.name}
                    onChange={value => updateCategory(index, 'name', value)}
                  />
                </div>
                <div style={buttonColumnStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => setCategories(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setCategories(prev => moveItem(prev, index, 1))}>↓</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => setCategories(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCategories(prev => ([
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: 'New Category',
                  sort_order: prev.length + 1,
                  is_visible: true,
                },
              ]))}
              style={addButtonStyle}
            >
              Add Category
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Sponsors" subtitle="Add sponsors and media partners." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {sponsors.map((sponsor, index) => (
              <div
                key={sponsor.id}
                style={{
                  ...listRowStyle,
                  opacity: dragSponsorId === sponsor.id ? 0.6 : 1,
                  cursor: 'grab',
                }}
                draggable
                onDragStart={() => setDragSponsorId(sponsor.id)}
                onDragEnd={() => setDragSponsorId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragSponsorId) return
                  setSponsors(prev => reorderById(prev, dragSponsorId, sponsor.id))
                  setDragSponsorId(null)
                }}
              >
                <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                  <CheckboxField
                    label="Visible"
                    checked={sponsor.is_visible}
                    onChange={checked => updateSponsor(index, 'is_visible', checked)}
                  />
                  <LabeledInput
                    label="Sponsor name"
                    value={sponsor.name}
                    onChange={value => updateSponsor(index, 'name', value)}
                  />
                  <SelectField
                    label="Category"
                    value={sponsor.category_id}
                    options={categoryOptions}
                    onChange={value => updateSponsor(index, 'category_id', value)}
                  />
                  <SelectField
                    label="Display mode"
                    value={sponsor.display_mode}
                    options={[
                      { id: 'logo', name: 'Logo only' },
                      { id: 'name', name: 'Name only' },
                      { id: 'both', name: 'Logo + Name' },
                    ]}
                    onChange={value => updateSponsor(index, 'display_mode', value as Sponsor['display_mode'])}
                  />
                  <SelectField
                    label="Logo size"
                    value={sponsor.logo_size}
                    options={[
                      { id: 'small', name: 'Small' },
                      { id: 'medium', name: 'Medium' },
                      { id: 'large', name: 'Large' },
                    ]}
                    onChange={value => updateSponsor(index, 'logo_size', value as Sponsor['logo_size'])}
                  />
                  <LabeledInput
                    label="Website URL"
                    value={sponsor.website_url ?? ''}
                    onChange={value => updateSponsor(index, 'website_url', value || null)}
                  />
                  <LabeledInput
                    label="Logo URL"
                    value={sponsor.logo_url ?? ''}
                    onChange={value => updateSponsor(index, 'logo_url', value || null)}
                  />
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span style={labelStyle}>Upload logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) handleUpload(file, index)
                      }}
                    />
                  </label>
                </div>
                <div style={buttonColumnStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => setSponsors(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setSponsors(prev => moveItem(prev, index, 1))}>↓</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => setSponsors(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSponsors(prev => ([
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: 'New Sponsor',
                  logo_url: null,
                  website_url: null,
                  category_id: categoryOptions[0]?.id ?? '',
                  display_mode: 'logo',
                  logo_size: 'medium',
                  is_visible: true,
                  sort_order: prev.length + 1,
                },
              ]))}
              style={addButtonStyle}
            >
              Add Sponsor
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
            borderRadius: 12,
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
          {saving ? 'Saving...' : 'Save Sponsors'}
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; name: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
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
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span style={labelStyle}>{label}</span>
    </label>
  )
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
  borderRadius: 12,
  border: '1px solid var(--admin-border)',
  padding: '0.5rem 0.65rem',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  outline: 'none',
}

const listRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '0.75rem',
  borderRadius: 16,
  border: '1px solid var(--admin-border)',
  background: 'var(--admin-surface-blur)',
}

const buttonColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const smallButtonStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const dangerButtonStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(248,113,113,0.4)',
  background: 'rgba(248,113,113,0.12)',
  color: '#f87171',
  fontSize: '0.65rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const addButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px dashed var(--admin-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.45rem 0.7rem',
  cursor: 'pointer',
}
