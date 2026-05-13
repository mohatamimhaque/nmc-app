import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider'
import { MathBackground } from '@/components/admin/MathBackground'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Auth layout — full screen, centred, no sidebar */
export default async function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminRecord) {
      redirect('/admin')
    }
  }

  return (
    <AdminThemeProvider>
      <MathBackground />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--admin-bg)',
        }}
      >
        {children}
      </div>
    </AdminThemeProvider>
  )
}
