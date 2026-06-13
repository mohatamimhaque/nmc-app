import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'
import { ContactForm } from '@/components/public/ContactForm'
import { RichHtml } from '@/components/public/RichHtml'
import { DEFAULT_CONTACT_PAGE, DEFAULT_CONTACT_SECTIONS } from '@/lib/contactPage'
import type { ContactPage, ContactPerson, FooterSettings, PageSection } from '@/types/database'
import { DEFAULT_FOOTER_SETTINGS } from '@/lib/siteSettings'

export const metadata: Metadata = {
	title: 'Contact Us — National Mathematics Carnival 2026 | DUET',
	description: 'Get in touch with the National Mathematics Carnival 2026 organizing team. Find email addresses, phone contacts, location maps, and the general inquiry form.',
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
	const supabase = await createClient()

	const [pageRes, personsRes, sectionsRes, footerRes] = await Promise.all([
		supabase.from('contact_page').select('*').single(),
		supabase.from('contact_persons').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
		supabase.from('page_sections').select('*').eq('page', 'contact').order('sort_order', { ascending: true }),
		supabase.from('footer_settings').select('*').single(),
	])

	const page = (pageRes.data ?? DEFAULT_CONTACT_PAGE) as ContactPage
	const persons = (personsRes.data ?? []) as ContactPerson[]
	const sections = ((sectionsRes.data ?? []) as PageSection[])
		.sort((a, b) => a.sort_order - b.sort_order)
	const orderedSections = sections.length ? sections : DEFAULT_CONTACT_SECTIONS
	const footerSettings = (footerRes.data ?? DEFAULT_FOOTER_SETTINGS) as FooterSettings

	const socialLinks = [
		{ label: 'Facebook', url: footerSettings.facebook_url, show: footerSettings.show_facebook },
		{ label: 'YouTube', url: footerSettings.youtube_url, show: footerSettings.show_youtube },
		{ label: 'Instagram', url: footerSettings.instagram_url, show: footerSettings.show_instagram },
		{ label: 'LinkedIn', url: footerSettings.linkedin_url, show: footerSettings.show_linkedin },
		{ label: 'Twitter', url: footerSettings.twitter_url, show: footerSettings.show_twitter },
	].filter(item => item.show && item.url)

	const sectionMap: Record<string, React.ReactNode> = {
		contact_form: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
				<ContactForm title={page.form_title} subtitle={page.form_subtitle} />
			</section>
		),
		contact_persons: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
				<SectionHeader eyebrow="Team" title="Contact Persons" sub="Reach our organizers directly." />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
					{persons.map((person, index) => (
						<div
							key={person.id}
							className="contact-card"
							style={{
								...cardStyle,
								animation: 'card-in 500ms ease forwards',
								animationDelay: `${index * 45}ms`,
								opacity: 0,
								transform: 'translateY(10px)',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
								<div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', background: 'rgba(148,163,184,0.2)' }}>
									{person.photo_url ? (
										<img src={person.photo_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									) : (
										<div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '1.15rem' }}>
											{person.name?.[0] ?? 'C'}
										</div>
									)}
								</div>
								<div>
									<div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--foreground)', fontSize: '1rem' }}>{person.name}</div>
									{person.designation && (
										<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--foreground-muted)', marginTop: 4 }}>{person.designation}</div>
									)}
								</div>
							</div>
							<div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.4rem' }}>
								{person.show_email && person.email && (
									<a href={`mailto:${person.email}`} style={inlineLinkStyle}>{person.email}</a>
								)}
								{person.show_phone && person.phone && (
									<a href={`tel:${person.phone}`} style={inlineLinkStyle}>{person.phone}</a>
								)}
							</div>
						</div>
					))}
				</div>
			</section>
		),
		contact_location: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
				<SectionHeader eyebrow="Location" title={page.location_title} sub={page.location_body} />
				{page.map_embed_url && (
					<div style={{ marginTop: '1.5rem', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
						<iframe
							src={page.map_embed_url}
							title="Map"
							style={{ width: '100%', height: 360, border: 0 }}
							loading="lazy"
						/>
					</div>
				)}
			</section>
		),
		contact_social: (
			<section style={{ padding: '4rem 1.5rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
				<SectionHeader eyebrow="Social" title={page.social_title} />
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
					{socialLinks.map(link => (
						<Link key={link.label} href={link.url!} style={chipStyle} target="_blank" rel="noopener noreferrer">
							{link.label}
						</Link>
					))}
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
				.contact-card {
					position: relative;
					overflow: hidden;
				}
				.contact-card::after {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 55%);
					opacity: 0;
					transition: opacity 0.2s ease;
					pointer-events: none;
				}
				.contact-card:hover::after {
					opacity: 1;
				}
			`}</style>
			<section style={{ padding: '2.5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto' }}>
				<div style={heroCardStyle}>
					<div style={eyebrowStyle}>Contact</div>
					<h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.2rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
						{page.hero_title}
					</h1>
					<div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
						<RichHtml html={page.hero_subtitle} />
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
			{eyebrow && <div style={{ ...eyebrowStyle, marginBottom: '0.5rem' }}>{eyebrow}</div>}
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

const inlineLinkStyle: React.CSSProperties = {
	fontFamily: 'var(--font-body)',
	fontSize: '0.85rem',
	color: 'var(--color-primary)',
	textDecoration: 'none',
}

const chipStyle: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.35rem',
	fontFamily: 'var(--font-body)',
	fontWeight: 600,
	color: 'var(--color-primary)',
	textDecoration: 'none',
	border: '1.5px solid var(--color-primary)',
	padding: '0.55rem 1.2rem',
	borderRadius: 999,
}

const heroCardStyle: React.CSSProperties = {
	textAlign: 'center',
	background: 'transparent',
	padding: '2.5rem 2rem',
}
