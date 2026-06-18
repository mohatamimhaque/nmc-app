import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'
import { RichHtml } from '@/components/public/RichHtml'
import {
	DEFAULT_ABOUT_HIGHLIGHTS,
	DEFAULT_ABOUT_MILESTONES,
	DEFAULT_ABOUT_PAGE,
	DEFAULT_ABOUT_SECTIONS,
} from '@/lib/aboutPage'
import type {
	AboutHighlight,
	AboutMilestone,
	AboutPage,
	AboutTeamMember,
	Adviser,
	CommitteeMember,
	PageSection,
} from '@/types/database'

export const metadata: Metadata = {
	title: 'About Us | NMC 2026 | DUET',
	description: 'Discover the history, mission, and vision of Math Club DUET and the annual National Mathematics Carnival. Meet our team driving mathematics excellence in BD.',
	alternates: {
		canonical: '/about',
	},
}

export default async function AboutPage() {
	const supabase = await createClient()

	const [
		aboutRes,
		committeeRes,
		advisersRes,
		teamRes,
		milestonesRes,
		highlightsRes,
		sectionsRes,
	] = await Promise.all([
		supabase.from('about_page').select('*').single(),
		supabase.from('committee_members').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('advisers').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('about_team_members').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('about_milestones').select('*').order('sort_order', { ascending: true }),
		supabase.from('about_highlights').select('*').order('sort_order', { ascending: true }),
		supabase.from('page_sections').select('*').eq('page', 'about').order('sort_order', { ascending: true }),
	])

	const aboutPage = (aboutRes.data ?? DEFAULT_ABOUT_PAGE) as AboutPage
	const committee = (committeeRes.data ?? []) as CommitteeMember[]
	const advisers = (advisersRes.data ?? []) as Adviser[]
	const aboutTeam = (teamRes.data ?? []) as AboutTeamMember[]
	const milestones = (milestonesRes.data ?? DEFAULT_ABOUT_MILESTONES) as AboutMilestone[]
	const highlights = (highlightsRes.data ?? DEFAULT_ABOUT_HIGHLIGHTS) as AboutHighlight[]
	const sections = ((sectionsRes.data ?? []) as PageSection[])
		.sort((a, b) => a.sort_order - b.sort_order)
	const orderedSections = sections.length ? sections : DEFAULT_ABOUT_SECTIONS

	const teamMembers = aboutTeam.length ? aboutTeam : committee
	const visibleMilestones = milestones.filter(item => item.is_visible !== false)
	const visibleHighlights = highlights.filter(item => item.is_visible !== false)

	const sectionMap: Record<string, React.ReactNode> = {
		about_overview: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
				<SectionHeader eyebrow="About" title={aboutPage.overview_section_title} sub={aboutPage.overview_section_subtitle} />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
					<div className="about-card" style={{ ...cardStyle, ...revealStyle(0) }}>
						<div style={eyebrowStyle}>{aboutPage.overview_section_title}</div>
						<h3 style={cardTitleStyle}>{aboutPage.overview_title}</h3>
						<div style={cardBodyStyle}><RichHtml html={aboutPage.overview_body} /></div>
					</div>
					<div className="about-card" style={{ ...cardStyle, ...revealStyle(80) }}>
						<div style={eyebrowStyle}>{aboutPage.nmc_eyebrow}</div>
						<h3 style={cardTitleStyle}>{aboutPage.nmc_title}</h3>
						<div style={cardBodyStyle}><RichHtml html={aboutPage.nmc_body} /></div>
						<Link href={aboutPage.nmc_cta_url} style={primaryLinkStyle}>{aboutPage.nmc_cta_label}</Link>
					</div>
				</div>
			</section>
		),
		about_mission: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
				<SectionHeader eyebrow="Purpose" title={aboutPage.mission_section_title} />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
					<div className="about-card" style={{ ...cardStyle, ...revealStyle(0) }}>
						<div style={eyebrowStyle}>{aboutPage.mission_title}</div>
						<div style={cardBodyStyle}><RichHtml html={aboutPage.mission_body} /></div>
					</div>
					<div className="about-card" style={{ ...cardStyle, ...revealStyle(80) }}>
						<div style={eyebrowStyle}>{aboutPage.vision_title}</div>
						<div style={cardBodyStyle}><RichHtml html={aboutPage.vision_body} /></div>
					</div>
				</div>
			</section>
		),
		about_team_strip: (
			teamMembers.length ? (
				<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
					<SectionHeader eyebrow="Committee" title={aboutPage.team_title} sub={aboutPage.team_subtitle} />
					<div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '1rem' }}>
						{teamMembers.slice(0, 8).map(member => (
							<div key={member.id} style={{ flexShrink: 0, textAlign: 'center', width: 150 }}>
								<div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.6rem', background: 'var(--border)', border: '2px solid var(--color-primary)' }}>
									{member.photo_url ? (
										<img src={member.photo_url} alt={member.name ?? 'Team member'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									) : (
										<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
											{member.name?.[0] ?? 'M'}
										</div>
									)}
								</div>
								<div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{member.name}</div>
								{'role' in member && member.role && (
									<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--foreground-muted)', marginTop: 2 }}>{member.role}</div>
								)}
							</div>
						))}
					</div>
					<div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
						<Link href={aboutPage.committee_cta_url} style={secondaryLinkStyle}>{aboutPage.committee_cta_label}</Link>
					</div>
				</section>
			) : null
		),
		about_milestones: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
				<SectionHeader eyebrow="Timeline" title={aboutPage.milestones_title} sub={aboutPage.milestones_subtitle} />
				<div style={{ display: 'grid', gap: '1rem' }}>
					{visibleMilestones.map((item, index) => (
						<div key={`${item.year}-${item.title}`} className="about-card" style={{ ...cardStyle, ...revealStyle(index * 50), display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
							<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-primary)', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', padding: '0.25rem 0.6rem', borderRadius: 999 }}>
								{item.year}
							</div>
							<div>
								<div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.35rem' }}>{item.title}</div>
								<div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
									<RichHtml html={item.description} />
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		),
		about_advisers_strip: (
			advisers.length ? (
				<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
					<SectionHeader eyebrow="Advisers" title={aboutPage.advisers_title} sub={aboutPage.advisers_subtitle} />
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
						{advisers.slice(0, 6).map((adviser, index) => (
							<div key={adviser.id} className="about-card" style={{ ...cardStyle, ...revealStyle(index * 50) }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
									<div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: 'var(--border)', border: '1px solid var(--border)' }}>
										{adviser.photo_url ? (
											<img src={adviser.photo_url} alt={adviser.name ?? 'Adviser'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
										) : (
											<div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
												{adviser.name?.[0] ?? 'A'}
											</div>
										)}
									</div>
									<div>
										<div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>{adviser.name}</div>
										{adviser.designation && (
											<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--foreground-muted)', marginTop: 2 }}>{adviser.designation}</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
					<div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
						<Link href={aboutPage.advisers_cta_url} style={secondaryLinkStyle}>{aboutPage.advisers_cta_label}</Link>
					</div>
				</section>
			) : null
		),
		about_past_events: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
				<SectionHeader eyebrow="Highlights" title={aboutPage.past_events_title} sub={aboutPage.past_events_subtitle} />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
					{visibleHighlights.map((item, index) => (
						<div key={item.title} className="about-card" style={{ ...cardStyle, ...revealStyle(index * 50) }}>
							<div style={eyebrowStyle}>Highlight</div>
							<div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>{item.title}</div>
							<div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--foreground-muted)', lineHeight: 1.55 }}>
								<RichHtml html={item.detail} />
							</div>
						</div>
					))}
				</div>
				<div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
					<Link href={aboutPage.past_events_cta_url} style={secondaryLinkStyle}>{aboutPage.past_events_cta_label}</Link>
				</div>
			</section>
		),
	}

	const visibleSections = orderedSections.filter(
		section => section.is_visible && sectionMap[section.section_key]
	)

	return (
		<main style={{ position: 'relative', zIndex: 1, paddingTop: '2rem' }}>
			<style>{`
				@keyframes card-in {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.about-card {
					position: relative;
					overflow: hidden;
				}
				.about-card::after {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 55%);
					opacity: 0;
					transition: opacity 0.2s ease;
					pointer-events: none;
				}
				.about-card:hover::after {
					opacity: 1;
				}
			`}</style>
			<section style={{ padding: '2.5rem 1.5rem 3rem', maxWidth: 1000, margin: '0 auto' }}>
				<div style={heroCardStyle}>
					<div style={eyebrowStyle}>About</div>
					<h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.4rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
						{aboutPage.hero_title}
					</h1>
					<div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 680, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
						<RichHtml html={aboutPage.hero_subtitle} />
					</div>
				</div>
			</section>

			{visibleSections.map((section, index) => (
				<div key={section.section_key}>
					{sectionMap[section.section_key]}
					{index < visibleSections.length - 1 && (
						<PublicMathDivider formula="sum(n=1..inf) 1/n^2 = pi^2/6" />
					)}
				</div>
			))}
		</main>
	)
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
	return (
		<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
			{eyebrow && (
				<div style={{ ...eyebrowStyle, marginBottom: '0.5rem' }}>{eyebrow}</div>
			)}
			<h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
				{title}
			</h2>
			{sub && (
				<div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
					<RichHtml html={sub} />
				</div>
			)}
		</div>
	)
}

const revealStyle = (delayMs: number): React.CSSProperties => ({
	animation: 'card-in 500ms ease forwards',
	animationDelay: `${delayMs}ms`,
	opacity: 0,
	transform: 'translateY(10px)',
})

const eyebrowStyle: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: '0.65rem',
	letterSpacing: '0.14em',
	textTransform: 'uppercase',
	color: 'var(--color-accent)',
}

