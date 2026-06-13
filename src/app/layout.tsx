import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { PublicChrome } from '@/components/public/PublicChrome'
import type { FooterSettings, NavLink, SiteSettings } from '@/types/database'
import { DEFAULT_FOOTER_SETTINGS, DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const normalizeGoogleFontName = (value: string) => {
  const raw = value.trim()
  if (!raw) {
    return ''
  }

  const first = raw.split(',')[0] ?? ''
  return first.replace(/['"]/g, '').trim()
}

const formatGoogleFont = (value: string) => normalizeGoogleFontName(value).replace(/\s+/g, '+')

const buildGoogleFontsUrl = (heading: string, body: string) => {
  const headingFont = formatGoogleFont(heading || DEFAULT_SITE_SETTINGS.font_heading)
  const bodyFont = formatGoogleFont(body || DEFAULT_SITE_SETTINGS.font_body)
  return `https://fonts.googleapis.com/css2?family=${headingFont}:wght@400;600;700;800&family=${bodyFont}:wght@400;500;600;700&display=swap`
}

const getFaviconType = (value: string) => {
  const normalized = value.split('?')[0].split('#')[0].toLowerCase()
  if (normalized.endsWith('.ico')) return 'image/x-icon'
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg'
  if (normalized.endsWith('.png')) return 'image/png'
  return undefined
}

const fallbackMetadata = {
  title: {
    default: 'National Mathematics Carnival 2026 — Math Club, DUET',
    template: '%s | NMC 2026',
  },
  description:
    "Official website of the National Mathematics Carnival 2026, organized by Math Club, DUET. Join Bangladesh's premier competitive mathematics event today!",
  keywords: [
    'Dhaka University of Engineering & Technology',
    'Gazipur',
    'Dhaka University of Engineering & Technology, Gazipur',
    'Dhaka University of Engineering and Technology',
    'University of Engineering & Technology',
    'DUET Gazipur',
    'duet campus',
    'DUET Campus Gazipur',
    'Mathematics',
    'Math',
    'Carnival',
    'National Mathematics fest',
    'National Mathematics Carnival 2026',
    'National Mathematics Carnival 2026 DUET',
    'nmcbd',
    'nmcbd.app',
    'National Mathematics Carnival Bangladesh',
    'nmc bangladesh',
    'nmc',
    'nmc bd 2026',
    'Math Club DUET',
    'DUET Math Club',
    'Math Olympiad',
    'competition',
    'Mathematics Competition Bangladesh',
    'National Math Olympiad',
    'Bangladesh Math Olympiad',
    'BD Math Olympiad',
    'Math Competition in Bangladesh',
    'Math Contest',
    'Math Fest Bangladesh',
    'Math Festival',
    'Math Olympiad BD',
    'mohatamim',
    'mohatamim haque'
  ],
  authors: [{ name: 'Math Club, DUET' }],
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    siteName: 'National Mathematics Carnival 2026',
    title: 'National Mathematics Carnival 2026 — Math Club, DUET',
    description:
      "Official website of the National Mathematics Carnival 2026, organized by Math Club, DUET. Join Bangladesh's premier competitive mathematics event today!",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'National Mathematics Carnival 2026',
    description: "Official website of the National Mathematics Carnival 2026, organized by Math Club, DUET. Join Bangladesh's premier competitive mathematics event today!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export async function generateMetadata() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_settings').select('*').single()
    const settings = (data ?? DEFAULT_SITE_SETTINGS) as SiteSettings
    const title = settings.site_title || fallbackMetadata.title.default
    const faviconUrl = settings.favicon_url || '/favicon.ico'
    const faviconType = faviconUrl ? getFaviconType(faviconUrl) : undefined
    return {
      ...fallbackMetadata,
      title: {
        default: title,
        template: `%s | ${title}`,
      },
      openGraph: {
        ...fallbackMetadata.openGraph,
        siteName: title,
        title,
      },
      twitter: {
        ...fallbackMetadata.twitter,
        title,
      },
      icons: faviconUrl
        ? {
            icon: [
              { url: faviconUrl, type: faviconType },
              { url: faviconUrl, sizes: '32x32', type: faviconType },
              { url: faviconUrl, sizes: '16x16', type: faviconType },
            ],
            apple: [{ url: faviconUrl, sizes: '180x180', type: faviconType }],
            shortcut: [faviconUrl],
          }
        : undefined,
    }
  } catch {
    return fallbackMetadata
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  let settings: SiteSettings = DEFAULT_SITE_SETTINGS
  let navLinks: NavLink[] = []
  let footerSettings: FooterSettings = DEFAULT_FOOTER_SETTINGS

  try {
    const [settingsRes, navRes, footerRes] = await Promise.all([
      supabase.from('site_settings').select('*').single(),
      supabase.from('nav_links').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
      supabase.from('footer_settings').select('*').single(),
    ])

    if (settingsRes.data) settings = settingsRes.data as SiteSettings
    if (navRes.data) navLinks = navRes.data as NavLink[]
    if (footerRes.data) footerSettings = footerRes.data as FooterSettings
  } catch {
    // Fallback to defaults on fetch errors
  }

  const themeSource = settings.use_static_theme ? DEFAULT_SITE_SETTINGS : settings

  const themeVars: React.CSSProperties = {
    '--color-primary': themeSource.color_primary,
    '--color-secondary': themeSource.color_secondary,
    '--color-accent': themeSource.color_accent,
    '--color-btn-bg': themeSource.color_button_bg,
    '--color-btn-text': themeSource.color_button_text,
    '--color-navbar-bg': themeSource.color_navbar_bg,
    '--color-footer-bg': themeSource.color_footer_bg,
    '--color-hero-overlay': themeSource.hero_overlay_color,
    '--color-link': themeSource.color_primary,
    '--font-heading': `'${themeSource.font_heading}', serif`,
    '--font-body': `'${themeSource.font_body}', sans-serif`,
  } as React.CSSProperties

  return (
    <html lang="en" suppressHydrationWarning className={themeSource.default_theme === 'dark' ? 'dark' : ''}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={buildGoogleFontsUrl(themeSource.font_heading, themeSource.font_body)} />
        {settings.favicon_url ? (
          <>
            <link rel="icon" href={settings.favicon_url} type={getFaviconType(settings.favicon_url)} />
            <link rel="icon" href={settings.favicon_url} sizes="32x32" type={getFaviconType(settings.favicon_url)} />
            <link rel="icon" href={settings.favicon_url} sizes="16x16" type={getFaviconType(settings.favicon_url)} />
            <link rel="shortcut icon" href={settings.favicon_url} type={getFaviconType(settings.favicon_url)} />
            <link rel="apple-touch-icon" href={settings.favicon_url} sizes="180x180" />
          </>
        ) : null}
      </head>
      <body>
        <PublicChrome
          settings={settings}
          navLinks={navLinks}
          footerSettings={footerSettings}
          themeVars={themeVars}
          themeMode={themeSource.default_theme}
          showThemeSymbols={!settings.use_static_theme}
          competitionCategory={settings.competition_category}
        >
          {children}
        </PublicChrome>
      </body>
    </html>
  )
}
