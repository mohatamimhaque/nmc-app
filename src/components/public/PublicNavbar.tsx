'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavLink, SiteSettings } from '../../types/database'

interface PublicNavbarProps {
  settings: SiteSettings
  links: NavLink[]
}

export function PublicNavbar({ settings, links }: PublicNavbarProps) {
  const visibleLinks = links.filter(link => link.is_visible)
  const ctaLink = visibleLinks.find(link => link.is_cta)
  const navLinks = visibleLinks.filter(link => !link.is_cta)
  const navRef = useRef<HTMLDivElement | null>(null)
  const [maxVisible, setMaxVisible] = useState(navLinks.length)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const element = navRef.current
    if (!element) return

    const update = () => {
      const width = element.getBoundingClientRect().width
      if (!width) return
      const reserved = ctaLink ? 170 : 80
      const available = Math.max(0, width - reserved)
      const estimatedLinkWidth = 120
      const next = Math.max(1, Math.floor(available / estimatedLinkWidth))
      setMaxVisible(Math.min(navLinks.length, next))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [navLinks.length, ctaLink])

  const [primaryLinks, overflowLinks] = useMemo(() => {
    const primary = navLinks.slice(0, maxVisible)
    const overflow = navLinks.slice(maxVisible)
    return [primary, overflow]
  }, [navLinks, maxVisible])

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'color-mix(in srgb, var(--color-navbar-bg) 88%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="navbar-container">
          <Link
            href="/"
            className="navbar-logo-link"
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_title || 'NMC 2026'}
                style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                }}
              >
                N
              </div>
            )}
            <div className="navbar-title-container">
              <div className="navbar-title">
                {settings.site_title}
              </div>
              <div className="navbar-subtext">
                {settings.competition_name}{settings.competition_season ? ` · ${settings.competition_season}` : ''}
              </div>
            </div>
          </Link>

          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'nowrap',
              flex: 1,
              justifyContent: 'flex-end',
              minWidth: 0,
              position: 'relative',
            }}
            ref={navRef}
          >
            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'nowrap' }}>
              {primaryLinks.map(link =>
                link.is_external ? (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={navLinkStyle}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.id} href={link.url} style={navLinkStyle}>
                    {link.label}
                  </Link>
                )
              )}
              {overflowLinks.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(prev => !prev)}
                    style={hamburgerStyle}
                    aria-expanded={menuOpen}
                    aria-label="Open navigation menu"
                  >
                    <span style={hamburgerLineStyle} />
                    <span style={hamburgerLineStyle} />
                    <span style={hamburgerLineStyle} />
                  </button>
                  {menuOpen && (
                    <div style={menuStyle}>
                      {overflowLinks.map(link =>
                        link.is_external ? (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={menuLinkStyle}
                            onClick={() => setMenuOpen(false)}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            key={link.id}
                            href={link.url}
                            style={menuLinkStyle}
                            onClick={() => setMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="mobile-hamburger"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open mobile navigation menu"
            >
              <span />
              <span />
              <span />
            </button>

            {ctaLink && (
              <div className="cta-desktop" style={{ display: 'flex', alignItems: 'center' }}>
                {ctaLink.is_external ? (
                  <a
                    href={ctaLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-cta="navbar-cta"
                    style={ctaStyle}
                  >
                    {ctaLink.label}
                  </a>
                ) : (
                  <Link href={ctaLink.url} style={ctaStyle} data-analytics-cta="navbar-cta">
                    {ctaLink.label}
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay / Drawer */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
          <div className="mobile-menu-header">
            <div className="mobile-menu-logo">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.site_title || 'NMC 2026'}
                />
              ) : (
                <div className="mobile-menu-logo-fallback" aria-hidden="true">
                  N
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="mobile-menu-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {settings.site_title}
                </div>
                <div className="mobile-menu-season">
                  {settings.competition_name}
                  {settings.competition_season ? ` · ${settings.competition_season}` : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-menu-close"
              aria-label="Close mobile menu"
            >
              ✕
            </button>
          </div>
          <div className="mobile-menu-links">
            {navLinks.map((link, index) =>
              link.is_external ? (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  style={{ transitionDelay: `${index * 40}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.id}
                  href={link.url}
                  className="mobile-menu-link"
                  style={{ transitionDelay: `${index * 40}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
          {ctaLink && (
            <div className="mobile-menu-footer">
              {ctaLink.is_external ? (
                <a
                  href={ctaLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-cta="navbar-cta-mobile"
                  className="mobile-menu-cta"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {ctaLink.label}
                </a>
              ) : (
                <Link
                  href={ctaLink.url}
                  className="mobile-menu-cta"
                  data-analytics-cta="navbar-cta-mobile"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {ctaLink.label}
                </Link>
              )}
              {settings.competition_category && (
                <div className="mobile-menu-footer-text">
                  {settings.competition_category}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const navLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: 'var(--foreground)',
  textDecoration: 'none',
  padding: '0.35rem 0',
  position: 'relative',
}

const ctaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '0.85rem',
  color: 'var(--color-btn-text)',
  background: 'var(--color-btn-bg)',
  padding: '0.5rem 1.1rem',
  borderRadius: 999,
  textDecoration: 'none',
  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
}

const hamburgerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'transparent',
  display: 'grid',
  alignItems: 'center',
  justifyItems: 'center',
  gap: 4,
  padding: 6,
  cursor: 'pointer',
}

const hamburgerLineStyle: React.CSSProperties = {
  width: '100%',
  height: 2,
  background: 'var(--foreground)',
  borderRadius: 999,
}

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  right: 0,
  minWidth: 200,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: '0 12px 26px rgba(15,23,42,0.15)',
  padding: '0.5rem',
  display: 'grid',
  gap: '0.2rem',
  zIndex: 20,
}

const menuLinkStyle: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  borderRadius: 10,
  textDecoration: 'none',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
}
