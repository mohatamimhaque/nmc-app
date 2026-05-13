import { createClient } from '@/lib/supabase/server'
import { GlassCard, StatCard } from '@/components/admin/GlassCard'
import { MathDivider } from '@/components/admin/MathDivider'
import { R2MetricsCard } from '@/components/admin/R2MetricsCard'
import {
  GridIcon,
  HexagonIcon,
  TriangleIcon,
  InfinityIcon,
} from '@/components/admin/GeoIcons'

type AnalyticsEventRow = {
  id: string
  event_type: 'pageview' | 'cta_click' | 'notice_view' | 'form_submit'
  page_path: string
  created_at: string
}

const RANGE_OPTIONS = [14, 30, 90]
const MAX_EVENTS = 1000
const EVENT_COLORS: Record<AnalyticsEventRow['event_type'], string> = {
  pageview: '#60a5fa',
  cta_click: '#f59e0b',
  notice_view: '#34d399',
  form_submit: '#a78bfa',
}

function buildDayBuckets(start: Date, count: number) {
  const buckets: { key: string; label: string; count: number }[] = []
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets.push({ key, label, count: 0 })
  }
  return buckets
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const supabase = await createClient()

  const params = await searchParams
  const rangeValue = Number(params?.range ?? 14)
  const activeRange = RANGE_OPTIONS.includes(rangeValue) ? rangeValue : 14

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - (activeRange - 1))
  startDate.setHours(0, 0, 0, 0)

  const [
    { data: analyticsEvents },
    { data: siteSettings },
    { count: eventsCount },
    { count: noticesCount },
    { count: galleryCount },
    { count: scheduleSessionsCount },
    { count: scheduleDaysCount },
    { count: contactCount },
    { count: advisersCount },
    { count: committeeCount },
    { count: ambassadorsCount },
  ] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id, event_type, page_path, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(MAX_EVENTS),
    supabase
      .from('site_settings')
      .select('site_title, logo_url, hero_image_url, event_date, schedule_pdf_url')
      .single(),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('notices').select('*', { count: 'exact', head: true }),
    supabase.from('gallery_images').select('*', { count: 'exact', head: true }),
    supabase.from('schedule_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('schedule_day_settings').select('*', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('advisers').select('*', { count: 'exact', head: true }),
    supabase.from('committee_members').select('*', { count: 'exact', head: true }),
    supabase.from('campus_ambassadors').select('*', { count: 'exact', head: true }),
  ])

  const events = (analyticsEvents ?? []) as AnalyticsEventRow[]
  const dayBuckets = buildDayBuckets(startDate, activeRange)
  const dayLookup = new Map(dayBuckets.map(bucket => [bucket.key, bucket]))

  const eventTypeCounts: Record<AnalyticsEventRow['event_type'], number> = {
    pageview: 0,
    cta_click: 0,
    notice_view: 0,
    form_submit: 0,
  }

  const pageViewCounts: Record<string, number> = {}
  for (const event of events) {
    const dayKey = event.created_at.slice(0, 10)
    const bucket = dayLookup.get(dayKey)
    if (bucket) bucket.count += 1

    eventTypeCounts[event.event_type] += 1

    if (event.event_type === 'pageview') {
      pageViewCounts[event.page_path] = (pageViewCounts[event.page_path] || 0) + 1
    }
  }

  const totalEvents = events.length
  const topPages = Object.entries(pageViewCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const latestEvents = [...events]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8)

  const maxDaily = Math.max(1, ...dayBuckets.map(bucket => bucket.count))
  const linePoints = dayBuckets
    .map((bucket, index) => {
      const x = (index / (activeRange - 1)) * 100
      const y = 100 - (bucket.count / maxDaily) * 100
      return `${x},${y}`
    })
    .join(' ')

  const pieTotal = Object.values(eventTypeCounts).reduce((sum, value) => sum + value, 0)
  let pieOffset = 0
  const pieStops = (Object.keys(eventTypeCounts) as AnalyticsEventRow['event_type'][]).map(type => {
    const value = eventTypeCounts[type]
    const portion = pieTotal ? (value / pieTotal) * 100 : 0
    const stop = `${EVENT_COLORS[type]} ${pieOffset}% ${pieOffset + portion}%`
    pieOffset += portion
    return { type, value, stop, portion }
  })
  const pieBackground = pieStops.length
    ? `conic-gradient(${pieStops.map(stop => stop.stop).join(', ')})`
    : 'conic-gradient(#1f2937 0% 100%)'

  const siteConfigured = Boolean(siteSettings?.site_title && siteSettings?.logo_url && siteSettings?.event_date)
  const programReady = (eventsCount || 0) > 0 && (scheduleSessionsCount || 0) > 0
  const contentReady = (noticesCount || 0) > 0 && (galleryCount || 0) > 0
  const peopleReady = (advisersCount || 0) + (committeeCount || 0) + (ambassadorsCount || 0) > 0
  const storageReady = (galleryCount || 0) > 0 && Boolean(siteSettings?.hero_image_url)
  const databaseStatus = events.length >= 0 ? 'Connected' : 'Unknown'

  const dailyAverage = dayBuckets.reduce((sum, bucket) => sum + bucket.count, 0) / activeRange
  const lastDayCount = dayBuckets[dayBuckets.length - 1]?.count ?? 0
  const trafficSpike = lastDayCount > dailyAverage * 1.5

  const readinessScore = [siteConfigured, programReady, contentReady, peopleReady, storageReady]
    .filter(Boolean).length
  const readinessPercent = Math.round((readinessScore / 5) * 100)

  return (
    <div style={{ maxWidth: 1100 }}>
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
          Analytics Center
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--admin-fg)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          Site Health and Performance
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--admin-fg-muted)',
          margin: '0.4rem 0 0',
        }}>
          Monitor traffic, program readiness, storage, and data signals across the site.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem' }}>
          {RANGE_OPTIONS.map(option => (
            <a
              key={option}
              href={`/admin/analytics?range=${option}`}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 999,
                border: `1px solid ${option === activeRange ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                background: option === activeRange ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: option === activeRange ? 'var(--admin-accent)' : 'var(--admin-fg-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {option} days
            </a>
          ))}
          <a
            href={`/api/admin/analytics/export?type=events&range=${activeRange}`}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 999,
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-fg-muted)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Export events CSV
          </a>
          <a
            href="/api/admin/analytics/export?type=ops"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 999,
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-fg-muted)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Export ops CSV
          </a>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard label="Visitors" value={eventTypeCounts.pageview} sub={`Pageviews (${activeRange}d)`} icon={<GridIcon size={22} />} />
        <StatCard label="CTA Clicks" value={eventTypeCounts.cta_click} sub="Primary actions" trend={eventTypeCounts.cta_click ? 'up' : 'flat'} icon={<TriangleIcon size={22} />} />
        <StatCard label="Notice Views" value={eventTypeCounts.notice_view} sub="Notice engagement" icon={<InfinityIcon size={22} />} />
        <StatCard label="Form Submits" value={eventTypeCounts.form_submit} sub="Registrations + contact" icon={<HexagonIcon size={22} />} />
      </div>

      <MathDivider formula="y = mx + b" dim />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <GlassCard padding="1.25rem" accent>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', opacity: 0.7 }}>
            Site Configuration
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--admin-fg)' }}>
            {siteConfigured ? 'Healthy' : 'Needs setup'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
            {siteConfigured ? 'Branding and event date configured.' : 'Missing logo or event date.'}
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem" accent>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', opacity: 0.7 }}>
            Program Readiness
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--admin-fg)' }}>
            {programReady ? 'On track' : 'Missing schedule'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
            {programReady ? 'Events and schedule sessions are populated.' : 'Add events or schedule sessions.'}
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem" accent>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', opacity: 0.7 }}>
            Storage Signals
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--admin-fg)' }}>
            {storageReady ? 'Active' : 'Needs assets'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
            {galleryCount || 0} gallery items, hero image {siteSettings?.hero_image_url ? 'set' : 'missing'}.
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem" accent>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', opacity: 0.7 }}>
            Database
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--admin-fg)' }}>
            {databaseStatus}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
            Last analytics event: {latestEvents[0] ? formatDate(latestEvents[0].created_at) : 'No activity'}
          </div>
        </GlassCard>
        <R2MetricsCard />
      </div>

      <MathDivider formula="\u03a3 = \u2211" dim />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Traffic Trend ({activeRange}d)
          </div>
          <div style={{ height: 140 }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
              <polyline
                points={linePoints}
                fill="none"
                stroke="var(--admin-accent)"
                strokeWidth="2"
              />
              <polygon
                points={`0,100 ${linePoints} 100,100`}
                fill="rgba(59,130,246,0.15)"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
            <span>{dayBuckets[0]?.label}</span>
            <span>avg {Math.round(dailyAverage)}</span>
            <span>{dayBuckets[dayBuckets.length - 1]?.label}</span>
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Event Types
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: pieBackground,
              border: '1px solid var(--admin-border)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {pieStops.map(stop => (
                <div key={stop.type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: EVENT_COLORS[stop.type], display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg)' }}>
                    {stop.type.replace('_', ' ')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)' }}>
                    {pieTotal ? Math.round(stop.portion) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Top Pages
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topPages.length ? topPages.map(page => {
              const width = Math.max(8, Math.round((page.count / Math.max(1, topPages[0].count)) * 100))
              return (
                <div key={page.path}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg)' }}>
                    <span>{page.path}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--admin-fg-muted)' }}>{page.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: '0.3rem' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: 'var(--admin-accent)' }} />
                  </div>
                </div>
              )
            }) : (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
                No pageview data yet.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <MathDivider formula="P(A|B) = P(A \u2229 B) / P(B)" dim />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Advanced Signals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
                Readiness score: {readinessPercent}%
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.25rem' }}>
                {readinessScore}/5 core systems configured.
              </div>
            </div>
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: trafficSpike ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
            }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
                {trafficSpike ? 'Traffic spike detected' : 'Traffic steady'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.25rem' }}>
                Last day {lastDayCount} vs avg {Math.round(dailyAverage)}.
              </div>
            </div>
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: contentReady ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
            }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
                Content coverage
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.25rem' }}>
                Notices: {noticesCount || 0}, gallery: {galleryCount || 0}, schedule days: {scheduleDaysCount || 0}.
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Latest Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {latestEvents.length ? latestEvents.map(event => (
              <div key={event.id} style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 10,
                border: '1px solid var(--admin-border)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
                  {event.event_type.replace('_', ' ')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', marginTop: '0.25rem' }}>
                  <span>{event.page_path}</span>
                  <span>{formatDate(event.created_at)}</span>
                </div>
              </div>
            )) : (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
                No analytics events tracked yet.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard padding="1.25rem">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
            Operational Summary
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
              <span>Events created</span>
              <span>{eventsCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
              <span>Schedule sessions</span>
              <span>{scheduleSessionsCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
              <span>Contact submissions</span>
              <span>{contactCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
              <span>People profiles</span>
              <span>{(advisersCount || 0) + (committeeCount || 0) + (ambassadorsCount || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
              <span>Readiness</span>
              <span>{readinessPercent}%</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
