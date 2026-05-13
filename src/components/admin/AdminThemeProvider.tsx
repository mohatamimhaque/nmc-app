'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminThemeMode = 'dark' | 'light'

export type AccentKey =
  | 'euler-blue'
  | 'theorem-green'
  | 'prime-purple'
  | 'calculus-orange'

export interface AccentColour {
  key: AccentKey
  label: string
  hex: string
  hexLight: string   // lighter tint for light admin mode
  glow: string       // rgba for box-shadow glow
}

export const ACCENT_COLOURS: AccentColour[] = [
  {
    key: 'euler-blue',
    label: 'Euler Blue',
    hex: '#748ffc',
    hexLight: '#4263eb',
    glow: 'rgba(116,143,252,0.35)',
  },
  {
    key: 'theorem-green',
    label: 'Theorem Green',
    hex: '#20c997',
    hexLight: '#0ca678',
    glow: 'rgba(32,201,151,0.35)',
  },
  {
    key: 'prime-purple',
    label: 'Prime Purple',
    hex: '#9775fa',
    hexLight: '#7048e8',
    glow: 'rgba(151,117,250,0.35)',
  },
  {
    key: 'calculus-orange',
    label: 'Calculus Orange',
    hex: '#fd7e14',
    hexLight: '#e8590c',
    glow: 'rgba(253,126,20,0.35)',
  },
]

// ─── Context ─────────────────────────────────────────────────────────────────

interface AdminThemeCtx {
  mode: AdminThemeMode
  accent: AccentKey
  accentColour: AccentColour
  toggleMode: () => void
  setAccent: (key: AccentKey) => void
}

const AdminThemeContext = createContext<AdminThemeCtx | null>(null)

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used inside AdminThemeProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AdminThemeMode>('dark')
  const [accent, setAccentKey] = useState<AccentKey>('euler-blue')

  // Restore from localStorage on mount
  useEffect(() => {
    const savedMode   = localStorage.getItem('nmc-admin-theme') as AdminThemeMode | null
    const savedAccent = localStorage.getItem('nmc-admin-accent') as AccentKey | null
    if (savedMode)   setMode(savedMode)
    if (savedAccent) setAccentKey(savedAccent)
  }, [])

  // Apply CSS variables whenever mode/accent changes
  useEffect(() => {
    const root = document.documentElement
    const col  = ACCENT_COLOURS.find(c => c.key === accent)!

    root.setAttribute('data-admin-theme', mode)

    if (mode === 'dark') {
      root.style.setProperty('--admin-bg',           '#0d0f1c')
      root.style.setProperty('--admin-surface',      'rgba(17,20,40,0.85)')
      root.style.setProperty('--admin-surface-blur', 'rgba(17,20,40,0.65)')
      root.style.setProperty('--admin-fg',           '#e8eaf6')
      root.style.setProperty('--admin-fg-muted',     '#9ca3af')
      root.style.setProperty('--admin-sidebar-bg',   '#080a14')
      root.style.setProperty('--admin-sidebar-fg',   '#c5c9f4')
      root.style.setProperty('--admin-border',       'rgba(129,140,248,0.18)')
      root.style.setProperty('--admin-accent',       col.hex)
      root.style.setProperty('--admin-accent-glow',  col.glow)
    } else {
      root.style.setProperty('--admin-bg',           '#eef0ff')
      root.style.setProperty('--admin-surface',      'rgba(255,255,255,0.88)')
      root.style.setProperty('--admin-surface-blur', 'rgba(255,255,255,0.70)')
      root.style.setProperty('--admin-fg',           '#1a1d2e')
      root.style.setProperty('--admin-fg-muted',     '#6b7280')
      root.style.setProperty('--admin-sidebar-bg',   '#1e2340')
      root.style.setProperty('--admin-sidebar-fg',   '#e8eaf6')
      root.style.setProperty('--admin-border',       'rgba(79,70,229,0.15)')
      root.style.setProperty('--admin-accent',       col.hexLight)
      root.style.setProperty('--admin-accent-glow',  col.glow)
    }
  }, [mode, accent])

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('nmc-admin-theme', next)
      return next
    })
  }, [])

  const setAccent = useCallback((key: AccentKey) => {
    setAccentKey(key)
    localStorage.setItem('nmc-admin-accent', key)
  }, [])

  const accentColour = ACCENT_COLOURS.find(c => c.key === accent)!

  return (
    <AdminThemeContext.Provider value={{ mode, accent, accentColour, toggleMode, setAccent }}>
      {children}
    </AdminThemeContext.Provider>
  )
}
