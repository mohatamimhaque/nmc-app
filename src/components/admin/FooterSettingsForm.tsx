'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FooterSettings } from '@/types/database'
import { GlassCard } from './GlassCard'
import { PublicFooter } from '../public/PublicFooter'

interface FooterSettingsFormProps {
  initialSettings: FooterSettings
  footerPattern: string
}

export function FooterSettingsForm({ initialSettings, footerPattern }: FooterSettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<FooterSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateField = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/admin/footer-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save footer settings.')
      return
    }

    setSuccess('Footer settings saved. Public site refreshed.')
    setSettings(data.data)
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
          Admin · Footer
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
          Footer Settings
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Control footer content, contact details, social links, and policy links.
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
          <SectionTitle title="Branding" />
          <LabeledInput
            label="Tagline"
            value={settings.tagline ?? ''}
            onChange={value => updateField('tagline', value)}
          />
          <LabeledInput
            label="Organiser text"
            value={settings.organiser_text ?? ''}
            onChange={value => updateField('organiser_text', value)}
          />
          <LabeledInput
            label="Copyright text"
            value={settings.copyright_text ?? ''}
            onChange={value => updateField('copyright_text', value)}
          />
          <LabeledInput
            label="Developer credit text"
            value={settings.developer_credit_text ?? ''}
            onChange={value => updateField('developer_credit_text', value)}
          />
          <LabeledInput
            label="Developer credit URL"
            value={settings.developer_credit_url ?? ''}
            onChange={value => updateField('developer_credit_url', value)}
          />
          <CheckboxField
            label="Show developer credit"
            checked={settings.show_developer_credit}
            onChange={checked => updateField('show_developer_credit', checked)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Contact" />
          <CheckboxField
            label="Show phone"
            checked={settings.show_phone}
            onChange={checked => updateField('show_phone', checked)}
          />
          <LabeledInput
            label="Phone"
            value={settings.contact_phone ?? ''}
            onChange={value => updateField('contact_phone', value)}
          />
          <CheckboxField
            label="Show email"
            checked={settings.show_email}
            onChange={checked => updateField('show_email', checked)}
          />
          <LabeledInput
            label="Email"
            value={settings.contact_email ?? ''}
            onChange={value => updateField('contact_email', value)}
          />
          <CheckboxField
            label="Show address"
            checked={settings.show_address}
            onChange={checked => updateField('show_address', checked)}
          />
          <LabeledInput
            label="Address"
            value={settings.contact_address ?? ''}
            onChange={value => updateField('contact_address', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Social Links" />
          <CheckboxField
            label="Show Facebook"
            checked={settings.show_facebook}
            onChange={checked => updateField('show_facebook', checked)}
          />
          <LabeledInput
            label="Facebook URL"
            value={settings.facebook_url ?? ''}
            onChange={value => updateField('facebook_url', value)}
          />
          <CheckboxField
            label="Show YouTube"
            checked={settings.show_youtube}
            onChange={checked => updateField('show_youtube', checked)}
          />
          <LabeledInput
            label="YouTube URL"
            value={settings.youtube_url ?? ''}
            onChange={value => updateField('youtube_url', value)}
          />
          <CheckboxField
            label="Show Instagram"
            checked={settings.show_instagram}
            onChange={checked => updateField('show_instagram', checked)}
          />
          <LabeledInput
            label="Instagram URL"
            value={settings.instagram_url ?? ''}
            onChange={value => updateField('instagram_url', value)}
          />
          <CheckboxField
            label="Show LinkedIn"
            checked={settings.show_linkedin}
            onChange={checked => updateField('show_linkedin', checked)}
          />
          <LabeledInput
            label="LinkedIn URL"
            value={settings.linkedin_url ?? ''}
            onChange={value => updateField('linkedin_url', value)}
          />
          <CheckboxField
            label="Show Twitter/X"
            checked={settings.show_twitter}
            onChange={checked => updateField('show_twitter', checked)}
          />
          <LabeledInput
            label="Twitter/X URL"
            value={settings.twitter_url ?? ''}
            onChange={value => updateField('twitter_url', value)}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Policies" />
          <CheckboxField
            label="Show privacy policy"
            checked={settings.show_privacy_link}
            onChange={checked => updateField('show_privacy_link', checked)}
          />
          <LabeledInput
            label="Privacy URL"
            value={settings.privacy_url ?? ''}
            onChange={value => updateField('privacy_url', value)}
          />
          <CheckboxField
            label="Show terms"
            checked={settings.show_terms_link}
            onChange={checked => updateField('show_terms_link', checked)}
          />
          <LabeledInput
            label="Terms URL"
            value={settings.terms_url ?? ''}
            onChange={value => updateField('terms_url', value)}
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

      <div style={{ marginTop: '2rem' }}>
        <SectionTitle title="Preview" subtitle="Live preview of the public footer." />
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
          <PublicFooter settings={settings} footerPattern={footerPattern} />
        </div>
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
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.55rem 0.75rem',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  outline: 'none',
}
