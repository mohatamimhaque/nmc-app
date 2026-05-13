import type { FooterSettings, SiteSettings } from '../../types/database'

interface PublicFooterProps {
  settings: FooterSettings
  competition?: SiteSettings | null
  footerPattern?: string | null
}

export function PublicFooter({ settings, competition, footerPattern }: PublicFooterProps) {
  const patternStyle = resolveFooterPattern(footerPattern)
  const competitionLabel = competition?.competition_name
    ? `${competition.competition_name}${competition.competition_season ? ` ${competition.competition_season}` : ''}`
    : null
  const organiserLabel = competition?.organiser_name ?? null

  return (
    <footer
      style={{
        background: 'linear-gradient(140deg, rgba(15,17,23,0.92), rgba(6,8,16,0.98))',
        color: '#f8fafc',
        padding: '5rem 1.5rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '3rem',
        zIndex: 2,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 15% 10%, rgba(99,102,241,0.22), transparent 45%)',
          opacity: 0.6,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 50%),' +
            'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05), transparent 45%)',
          opacity: 0.6,
        }}
      />
      {patternStyle && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: patternStyle,
            backgroundSize: patternStyle.includes('radial-gradient') ? '18px 18px' : '48px 48px',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: '2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
            {settings.tagline ?? competitionLabel ?? 'Competition'}
          </div>
          <p style={{ color: 'rgba(248,250,252,0.75)', marginTop: '0.85rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {settings.organiser_text ?? organiserLabel ?? 'Competition Organiser'}
          </p>
          <div style={{ marginTop: '1.25rem', display: 'inline-flex', gap: '0.6rem', alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.65)' }}>
              {competitionLabel ?? 'Competition'}
            </span>
          </div>
        </div>

        <div>
          <div style={footerHeadingStyle}>Contact</div>
          <ul style={footerListStyle}>
            {settings.show_phone && settings.contact_phone && (
              <li>Phone: {settings.contact_phone}</li>
            )}
            {settings.show_email && settings.contact_email && (
              <li>Email: {settings.contact_email}</li>
            )}
            {settings.show_address && settings.contact_address && (
              <li>{settings.contact_address}</li>
            )}
          </ul>
        </div>

        <div>
          <div style={footerHeadingStyle}>Social</div>
          <ul style={footerListStyle}>
            {settings.show_facebook && settings.facebook_url && (
              <li><a href={settings.facebook_url} style={footerLinkStyle}>Facebook</a></li>
            )}
            {settings.show_youtube && settings.youtube_url && (
              <li><a href={settings.youtube_url} style={footerLinkStyle}>YouTube</a></li>
            )}
            {settings.show_instagram && settings.instagram_url && (
              <li><a href={settings.instagram_url} style={footerLinkStyle}>Instagram</a></li>
            )}
            {settings.show_linkedin && settings.linkedin_url && (
              <li><a href={settings.linkedin_url} style={footerLinkStyle}>LinkedIn</a></li>
            )}
            {settings.show_twitter && settings.twitter_url && (
              <li><a href={settings.twitter_url} style={footerLinkStyle}>Twitter/X</a></li>
            )}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ color: 'rgba(248,250,252,0.7)', fontSize: '0.85rem' }}>
          {settings.copyright_text ?? '© 2026 Math Club, DUET. All rights reserved.'}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          {settings.show_privacy_link && settings.privacy_url && (
            <a href={settings.privacy_url} style={footerLinkStyle}>Privacy Policy</a>
          )}
          {settings.show_terms_link && settings.terms_url && (
            <a href={settings.terms_url} style={footerLinkStyle}>Terms</a>
          )}
          {settings.show_developer_credit && (
            settings.developer_credit_url ? (
              <a href={settings.developer_credit_url} style={footerLinkStyle}>
                {settings.developer_credit_text ?? 'Built by Math Club, DUET'}
              </a>
            ) : (
              <span style={{ color: 'rgba(248,250,252,0.6)' }}>
                {settings.developer_credit_text ?? 'Built by Math Club, DUET'}
              </span>
            )
          )}
        </div>
      </div>
    </footer>
  )
}

const resolveFooterPattern = (pattern?: string | null) => {
  switch (pattern) {
    case 'grid':
      return 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)'
    case 'dots':
      return 'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)'
    case 'solid':
    default:
      return null
  }
}

const footerHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'rgba(248,250,252,0.75)',
  marginBottom: '0.75rem',
}

const footerListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  color: 'rgba(248,250,252,0.75)',
  fontSize: '0.9rem',
}

const footerLinkStyle: React.CSSProperties = {
  color: 'rgba(248,250,252,0.85)',
  textDecoration: 'none',
}
