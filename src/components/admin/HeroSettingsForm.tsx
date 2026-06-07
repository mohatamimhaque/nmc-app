'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/types/database'
import { GlassCard } from './GlassCard'
import { RichTextField } from '@/components/shared/RichTextField'

type HeroSettings = Pick<
  SiteSettings,
  | 'hero_mode'
  | 'hero_title'
  | 'hero_subtitle'
  | 'hero_cta_label'
  | 'hero_cta_url'
  | 'hero_image_url'
  | 'hero_carousel_images'
  | 'hero_countdown_date'
  | 'hero_show_countdown'
  | 'hero_overlay_color'
  | 'hero_overlay_enabled'
  | 'hero_overlay_opacity'
>

interface HeroSettingsFormProps {
  initialSettings: SiteSettings
}

const toDateTimeInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const fromDateTimeInput = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return null
  return date.toISOString()
}

const pickHeroSettings = (settings: SiteSettings): HeroSettings => ({
  hero_mode: settings.hero_mode,
  hero_title: settings.hero_title,
  hero_subtitle: settings.hero_subtitle ?? '',
  hero_cta_label: settings.hero_cta_label,
  hero_cta_url: settings.hero_cta_url,
  hero_image_url: settings.hero_image_url,
  hero_carousel_images: settings.hero_carousel_images ?? [],
  hero_countdown_date: settings.hero_countdown_date,
  hero_show_countdown: settings.hero_show_countdown ?? true,
  hero_overlay_color: settings.hero_overlay_color ?? '#0f1117',
  hero_overlay_enabled: settings.hero_overlay_enabled ?? true,
  hero_overlay_opacity: settings.hero_overlay_opacity ?? 55,
})

