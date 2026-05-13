import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const RANGE_OPTIONS = new Set([14, 30, 90])

function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escapeValue = (value: string | number | null) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(key => escapeValue(row[key])).join(','))
  }
  return lines.join('\n')
}

export async function GET(request: Request) {
  const guard = await requireAdminRole(['super_admin', 'admin', 'moderator'])
  if ('response' in guard) {
    return guard.response
  }

  const { supabase } = guard
  const url = new URL(request.url)
  const type = url.searchParams.get('type') ?? 'events'
  const rangeValue = Number(url.searchParams.get('range') ?? 14)
  const range = RANGE_OPTIONS.has(rangeValue) ? rangeValue : 14

  if (type === 'events') {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (range - 1))
    startDate.setHours(0, 0, 0, 0)

    const { data: analyticsEvents, error } = await supabase
      .from('analytics_events')
      .select('created_at, event_type, page_path, referrer, country_code, screen_width, session_id')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const rows = (analyticsEvents ?? []).map(event => ({
      created_at: event.created_at,
      event_type: event.event_type,
      page_path: event.page_path,
      referrer: event.referrer ?? '',
      country_code: event.country_code ?? '',
      screen_width: event.screen_width ?? '',
      session_id: event.session_id ?? '',
    }))

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-events-${range}d.csv"`,
      },
    })
  }

  if (type === 'ops') {
    const [
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

    const rows = [
      {
        generated_at: new Date().toISOString(),
        events_count: eventsCount ?? 0,
        notices_count: noticesCount ?? 0,
        gallery_count: galleryCount ?? 0,
        schedule_sessions_count: scheduleSessionsCount ?? 0,
        schedule_days_count: scheduleDaysCount ?? 0,
        contact_submissions_count: contactCount ?? 0,
        advisers_count: advisersCount ?? 0,
        committee_count: committeeCount ?? 0,
        ambassadors_count: ambassadorsCount ?? 0,
      },
    ]

    const csv = toCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="operational-stats.csv"',
      },
    })
  }

  return NextResponse.json({ error: 'Invalid export type.' }, { status: 400 })
}
