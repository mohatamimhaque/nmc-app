'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { GalleryCategory, GalleryImage } from '@/types/database'

interface GalleryGridProps {
  categories: GalleryCategory[]
  images: GalleryImage[]
  initialImageId?: string | null
}

export function GalleryGrid({ categories, images, initialImageId }: GalleryGridProps) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const tabs = useMemo(() => {
    const names = categories.map(category => category.name)
    return ['All', ...names]
  }, [categories])

  const filteredImages = useMemo(() => {
    if (activeCategory === 'All') return images
    const category = categories.find(cat => cat.name === activeCategory)
    if (!category) return images
    return images.filter(img => img.category_id === category.id)
  }, [activeCategory, categories, images])

  const categoryById = useMemo(() => {
    return new Map(categories.map(category => [category.id, category.name]))
  }, [categories])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const showPrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setLightboxIndex(prev => {
      if (prev === null) return prev
      return prev === 0 ? filteredImages.length - 1 : prev - 1
    })
  }, [filteredImages.length])

  const showNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setLightboxIndex(prev => {
      if (prev === null) return prev
      return prev === filteredImages.length - 1 ? 0 : prev + 1
    })
  }, [filteredImages.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') showPrev()
      if (e.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, showPrev, showNext])

  const activeImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null

  useEffect(() => {
    if (!initialImageId) return
    const nextIndex = filteredImages.findIndex(image => image.id === initialImageId)
    if (nextIndex >= 0) {
      setLightboxIndex(nextIndex)
    }
  }, [filteredImages, initialImageId])

  return (
    <div>
      <div style={tabsStyle}>
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveCategory(tab)}
            style={{
              ...tabStyle,
              background: activeCategory === tab ? 'var(--color-primary)' : 'transparent',
              color: activeCategory === tab ? '#fff' : 'var(--foreground)',
              borderColor: activeCategory === tab ? 'transparent' : 'var(--border)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {!filteredImages.length && (
        <div style={{ textAlign: 'center', color: 'var(--foreground-muted)', fontFamily: 'var(--font-body)' }}>
          No gallery images yet.
        </div>
      )}

      <div style={gridStyle}>
        {filteredImages.map((img, index) => {
          const title = img.caption || img.alt_text || 'NMC 2026'
          const category = img.category_id ? categoryById.get(img.category_id) ?? 'Uncategorized' : 'Uncategorized'
          const tilt = index % 2 === 0 ? -2.2 : 1.7

          return (
            <button
              key={img.id}
              type="button"
              onClick={() => openLightbox(index)}
              className="gallery-preview-card"
              style={{
                ...imageButtonStyle,
                transform: `rotate(${tilt}deg)`,
              }}
            >
              <div className="gallery-preview-shell" style={shellStyle}>
                <div className="gallery-preview-frame" style={frameStyle}>
                  <img
                    src={img.url}
                    alt={title}
                    loading="lazy"
                    style={imageStyle}
                    className="gallery-preview-image"
                  />
                  <div className="gallery-preview-overlay" style={overlayStyle}>
                    <span className="gallery-preview-expand" style={expandIconStyle} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </div>
                <div style={cardFooterStyle}>
                  <div style={cardTitleStyle}>{title}</div>
                  <div style={cardCategoryStyle}>
                    <span style={dividerLineStyle} />
                    {category}
                    <span style={dividerLineStyle} />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {activeImage && (
        <div style={lightboxOverlayStyle} onClick={closeLightbox}>
          {/* Top Toolbar */}
          <div style={lightboxToolbarStyle} onClick={e => e.stopPropagation()}>
            <div style={lightboxTitleStyle}>
              {activeImage.caption || activeImage.alt_text || 'NMC 2026'}
              <div style={lightboxCategoryStyle}>
                {activeImage.category_id ? categoryById.get(activeImage.category_id) ?? 'Uncategorized' : 'Uncategorized'}
              </div>
            </div>
            <button type="button" style={lightboxCloseStyle} onClick={closeLightbox} aria-label="Close">✕</button>
          </div>

          {/* Nav Areas */}
          <div style={{ ...lightboxNavAreaStyle, left: 0 }} onClick={showPrev}>
            <button type="button" style={lightboxChevronStyle} aria-label="Previous">‹</button>
          </div>
          <div style={{ ...lightboxNavAreaStyle, right: 0 }} onClick={showNext}>
            <button type="button" style={lightboxChevronStyle} aria-label="Next">›</button>
          </div>

          {/* Main Image */}
          <img
            src={activeImage.url}
            alt={activeImage.alt_text || activeImage.caption || 'NMC 2026'}
            style={lightboxImageStyle}
            onClick={e => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const tabsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.6rem',
  marginBottom: '3rem',
}

const tabStyle: CSSProperties = {
  borderRadius: 999,
  border: '1px solid var(--border)',
  padding: '0.35rem 1rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '2rem',
  justifyContent: 'center',
  padding: '0 1rem',
}

const imageButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'transform 0.35s ease',
  outline: 'none',
}

const shellStyle: CSSProperties = {
  position: 'relative',
  borderRadius: 28,
  overflow: 'hidden',
  background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, #fff 6%), var(--surface))',
  border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
  boxShadow: 'var(--shadow-lg)',
  padding: '0.85rem 0.85rem 1rem',
  transformOrigin: 'center bottom',
}

const frameStyle: CSSProperties = {
  aspectRatio: '4/5',
  overflow: 'hidden',
  position: 'relative',
  borderRadius: 20,
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  transition: 'transform 0.35s ease',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(15,17,23,0) 35%, rgba(15,17,23,0.55) 100%)',
  opacity: 0,
  transition: 'opacity 0.25s ease',
}

const expandIconStyle: CSSProperties = {
  position: 'absolute',
  top: '0.85rem',
  right: '0.85rem',
  width: 42,
  height: 42,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(195, 152, 98, 0.92)',
  color: '#fff',
  boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.15)',
  transform: 'scale(0.94)',
  transition: 'transform 0.25s ease',
}

const cardFooterStyle: CSSProperties = {
  padding: '0.95rem 0.45rem 0.2rem',
  textAlign: 'center',
}

const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.45rem',
  fontWeight: 700,
  fontStyle: 'italic',
  color: 'var(--color-primary)',
  lineHeight: 1.15,
}

const cardCategoryStyle: CSSProperties = {
  marginTop: '0.55rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.58rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--foreground-muted)',
}

const dividerLineStyle: CSSProperties = {
  width: 24,
  height: 1,
  background: 'currentColor',
  opacity: 0.35,
}

// ─── Lightbox Styles (FB Messenger style) ───────────────────────────────────

const lightboxOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#000', // Fully black like FB Messenger
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999, // Ensure it's above everything
}

const lightboxToolbarStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: '1.5rem',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  zIndex: 10,
  background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  pointerEvents: 'none', // Allow clicking through to background
}

const lightboxTitleStyle: CSSProperties = {
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: '1.1rem',
  fontWeight: 600,
  pointerEvents: 'auto',
  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
}

const lightboxCategoryStyle: CSSProperties = {
  fontSize: '0.8rem',
  color: 'rgba(255,255,255,0.7)',
  marginTop: '0.2rem',
  fontWeight: 400,
}

const lightboxCloseStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: '#fff',
  fontSize: '1.5rem',
  borderRadius: 999,
  width: 44,
  height: 44,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
  backdropFilter: 'blur(8px)',
  transition: 'background 0.2s',
}

const lightboxNavAreaStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  height: '70%', // Large hit area
  width: '15%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 5,
  WebkitTapHighlightColor: 'transparent',
}

const lightboxChevronStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(8px)',
  border: 'none',
  color: '#fff',
  fontSize: '2.5rem',
  borderRadius: 999,
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pointerEvents: 'none', // Let parent handle clicks
}

const lightboxImageStyle: CSSProperties = {
  maxWidth: '100vw',
  maxHeight: '100vh',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}
