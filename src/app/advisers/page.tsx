import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Adviser } from '@/types/database'
import { AdvisersPublicView } from '@/components/public/AdvisersPublicView'
import { getSeoTitle, getSeoDescription, getEventKeywords } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('advisers')
		.select('name, designation, institution, department')
		.eq('is_visible', true)

	const names = (data ?? []).map(a => a.name).filter(Boolean)
	const designations = (data ?? []).map(a => a.designation).filter(Boolean)
	const institutions = (data ?? []).map(a => a.institution).filter(Boolean)
	const depts = (data ?? []).map(a => a.department).filter(Boolean)

	const dynamicKeywords = [...names, ...designations, ...institutions, ...depts].join(', ')
	const keywords = getEventKeywords('Advisers & Mentors', 'Mentors', dynamicKeywords)

	return {
		title: getSeoTitle('Advisers & Mentors'),
		description: getSeoDescription('Meet the esteemed faculty members, industry experts, and professional advisors guiding the National Mathematics Carnival 2026, hosted by Math Club at DUET.'),
		keywords,
		alternates: {
			canonical: '/advisers',
		},
	}
}

export const dynamic = 'force-dynamic'

export default async function AdvisersPage() {
	const supabase = await createClient()
	const [visibilityRes, dataRes] = await Promise.all([
		supabase.from('page_visibility').select('is_visible').eq('page_key', 'advisers').single(),
		supabase.from('advisers').select('*').eq('is_visible', true).order('sort_order', { ascending: true })
	])

	if (visibilityRes.data?.is_visible === false) {
		notFound()
	}

	const advisers = (dataRes.data ?? []) as Adviser[]

	return <AdvisersPublicView advisers={advisers} />
}
