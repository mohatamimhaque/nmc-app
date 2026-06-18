import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Notice } from '@/types/database'
import { NoticesBoard } from '@/components/public/NoticesBoard'

export const metadata: Metadata = {
	title: 'Notices & Updates | NMC 2026',
	description: 'Stay updated with the latest announcements, notice board bulletins, schedule changes, and registration deadlines for National Mathematics Carnival 2026.',
	alternates: {
		canonical: '/notices',
	},
}

export const dynamic = 'force-dynamic'

export default async function NoticesPage() {
	const supabase = await createClient()
	const now = new Date().toISOString()

	const { data } = await supabase
		.from('notices')
		.select('*')
		.eq('is_visible', true)
		.lte('publish_at', now)
		.or(`expires_at.is.null,expires_at.gt.${now}`)
		.order('is_pinned', { ascending: false })
		.order('sort_order', { ascending: true })
		.order('publish_at', { ascending: false })

	const notices = (data ?? []) as Notice[]

	return (
		<main style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
			<section style={{ maxWidth: 1000, margin: '0 auto 3rem' }}>
				<div style={heroCardStyle}>
					<div style={eyebrowStyle}>Announcements</div>
					<h1 style={titleStyle}>Notices & Announcements</h1>
					<p style={subtitleStyle}>Updates, deadlines, and important announcements from the NMC team.</p>
				</div>
			</section>

			<section style={{ maxWidth: 900, margin: '0 auto' }}>
				<NoticesBoard notices={notices} />
			</section>
		</main>
	)
}

const eyebrowStyle: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: '0.65rem',
	letterSpacing: '0.14em',
	textTransform: 'uppercase',
	color: 'var(--color-accent)',
	marginBottom: '0.5rem',
}

const titleStyle: CSSProperties = {
	fontFamily: 'var(--font-heading)',
	fontSize: 'clamp(2rem,5vw,3rem)',
	fontWeight: 800,
	color: 'var(--foreground)',
	margin: 0,
}

const subtitleStyle: CSSProperties = {
	fontFamily: 'var(--font-body)',
	color: 'var(--foreground-muted)',
	maxWidth: 640,
	margin: '0.75rem auto 0',
	lineHeight: 1.6,
}

const heroCardStyle: CSSProperties = {
	textAlign: 'center',
	background: 'transparent',
	padding: '2.25rem 2rem',
}
