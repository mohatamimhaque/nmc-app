import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'
import type { Sponsor, SponsorCategory } from '@/types/database'

export const metadata: Metadata = {
	title: 'Sponsors & Partners — National Mathematics Carnival 2026',
	description: 'Meet the proud sponsors, corporate partners, and media organizations supporting the National Mathematics Carnival 2026, organized by Math Club, DUET.',
}

export const dynamic = 'force-dynamic'

export default async function SponsorsPage() {
	const supabase = await createClient()

	const [categoriesRes, sponsorsRes] = await Promise.all([
		supabase.from('sponsor_categories').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('sponsors').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
	])

	const categories = (categoriesRes.data ?? []) as SponsorCategory[]
	const sponsors = (sponsorsRes.data ?? []) as Sponsor[]

	return (
		<main style={{ position: 'relative', zIndex: 1, paddingTop: '2rem' }}>
			<style>{`
				@keyframes card-in {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.sponsor-card {
					position: relative;
					overflow: hidden;
					opacity: 0;
					transform: translateY(10px);
					animation: card-in 500ms ease forwards;
				}
				.sponsor-card::after {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 55%);
					opacity: 0;
					transition: opacity 0.2s ease;
					pointer-events: none;
				}
				.sponsor-card:hover::after {
					opacity: 1;
				}
			`}</style>
			<section style={{ padding: '2.5rem 1.5rem 3rem', maxWidth: 1000, margin: '0 auto' }}>
				<div style={heroCardStyle}>
					<div style={eyebrowStyle}>Sponsors</div>
					<h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.3rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
						Sponsors & Partners
					</h1>
					<p style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
						We are grateful to the organisations supporting National Mathematics Carnival 2026.
					</p>
				</div>
			</section>

			{categories.map((category, index) => {
				const categorySponsors = sponsors.filter(sponsor => sponsor.category_id === category.id)
				if (!categorySponsors.length) return null
				return (
					<div key={category.id}>
						<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
							<SectionHeader eyebrow="Category" title={category.name} />
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
								{categorySponsors.map((sponsor, sponsorIndex) => {
									const content = (
										<div
											className="sponsor-card"
											style={{ ...sponsorCardStyle, animationDelay: `${sponsorIndex * 45}ms` }}
										>
											{(sponsor.display_mode === 'logo' || sponsor.display_mode === 'both') && sponsor.logo_url && (
												<img
													src={sponsor.logo_url}
													alt={sponsor.name}
													style={{ height: sponsor.logo_size === 'large' ? 72 : sponsor.logo_size === 'small' ? 36 : 52, objectFit: 'contain', maxWidth: '100%' }}
												/>
											)}
											{(sponsor.display_mode === 'name' || sponsor.display_mode === 'both') && (
												<div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', textAlign: 'center', marginTop: sponsor.logo_url ? '0.6rem' : 0 }}>
													{sponsor.name}
												</div>
											)}
										</div>
									)

									if (sponsor.website_url) {
										return (
											<a
												key={sponsor.id}
												href={sponsor.website_url}
												target="_blank"
												rel="noopener noreferrer"
												style={{ textDecoration: 'none', opacity: 0.95, transition: 'opacity 0.15s' }}
											>
												{content}
											</a>
										)
									}

									return (
										<div key={sponsor.id} style={{ opacity: 0.95 }}>
											{content}
										</div>
									)
								})}
							</div>
						</section>
						{index < categories.length - 1 && (
							<PublicMathDivider formula="sum(n=1..inf) 1/n^2 = pi^2/6" />
						)}
					</div>
				)
			})}
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

const sponsorCardStyle: React.CSSProperties = {
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
