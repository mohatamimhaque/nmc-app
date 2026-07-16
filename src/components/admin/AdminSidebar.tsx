"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  HexagonIcon,
  CircleDotIcon,
  TriangleIcon,
  DiamondIcon,
  GridIcon,
  PentagonIcon,
  InfinityIcon,
  SigmaIcon,
  IntegralIcon,
} from './GeoIcons'
import { AdminThemeControls } from './AdminThemeControls'

// ── Nav item type ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  group?: string
  roles?: AdminRole[]
}

type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'registration_editor'

const NAV: NavItem[] = [
  // Dashboard
  { label: 'Dashboard',    href: '/admin',              icon: <HexagonIcon />,   group: 'Overview', roles: ['super_admin', 'admin', 'moderator'] },
  { label: 'Analytics',   href: '/admin/analytics',     icon: <GridIcon />,      group: 'Overview', roles: ['super_admin', 'admin'] },

  // Content
  { label: 'Home Page',   href: '/admin/home',          icon: <CircleDotIcon />, group: 'Content', roles: ['super_admin', 'admin'] },
  { label: 'Events',      href: '/admin/events',        icon: <TriangleIcon />,  group: 'Content', roles: ['super_admin', 'admin'] },
  { label: 'Notices',     href: '/admin/notices',       icon: <DiamondIcon />,   group: 'Content', roles: ['super_admin', 'admin', 'moderator'] },
  { label: 'Gallery',     href: '/admin/gallery',       icon: <PentagonIcon />,  group: 'Content', roles: ['super_admin', 'admin'] },
  { label: 'Schedule',    href: '/admin/schedule',      icon: <SigmaIcon />,     group: 'Content', roles: ['super_admin', 'admin'] },
  { label: 'Sponsors',    href: '/admin/sponsors',      icon: <IntegralIcon />,  group: 'Content', roles: ['super_admin', 'admin'] },
  { label: 'Club Partners', href: '/admin/club-partners', icon: <IntegralIcon />,  group: 'Content', roles: ['super_admin', 'admin', 'moderator'] },

  // People
  { label: 'Committee',   href: '/admin/committee',     icon: <TriangleIcon />,  group: 'People', roles: ['super_admin', 'admin'] },
  { label: 'Campus Ambassadors', href: '/admin/campus-ambassadors', icon: <CircleDotIcon />, group: 'People', roles: ['super_admin', 'admin'] },

  // Settings
  { label: 'Registrations',href: '/admin/registrations',icon: <HexagonIcon />,  group: 'Manage', roles: ['super_admin', 'admin', 'registration_editor'] },
  { label: 'Volunteers',   href: '/admin/volunteers',    icon: <IntegralIcon />,  group: 'Manage', roles: ['super_admin', 'admin', 'registration_editor'] },
  { label: 'Visibility',  href: '/admin/visibility',    icon: <InfinityIcon />, group: 'Manage', roles: ['super_admin'] },
  { label: 'Navigation',  href: '/admin/navigation',   icon: <GridIcon />,     group: 'Manage', roles: ['super_admin', 'admin'] },
  { label: 'Contact/About',href: '/admin/contact-about',icon: <DiamondIcon />,  group: 'Manage', roles: ['super_admin', 'admin'] },
  { label: 'Footer',      href: '/admin/footer',         icon: <PentagonIcon />, group: 'Manage', roles: ['super_admin', 'admin'] },
  { label: 'Theme',       href: '/admin/theme',          icon: <GridIcon />,     group: 'Manage', roles: ['super_admin'] },
  { label: 'Admins',      href: '/admin/admins',         icon: <HexagonIcon />,  group: 'Manage', roles: ['super_admin'] },
  { label: 'Docs',        href: '/admin/docs',           icon: <SigmaIcon />,    group: 'Help', roles: ['super_admin', 'admin', 'moderator'] },
]

// ── Group the nav items ───────────────────────────────────────────────────────

