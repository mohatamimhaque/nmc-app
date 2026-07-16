import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/admin/GlassCard'
import { LocationConfigForm } from '@/components/admin/LocationConfigForm'

export default async function AdminLocationConfigPage() {
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
          Only super admins can manage location settings.
        </div>
      </GlassCard>
    )
  }

  // Fetch current configuration
  const { data: config } = await supabase
    .from('location_config')
    .select('supabase_url, supabase_anon_key, live_map_enabled')
    .eq('id', 1)
    .single()

  const initialConfig = {
    supabase_url: config?.supabase_url || 'https://placeholder-url.supabase.co',
    supabase_anon_key: config?.supabase_anon_key || 'placeholder-anon-key',
    live_map_enabled: config?.live_map_enabled || false,
  }

  return <LocationConfigForm initialConfig={initialConfig} />
}
