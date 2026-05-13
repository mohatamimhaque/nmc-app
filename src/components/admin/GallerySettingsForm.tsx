'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GalleryCategory, GalleryImage } from '@/types/database'
import { GlassCard } from './GlassCard'

interface GallerySettingsFormProps {
  initialCategories: GalleryCategory[]
  initialImages: GalleryImage[]
}

export function GallerySettingsForm({
  initialCategories,
  initialImages,
}: GallerySettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState<GalleryCategory[]>(initialCategories)
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null)
  const [dragImageId, setDragImageId] = useState<string | null>(null)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const [imageQuery, setImageQuery] = useState('')
  const [imageCategoryFilter, setImageCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const categoryOptions = useMemo(
    () => categories.map(category => ({ id: category.id, name: category.name })),
    [categories]
  )

  const filteredImages = useMemo(() => {
    const query = imageQuery.trim().toLowerCase()
    return images.filter(image => {
      if (visibilityFilter === 'visible' && !image.is_visible) return false
      if (visibilityFilter === 'hidden' && image.is_visible) return false
      if (imageCategoryFilter !== 'all' && image.category_id !== imageCategoryFilter) return false
      if (!query) return true
      const haystack = [image.caption, image.alt_text, image.url]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [images, imageQuery, imageCategoryFilter, visibilityFilter])

  const updateCategory = (index: number, field: keyof GalleryCategory, value: string | number) => {
    setCategories(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const updateImage = (index: number, field: keyof GalleryImage, value: string | boolean | number | null) => {
    setImages(prev => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )))
  }

  const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return items
    const copy = [...items]
    const [moved] = copy.splice(index, 1)
    copy.splice(nextIndex, 0, moved)
    return copy
  }

  const reorderById = <T extends { id: string }>(items: T[], dragId: string, targetId: string) => {
    if (dragId === targetId) return items
    const fromIndex = items.findIndex(item => item.id === dragId)
    const toIndex = items.findIndex(item => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return items
    const copy = [...items]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    return copy
  }

  const handleUpload = async (file: File, index: number) => {
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data?.error ?? 'Upload failed.')
      return
    }

    updateImage(index, 'url', data.url)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/admin/gallery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, images }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save gallery settings.')
      return
    }

    setSuccess('Gallery saved.')
    router.refresh()
  }

  const saveNow = async (
    message: string,
    onSuccess?: () => void,
    nextCategories?: GalleryCategory[],
    nextImages?: GalleryImage[]
  ) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const categoriesToSave = nextCategories ?? categories
    const imagesToSave = nextImages ?? images

    if (nextCategories) setCategories(nextCategories)
    if (nextImages) setImages(nextImages)

    const response = await fetch('/api/admin/gallery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: categoriesToSave, images: imagesToSave }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save gallery settings.')
      return
    }

    setSuccess(message)
    router.refresh()
    onSuccess?.()
  }

  const openCategoryEdit = (index: number) => {
    setActiveCategoryIndex(index)
  }

  const closeCategoryEdit = () => {
    setActiveCategoryIndex(null)
  }

  const openImageEdit = (index: number) => {
    setActiveImageIndex(index)
  }

  const closeImageEdit = () => {
    setActiveImageIndex(null)
  }

  const handleAddCategory = () => {
    const created = { id: crypto.randomUUID(), name: 'New Category', sort_order: categories.length + 1 }
    setCategories(prev => {
      const next = [...prev, created]
      setActiveCategoryIndex(next.length - 1)
      return next
    })
  }

  const handleAddImage = () => {
    const created = {
      id: crypto.randomUUID(),
      url: '',
      caption: null,
      alt_text: '',
      category_id: null,
      is_visible: true,
      sort_order: images.length + 1,
      created_at: new Date().toISOString(),
    }
    setImages(prev => {
      const next = [...prev, created]
      setActiveImageIndex(next.length - 1)
      return next
    })
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={eyebrowStyle}>Admin · Gallery</div>
        <h1 style={titleStyle}>Image Gallery</h1>
        <p style={subtitleStyle}>Upload gallery images, manage captions, and reorder the layout.</p>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '1rem', color: '#34d399', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <GlassCard>
          <SectionTitle title="Categories" subtitle="Manage gallery filter tabs." />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {categories.map(category => (
              <span key={category.id} style={chipStyle}>{category.name}</span>
            ))}
            <button type="button" style={addButtonStyle} onClick={handleAddCategory}>Add Category</button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {categories.map((category, index) => (
              <div
                key={category.id}
                style={{
                  ...listRowStyle,
                  opacity: dragCategoryId === category.id ? 0.6 : 1,
                  cursor: 'grab',
                  alignItems: 'center',
                }}
                draggable
                onDragStart={() => setDragCategoryId(category.id)}
                onDragEnd={() => setDragCategoryId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragCategoryId) return
                  setCategories(prev => reorderById(prev, dragCategoryId, category.id))
                  setDragCategoryId(null)
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
                    {category.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" style={smallButtonStyle} onClick={() => openCategoryEdit(index)}>Edit</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setCategories(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setCategories(prev => moveItem(prev, index, 1))}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Images" subtitle="Drag to reorder. Use upload to add photos." />
          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button type="button" style={addButtonStyle} onClick={handleAddImage}>Add Image</button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-fg-muted)', alignSelf: 'center' }}>
                Showing {filteredImages.length} / {images.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={labelStyle}>Search</span>
                <input
                  value={imageQuery}
                  onChange={event => setImageQuery(event.target.value)}
                  placeholder="Search caption, alt text, or URL"
                  style={inputStyle}
                />
              </label>
              <SelectField
                label="Category"
                value={imageCategoryFilter}
                options={[{ id: 'all', name: 'All categories' }, ...categoryOptions]}
                onChange={value => setImageCategoryFilter(value)}
              />
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={labelStyle}>Visibility</span>
                <select
                  value={visibilityFilter}
                  onChange={event => setVisibilityFilter(event.target.value as 'all' | 'visible' | 'hidden')}
                  style={inputStyle}
                >
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
            </div>
          </div>
          <div style={imageGridStyle}>
            {filteredImages.map((image) => {
              const index = images.findIndex(item => item.id === image.id)
              return (
              <div
                key={image.id}
                style={{
                  ...imageCardStyle,
                  opacity: dragImageId === image.id ? 0.6 : 1,
                }}
                draggable
                onDragStart={() => setDragImageId(image.id)}
                onDragEnd={() => setDragImageId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragImageId) return
                  setImages(prev => reorderById(prev, dragImageId, image.id))
                  setDragImageId(null)
                }}
              >
                <div style={imagePreviewStyle}>
                  {image.url ? (
                    <img src={image.url} alt={image.alt_text || image.caption || 'Gallery image'} style={imagePreviewImgStyle} />
                  ) : (
                    <div style={imagePlaceholderStyle}>No image</div>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-fg)' }}>
                    {image.caption || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
                    {image.category_id
                      ? categoryOptions.find(option => option.id === image.category_id)?.name ?? 'Uncategorized'
                      : 'Uncategorized'}
                    {image.is_visible ? '' : ' · Hidden'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    <button type="button" style={smallButtonStyle} onClick={() => openImageEdit(index)}>Edit</button>
                    <button
                      type="button"
                      style={smallButtonStyle}
                      onClick={() => updateImage(index, 'is_visible', !image.is_visible)}
                    >
                      {image.is_visible ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" style={smallButtonStyle} onClick={() => setImages(prev => moveItem(prev, index, -1))}>↑</button>
                    <button type="button" style={smallButtonStyle} onClick={() => setImages(prev => moveItem(prev, index, 1))}>↓</button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
          {filteredImages.length === 0 && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--admin-fg-muted)', marginTop: '0.5rem' }}>
              No images match the current filters.
            </div>
          )}
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
          {saving ? 'Saving...' : 'Save Gallery'}
        </button>
      </div>

      {activeCategoryIndex !== null && categories[activeCategoryIndex] && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalEyebrowStyle}>Category Editor</div>
                <div style={modalTitleStyle}>{categories[activeCategoryIndex].name || 'Untitled Category'}</div>
              </div>
              <button type="button" style={smallButtonStyle} onClick={closeCategoryEdit}>Close</button>
            </div>
            <LabeledInput
              label="Category name"
              value={categories[activeCategoryIndex].name}
              onChange={value => updateCategory(activeCategoryIndex, 'name', value)}
            />
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => saveNow('Category saved.', closeCategoryEdit)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
              <button
                type="button"
                style={dangerButtonStyle}
                onClick={() => {
                  const idx = activeCategoryIndex
                  const next = categories.filter((_, i) => i !== idx)
                  saveNow('Category deleted.', closeCategoryEdit, next, images)
                }}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeImageIndex !== null && images[activeImageIndex] && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalEyebrowStyle}>Image Editor</div>
                <div style={modalTitleStyle}>{images[activeImageIndex].caption || 'Gallery Image'}</div>
              </div>
              <button type="button" style={smallButtonStyle} onClick={closeImageEdit}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <CheckboxField
                label="Visible"
                checked={images[activeImageIndex].is_visible}
                onChange={checked => updateImage(activeImageIndex, 'is_visible', checked)}
              />
              <LabeledInput
                label="Image URL"
                value={images[activeImageIndex].url}
                onChange={value => updateImage(activeImageIndex, 'url', value)}
              />
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={labelStyle}>Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) handleUpload(file, activeImageIndex)
                  }}
                />
              </label>
              <LabeledInput
                label="Caption"
                value={images[activeImageIndex].caption ?? ''}
                onChange={value => updateImage(activeImageIndex, 'caption', value || null)}
              />
              <LabeledInput
                label="Alt text"
                value={images[activeImageIndex].alt_text ?? ''}
                onChange={value => updateImage(activeImageIndex, 'alt_text', value)}
              />
              <SelectField
                label="Category"
                value={images[activeImageIndex].category_id ?? ''}
                options={[{ id: '', name: 'Uncategorized' }, ...categoryOptions]}
                onChange={value => updateImage(activeImageIndex, 'category_id', value || null)}
              />
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() => saveNow('Image saved.', closeImageEdit)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Image'}
                </button>
                <button
                  type="button"
                  style={dangerButtonStyle}
                  onClick={() => {
                    const idx = activeImageIndex
                    const next = images.filter((_, i) => i !== idx)
                    saveNow('Image deleted.', closeImageEdit, categories, next)
                  }}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={sectionTitleStyle}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>{subtitle}</div>}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; name: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span style={labelStyle}>{label}</span>
    </label>
  )
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--admin-accent)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: '0.4rem',
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--admin-fg-muted)',
  marginTop: '0.35rem',
}

const sectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--admin-accent)',
  marginBottom: '0.25rem',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.55rem 0.75rem',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  outline: 'none',
}

const listRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  borderRadius: 12,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.03)',
}

const buttonColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const smallButtonStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontSize: '0.75rem',
  padding: '0.3rem 0.5rem',
  cursor: 'pointer',
}

const dangerButtonStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px solid rgba(248,113,113,0.4)',
  background: 'rgba(248,113,113,0.12)',
  color: '#f87171',
  fontSize: '0.7rem',
  padding: '0.3rem 0.5rem',
  cursor: 'pointer',
}

const addButtonStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px dashed var(--admin-border)',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--admin-fg)',
  fontSize: '0.75rem',
  padding: '0.6rem 0.8rem',
  cursor: 'pointer',
}

const chipStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '0.2rem 0.6rem',
  borderRadius: 999,
  border: '1px solid var(--admin-border)',
  color: 'var(--admin-fg-muted)',
}

const imageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.1rem',
}

const imageCardStyle: CSSProperties = {
  borderRadius: 14,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.03)',
  overflow: 'hidden',
  cursor: 'grab',
}

const imagePreviewStyle: CSSProperties = {
  height: 170,
  background: 'rgba(255,255,255,0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const imagePreviewImgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const imagePlaceholderStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6,8,16,0.6)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  zIndex: 200,
}

const modalCardStyle: CSSProperties = {
  width: 'min(820px, 100%)',
  maxHeight: '85vh',
  overflowY: 'auto',
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 16,
  padding: '1.5rem',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
}

const modalEyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--admin-accent)',
}

const modalTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.4rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
}

const primaryButtonStyle: CSSProperties = {
  background: 'var(--admin-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.75rem 1.6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  boxShadow: '0 8px 24px var(--admin-accent-glow)',
}
