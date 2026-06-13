import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { GalleryCategory, GalleryImage } from '@/types/database'
import { GalleryGrid } from '@/components/public/GalleryGrid'

export const metadata: Metadata = {
	title: 'Gallery & Moments — National Mathematics Carnival 2026',
	description: 'Browse the photo gallery and highlights of National Mathematics Carnival 2026. Explore captured moments of math olympiads and contests by Math Club, DUET.',
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage({ searchParams }: { searchParams?: Promise<{ image?: string }> }) {
	const supabase = await createClient()
	const params = await searchParams

	const [categoriesRes, imagesRes] = await Promise.all([
		supabase.from('gallery_categories').select('*').order('sort_order', { ascending: true }),
		supabase.from('gallery_images').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
	])

	const categories = (categoriesRes.data ?? []) as GalleryCategory[]
	const images = (imagesRes.data ?? []) as GalleryImage[]

	return (
		<main style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
			<section style={{ maxWidth: 1000, margin: '0 auto 3rem', textAlign: 'center' }}>
				<div style={eyebrowStyle}>Gallery</div>
				<h1 style={titleStyle}>Moments & Highlights</h1>
				<p style={subtitleStyle}>
					A visual archive of competitions, ceremonies, and community moments from NMC 2026.
				</p>
			</section>

			<section style={{ maxWidth: 1100, margin: '0 auto' }}>
				<GalleryGrid categories={categories} images={images} initialImageId={params?.image ?? null} />
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
