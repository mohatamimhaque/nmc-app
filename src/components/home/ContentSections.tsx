import Link from 'next/link'
import { RichHtml } from '@/components/public/RichHtml'

// ── Event Highlights Cards ────────────────────────────────────
export function EventHighlightsSection({ events }: { events: any[] }) {
  if (!events?.length) return null
  const catColour: Record<string, string> = { university: '#4f46e5', college: '#0ca678', school: '#f76707', all: '#0ea5e9' }
  return (
    <section style={{ padding: '5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader eyebrow="Competitions" title="Featured Events" sub="Open to University, College & School participants" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,320px))', gap: '1.25rem', marginBottom: '2rem', justifyContent: 'center' }}>
        {events.map(ev => (
          <div key={ev.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ev.cover_image_url && <img src={ev.cover_image_url} alt={ev.title || 'NMC 2026'} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: catColour[ev.category] ?? '#4f46e5', background: `${catColour[ev.category] ?? '#4f46e5'}18`, border: `1px solid ${catColour[ev.category] ?? '#4f46e5'}40`, padding: '0.2rem 0.6rem', borderRadius: 999, alignSelf: 'flex-start' }}>
              {ev.category}
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{ev.title}</h3>
            {ev.short_description && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--foreground-muted)', lineHeight: 1.55, margin: 0 }}>
                <RichHtml html={ev.short_description} />
              </div>
            )}
            {ev.registration_type === 'google_form' && ev.registration_url ? (
              <a
                href={ev.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', background: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8rem', padding: '0.5rem 1.1rem', borderRadius: 8, textDecoration: 'none' }}
              >
                {ev.registration_button_label ?? 'Register'}
                <span style={{ marginLeft: 6 }} aria-hidden>↗</span>
              </a>
            ) : (
              <Link href={`/events/${ev.slug}/register`} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', background: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8rem', padding: '0.5rem 1.1rem', borderRadius: 8, textDecoration: 'none' }}>
                {ev.registration_button_label ?? 'Register'} →
              </Link>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}><Link href="/events" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', border: '1.5px solid var(--color-primary)', padding: '0.6rem 1.5rem', borderRadius: 8 }}>View All Events</Link></div>
    </section>
  )
}

// ── Notices Preview ───────────────────────────────────────────
export function NoticesPreviewSection({ notices }: { notices: any[] }) {
  if (!notices?.length) return null
  return (
    <section style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <SectionHeader eyebrow="Announcements" title="Latest Notices" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' }}>
        {notices.slice(0,3).map(n => (
          <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%', maxWidth: 720 }}>
            {n.is_pinned && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.15rem 0.5rem', borderRadius: 999, flexShrink: 0, marginTop: 2 }}>Pinned</span>}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)' }}>{n.title}</div>
              {n.category && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--foreground-muted)', marginTop: 3, letterSpacing: '0.06em' }}>{n.category}</div>}
            </div>
            <Link href="/notices" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-primary)', textDecoration: 'none', flexShrink: 0 }}>Read →</Link>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}><Link href="/notices" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', border: '1.5px solid var(--color-primary)', padding: '0.6rem 1.5rem', borderRadius: 8 }}>View All Notices</Link></div>
    </section>
  )
}

// ── Gallery Preview Strip ─────────────────────────────────────
export function GalleryPreviewSection({ images }: { images: any[] }) {
  if (!images?.length) return null
  return (
    <section style={{ padding: '4rem 0', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <SectionHeader eyebrow="Gallery" title="Photo Highlights" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,250px))', gap: 16, marginBottom: '2rem', justifyContent: 'center', padding: '0 1.5rem' }}>
        {images.slice(0,9).map((img, index) => {
          const title = img.caption || img.alt_text || 'NMC 2026'
          const category = img.category_name || 'Uncategorized'
          const tilt = index % 2 === 0 ? -2.2 : 1.7
          return (
          <Link
            key={img.id}
            href={`/gallery?image=${encodeURIComponent(img.id)}`}
            className="gallery-preview-card"
            style={{ textDecoration: 'none', transform: `rotate(${tilt}deg)` }}
          >
            <div className="gallery-preview-shell" style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, #fff 6%), var(--surface))', border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)', boxShadow: 'var(--shadow-lg)', padding: '0.85rem 0.85rem 1rem', transformOrigin: 'center bottom' }}>
              <div className="gallery-preview-frame" style={{ aspectRatio: '4/5', overflow: 'hidden', position: 'relative', borderRadius: 20 }}>
                <img src={img.url} alt={img.alt_text || img.caption || 'NMC 2026'} className="gallery-preview-image" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }} />
                <div className="gallery-preview-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,17,23,0) 35%, rgba(15,17,23,0.55) 100%)', opacity: 0, transition: 'opacity 0.25s ease' }}>
                  <span className="gallery-preview-expand" style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', width: 42, height: 42, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(195, 152, 98, 0.92)', color: '#fff', boxShadow: '0 10px 24px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)', transform: 'scale(0.94)', transition: 'transform 0.25s ease' }} aria-hidden="true">
                    ↗
                  </span>
                </div>
              </div>
              <div style={{ padding: '0.95rem 0.45rem 0.2rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700, fontStyle: 'italic', color: 'var(--color-primary)', lineHeight: 1.15 }}>{title}</div>
                <div style={{ marginTop: '0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                  <span style={{ width: 24, height: 1, background: 'currentColor', opacity: 0.35 }} />
                  {category}
                  <span style={{ width: 24, height: 1, background: 'currentColor', opacity: 0.35 }} />
                </div>
              </div>
            </div>
          </Link>
          )
        })}
      </div>
      <div style={{ textAlign: 'center' }}><Link href="/gallery" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', border: '1.5px solid var(--color-primary)', padding: '0.6rem 1.5rem', borderRadius: 8 }}>View Full Gallery</Link></div>
    </section>
  )
}

