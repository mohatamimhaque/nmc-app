'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AboutHighlight, AboutMilestone, AboutPage, PageSection } from '@/types/database'
import { GlassCard } from './GlassCard'
import { RichTextField } from '@/components/shared/RichTextField'

interface AboutSettingsFormProps {
  initialPage: AboutPage
  initialMilestones: AboutMilestone[]
  initialHighlights: AboutHighlight[]
  initialSections: PageSection[]
}

export function AboutSettingsForm({
  initialPage,
  initialMilestones,
  initialHighlights,
  initialSections,
}: AboutSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState<AboutPage>(initialPage)
  const [milestones, setMilestones] = useState<AboutMilestone[]>(initialMilestones)
  const [highlights, setHighlights] = useState<AboutHighlight[]>(initialHighlights)
  const [sections, setSections] = useState<PageSection[]>(initialSections)

  const updateField = <K extends keyof AboutPage>(key: K, value: AboutPage[K]) => {
    setPage(prev => ({ ...prev, [key]: value }))
  }

  const updateMilestone = (index: number, field: keyof AboutMilestone, value: string | boolean) => {
    setMilestones(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const updateHighlight = (index: number, field: keyof AboutHighlight, value: string | boolean) => {
    setHighlights(prev => prev.map((item, idx) => (
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

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/admin/about-page', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        milestones,
        highlights,
        sections,
      }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save about page settings.')
      return
    }

    setSuccess('About page settings saved.')
    setPage(data.data)
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
          Admin · About Page
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
          About Page Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Manage the public About page content, milestones, and highlights.
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
          <SectionTitle title="Hero" subtitle="Main About page heading." />
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
          <SectionTitle title="Overview" subtitle="Organisation overview content." />
          <LabeledInput
            label="Overview section title"
            value={page.overview_section_title}
            onChange={value => updateField('overview_section_title', value)}
          />
          <TextAreaField
            label="Overview section subtitle"
            value={page.overview_section_subtitle}
            onChange={value => updateField('overview_section_subtitle', value)}
          />
          <LabeledInput
            label="Overview title"
            value={page.overview_title}
            onChange={value => updateField('overview_title', value)}
          />
          <TextAreaField
            label="Overview body"
            value={page.overview_body}
            onChange={value => updateField('overview_body', value)}
          />
          <LabeledInput
            label="NMC card title"
            value={page.nmc_title}
            onChange={value => updateField('nmc_title', value)}
          />
          <LabeledInput
            label="NMC eyebrow label"
            value={page.nmc_eyebrow}
            onChange={value => updateField('nmc_eyebrow', value)}
          />
          <TextAreaField
            label="NMC card body"
            value={page.nmc_body}
            onChange={value => updateField('nmc_body', value)}
          />
          <LabeledInput
            label="NMC CTA label"
            value={page.nmc_cta_label}
            onChange={value => updateField('nmc_cta_label', value)}
          />
          <LabeledInput
            label="NMC CTA URL"
            value={page.nmc_cta_url}
            onChange={value => updateField('nmc_cta_url', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Mission & Vision" subtitle="Purpose statements." />
          <LabeledInput
            label="Mission section title"
            value={page.mission_section_title}
            onChange={value => updateField('mission_section_title', value)}
          />
          <LabeledInput
            label="Mission title"
            value={page.mission_title}
            onChange={value => updateField('mission_title', value)}
          />
          <TextAreaField
            label="Mission body"
            value={page.mission_body}
            onChange={value => updateField('mission_body', value)}
          />
          <LabeledInput
            label="Vision title"
            value={page.vision_title}
            onChange={value => updateField('vision_title', value)}
          />
          <TextAreaField
            label="Vision body"
            value={page.vision_body}
            onChange={value => updateField('vision_body', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Team Strip" subtitle="Committee preview section." />
          <LabeledInput
            label="Team section title"
            value={page.team_title}
            onChange={value => updateField('team_title', value)}
          />
          <TextAreaField
            label="Team section subtitle"
            value={page.team_subtitle}
            onChange={value => updateField('team_subtitle', value)}
          />
          <LabeledInput
            label="Committee CTA label"
            value={page.committee_cta_label}
            onChange={value => updateField('committee_cta_label', value)}
          />
          <LabeledInput
            label="Committee CTA URL"
            value={page.committee_cta_url}
            onChange={value => updateField('committee_cta_url', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Advisers Strip" subtitle="Advisers preview section." />
          <LabeledInput
            label="Advisers section title"
            value={page.advisers_title}
            onChange={value => updateField('advisers_title', value)}
          />
          <TextAreaField
            label="Advisers section subtitle"
            value={page.advisers_subtitle}
            onChange={value => updateField('advisers_subtitle', value)}
          />
          <LabeledInput
            label="Advisers CTA label"
            value={page.advisers_cta_label}
            onChange={value => updateField('advisers_cta_label', value)}
          />
          <LabeledInput
            label="Advisers CTA URL"
            value={page.advisers_cta_url}
            onChange={value => updateField('advisers_cta_url', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Milestones" subtitle="Timeline section headings." />
          <LabeledInput
            label="Milestones title"
            value={page.milestones_title}
            onChange={value => updateField('milestones_title', value)}
          />
          <TextAreaField
            label="Milestones subtitle"
            value={page.milestones_subtitle}
            onChange={value => updateField('milestones_subtitle', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Past Events" subtitle="Highlights section headings." />
          <LabeledInput
            label="Past events title"
            value={page.past_events_title}
            onChange={value => updateField('past_events_title', value)}
          />
          <TextAreaField
            label="Past events subtitle"
            value={page.past_events_subtitle}
            onChange={value => updateField('past_events_subtitle', value)}
          />
          <LabeledInput
            label="Past events CTA label"
            value={page.past_events_cta_label}
            onChange={value => updateField('past_events_cta_label', value)}
          />
          <LabeledInput
            label="Past events CTA URL"
            value={page.past_events_cta_url}
            onChange={value => updateField('past_events_cta_url', value)}
          />
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        <GlassCard>
          <SectionTitle title="Section Visibility" subtitle="Toggle About page sections." />
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
          <SectionTitle title="Milestones List" subtitle="Add timeline entries." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {milestones.map((item, index) => (
              <div key={`${item.id}-${index}`} style={{ ...listRowStyle, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                  <CheckboxField
                    label="Visible"
                    checked={item.is_visible}
                    onChange={checked => updateMilestone(index, 'is_visible', checked)}
                  />
                  <LabeledInput
                    label="Year"
                    value={item.year}
                    onChange={value => updateMilestone(index, 'year', value)}
                  />
                  <LabeledInput
                    label="Title"
                    value={item.title}
                    onChange={value => updateMilestone(index, 'title', value)}
                  />
                  <TextAreaField
                    label="Description"
                    value={item.description}
                    onChange={value => updateMilestone(index, 'description', value)}
                  />
                </div>
                <div style={buttonColumnStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => setMilestones(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setMilestones(prev => moveItem(prev, index, 1))}>↓</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => setMilestones(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMilestones(prev => ([
                ...prev,
                { id: `new-${Date.now()}`, year: '', title: '', description: '', is_visible: true, sort_order: prev.length + 1 },
              ]))}
              style={addButtonStyle}
            >
              Add Milestone
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Past Highlights" subtitle="Add past event highlights." />
          <div style={{ display: 'grid', gap: '1rem' }}>
            {highlights.map((item, index) => (
              <div key={`${item.id}-${index}`} style={listRowStyle}>
                <div style={{ flex: 1, display: 'grid', gap: '0.6rem' }}>
                  <CheckboxField
                    label="Visible"
                    checked={item.is_visible}
                    onChange={checked => updateHighlight(index, 'is_visible', checked)}
                  />
                  <LabeledInput
                    label="Title"
                    value={item.title}
                    onChange={value => updateHighlight(index, 'title', value)}
                  />
                  <TextAreaField
                    label="Detail"
                    value={item.detail}
                    onChange={value => updateHighlight(index, 'detail', value)}
                  />
                </div>
                <div style={buttonColumnStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => setHighlights(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setHighlights(prev => moveItem(prev, index, 1))}>↓</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => setHighlights(prev => prev.filter((_, idx) => idx !== index))}>Remove</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setHighlights(prev => ([
                ...prev,
                { id: `new-${Date.now()}`, title: '', detail: '', is_visible: true, sort_order: prev.length + 1 },
              ]))}
              style={addButtonStyle}
            >
              Add Highlight
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
          {saving ? 'Saving...' : 'Save About Page'}
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
