'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
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

  const showPrev = () => {
    setLightboxIndex(prev => {
      if (prev === null) return prev
      return prev === 0 ? filteredImages.length - 1 : prev - 1
    })
  }

  const showNext = () => {
    setLightboxIndex(prev => {
      if (prev === null) return prev
      return prev === filteredImages.length - 1 ? 0 : prev + 1
    })
  }

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
        {filteredImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => openLightbox(index)}
            style={imageButtonStyle}
            className="gallery-card"
          >
            <div style={imageFrameStyle}>
              <img
                src={image.url}
                alt={image.alt_text || image.caption || 'Gallery image'}
                loading="lazy"
                style={imageStyle}
                className="gallery-image"
              />
              <div className="gallery-overlay" style={overlayStyle}>
                <div style={overlayContentStyle}>
                  <span style={overlayBadgeStyle}>
                    {image.category_id ? categoryById.get(image.category_id) ?? 'Uncategorized' : 'Uncategorized'}
                  </span>
                  <span style={overlayCtaStyle}>View Photo</span>
                </div>
              </div>
            </div>
            {image.caption && (
              <div style={captionStyle}>{image.caption}</div>
            )}
          </button>
        ))}
      </div>

      {activeImage && (
        <div style={lightboxOverlayStyle} onClick={closeLightbox}>
          <div style={lightboxContentStyle} onClick={event => event.stopPropagation()}>
            <button type="button" style={lightboxCloseStyle} onClick={closeLightbox}>×</button>
            <button type="button" style={lightboxNavStyle} onClick={showPrev}>‹</button>
            <div style={lightboxImageShellStyle}>
              <img
                src={activeImage.url}
                alt={activeImage.alt_text || activeImage.caption || 'Gallery image'}
                style={lightboxImageStyle}
              />
            </div>
            <button type="button" style={lightboxNavStyle} onClick={showNext}>›</button>
            {(activeImage.caption || activeImage.alt_text) && (
              <div style={lightboxCaptionStyle}>
                {activeImage.caption || activeImage.alt_text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const tabsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.6rem',
  marginBottom: '2rem',
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
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 280px))',
  gap: '1.25rem',
  justifyContent: 'center',
}

const imageButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
}

const imageFrameStyle: CSSProperties = {
  borderRadius: 14,
  overflow: 'hidden',
  background: 'linear-gradient(140deg, color-mix(in srgb, var(--surface) 80%, transparent), var(--surface))',
  border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
  boxShadow: 'var(--shadow-md)',
  aspectRatio: '4 / 3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  background: 'var(--surface-2)',
  transition: 'transform 0.35s ease',
}

const captionStyle: CSSProperties = {
  marginTop: '0.5rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  color: 'var(--foreground-muted)',
  textAlign: 'left',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-end',
  padding: '0.85rem',
  background: 'linear-gradient(180deg, rgba(15,17,23,0) 35%, rgba(15,17,23,0.65) 100%)',
  opacity: 0,
  transition: 'opacity 0.35s ease',
}

const overlayContentStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  color: '#fff',
}

const overlayBadgeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '0.2rem 0.6rem',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.3)',
}

const overlayCtaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: 'rgba(255,255,255,0.2)',
  borderRadius: 999,
  padding: '0.25rem 0.7rem',
  border: '1px solid rgba(255,255,255,0.25)',
}

const lightboxOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10,12,18,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: '1.5rem',
}

const lightboxContentStyle: CSSProperties = {
  maxWidth: '1000px',
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '1rem',
  position: 'relative',
}

const lightboxImageShellStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 16,
  padding: '1rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const lightboxImageStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: '70vh',
  objectFit: 'contain',
}

const lightboxNavStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  fontSize: '2rem',
  borderRadius: 999,
  width: 44,
  height: 44,
  cursor: 'pointer',
}

const lightboxCloseStyle: CSSProperties = {
  position: 'absolute',
  top: '-0.5rem',
  right: 0,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  fontSize: '1.5rem',
  borderRadius: 999,
  width: 36,
  height: 36,
  cursor: 'pointer',
}

const lightboxCaptionStyle: CSSProperties = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  color: 'rgba(255,255,255,0.7)',
  fontFamily: 'var(--font-body)',
  marginTop: '0.5rem',
}
