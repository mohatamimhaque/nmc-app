import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleDaySetting, ScheduleSession, SiteSettings } from '@/types/database'
import { SchedulePublicView } from '@/components/public/SchedulePublicView'

export const metadata: Metadata = {
	title: 'Program Schedule',
	description: 'Full program schedule for NMC 2026.',
}

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
	const supabase = await createClient()

	const [pageRes, sessionsRes, daysRes, settingsRes] = await Promise.all([
		supabase.from('page_visibility').select('is_visible').eq('page_key', 'schedule').single(),
		supabase.from('schedule_sessions').select('*').eq('is_visible', true).order('day_number', { ascending: true }).order('sort_order', { ascending: true }),
		supabase.from('schedule_day_settings').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('site_settings').select('*').single(),
	])

	if (pageRes.data?.is_visible === false) {
		notFound()
	}

	const sessions = (sessionsRes.data ?? []) as ScheduleSession[]
	const days = (daysRes.data ?? []) as ScheduleDaySetting[]
	const settings = (settingsRes.data ?? null) as SiteSettings | null

	return (
		<main style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
			<section style={{ maxWidth: 1000, margin: '0 auto 3rem' }}>
				<div style={heroCardStyle}>
					<div style={eyebrowStyle}>Schedule</div>
					<h1 style={titleStyle}>Program Schedule</h1>
					<p style={subtitleStyle}>National Mathematics Carnival 2026 — full program timeline.</p>
				</div>
			</section>
			<section style={{ maxWidth: 1100, margin: '0 auto' }}>
				<SchedulePublicView
					sessions={sessions}
					days={days}
					pdfUrl={settings?.schedule_pdf_url ?? null}
					eventDate={settings?.event_date ?? null}
				/>
			</section>
		</main>
	)
}

const eyebrowStyle: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: '0.65rem',
	letterSpacing: '0.14em',
	textTransform: 'uppercase',
	color: 'var(--color-accent)',
	marginBottom: '0.5rem',
}

const titleStyle: React.CSSProperties = {
	fontFamily: 'var(--font-heading)',
	fontSize: 'clamp(2rem,5vw,3rem)',
	fontWeight: 800,
	color: 'var(--foreground)',
	margin: 0,
}

const subtitleStyle: React.CSSProperties = {
	fontFamily: 'var(--font-body)',
	color: 'var(--foreground-muted)',
	maxWidth: 640,
	margin: '0.75rem auto 0',
	lineHeight: 1.6,
}

const heroCardStyle: React.CSSProperties = {
	textAlign: 'center',
	background: 'transparent',
	padding: '2.25rem 2rem',
}
