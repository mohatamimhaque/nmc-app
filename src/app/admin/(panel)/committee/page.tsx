import { createClient } from '@/lib/supabase/server'
import type { CommitteeMember, SubCommittee } from '@/types/database'
import { CommitteeSettingsForm } from '@/components/admin/CommitteeSettingsForm'

export default async function CommitteeAdminPage() {
  const supabase = await createClient()

  const [subCommitteesRes, membersRes] = await Promise.all([
    supabase.from('sub_committees').select('*').order('sort_order', { ascending: true }),
    supabase.from('committee_members').select('*').order('sort_order', { ascending: true }),
  ])

  const subCommittees = (subCommitteesRes.data ?? []) as SubCommittee[]
  const members = (membersRes.data ?? []) as CommitteeMember[]

  return (
    <CommitteeSettingsForm
      initialSubCommittees={subCommittees}
      initialMembers={members}
    />
  )
}
