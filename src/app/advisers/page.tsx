import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Adviser } from '@/types/database'
import { AdvisersPublicView } from '@/components/public/AdvisersPublicView'

export const metadata: Metadata = {
	title: 'Advisers',
	description: 'Faculty and professional advisers for NMC 2026.',
}

export const dynamic = 'force-dynamic'

export default async function AdvisersPage() {
	const supabase = await createClient()
	const { data } = await supabase
		.from('advisers')
		.select('*')
		.eq('is_visible', true)
		.order('sort_order', { ascending: true })

	const advisers = (data ?? []) as Adviser[]

	return <AdvisersPublicView advisers={advisers} />
}
