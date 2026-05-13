'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/types/database'
import { GlassCard } from './GlassCard'

interface SiteSettingsFormProps {
  initialSettings: SiteSettings
}

const toDateInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateInput = (value: string) => {
  if (!value) return null
  return new Date(`${value}T00:00:00Z`).toISOString()
}

const DEFAULT_PREVIEW = {
  logo: '/favicon.ico',
  favicon: '/favicon.ico',
}

const COMPETITION_TYPES = [
  'Mathematics',
  'IUPC',
  'Robotics',
  'Programming Contest',
  'Hackathon',
  'Science Olympiad',
  'Debate',
  'Business Case',
] as const

const COMPETITION_THEME_PRESETS: Record<string, Partial<SiteSettings>> = {
  Mathematics: {
    color_primary: '#2563eb',
    color_secondary: '#1d4ed8',
    color_accent: '#06b6d4',
    color_button_bg: '#2563eb',
    color_button_text: '#ffffff',
    color_navbar_bg: '#ffffff',
    color_footer_bg: '#0f172a',
    font_heading: 'Playfair Display',
    font_body: 'Inter',
  },
  IUPC: {
    color_primary: '#ef4444',
    color_secondary: '#b91c1c',
    color_accent: '#f59e0b',
    color_button_bg: '#ef4444',
    color_button_text: '#ffffff',
    color_navbar_bg: '#0b0f19',
    color_footer_bg: '#0b0f19',
    font_heading: 'Space Grotesk',
    font_body: 'Inter',
  },
  Robotics: {
    color_primary: '#10b981',
    color_secondary: '#0f766e',
    color_accent: '#22c55e',
    color_button_bg: '#10b981',
    color_button_text: '#ffffff',
    color_navbar_bg: '#0b1120',
    color_footer_bg: '#0b1120',
    font_heading: 'Oxanium',
    font_body: 'Inter',
  },
  'Programming Contest': {
    color_primary: '#6366f1',
    color_secondary: '#4338ca',
    color_accent: '#22d3ee',
    color_button_bg: '#6366f1',
    color_button_text: '#ffffff',
    color_navbar_bg: '#0f172a',
    color_footer_bg: '#0f172a',
    font_heading: 'Space Grotesk',
    font_body: 'Inter',
  },
  Hackathon: {
    color_primary: '#8b5cf6',
    color_secondary: '#6d28d9',
    color_accent: '#f472b6',
    color_button_bg: '#8b5cf6',
    color_button_text: '#ffffff',
    color_navbar_bg: '#0f172a',
    color_footer_bg: '#0f172a',
    font_heading: 'Manrope',
    font_body: 'Inter',
  },
  'Science Olympiad': {
    color_primary: '#0ea5e9',
    color_secondary: '#0284c7',
    color_accent: '#a3e635',
    color_button_bg: '#0ea5e9',
    color_button_text: '#ffffff',
    color_navbar_bg: '#ffffff',
    color_footer_bg: '#102a43',
    font_heading: 'Merriweather',
    font_body: 'Inter',
  },
  Debate: {
    color_primary: '#f97316',
    color_secondary: '#c2410c',
    color_accent: '#22c55e',
    color_button_bg: '#f97316',
    color_button_text: '#ffffff',
    color_navbar_bg: '#ffffff',
    color_footer_bg: '#1f2937',
    font_heading: 'Playfair Display',
    font_body: 'Inter',
  },
  'Business Case': {
    color_primary: '#0f172a',
    color_secondary: '#1e293b',
    color_accent: '#22c55e',
    color_button_bg: '#0f172a',
    color_button_text: '#ffffff',
    color_navbar_bg: '#ffffff',
    color_footer_bg: '#0f172a',
    font_heading: 'DM Serif Display',
    font_body: 'Inter',
  },
}

