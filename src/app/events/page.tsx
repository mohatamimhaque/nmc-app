import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/types/database'
import { EventsPublicView } from '@/components/public/EventsPublicView'

export const metadata: Metadata = {
	title: 'Contests & Events — National Mathematics Carnival 2026',
	description: 'Explore all competitive contests, math olympiads, workshops, and exhibitions at the National Mathematics Carnival 2026. Register today and win grand prizes!',
	alternates: {
		canonical: '/events',
	},
}

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
	const supabase = await createClient()

	const [eventsRes] = await Promise.all([
		supabase.from('events').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
	])

	const events = (eventsRes.data ?? []) as Event[]
	return (
		<main style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
			<section style={{ padding: '2rem 1.5rem 3rem', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
				<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
					Events
				</div>
				<h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.4rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
					Events
				</h1>
				<div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 680, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
					Explore all competitions, workshops, and challenges at NMC 2026.
				</div>
			</section>
			<section style={{ maxWidth: 1200, margin: '0 auto' }}>
				<EventsPublicView events={events} />
			</section>
		</main>
	)
}
