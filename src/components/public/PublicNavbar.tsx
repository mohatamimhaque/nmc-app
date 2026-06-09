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
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'color-mix(in srgb, var(--color-navbar-bg) 88%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
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
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--foreground)',
              }}
            >
              {settings.site_title}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--foreground-muted)',
              }}
            >
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
            style={mobileHamburgerStyle}
            aria-expanded={mobileMenuOpen}
            aria-label="Open mobile navigation menu"
          >
            <span style={mobileHamburgerLineStyle} />
            <span style={mobileHamburgerLineStyle} />
            <span style={mobileHamburgerLineStyle} />
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

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div style={mobileMenuOverlayStyle} onClick={() => setMobileMenuOpen(false)}>
            <div style={mobileMenuStyle} onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={mobileMenuCloseStyle}
                aria-label="Close mobile menu"
              >
                ✕
              </button>
              <div style={mobileMenuLinksStyle}>
                {navLinks.map(link =>
                  link.is_external ? (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={mobileMenuLinkStyle}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.id}
                      href={link.url}
                      style={mobileMenuLinkStyle}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                )}
                {ctaLink && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    {ctaLink.is_external ? (
                      <a
                        href={ctaLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-analytics-cta="navbar-cta-mobile"
                        style={mobileCtaStyle}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {ctaLink.label}
                      </a>
                    ) : (
                      <Link
                        href={ctaLink.url}
                        style={mobileCtaStyle}
                        data-analytics-cta="navbar-cta-mobile"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {ctaLink.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
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

const mobileHamburgerStyle: React.CSSProperties = {
  display: 'none',
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'transparent',
  alignItems: 'center',
  justifyItems: 'center',
  gap: 4,
  padding: 6,
  cursor: 'pointer',
}

const mobileHamburgerLineStyle: React.CSSProperties = {
  width: '100%',
  height: 2,
  background: 'var(--foreground)',
  borderRadius: 999,
}

const mobileMenuOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 30,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  paddingTop: '4rem',
  paddingRight: '1rem',
}

const mobileMenuStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  width: '280px',
  maxHeight: '80vh',
  overflowY: 'auto',
  position: 'relative',
}

const mobileMenuCloseStyle: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: 'var(--surface-2)',
  color: 'var(--foreground)',
  fontSize: '1.2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const mobileMenuLinksStyle: React.CSSProperties = {
  padding: '3rem 1.5rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const mobileMenuLinkStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: 12,
  textDecoration: 'none',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'background 0.2s ease',
}

const mobileCtaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '1rem',
  color: 'var(--color-btn-text)',
  background: 'var(--color-btn-bg)',
  padding: '0.75rem 1.5rem',
  borderRadius: 12,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
}