function groupedNav(items: NavItem[]) {
  const groups: Record<string, NavItem[]> = {}
  for (const item of items) {
    const g = item.group ?? 'Other'
    if (!groups[g]) groups[g] = []
    groups[g].push(item)
  }
  return groups
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<AdminRole | null>(null)
  const [canManageVolunteers, setCanManageVolunteers] = useState(false)

  useEffect(() => {
    let isMounted = true
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const loadRole = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        if (isMounted) setRole(null)
        return
      }
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role, can_manage_volunteers')
        .eq('id', userId)
        .single()
      if (isMounted) {
        setRole((adminData?.role as AdminRole) ?? null)
        setCanManageVolunteers(!!adminData?.can_manage_volunteers)
      }
    }

    loadRole().catch(() => {
      if (isMounted) setRole(null)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const visibleNav = useMemo(() => {
    if (!role) return NAV
    return NAV.filter(item => {
      if (item.href === '/admin/volunteers') {
        return role === 'super_admin' || role === 'admin' || (role === 'registration_editor' && canManageVolunteers)
      }
      return !item.roles || item.roles.includes(role)
    })
  }, [role, canManageVolunteers])

  const groups = groupedNav(visibleNav)

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--admin-sidebar-bg)',
        borderRight: '1px solid var(--admin-border)',
        overflowY: 'auto',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* ── Logo / Wordmark ── */}
      <div
        style={{
          padding: '1.5rem 1.25rem 1rem',
          borderBottom: '1px solid var(--admin-border)',
        }}
      >
        {/* Geometric logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            {/* Outer hexagon */}
            <polygon
              points="14,2 24,8 24,20 14,26 4,20 4,8"
              stroke="var(--admin-accent)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Inner triangle */}
            <polygon
              points="14,8 20,19 8,19"
              stroke="var(--admin-accent)"
              strokeWidth="1"
              fill="var(--admin-accent)"
              opacity="0.25"
            />
            {/* Centre dot */}
            <circle cx="14" cy="14" r="2" fill="var(--admin-accent)" />
          </svg>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--admin-sidebar-fg)',
                lineHeight: 1,
                letterSpacing: '0.04em',
              }}
            >
              NMC 2026
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--admin-accent)',
                letterSpacing: '0.08em',
                marginTop: '2px',
              }}
            >
              ADMIN PANEL
            </div>
          </div>
        </div>

        {/* Tiny math snippet under logo */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            color: 'var(--admin-accent)',
            opacity: 0.4,
            marginTop: '0.5rem',
            letterSpacing: '0.06em',
          }}
        >
          e^(iπ) + 1 = 0
        </div>
      </div>

      {/* ── Navigation groups ── */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} style={{ marginBottom: '1.25rem' }}>
            {/* Group label */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--admin-accent)',
                opacity: 0.6,
                padding: '0 0.5rem',
                marginBottom: '0.35rem',
              }}
            >
              {groupName}
            </div>

            {/* Items */}
            {items.map(item => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    textDecoration: 'none',
                    color: isActive
                      ? 'var(--admin-accent)'
                      : 'var(--admin-sidebar-fg)',
                    background: isActive
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '2px solid var(--admin-accent)'
                      : '2px solid transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
                      ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--admin-sidebar-fg)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    }
                  }}
                >
                  {/* Geometric icon */}
                  <span style={{
                    color: isActive ? 'var(--admin-accent)' : 'var(--admin-sidebar-fg)',
                    opacity: isActive ? 1 : 0.55,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: sign out + theme controls ── */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--admin-border)' }}>
        <SignOutButton />
        <AdminThemeControls />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--admin-accent)', opacity: 0.25, marginTop: '0.75rem', letterSpacing: '0.06em' }}>
          φ = (1 + √5) / 2
        </div>
      </div>
    </aside>
  )
}

function SignOutButton() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }
  return (
    <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.6rem', marginBottom: '0.5rem', background: 'transparent', border: '1px solid var(--admin-border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', transition: 'background 0.15s, color 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-fg-muted)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign Out
    </button>
  )
}
