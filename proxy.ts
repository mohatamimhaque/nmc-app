import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always refresh session first (required by @supabase/ssr)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  // ── Unauthenticated → redirect to login ──────────────────────────────────
  if (isAdminRoute && !isLoginPage && !user) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('redirected', '1')
    return NextResponse.redirect(url)
  }

  // ── Authenticated but verify they are in admin_users table ───────────────
  if (isAdminRoute && !isLoginPage && user) {
    const { data: adminRecord, error } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    // Not an admin → sign them out and redirect to login with error
    if (error || !adminRecord) {
      await supabase.auth.signOut()
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  // ── Already logged-in admin visiting login page → go to dashboard ────────
  if (isLoginPage && user) {
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminRecord) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
