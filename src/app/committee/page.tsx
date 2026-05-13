import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CommitteeMember, SubCommittee } from '@/types/database'
import { CommitteePublicView } from '@/components/public/CommitteePublicView'

export const metadata: Metadata = {
	title: 'Organizing Committee',
	description: 'Meet the organizing committee of NMC 2026.',
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
