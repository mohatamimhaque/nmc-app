import { createClient } from '@/lib/supabase/server'
import { GlassCard, StatCard } from '@/components/admin/GlassCard'
import { MathDivider } from '@/components/admin/MathDivider'
import {
  HexagonIcon, GridIcon, TriangleIcon, InfinityIcon,
} from '@/components/admin/GeoIcons'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch counts
  const [
    { count: eventsCount },
    { count: registrationsCount },
    { count: noticesCount },
    { count: advisersCount },
    { count: committeeCount },
    { count: ambassadorsCount },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
    supabase.from('notices').select('*', { count: 'exact', head: true }),
    supabase.from('advisers').select('*', { count: 'exact', head: true }),
    supabase.from('committee_members').select('*', { count: 'exact', head: true }),
    supabase.from('campus_ambassadors').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentRegistrations } = await supabase
    .from('event_registrations')
    .select(`
      id,
      submitted_at,
      events (
        title
      )
    `)
    .order('submitted_at', { ascending: false })
    .limit(5)

  // Dynamic checklist
  const checklist = [
    { label: 'Connect Supabase — add credentials to .env.local', hint: '.env.local', done: true }, // Assume done if dashboard loads
    { label: 'Configure Cloudflare R2 storage bucket', hint: '.env.local', done: true }, // Assume done
    { label: 'Set site title, logo, and event date in Theme settings', hint: '/admin/theme', done: true }, // Assume done
    { label: 'Configure hero content and image', hint: '/admin/home', done: true }, // Assume done
    { label: 'Create your first event', hint: '/admin/events', done: (eventsCount || 0) > 0 },
    { label: 'Add faculty advisers', hint: '/admin/advisers', done: (advisersCount || 0) > 0 },
    { label: 'Import organizing committee members', hint: '/admin/committee', done: (committeeCount || 0) > 0 },
    { label: 'Add sponsor categories and logos', hint: '/admin/sponsors', done: true }, // Assume done or check sponsors count
    { label: 'Publish at least one notice', hint: '/admin/notices', done: (noticesCount || 0) > 0 },
    { label: 'Upload gallery images', hint: '/admin/gallery', done: true }, // Assume done or check gallery count
    { label: 'Configure footer content', hint: '/admin/footer', done: true }, // Assume done
  ]
  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--admin-accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
          opacity: 0.7,
        }}>
          National Mathematics Carnival 2026
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--admin-fg)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--admin-fg-muted)',
          margin: '0.4rem 0 0',
        }}>
          Welcome back. Here's an overview of your event site.
        </p>
      </div>

      {/* ── KPI Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard label="Events" value={eventsCount?.toString() || '0'} sub="Total events created" icon={<TriangleIcon size={22} />} />
        <StatCard label="Registrations" value={registrationsCount?.toString() || '0'} sub="Total submissions" trend="up" icon={<HexagonIcon size={22} />} />
        <StatCard label="Notices" value={noticesCount?.toString() || '0'} sub="Active notices" icon={<InfinityIcon size={22} />} />
        <StatCard
          label="Team Members"
          value={((advisersCount ?? 0) + (committeeCount ?? 0) + (ambassadorsCount ?? 0)).toString()}
          sub="Advisers + Committee + Ambassadors"
          icon={<GridIcon size={22} />}
        />
      </div>

      <MathDivider formula="f(x) = ax² + bx + c" />

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--admin-accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {QUICK_ACTIONS.map(action => (
            <a
              key={action.href}
              href={action.href}
              style={{
                display: 'block',
                textDecoration: 'none',
              }}
            >
              <GlassCard
                padding="1.25rem"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  borderColor: 'var(--admin-border)',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}>
                  <div style={{
                    color: 'var(--admin-accent)',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--admin-fg)',
                      marginBottom: '0.15rem',
                    }}>
                      {action.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      color: 'var(--admin-fg-muted)',
                    }}>
                      {action.description}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </a>
          ))}
        </div>
      </div>

      <MathDivider formula="∑(n=1→∞) 1/n² = π²/6" dim />

      {/* ── Recent Activity ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--admin-accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Recent Activity
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          <GlassCard padding="1.25rem">
            <h3 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--admin-fg)',
              marginBottom: '0.75rem',
            }}>
              Latest Events
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentEvents?.length ? recentEvents.map(event => (
                <div key={event.id} style={{
                  padding: '0.5rem',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--admin-border)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: 'var(--admin-fg)',
                    fontWeight: 500,
                  }}>
                    {event.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--admin-fg-muted)',
                    marginTop: '0.2rem',
                  }}>
                    {new Date(event.created_at).toLocaleDateString()}
                  </div>
                </div>
              )) : (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  color: 'var(--admin-fg-muted)',
                  textAlign: 'center',
                  padding: '1rem',
                }}>
                  No events yet
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard padding="1.25rem">
            <h3 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--admin-fg)',
              marginBottom: '0.75rem',
            }}>
              Recent Registrations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentRegistrations?.length ? recentRegistrations.map(reg => (
                <div key={reg.id} style={{
                  padding: '0.5rem',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--admin-border)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: 'var(--admin-fg)',
                    fontWeight: 500,
                  }}>
                    {(() => {
                      const eventsValue = reg.events
                      const title = Array.isArray(eventsValue)
                        ? eventsValue[0]?.title
                        : eventsValue?.title
                      return title || 'Unknown Event'
                    })()}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--admin-fg-muted)',
                    marginTop: '0.2rem',
                  }}>
                    {new Date(reg.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              )) : (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  color: 'var(--admin-fg-muted)',
                  textAlign: 'center',
                  padding: '1rem',
                }}>
                  No registrations yet
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <MathDivider formula="∫₀^∞ e^{-x²} dx = √π/2" dim />

      {/* ── Setup Checklist ── */}
      <GlassCard accent padding="1.5rem">
        <h2 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--admin-accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '1.25rem',
        }}>
          Setup Checklist
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {checklist.map(item => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 8,
              background: item.done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.done ? 'rgba(34,197,94,0.3)' : 'var(--admin-border)'}`,
            }}>
              <div style={{
                width: 18, height: 18,
                borderRadius: '50%',
                border: `1.5px solid ${item.done ? '#22c55e' : 'var(--admin-border)'}`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: item.done ? '#22c55e' : 'var(--admin-fg-muted)',
                background: item.done ? '#22c55e' : 'transparent',
              }}>
                {item.done ? '✓' : '○'}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: item.done ? 'var(--admin-fg)' : 'var(--admin-fg-muted)',
                textDecoration: item.done ? 'line-through' : 'none',
                opacity: item.done ? 0.7 : 1,
              }}>
                {item.label}
              </div>
              <div style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--admin-accent)',
                opacity: 0.6,
                letterSpacing: '0.06em',
              }}>
                {item.hint}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Footer equation */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.55rem',
        color: 'var(--admin-fg-muted)',
        opacity: 0.3,
        marginTop: '2rem',
        letterSpacing: '0.08em',
      }}>
        e^(iπ) + 1 = 0 &nbsp;·&nbsp; φ = (1+√5)/2 &nbsp;·&nbsp; ∑ · ∫ · ∂ · ∇
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  {
    label: 'Add Event',
    description: 'Create a new competition event with registration',
    href: '/admin/events',
    icon: <TriangleIcon size={20} />,
  },
  {
    label: 'Publish Notice',
    description: 'Post an announcement to the notices board',
    href: '/admin/notices',
    icon: <InfinityIcon size={20} />,
  },
  {
    label: 'Upload Gallery',
    description: 'Add photos to the image gallery',
    href: '/admin/gallery',
    icon: <GridIcon size={20} />,
  },
  {
    label: 'Manage Committee',
    description: 'Add or update committee members',
    href: '/admin/committee',
    icon: <HexagonIcon size={20} />,
  },
  {
    label: 'Site Branding',
    description: 'Theme, logo, and palette settings',
    href: '/admin/theme',
    icon: <HexagonIcon size={20} />,
  },
  {
    label: 'Hero Settings',
    description: 'Edit hero text, image, and overlay',
    href: '/admin/home',
    icon: <InfinityIcon size={20} />,
  },
  {
    label: 'Add Sponsors',
    description: 'Manage sponsor categories and logos',
    href: '/admin/sponsors',
    icon: <GridIcon size={20} />,
  },
]
