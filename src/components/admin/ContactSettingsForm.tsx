'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContactPage, ContactPerson, PageSection } from '@/types/database'
import { GlassCard } from './GlassCard'
import { RichTextField } from '@/components/shared/RichTextField'

interface ContactSettingsFormProps {
  initialPage: ContactPage
  initialPersons: ContactPerson[]
  initialSections: PageSection[]
}

export function ContactSettingsForm({
  initialPage,
  initialPersons,
  initialSections,
}: ContactSettingsFormProps) {
  const router = useRouter()
  const [page, setPage] = useState<ContactPage>(initialPage)
  const [persons, setPersons] = useState<ContactPerson[]>(initialPersons)
  const [sections, setSections] = useState<PageSection[]>(initialSections)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateField = <K extends keyof ContactPage>(key: K, value: ContactPage[K]) => {
    setPage(prev => ({ ...prev, [key]: value }))
  }

  const updatePerson = (index: number, field: keyof ContactPerson, value: string | boolean) => {
    setPersons(prev => prev.map((item, idx) => (
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

    updatePerson(index, 'photo_url', data.url)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/admin/contact-page', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        persons,
        sections,
      }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save contact page settings.')
      return
    }

    setSuccess('Contact page settings saved.')
    setPage(data.data)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 1100, marginBottom: '2rem' }}>
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
          Admin · Contact Page
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
          Contact Page Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Manage the public Contact page content and contact persons.
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <GlassCard accent>
          <SectionTitle title="Hero" subtitle="Contact page heading." />
          <LabeledInput
            label="Hero title"
            value={page.hero_title}
            onChange={value => updateField('hero_title', value)}
          />
          <TextAreaField
            label="Hero subtitle"
            value={page.hero_subtitle}
            onChange={value => updateField('hero_subtitle', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Form" subtitle="Form heading and recipient email." />
          <LabeledInput
            label="Form title"
            value={page.form_title}
            onChange={value => updateField('form_title', value)}
          />
          <TextAreaField
            label="Form subtitle"
            value={page.form_subtitle}
            onChange={value => updateField('form_subtitle', value)}
          />
          <LabeledInput
            label="Recipient email"
            value={page.recipient_email ?? ''}
            onChange={value => updateField('recipient_email', value || null)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Location" subtitle="Address and map embed." />
          <LabeledInput
            label="Location title"
            value={page.location_title}
            onChange={value => updateField('location_title', value)}
          />
          <TextAreaField
            label="Location body"
            value={page.location_body}
            onChange={value => updateField('location_body', value)}
          />
          <LabeledInput
            label="Map embed URL"
            value={page.map_embed_url ?? ''}
            onChange={value => updateField('map_embed_url', value || null)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Social" subtitle="Social strip heading." />
          <LabeledInput
            label="Social title"
            value={page.social_title}
            onChange={value => updateField('social_title', value)}
          />
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        <GlassCard>
          <SectionTitle title="Section Visibility" subtitle="Toggle Contact page sections." />
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sections.map((section, index) => (
              <div key={section.section_key} style={listRowStyle}>
                <div style={{ flex: 1 }}>
                  <CheckboxField
                    label={section.label}
                    checked={section.is_visible}
                    onChange={checked => setSections(prev => prev.map((item, idx) => (
                      idx === index ? { ...item, is_visible: checked } : item
                    )))}
                  />
                </div>
                <div style={buttonColumnStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => setSections(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setSections(prev => moveItem(prev, index, 1))}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Contact Persons" subtitle="Add team members shown on the page." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {persons.map((person, index) => (
              <div key={`${person.id}-${index}`} style={listRowStyle}>
                <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                  <CheckboxField
                    label="Visible"
                    checked={person.is_visible}
                    onChange={checked => updatePerson(index, 'is_visible', checked)}
                  />
                  <LabeledInput
                    label="Name"
                    value={person.name}
                    onChange={value => updatePerson(index, 'name', value)}
                  />
                  <LabeledInput
                    label="Designation"
                    value={person.designation ?? ''}
                    onChange={value => updatePerson(index, 'designation', value || null)}
                  />
                  <LabeledInput
                    label="Email"
                    value={person.email ?? ''}
                    onChange={value => updatePerson(index, 'email', value || null)}
                  />
                  <CheckboxField
                    label="Show email"
                    checked={person.show_email}
                    onChange={checked => updatePerson(index, 'show_email', checked)}
                  />
                  <LabeledInput
                    label="Phone"
                    value={person.phone ?? ''}
                    onChange={value => updatePerson(index, 'phone', value || null)}
                  />
                  <CheckboxField
                    label="Show phone"
                    checked={person.show_phone}
                    onChange={checked => updatePerson(index, 'show_phone', checked)}
                  />
                  <LabeledInput
                    label="Photo URL"
                    value={person.photo_url ?? ''}
                    onChange={value => updatePerson(index, 'photo_url', value || null)}
                  />
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span style={labelStyle}>Upload photo</span>
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
                  <button type="button" style={smallButtonStyle} onClick={() => setPersons(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setPersons(prev => moveItem(prev, index, 1))}>↓</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => setPersons(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPersons(prev => ([
                ...prev,
                {
                  id: `new-${Date.now()}`,
                  name: '',
                  designation: null,
                  phone: null,
                  email: null,
                  photo_url: null,
                  show_phone: true,
                  show_email: true,
                  is_visible: true,
                  sort_order: prev.length + 1,
                },
              ]))}
              style={addButtonStyle}
            >
              Add Contact Person
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
          {saving ? 'Saving...' : 'Save Contact Page'}
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

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      minHeight={120}
    />
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

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: React.CSSProperties = {
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

const listRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '0.75rem',
  borderRadius: 16,
  border: '1px solid var(--admin-border)',
  background: 'var(--admin-surface-blur)',
}

const buttonColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const smallButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const dangerButtonStyle: React.CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(248,113,113,0.4)',
  background: 'rgba(248,113,113,0.12)',
  color: '#f87171',
  fontSize: '0.65rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const addButtonStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px dashed var(--admin-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.45rem 0.7rem',
  cursor: 'pointer',
}