// ── Committee Preview Strip ───────────────────────────────────
export function CommitteePreviewSection({ members }: { members: any[] }) {
  if (!members?.length) return null
  return (
    <section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader eyebrow="Our Team" title="Organizing Committee" />
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', justifyContent: 'center' }}>
        {members.slice(0,8).map(m => (
          <div key={m.id} style={{ flexShrink: 0, textAlign: 'center', width: 140 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.6rem', background: 'var(--border)', border: '2px solid var(--color-primary)' }}>
              {m.photo_url ? <img src={m.photo_url} alt={m.name || 'NMC 2026'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>{m.name?.[0]}</div>}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--foreground)' }}>{m.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--foreground-muted)', marginTop: 2 }}>{m.role}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}><Link href="/committee" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', border: '1.5px solid var(--color-primary)', padding: '0.6rem 1.5rem', borderRadius: 8 }}>Meet the Team</Link></div>
    </section>
  )
}

// ── Sponsors Section ──────────────────────────────────────────
export function SponsorsSection({ categories, sponsors, isMediaPartners = false }: { categories: any[], sponsors: any[], isMediaPartners?: boolean }) {
  const visible = sponsors?.filter(s => s.is_visible)
  if (!visible?.length) return null
  const title = isMediaPartners ? 'Media Partners' : 'Proud Sponsors'
  return (
    <section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader eyebrow={isMediaPartners ? 'Partners' : 'Sponsors'} title={title} />
      {categories?.filter(c => c.is_visible).map(cat => {
        const catSponsors = visible.filter(s => s.category_id === cat.id)
        if (!catSponsors.length) return null
        return (
          <div key={cat.id} style={{ marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--foreground-muted)', marginBottom: '1rem', textAlign: 'center' }}>{cat.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
              {catSponsors.map(s => (
                <a key={s.id} href={s.website_url || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', opacity: 0.85, transition: 'opacity 0.15s' }}>
                  {(s.display_mode === 'logo' || s.display_mode === 'both') && s.logo_url && <img src={s.logo_url} alt={s.name || 'NMC 2026'} style={{ height: s.logo_size === 'large' ? 64 : s.logo_size === 'small' ? 32 : 48, objectFit: 'contain' }} />}
                  {(s.display_mode === 'name' || s.display_mode === 'both') && <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>{s.name}</div>}
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────
export function StatsSection({ stats }: { stats: { value: string, label: string }[] }) {
  return (
    <section style={{ padding: '4rem 1.5rem', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1.5rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: '1.5rem 1rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,var(--color-primary),var(--color-accent))' }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CTA Strip ─────────────────────────────────────────────────
export function CTAStripSection({ settings }: { settings: any }) {
  return (
    <section style={{ margin: '4rem auto', maxWidth: 1100, padding: '0 1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))', borderRadius: 20, padding: 'clamp(2.5rem,6vw,4rem) 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'serif', fontSize: '18rem', color: '#fff', opacity: 0.04, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>∫</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>Registration Open</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>
          Ready to prove your<br />mathematical excellence?
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Register now for NMC 2026. Open to University, College, and School students across Bangladesh.
        </p>
        <a href={settings?.hero_cta_url ?? '/events'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: 'var(--color-primary)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', padding: '0.8rem 2.25rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {settings?.hero_cta_label ?? 'Register Now'} →
        </a>
      </div>
    </section>
  )
}

// ── Shared section header ─────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string, title: string, sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
      {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>{eyebrow}</div>}
      <h2 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--foreground)', margin: 0, textTransform: 'uppercase' }}>{title}</h2>    </div>
  )
}
