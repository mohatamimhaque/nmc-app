'use client'
import { useEffect, useMemo, useState } from 'react'
import type { SiteSettings } from '@/types/database'
import { DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'
import { RichHtml } from '@/components/public/RichHtml'

type HeroMode = 'text' | 'image' | 'image_only' | 'banner' | 'countdown' | 'carousel'

const resolveHeroMode = (value: string | null | undefined): HeroMode => {
  if (value === 'image' || value === 'image_only' || value === 'banner' || value === 'countdown' || value === 'carousel') {
    return value
  }
  return 'text'
}

const clampPercent = (value: number | null | undefined, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function HeroSection({ settings }: { settings: SiteSettings | null }) {
  const heroSettings = settings ?? DEFAULT_SITE_SETTINGS
  const heroMode = resolveHeroMode(heroSettings.hero_mode)
  const carouselImages = useMemo(
    () => (heroSettings.hero_carousel_images ?? []).map(image => image.trim()).filter(Boolean),
    [heroSettings.hero_carousel_images]
  )
  const fallbackImage = heroSettings.hero_image_url?.trim() || ''
  const backgroundImages = heroMode === 'carousel'
    ? (carouselImages.length > 0 ? carouselImages : fallbackImage ? [fallbackImage] : [])
    : fallbackImage
      ? [fallbackImage]
      : []
  const hasImage = backgroundImages.length > 0
  const useImage = hasImage && (heroMode === 'image' || heroMode === 'image_only' || heroMode === 'banner' || heroMode === 'countdown' || heroMode === 'carousel')
  const overlayEnabled = heroSettings.hero_overlay_enabled ?? true
  const overlayOpacity = clampPercent(heroSettings.hero_overlay_opacity, 55) / 100
  const overlayColor = heroSettings.hero_overlay_color ?? 'rgba(0,0,0,0.5)'
  const showText = heroMode !== 'image_only'
  const showCountdown = (heroMode === 'countdown' || heroMode === 'carousel') && (heroSettings.hero_show_countdown ?? true)
  const countdownTarget = heroSettings.hero_countdown_date ?? heroSettings.event_date
  const [activeBackground, setActiveBackground] = useState(0)
  const activeBackgroundIndex = backgroundImages.length > 0 ? activeBackground % backgroundImages.length : 0
  const useBannerFrame = heroMode === 'banner' || heroMode === 'carousel'
  const sectionMinHeight = useBannerFrame ? '60vh' : '100vh'
  const competitionLabel = heroSettings.competition_name
    ? `${heroSettings.competition_name}${heroSettings.competition_season ? ` · ${heroSettings.competition_season}` : ''}`
    : 'Competition'
  const organiserLabel = heroSettings.organiser_name
    ? `${heroSettings.organiser_name}${heroSettings.competition_location ? ` · ${heroSettings.competition_location}` : ''}`
    : null
  const fallbackTitle = heroSettings.competition_name
    ? `${heroSettings.competition_name}${heroSettings.competition_season ? ` ${heroSettings.competition_season}` : ''}`
    : 'Competition'
  const titleColor = useImage ? '#fff' : 'var(--foreground)'
  const textColor = useImage ? 'rgba(255,255,255,0.85)' : 'var(--foreground-muted)'

  useEffect(() => {
    if (backgroundImages.length < 2) return
    const id = window.setInterval(() => {
      setActiveBackground(current => (current + 1) % backgroundImages.length)
    }, 8000)
    return () => window.clearInterval(id)
  }, [backgroundImages.length])

  return (
    <section style={{
      width: '100%',
      minHeight: sectionMinHeight,
      aspectRatio: useBannerFrame ? '16 / 9' : undefined,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '6rem 1.5rem 4rem',
      position: 'relative',
      overflow: 'hidden',
      backgroundRepeat: 'no-repeat',
    }}>
      {useImage && (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true">
            {backgroundImages.map((image, index) => (
              <div
                key={`${index}-${image}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: index === activeBackgroundIndex ? 1 : 0,
                  transition: 'opacity 700ms ease, transform 700ms ease',
                  transform: index === activeBackgroundIndex ? 'scale(1)' : 'scale(1.03)',
                }}
              />
            ))}
            {overlayEnabled && overlayOpacity > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: overlayColor,
                  opacity: overlayOpacity,
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          {heroMode === 'carousel' && backgroundImages.length > 1 && (
            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
              {backgroundImages.map((_, index) => {
                const active = index === activeBackgroundIndex
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveBackground(index)}
                    aria-label={`Show background image ${index + 1}`}
                    aria-pressed={active}
                    style={{
                      ...carouselIndicatorStyle,
                      ...(active ? carouselIndicatorActiveStyle : null),
                    }}
                  >
                    <span style={carouselIndicatorDotStyle} />
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
      {showText && (
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', justifyItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1.25rem', padding: '0.3rem 1rem', border: '1px solid var(--color-accent)', borderRadius: 999, display: 'inline-block', opacity: 0.85 }}>
            {organiserLabel ?? competitionLabel}
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem,7vw,5rem)', fontWeight: 900, lineHeight: 1.05, color: titleColor, maxWidth: 800, marginBottom: '1.5rem' }}>
            {heroSettings.hero_title ?? fallbackTitle}
          </h1>
          {heroSettings.hero_subtitle && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem,2.5vw,1.2rem)', color: textColor, maxWidth: 560, lineHeight: 1.65, marginBottom: '2.5rem' }}>
              <RichHtml html={heroSettings.hero_subtitle} />
            </div>
          )}
        </div>
      )}

      {showCountdown && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <HeroCountdown targetDate={countdownTarget} />
        </div>
      )}

      {showText && (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={heroSettings.hero_cta_url ?? '/events'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', padding: '0.8rem 2rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 16px rgba(79,70,229,0.35)' }}>
            {heroSettings.hero_cta_label ?? 'View Events'} →
          </a>
          <a href="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', color: titleColor, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', padding: '0.75rem 2rem', borderRadius: 10, textDecoration: 'none', border: '1.5px solid currentColor', opacity: 0.8 }}>
            Learn More
          </a>
        </div>
      )}
    </section>
  )
}

const carouselIndicatorStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255,255,255,0.28)',
  background: 'rgba(0,0,0,0.35)',
  color: 'transparent',
  borderRadius: 999,
  padding: 0,
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
}

const carouselIndicatorActiveStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.94)',
  borderColor: 'rgba(255,255,255,0.95)',
  boxShadow: '0 0 0 4px rgba(255,255,255,0.15)',
}

const carouselIndicatorDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: 'currentColor',
}

export function CountdownSection({ settings }: { settings: SiteSettings | null }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const targetDate = settings?.hero_countdown_date ?? settings?.event_date
  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate).getTime()
    if (Number.isNaN(target)) return
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      setTime({ d: Math.floor(diff/86400000), h: Math.floor(diff/3600000)%24, m: Math.floor(diff/60000)%60, s: Math.floor(diff/1000)%60 })
    }
    tick(); const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (!targetDate) return null
  return (
    <section style={{ padding: '4rem 1.5rem', textAlign: 'center', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '1rem' }}>Event Countdown</div>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[['d','Days'],['h','Hours'],['m','Minutes'],['s','Seconds']].map(([k, lbl]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1, minWidth: 80 }}>
              {String(time[k as keyof typeof time]).padStart(2,'0')}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginTop: '0.3rem' }}>{lbl}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HeroCountdown({ targetDate }: { targetDate: string | null }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate).getTime()
    if (Number.isNaN(target)) return
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!targetDate) return null

  return (
    <div style={{
      display: 'flex',
      gap: '1.25rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
      margin: '1.5rem 0 2.5rem',
      background: 'rgba(0,0,0,0.25)',
      padding: '1rem 1.5rem',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.25)',
      color: '#fff',
    }}>
      {[['d','Days'],['h','Hours'],['m','Minutes'],['s','Seconds']].map(([k, lbl]) => (
        <div key={k} style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, lineHeight: 1 }}>
            {String(time[k as keyof typeof time]).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginTop: '0.35rem' }}>{lbl}</div>
        </div>
      ))}
    </div>
  )
}

type DeadlineEvent = {
  registration_deadline?: string | null
  title?: string | null
  slug?: string | null
}

export function DeadlineStripSection({ events }: { events: DeadlineEvent[] }) {
  const [now] = useState(() => Date.now())
  const next = events.reduce<DeadlineEvent | null>((current, event) => {
    const eventDeadline = getDeadlineTime(event.registration_deadline)
    if (!Number.isFinite(eventDeadline) || eventDeadline <= now) {
      return current
    }

    if (!current) {
      return event
    }

    const currentDeadline = getDeadlineTime(current.registration_deadline)
    return eventDeadline < currentDeadline ? event : current
  }, null)
  if (!next) return null
  const deadline = new Date(getDeadlineTime(next.registration_deadline))
  return (
    <div style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))', color: '#fff', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', textAlign: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>Registration Deadline</span>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>{next.title}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.75rem', borderRadius: 999 }}>
        {deadline.toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})} · {deadline.toLocaleTimeString('en-BD',{hour:'2-digit',minute:'2-digit'})}
      </span>
      <a href={`/events/${next.slug}`} style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.8rem', padding: '0.4rem 1rem', borderRadius: 8, textDecoration: 'none' }}>Register →</a>
    </div>
  )
}

const getDeadlineTime = (value: string | null | undefined) => {
  if (!value) return Number.NaN
  return new Date(value).getTime()
}
