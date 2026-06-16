import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CommitteeMember, SubCommittee } from '@/types/database'
import { CommitteePublicView } from '@/components/public/CommitteePublicView'
import { getSeoTitle, getSeoDescription, getEventKeywords } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
	const supabase = await createClient()
	const [subCommitteesRes, membersRes] = await Promise.all([
		supabase.from('sub_committees').select('name'),
		supabase.from('committee_members').select('name, role'),
	])

	const subNames = (subCommitteesRes.data ?? []).map(sc => sc.name).filter(Boolean)
	const memberNames = (membersRes.data ?? []).map(m => m.name).filter(Boolean)
	const memberRoles = (membersRes.data ?? []).map(m => m.role).filter(Boolean)

	const dynamicKeywords = [...subNames, ...memberNames, ...memberRoles].join(', ')
	const keywords = getEventKeywords('Organizing Committee', 'Committee', dynamicKeywords)

	return {
		title: getSeoTitle('Organizing Committee'),
		description: getSeoDescription('Meet the dedicated team, organizers, and sub-committee members behind the National Mathematics Carnival 2026, managed and presented by Math Club at DUET.'),
		keywords,
		alternates: {
			canonical: '/committee',
		},
	}
}

export const dynamic = 'force-dynamic'

export default async function CommitteePage() {
	const supabase = await createClient()
	const [subCommitteesRes, membersRes] = await Promise.all([
		supabase.from('sub_committees').select('*').order('sort_order', { ascending: true }),
		supabase.from('committee_members').select('*').order('sort_order', { ascending: true }),
	])

	const subCommittees = (subCommitteesRes.data ?? []) as SubCommittee[]
	const members = (membersRes.data ?? []) as CommitteeMember[]

	return <CommitteePublicView subCommittees={subCommittees} members={members} />
}