const cardStyle: React.CSSProperties = {
	background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)',
	border: '1px solid var(--border)',
	borderRadius: 20,
	padding: '1.6rem',
	boxShadow: 'var(--shadow-md)',
}

const cardTitleStyle: React.CSSProperties = {
	fontFamily: 'var(--font-heading)',
	fontWeight: 700,
	fontSize: '1.1rem',
	color: 'var(--foreground)',
	marginBottom: '0.6rem',
}

const cardBodyStyle: React.CSSProperties = {
	fontFamily: 'var(--font-body)',
	fontSize: '0.9rem',
	color: 'var(--foreground-muted)',
	lineHeight: 1.6,
	margin: 0,
}

const primaryLinkStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.4rem',
	marginTop: '0.9rem',
	background: 'var(--color-primary)',
	color: '#fff',
	fontFamily: 'var(--font-body)',
	fontWeight: 600,
	fontSize: '0.85rem',
	padding: '0.5rem 1.25rem',
	borderRadius: 8,
	textDecoration: 'none',
}

const secondaryLinkStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.4rem',
	fontFamily: 'var(--font-body)',
	fontWeight: 600,
	color: 'var(--color-primary)',
	textDecoration: 'none',
	border: '1.5px solid var(--color-primary)',
	padding: '0.6rem 1.5rem',
	borderRadius: 8,
}

const heroCardStyle: React.CSSProperties = {
	textAlign: 'center',
	background: 'transparent',
	padding: '2.5rem 2rem',
}
