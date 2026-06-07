'use client'

import { usePathname } from 'next/navigation'
import type { FooterSettings, NavLink, SiteSettings } from '../../types/database'
import { PublicMathBackground } from './PublicMathBackground'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'
import { PublicAnalyticsTracker } from './PublicAnalyticsTracker'
import { PublicSymbolsProvider } from './PublicSymbolsContext'
import { PointerGlow } from './PointerGlow'

interface PublicChromeProps {
  children: React.ReactNode
  settings: SiteSettings
  navLinks: NavLink[]
  footerSettings: FooterSettings
  themeVars: React.CSSProperties
  themeMode: 'light' | 'dark'
  showThemeSymbols: boolean
  competitionCategory: string
}

export function PublicChrome({
  children,
  settings,
  navLinks,
  footerSettings,
  themeVars,
  themeMode,
  showThemeSymbols,
  competitionCategory,
}: PublicChromeProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <PublicAnalyticsTracker />
      <PointerGlow />
      <PublicSymbolsProvider category={competitionCategory}>
        <PublicMathBackground
          theme={themeMode}
          showSymbols={showThemeSymbols}
          category={competitionCategory}
          settings={settings}
        />
        <div className="public-shell" style={themeVars}>
          <PublicNavbar settings={settings} links={navLinks} />
          <div className="public-content">{children}</div>
          <PublicFooter
            settings={footerSettings}
            competition={settings}
            footerPattern={settings.footer_pattern}
          />
        </div>
      </PublicSymbolsProvider>
    </>
  )
}
