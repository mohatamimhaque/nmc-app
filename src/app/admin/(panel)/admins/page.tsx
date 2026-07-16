import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/admin/GlassCard'
import { AdminUsersPanel, type AdminUserRow } from '@/components/admin/AdminUsersPanel'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminRecord?.role !== 'super_admin') {
    return (
      <GlassCard padding="1.5rem" accent>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--admin-fg)' }}>
          Access restricted
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--admin-fg-muted)', marginTop: '0.5rem' }}>
          Only super admins can manage admin users.
        </div>
      </GlassCard>
    )
  }

  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, can_manage_volunteers, last_login_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--admin-accent)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
          opacity: 0.7,
        }}>
          Admin Access Control
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--admin-fg)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          Manage Admin Users
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--admin-fg-muted)',
          margin: '0.4rem 0 0',
        }}>
          Create admin and moderator accounts with scoped access.
        </p>
      </div>

      <AdminUsersPanel initialUsers={(adminUsers ?? []) as AdminUserRow[]} currentUserId={user.id} />
    </div>
  )
}