export function HeroSettingsForm({ initialSettings }: HeroSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<HeroSettings>(() => pickHeroSettings(initialSettings))

  const heroMode = settings.hero_mode
  const heroUsesImage = ['image', 'image_only', 'banner', 'countdown', 'carousel'].includes(heroMode)
  const heroShowsText = heroMode !== 'image_only'
  const heroUsesCarousel = heroMode === 'carousel'
  const heroShowCountdown = settings.hero_show_countdown ?? true
  const overlayOpacity = Math.min(100, Math.max(0, Math.round(settings.hero_overlay_opacity ?? 55)))
  const carouselImages = settings.hero_carousel_images ?? []

  const countdownDateValue = useMemo(
    () => toDateTimeInput(settings.hero_countdown_date),
    [settings.hero_countdown_date]
  )

  const updateField = <K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleUpload = async (file: File) => {
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

    updateField('hero_image_url', data.url)
  }

  const handleCarouselUpload = async (file: File, index: number) => {
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

    setSettings(prev => {
      const nextImages = [...(prev.hero_carousel_images ?? [])]
      nextImages[index] = data.url
      return { ...prev, hero_carousel_images: nextImages }
    })
  }

  const addCarouselImage = () => {
    setSettings(prev => ({
      ...prev,
      hero_carousel_images: [...(prev.hero_carousel_images ?? []), ''],
    }))
  }

  const updateCarouselImage = (index: number, value: string) => {
    setSettings(prev => {
      const nextImages = [...(prev.hero_carousel_images ?? [])]
      nextImages[index] = value
      return { ...prev, hero_carousel_images: nextImages }
    })
  }

  const removeCarouselImage = (index: number) => {
    setSettings(prev => {
      const nextImages = [...(prev.hero_carousel_images ?? [])]
      nextImages.splice(index, 1)
      return { ...prev, hero_carousel_images: nextImages }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      ...settings,
      hero_carousel_images: (settings.hero_carousel_images ?? []).map(image => image.trim()).filter(Boolean),
      hero_show_countdown: settings.hero_show_countdown ?? true,
      hero_countdown_date: fromDateTimeInput(countdownDateValue),
    }

    const response = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save hero settings.')
      return
    }

    setSuccess('Hero settings saved. Public site refreshed.')
    setSettings(pickHeroSettings(data.data))
    router.refresh()
  }

  const heroPreview = settings.hero_image_url ?? ''

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem',
          }}
        >
          Admin · Homepage Hero
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--admin-fg)',
            margin: 0,
          }}
        >
          Hero Settings
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.4rem',
          }}
        >
          Control hero content, background image, and overlay styling.
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

      <GlassCard>
        <SectionTitle title="Hero" subtitle="Homepage hero content." />
        <HeroModeToggle
          value={settings.hero_mode}
          onChange={value => updateField('hero_mode', value as HeroSettings['hero_mode'])}
        />
        {heroShowsText && (
          <>
            <LabeledInput
              label="Hero title"
              value={settings.hero_title}
              onChange={value => updateField('hero_title', value)}
            />
            <TextAreaField
              label="Hero subtitle"
              value={settings.hero_subtitle ?? ''}
              onChange={value => updateField('hero_subtitle', value)}
            />
            <LabeledInput
              label="Hero CTA label"
              value={settings.hero_cta_label}
              onChange={value => updateField('hero_cta_label', value)}
            />
            <LabeledInput
              label="Hero CTA URL"
              value={settings.hero_cta_url}
              onChange={value => updateField('hero_cta_url', value)}
            />
          </>
        )}
        <ColorField
          label="Hero overlay color"
          value={settings.hero_overlay_color}
          onChange={value => updateField('hero_overlay_color', value)}
        />
        <CheckboxField
          label="Enable hero overlay"
          checked={settings.hero_overlay_enabled}
          onChange={checked => updateField('hero_overlay_enabled', checked)}
        />
        <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
          <span style={labelStyle}>Hero overlay opacity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={overlayOpacity}
              onChange={event => updateField('hero_overlay_opacity', Number(event.target.value))}
              disabled={!settings.hero_overlay_enabled}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <div style={{ minWidth: 48, textAlign: 'right', color: 'var(--admin-fg-muted)', fontSize: '0.75rem' }}>
              {overlayOpacity}%
            </div>
          </div>
        </label>
        <ImageField
          label="Hero image URL"
          preview={heroPreview}
          value={settings.hero_image_url ?? ''}
          onChange={value => updateField('hero_image_url', value || null)}
          onFile={handleUpload}
        />
        {heroUsesCarousel && (
          <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
            <SectionTitle title="Carousel" subtitle="Add one or more background images that auto-rotate on the public hero." />
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {(carouselImages.length ? carouselImages : ['']).map((image, index) => (
                <div
                  key={`${index}-${image}`}
                  style={{
                    border: '1px solid var(--admin-border)',
                    borderRadius: 14,
                    padding: '0.85rem',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'grid',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={labelStyle}>Carousel image {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeCarouselImage(index)}
                      style={{
                        border: '1px solid var(--admin-border)',
                        background: 'transparent',
                        color: 'var(--admin-fg-muted)',
                        borderRadius: 999,
                        padding: '0.35rem 0.7rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={labelStyle}>Image URL</span>
                    <input
                      type="text"
                      value={image}
                      onChange={event => updateCarouselImage(index, event.target.value)}
                      style={inputStyle}
                      placeholder="https://..."
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 92,
                        height: 56,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid var(--admin-border)',
                      }}
                    >
                      {image ? (
                        <img src={image} alt={`Carousel preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--admin-fg-muted)', fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)' }}>
                          Empty
                        </div>
                      )}
                    </div>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={labelStyle}>Upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={event => {
                          const file = event.target.files?.[0]
                          if (file) void handleCarouselUpload(file, index)
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCarouselImage}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.85rem',
                borderRadius: 10,
                border: '1px solid var(--admin-border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--admin-fg)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Add carousel image
            </button>
          </div>
        )}
        {!heroUsesImage && (
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '-0.25rem' }}>
            Image is used in Image/Banner/Countdown modes.
          </div>
        )}
        <LabeledInput
          label="Hero countdown date and time"
          type="datetime-local"
          value={countdownDateValue}
          onChange={value => updateField('hero_countdown_date', value ? fromDateTimeInput(value) : null)}
        />
        <CheckboxField
          label="Show hero countdown"
          checked={heroShowCountdown}
          onChange={checked => updateField('hero_show_countdown', checked)}
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '-0.25rem' }}>
          Countdown is used when Hero mode is set to Countdown or Carousel. If empty, it uses the Event Date.
        </div>

        <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--admin-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '0.65rem 1.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px var(--admin-accent-glow)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Hero Settings'}
          </button>
        </div>
      </GlassCard>
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={event => onChange(event.target.value)}
          style={{ width: 42, height: 32, border: 'none', background: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          style={inputStyle}
          placeholder="#000000"
        />
      </div>
    </label>
  )
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

function HeroModeToggle({
  value,
  onChange,
}: {
  value: HeroSettings['hero_mode']
  onChange: (value: HeroSettings['hero_mode']) => void
}) {
  const options: { value: HeroSettings['hero_mode']; label: string; hint: string }[] = [
    { value: 'text', label: 'Text', hint: 'Title + CTA' },
    { value: 'image', label: 'Image', hint: 'Text on image' },
    { value: 'image_only', label: 'Image Only', hint: 'No text' },
    { value: 'banner', label: 'Banner', hint: 'Short hero' },
    { value: 'countdown', label: 'Countdown', hint: 'Timer + CTA' },
    { value: 'carousel', label: 'Carousel', hint: 'Rotate images' },
  ]

  return (
    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>Hero mode</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map(option => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                borderRadius: 999,
                border: active ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                background: active ? 'rgba(116,143,252,0.15)' : 'rgba(255,255,255,0.04)',
                color: active ? 'var(--admin-accent)' : 'var(--admin-fg)',
                padding: '0.4rem 0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{option.label}</span>
              <span style={{ color: 'var(--admin-fg-muted)', fontSize: '0.55rem' }}>{option.hint}</span>
            </button>
          )
        })}
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
