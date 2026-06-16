import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { ClubPartner } from '@/types/database'
import { getSeoTitle, getSeoDescription, getEventKeywords } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('club_partners')
    .select('name')
    .eq('is_visible', true)

  const names = (data ?? []).map(p => p.name).filter(Boolean)
  const dynamicKeywords = names.join(', ')
  const keywords = getEventKeywords('Club Partners', 'Partners', dynamicKeywords)

  return {
    title: getSeoTitle('Club Partners'),
    description: getSeoDescription('Meet the collaborative partner clubs and student associations supporting and co-promoting the National Mathematics Carnival 2026 across campuses in Bangladesh.'),
    keywords,
    alternates: {
      canonical: '/club-partners',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ClubPartnersPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('club_partners')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  const partners = (data ?? []) as ClubPartner[]

  return (
    <main style={{ position: 'relative', zIndex: 1, paddingTop: '2rem' }}>
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .partner-card {
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          animation: card-in 500ms ease forwards;
        }
        .partner-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 55%);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .partner-card:hover::after {
          opacity: 1;
        }
      `}</style>
      <section style={{ padding: '2.5rem 1.5rem 3rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={heroCardStyle}>
          <div style={eyebrowStyle}>Partners</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.3rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Club Partners
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Our partner clubs and organizations collaborating on NMC 2026.
          </p>
        </div>
      </section>

      <section style={{ padding: '1rem 1.5rem 4rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {partners.map((partner, index) => {
            const content = (
              <div
                className="partner-card"
                style={{ ...partnerCardStyle, animationDelay: `${index * 50}ms` }}
              >
                {(partner.display_mode === 'logo' || partner.display_mode === 'both') && partner.logo_url && (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    style={{ height: partner.logo_size === 'large' ? 72 : partner.logo_size === 'small' ? 36 : 52, objectFit: 'contain', maxWidth: '100%' }}
                  />
                )}
                {(partner.display_mode === 'name' || partner.display_mode === 'both') && (
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', textAlign: 'center', marginTop: partner.logo_url ? '0.6rem' : 0 }}>
                    {partner.name}
                  </div>
                )}
              </div>
            )

            if (partner.website_url) {
              return (
                <a
                  key={partner.id}
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', opacity: 0.95, transition: 'opacity 0.15s' }}
                >
                  {content}
                </a>
              )
            }

            return (
              <div key={partner.id} style={{ opacity: 0.95 }}>
                {content}
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
      {eyebrow && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
        {title}
      </h2>
    </div>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
}

const partnerCardStyle: React.CSSProperties = {
  minHeight: 128,
  display: 'grid',
  placeItems: 'center',
  gap: '0.35rem',
  background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '1.6rem 1.35rem',
  boxShadow: 'var(--shadow-md)',
}

const heroCardStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'transparent',
  padding: '2.5rem 2rem',
}