export function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<SiteSettings>({
    ...initialSettings,
  })

  const eventDateValue = useMemo(
    () => toDateInput(settings.event_date),
    [settings.event_date]
  )

  const updateField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const applyPreset = (presetKey: string) => {
    const preset = COMPETITION_THEME_PRESETS[presetKey]
    if (!preset) return
    setSettings(prev => ({
      ...prev,
      ...preset,
      use_static_theme: false,
    }))
  }

  const handleUpload = async (file: File, field: 'logo_url' | 'favicon_url') => {
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

    updateField(field, data.url)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      ...settings,
      event_date: fromDateInput(eventDateValue),
    }

    const response = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save settings.')
      return
    }

    setSuccess('Settings saved. Public site refreshed.')
    setSettings(data.data)
    router.refresh()
  }

  const logoPreview = settings.logo_url || DEFAULT_PREVIEW.logo
  const faviconPreview = settings.favicon_url || DEFAULT_PREVIEW.favicon

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
          Admin · Theme & Branding
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
          Site Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Update public branding, colors, and typography. Changes apply immediately.
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
          <SectionTitle title="Competition" subtitle="Profile and positioning details." />
          <LabeledInput
            label="Competition name"
            value={settings.competition_name}
            onChange={value => updateField('competition_name', value)}
          />
          <LabeledInput
            label="Competition slug"
            value={settings.competition_slug}
            onChange={value => updateField('competition_slug', value)}
          />
          <LabeledInput
            label="Competition category"
            value={settings.competition_category}
            onChange={value => updateField('competition_category', value)}
          />
          <SelectField
            label="Competition type"
            value={COMPETITION_TYPES.includes(settings.competition_category as any)
              ? settings.competition_category
              : 'Mathematics'}
            options={[...COMPETITION_TYPES]}
            onChange={value => {
              updateField('competition_category', value)
              applyPreset(value)
            }}
          />
          <button
            type="button"
            onClick={() => applyPreset(settings.competition_category)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Apply theme preset
          </button>
          <LabeledInput
            label="Season / Edition"
            value={settings.competition_season ?? ''}
            onChange={value => updateField('competition_season', value || null)}
          />
          <LabeledInput
            label="Location"
            value={settings.competition_location ?? ''}
            onChange={value => updateField('competition_location', value || null)}
          />
          <LabeledInput
            label="Organiser name"
            value={settings.organiser_name ?? ''}
            onChange={value => updateField('organiser_name', value || null)}
          />
          <LabeledInput
            label="Organiser tagline"
            value={settings.organiser_tagline ?? ''}
            onChange={value => updateField('organiser_tagline', value || null)}
          />
        </GlassCard>
        <GlassCard accent>
          <SectionTitle title="Branding" subtitle="Logo, favicon, and event date." />
          <LabeledInput
            label="Site title"
            value={settings.site_title}
            onChange={value => updateField('site_title', value)}
          />
          <LabeledInput
            label="Event date"
            type="date"
            value={eventDateValue}
            onChange={value => updateField('event_date', value ? fromDateInput(value) : null)}
          />
          <ImageField
            label="Logo URL"
            preview={logoPreview}
            value={settings.logo_url ?? ''}
            onChange={value => updateField('logo_url', value || null)}
            onFile={file => handleUpload(file, 'logo_url')}
          />
          <ImageField
            label="Favicon URL"
            preview={faviconPreview}
            value={settings.favicon_url ?? ''}
            onChange={value => updateField('favicon_url', value || null)}
            onFile={file => handleUpload(file, 'favicon_url')}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Theme" subtitle="Primary palette and typography." />
          <ColorField
            label="Primary color"
            value={settings.color_primary}
            onChange={value => updateField('color_primary', value)}
            allowAlpha
          />
          <ColorField
            label="Secondary color"
            value={settings.color_secondary}
            onChange={value => updateField('color_secondary', value)}
            allowAlpha
          />
          <ColorField
            label="Accent color"
            value={settings.color_accent}
            onChange={value => updateField('color_accent', value)}
            allowAlpha
          />
          <ColorField
            label="Button background"
            value={settings.color_button_bg}
            onChange={value => updateField('color_button_bg', value)}
            allowAlpha
          />
          <ColorField
            label="Button text"
            value={settings.color_button_text}
            onChange={value => updateField('color_button_text', value)}
            allowAlpha
          />
          <ColorField
            label="Navbar background"
            value={settings.color_navbar_bg}
            onChange={value => updateField('color_navbar_bg', value)}
            allowAlpha
          />
          <ColorField
            label="Footer background"
            value={settings.color_footer_bg}
            onChange={value => updateField('color_footer_bg', value)}
            allowAlpha
          />
          <LabeledInput
            label="Heading font (Google Fonts)"
            value={settings.font_heading}
            onChange={value => updateField('font_heading', value)}
          />
          <LabeledInput
            label="Body font (Google Fonts)"
            value={settings.font_body}
            onChange={value => updateField('font_body', value)}
          />
          <SelectField
            label="Default theme"
            value={settings.default_theme}
            options={['light', 'dark']}
            onChange={value => updateField('default_theme', value as SiteSettings['default_theme'])}
          />
          <CheckboxField
            label="Use static theme (ignore database colors/fonts)"
            checked={settings.use_static_theme}
            onChange={checked => updateField('use_static_theme', checked)}
          />
          <SelectField
            label="Footer pattern"
            value={settings.footer_pattern}
            options={['solid', 'grid', 'dots']}
            onChange={value => updateField('footer_pattern', value as SiteSettings['footer_pattern'])}
          />
          <CheckboxField
            label="Enable animations"
            checked={settings.animations_enabled}
            onChange={checked => updateField('animations_enabled', checked)}
          />
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
          {saving ? 'Saving...' : 'Save Changes'}
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
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
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

function ColorField({
  label,
  value,
  onChange,
  allowAlpha = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowAlpha?: boolean
}) {
  const parsed = parseColor(value)
  const alpha = parsed?.a ?? 1
  const rgb = parsed ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : value

  const handleColorChange = (hexValue: string) => {
    if (!allowAlpha || !parsed || alpha >= 0.999) {
      onChange(hexValue)
      return
    }
    const next = parseColor(hexValue)
    if (!next) {
      onChange(hexValue)
      return
    }
    onChange(toRgbaString(next.r, next.g, next.b, alpha))
  }

  const handleAlphaChange = (nextAlpha: number) => {
    if (!parsed) {
      return
    }
    onChange(toRgbaString(parsed.r, parsed.g, parsed.b, nextAlpha))
  }

  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          value={parsed?.hex ?? '#000000'}
          onChange={event => handleColorChange(event.target.value)}
          style={{ width: 42, height: 32, border: 'none', background: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          style={inputStyle}
          placeholder={allowAlpha ? 'rgba(0,0,0,0.7) or #000000' : '#000000'}
        />
      </div>
      {allowAlpha && (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={labelStyle}>Opacity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(alpha * 100)}
              onChange={event => handleAlphaChange(Number(event.target.value) / 100)}
              style={{ flex: 1 }}
            />
            <div
              style={{
                width: 36,
                height: 24,
                borderRadius: 6,
                border: '1px solid var(--admin-border)',
                background: rgb,
              }}
              title={`Opacity ${Math.round(alpha * 100)}%`}
            />
          </div>
        </div>
      )}
    </label>
  )
}

const parseColor = (input: string) => {
  const value = input.trim()

  if (value.startsWith('#')) {
    const hex = value.slice(1)
    const isShort = hex.length === 3
    const isLong = hex.length === 6
    if (!isShort && !isLong) {
      return null
    }
    const normalized = isShort
      ? hex.split('').map(ch => ch + ch).join('')
      : hex
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null
    }
    return { r, g, b, a: 1, hex: `#${normalized}` }
  }

  const rgbaMatch = value.match(/rgba?\(([^)]+)\)/i)
  if (!rgbaMatch) {
    return null
  }

  const parts = rgbaMatch[1].split(',').map(part => part.trim())
  if (parts.length < 3) {
    return null
  }
  const r = Number(parts[0])
  const g = Number(parts[1])
  const b = Number(parts[2])
  const a = parts[3] !== undefined ? Number(parts[3]) : 1
  if ([r, g, b, a].some(num => Number.isNaN(num))) {
    return null
  }

  return {
    r: clampChannel(r),
    g: clampChannel(g),
    b: clampChannel(b),
    a: clampAlpha(a),
    hex: toHex(r, g, b),
  }
}

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)))
const clampAlpha = (value: number) => Math.min(1, Math.max(0, Number(value)))

const toHex = (r: number, g: number, b: number) => {
  const toHexPart = (value: number) => clampChannel(value).toString(16).padStart(2, '0')
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
}

const toRgbaString = (r: number, g: number, b: number, a: number) => {
  const safeAlpha = clampAlpha(a)
  return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)}, ${safeAlpha})`
}

function ImageField({
  label,
  value,
  preview,
  onChange,
  onFile,
}: {
  label: string
  value: string
  preview: string
  onChange: (value: string) => void
  onFile: (file: File) => void
}) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={labelStyle}>{label}</span>
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          style={inputStyle}
          placeholder="https://..."
        />
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--admin-border)',
            background: 'rgba(255,255,255,0.05)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {preview ? (
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>No image</span>
          )}
        </div>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={labelStyle}>Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) onFile(file)
            }}
          />
        </label>
      </div>
    </div>
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
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.55rem 0.75rem',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  outline: 'none',
}
