import { AdminThemeProvider } from '@/components/admin/AdminThemeProvider'
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell'
import { MathBackground } from '@/components/admin/MathBackground'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Panel layout — sidebar + content shell for all admin management pages */
export default async function PanelGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login?redirected=1')
  }

  const { data: adminRecord, error } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (error || !adminRecord || adminRecord.role === 'volunteer') {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore sign-out errors; we still redirect below.
    }
    redirect('/admin/login?error=unauthorized')
  }

  return (
    <AdminThemeProvider>
      <MathBackground />
      <AdminLayoutShell>
        {children}
      </AdminLayoutShell>
    </AdminThemeProvider>
  )
}
