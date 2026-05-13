'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { Adviser } from '@/types/database'
import { GlassCard, StatCard } from './GlassCard'

interface AdvisersSettingsFormProps {
  initialAdvisers: Adviser[]
}

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

interface BulkPreviewRow {
  id: string
  name: string
  designation: string
  department: string
  institution: string
  expertise: string
  email: string
  phone: string
  linkedin: string
  bio: string
  is_visible: boolean
  photo_filename: string
  photo_preview_url: string | null
  photo_matched: boolean
}
  import { RichTextField } from '@/components/shared/RichTextField'

const EMPTY_ADVISER: Adviser = {
  id: '',
  name: '',
  designation: '',
  department: '',
  institution: '',
  expertise_tags: [],
  photo_url: null,
  email: '',
    return (
      <RichTextField
        label={label}
        value={value}
        onChange={onChange}
        minHeight={140}
      />
    )
  const [advisers, setAdvisers] = useState<Adviser[]>(initialAdvisers)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAdviser, setEditingAdviser] = useState<Adviser | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkXlsx, setBulkXlsx] = useState<File | null>(null)
  const [bulkZip, setBulkZip] = useState<File | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSummary, setBulkSummary] = useState<string>('')
  const [bulkPreviewRows, setBulkPreviewRows] = useState<BulkPreviewRow[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => snapshotState(initialAdvisers))
  const currentSnapshot = useMemo(() => snapshotState(advisers), [advisers])
  const isDirty = lastSavedSnapshot !== currentSnapshot

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    return () => {
      bulkPreviewRows.forEach(row => {
        if (row.photo_preview_url) URL.revokeObjectURL(row.photo_preview_url)
      })
    }
  }, [bulkPreviewRows])

  const totals = useMemo(() => {
    return {
      advisers: advisers.length,
      hidden: advisers.filter(adviser => !adviser.is_visible).length,
    }
  }, [advisers])

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone })
  }

  const handleSave = async (overrideAdvisers?: Adviser[]) => {
    setSaving(true)

    const advisersToSave = (overrideAdvisers ?? advisers).map((adviser, index) => ({
      ...adviser,
      name: adviser.name?.trim() || null,
      designation: adviser.designation?.trim() || null,
      department: adviser.department?.trim() || null,
      institution: adviser.institution?.trim() || null,
      email: adviser.email?.trim() || null,
      phone: adviser.phone?.trim() || null,
      linkedin_url: adviser.linkedin_url?.trim() || null,
      bio: adviser.bio?.trim() || null,
      expertise_tags: adviser.expertise_tags ?? [],
      sort_order: index + 1,
      show_email: Boolean(adviser.show_email),
      show_phone: Boolean(adviser.show_phone),
      is_visible: adviser.is_visible !== false,
      is_disabled: adviser.is_disabled === true,
    }))

    const response = await fetch('/api/admin/advisers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advisers: advisersToSave }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      showToast(data?.error ?? 'Failed to save adviser changes.', 'error')
      return
    }

    setAdvisers(advisersToSave)
    setLastSavedSnapshot(snapshotState(advisersToSave))
    showToast('Adviser changes saved.', 'success')
    router.refresh()
  }

  const openModal = (adviser?: Adviser) => {
    if (adviser) {
      setEditingAdviser(adviser)
    } else {
      setEditingAdviser({
        ...EMPTY_ADVISER,
        id: crypto.randomUUID(),
        sort_order: advisers.length + 1,
      })
    }
    setShowModal(true)
  }

  const handleAdviserSave = async (adviser: Adviser) => {
    let nextAdvisers: Adviser[] = advisers

    setAdvisers(prev => {
      const existingIndex = prev.findIndex(item => item.id === adviser.id)
      if (existingIndex >= 0) {
        const copy = [...prev]
        copy[existingIndex] = adviser
        nextAdvisers = copy
        return copy
      }
      const copy = [...prev, adviser]
      nextAdvisers = copy
      return copy
    })

    setShowModal(false)
    setEditingAdviser(null)

    await handleSave(nextAdvisers)
  }

  const handleDelete = (id: string) => {
    setAdvisers(prev => prev.filter(adviser => adviser.id !== id))
  }

  const handleBulkImport = async () => {
    if (!bulkXlsx || !bulkZip) {
      showToast('Select .xlsx and .zip files.', 'error')
      return
    }

    if (!bulkPreviewRows.length) {
      showToast('Preview the import before uploading.', 'error')
      return
    }

    setBulkLoading(true)
    setBulkSummary('')

    const formData = new FormData()
    formData.append('xlsx', bulkXlsx)
    formData.append('zip', bulkZip)

    const response = await fetch('/api/admin/advisers', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    setBulkLoading(false)

    if (!response.ok) {
      showToast(data?.error ?? 'Bulk import failed.', 'error')
      return
    }

    const inserted = (data?.inserted ?? []) as Adviser[]
    setAdvisers(prev => {
      const next = [...prev, ...inserted]
      setLastSavedSnapshot(snapshotState(next))
      return next
    })
    setBulkSummary(data?.summary ?? 'Import completed.')
    showToast('Bulk import completed.', 'success')
    router.refresh()
  }

  const handleBulkPreview = async () => {
    if (!bulkXlsx || !bulkZip) {
      showToast('Select .xlsx and .zip files.', 'error')
      return
    }

    setPreviewLoading(true)
    setBulkSummary('')

    bulkPreviewRows.forEach(row => {
      if (row.photo_preview_url) URL.revokeObjectURL(row.photo_preview_url)
    })

    try {
      const workbook = XLSX.read(await bulkXlsx.arrayBuffer(), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const zip = await JSZip.loadAsync(await bulkZip.arrayBuffer())

      const rows = await Promise.all(rawRows.map(async (rawRow, index) => {
        const normalized = Object.fromEntries(
          Object.entries(rawRow).map(([key, value]) => [String(key).trim().toLowerCase(), value])
        )

        const photoFilename = normalized.photo_filename ? String(normalized.photo_filename).trim() : ''
        const entry = photoFilename ? findZipEntry(zip, photoFilename) : null
        let photoUrl: string | null = null

        if (entry) {
          const blob = await entry.async('blob')
          photoUrl = URL.createObjectURL(blob)
        }

        return {
          id: `${index}-${Date.now()}`,
          name: normalized.name ? String(normalized.name).trim() : '',
          designation: normalized.designation ? String(normalized.designation).trim() : '',
          department: normalized.department ? String(normalized.department).trim() : '',
          institution: normalized.institution ? String(normalized.institution).trim() : '',
          expertise: normalized.expertise ? String(normalized.expertise).trim() : '',
          email: normalized.email ? String(normalized.email).trim() : '',
          phone: normalized.phone ? String(normalized.phone).trim() : '',
          linkedin: normalized.linkedin ? String(normalized.linkedin).trim() : '',
          bio: normalized.bio ? String(normalized.bio).trim() : '',
          is_visible: parseBoolean(normalized.is_visible, true),
          photo_filename: photoFilename,
          photo_preview_url: photoUrl,
          photo_matched: Boolean(entry),
        }
      }))

      setBulkPreviewRows(rows)
      const matched = rows.filter(row => row.photo_matched).length
      setBulkSummary(`${rows.length} rows loaded. ${matched} photos matched.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Preview failed.'
      showToast(message, 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    setUploadingPhoto(false)

    if (!response.ok) {
      showToast(data?.error ?? 'Photo upload failed.', 'error')
      return null
    }

    return data?.url as string
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{`
        .admin-adviser-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 700px) {
          .admin-adviser-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1100px) {
          .admin-adviser-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .admin-adviser-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.35);
        }
        .admin-pill-button {
          border-radius: 999px;
          padding: 0.5rem 1rem;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          font-size: 0.7rem;
          text-transform: uppercase;
        }
        @keyframes pulse {
          0% { transform: translateX(-30%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(80%); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--admin-accent)',
              marginBottom: '0.4rem',
            }}
          >
            Admin · Advisers
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--admin-fg)',
            }}
          >
            Advisers
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              color: 'var(--admin-fg-muted)',
              marginTop: '0.4rem',
            }}
          >
            Manage adviser profiles and visibility controls.
          </p>
          <div
            style={{
              marginTop: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: isDirty ? '#facc15' : 'var(--admin-fg-muted)',
            }}
          >
            {isDirty ? 'Unsaved changes' : 'All changes saved'} - ∑ π ∫
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave()}
          style={{
            background: 'var(--admin-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '0.75rem 1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 24px var(--admin-accent-glow)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard label="Total Advisers" value={totals.advisers} />
        <StatCard label="Hidden" value={totals.hidden} />
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <SectionTitle title="Advisers" subtitle="Profile cards and contact details." />
            <button
              type="button"
              onClick={() => openModal()}
              className="admin-pill-button"
              style={{
                background: 'var(--admin-accent)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 10px 24px var(--admin-accent-glow)',
              }}
            >
              + Add Adviser
            </button>
          </div>

          <div className="admin-adviser-grid">
            {advisers.length ? (
              advisers.map(adviser => (
                <div
                  key={adviser.id}
                  className="admin-adviser-card"
                  style={{
                    position: 'relative',
                    background: 'var(--admin-surface)',
                    borderRadius: 16,
                    border: adviser.is_disabled ? '1px solid rgba(251,146,60,0.6)' : '1px solid var(--admin-border)',
                    padding: '1.5rem 1.25rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    opacity: adviser.is_visible ? 1 : 0.45,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                  }}
                >
                  {adviser.is_visible === false && (
                    <Badge label="Hidden" tone="danger" />
                  )}
                  {adviser.is_disabled && (
                    <Badge label="Disabled" tone="warning" offset={32} />
                  )}
                  <div style={{ display: 'grid', placeItems: 'center', marginBottom: '0.8rem' }}>
                    <Avatar photoUrl={adviser.photo_url} size={88} />
                  </div>
                  <div style={nameStyle}>{adviser.name || 'Unnamed Adviser'}</div>
                  {adviser.designation && <div style={mutedStyle}>{adviser.designation}</div>}
                  {(adviser.department || adviser.institution) && (
                    <div style={mutedSmallStyle}>{[adviser.department, adviser.institution].filter(Boolean).join(' • ')}</div>
                  )}
                  {!!adviser.expertise_tags?.length && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                      {adviser.expertise_tags.map(tag => (
                        <span key={tag} style={tagStyle}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 1, background: 'var(--admin-border)', margin: '1rem 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <IconButton
                        active={adviser.is_visible}
                        ariaLabel="Toggle visibility"
                        onClick={() => {
                          setAdvisers(prev => prev.map(item => (
                            item.id === adviser.id ? { ...item, is_visible: !item.is_visible } : item
                          )))
                        }}
                        icon={<EyeIcon muted={!adviser.is_visible} />}
                      />
                      <IconButton
                        active={adviser.is_disabled}
                        ariaLabel="Toggle disabled"
                        onClick={() => {
                          setAdvisers(prev => prev.map(item => (
                            item.id === adviser.id ? { ...item, is_disabled: !item.is_disabled } : item
                          )))
                        }}
                        icon={<SlashEyeIcon muted={!adviser.is_disabled} />}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" style={editButtonStyle} onClick={() => openModal(adviser)}>Edit</button>
                      <button type="button" style={deleteButtonStyle} onClick={() => handleDelete(adviser.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-fg-muted)' }}>
                No advisers yet. Add the first adviser to get started.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <button
            type="button"
            onClick={() => setBulkOpen(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Bulk Import via Excel + ZIP {bulkOpen ? '^' : 'v'}
          </button>

          {bulkOpen && (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <label style={uploadBoxStyle}>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={event => setBulkXlsx(event.target.files?.[0] ?? null)}
                    style={{ display: 'none' }}
                  />
                  <span>Upload .xlsx</span>
                  <span style={mutedSmallStyle}>{bulkXlsx ? bulkXlsx.name : 'No file selected'}</span>
                </label>
                <label style={uploadBoxStyle}>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={event => setBulkZip(event.target.files?.[0] ?? null)}
                    style={{ display: 'none' }}
                  />
                  <span>Upload .zip</span>
                  <span style={mutedSmallStyle}>{bulkZip ? bulkZip.name : 'No file selected'}</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={handleBulkImport}
                  style={{
                    background: 'var(--admin-accent)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '0.75rem 1.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                    width: 'fit-content',
                  }}
                >
                  {bulkLoading ? 'Importing...' : 'Start Import'}
                </button>
                <button
                  type="button"
                  disabled={previewLoading}
                  onClick={handleBulkPreview}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--admin-border)',
                    color: 'var(--admin-fg)',
                    borderRadius: 10,
                    padding: '0.75rem 1.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    cursor: previewLoading ? 'not-allowed' : 'pointer',
                    width: 'fit-content',
                  }}
                >
                  {previewLoading ? 'Previewing...' : 'Preview Import'}
                </button>
              </div>
              {bulkLoading && (
                <div style={{ height: 6, background: 'rgba(148,163,184,0.2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: 'var(--admin-accent)', animation: 'pulse 1.2s infinite ease-in-out' }} />
                </div>
              )}
              {bulkSummary && (
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-fg-muted)' }}>{bulkSummary}</div>
              )}
              {!!bulkPreviewRows.length && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>
                    Preview {bulkPreviewRows.length} rows
                  </div>
                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {bulkPreviewRows.map(row => (
                      <div
                        key={row.id}
                        style={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 14,
                          padding: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'grid', placeItems: 'center', marginBottom: '0.5rem' }}>
                          <Avatar photoUrl={row.photo_preview_url} size={64} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>
                          {row.name || 'Unnamed'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                          {row.institution || row.department || 'No institution'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textAlign: 'center', marginTop: '0.4rem', color: row.photo_matched ? '#34d399' : '#f87171' }}>
                          {row.photo_matched ? 'Photo matched' : 'No photo match'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)' }}>
                Columns: name, designation, department, institution, expertise, email, phone, linkedin, bio, photo_filename, is_visible.
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {showModal && editingAdviser && (
        <AdviserModal
          adviser={editingAdviser}
          uploading={uploadingPhoto}
          onClose={() => {
            setShowModal(false)
            setEditingAdviser(null)
          }}
          onUpload={uploadPhoto}
          onSave={handleAdviserSave}
          onChange={adviser => setEditingAdviser(adviser)}
        />
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            padding: '0.75rem 1.25rem',
            borderRadius: 12,
            background: toast.tone === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(248,113,113,0.95)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
            zIndex: 80,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

function snapshotState(advisers: Adviser[]) {
  return JSON.stringify({
    advisers: advisers.map(adviser => ({
      id: adviser.id,
      name: adviser.name,
      designation: adviser.designation,
      department: adviser.department,
      institution: adviser.institution,
      expertise_tags: adviser.expertise_tags,
      photo_url: adviser.photo_url,
      email: adviser.email,
      phone: adviser.phone,
      linkedin_url: adviser.linkedin_url,
      bio: adviser.bio,
      show_email: adviser.show_email,
      show_phone: adviser.show_phone,
      is_visible: adviser.is_visible,
      is_disabled: adviser.is_disabled,
      sort_order: adviser.sort_order,
    })),
  })
}

function parseBoolean(value: unknown, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = String(value).trim().toLowerCase()
  if (['false', '0', 'no', 'n'].includes(text)) return false
  if (['true', '1', 'yes', 'y'].includes(text)) return true
  return defaultValue
}

function findZipEntry(zip: JSZip, filename: string) {
  const cleaned = filename.replace(/\\/g, '/').replace(/^\/+/, '')
  let entry = zip.file(cleaned)
  if (entry) return entry
  const lower = cleaned.toLowerCase()
  return Object.values(zip.files).find(file => file.name.toLowerCase().endsWith(lower)) ?? null
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--admin-accent)',
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>{subtitle}</div>
      )}
    </div>
  )
}

function Avatar({ photoUrl, size }: { photoUrl: string | null; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px solid var(--admin-accent)',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        background: photoUrl ? 'var(--admin-surface)' : 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
      }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="Adviser avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c2.5-3.5 13.5-3.5 16 0" />
        </svg>
      )}
    </div>
  )
}

function IconButton({
  icon,
  active,
  ariaLabel,
  onClick,
}: {
  icon: React.ReactNode
  active?: boolean
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        border: '1px solid var(--admin-border)',
        background: active ? 'rgba(148,163,184,0.2)' : 'transparent',
        borderRadius: 10,
        padding: '0.35rem',
        color: 'var(--admin-fg)',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  )
}

function Badge({ label, tone, offset = 0 }: { label: string; tone: 'danger' | 'warning'; offset?: number }) {
  const color = tone === 'danger' ? '#f87171' : '#fb923c'
  return (
    <div
      style={{
        position: 'absolute',
        top: 12 + offset,
        left: 12,
        background: color,
        color: '#fff',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.5rem',
        borderRadius: 999,
      }}
    >
      {label}
    </div>
  )
}

function EyeIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted ? '#9ca3af' : '#34d399'} strokeWidth="1.6">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SlashEyeIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted ? '#9ca3af' : '#fb923c'} strokeWidth="1.6">
      <path d="M3 4l18 16" />
      <path d="M10.6 10.3a3 3 0 004.1 4.4" />
      <path d="M9.9 4.3A10.9 10.9 0 0112 4c6 0 10 8 10 8a21 21 0 01-4.2 5.3" />
      <path d="M6.2 7.4C3.4 9.5 2 12 2 12a21 21 0 005.1 6" />
    </svg>
  )
}

function AdviserModal({
  adviser,
  uploading,
  onClose,
  onSave,
  onChange,
  onUpload,
}: {
  adviser: Adviser
  uploading: boolean
  onClose: () => void
  onSave: (adviser: Adviser) => void
  onChange: (adviser: Adviser) => void
  onUpload: (file: File) => Promise<string | null>
}) {
  const expertiseText = adviser.expertise_tags?.join(', ') ?? ''

  return (
    <ModalShell title={adviser.created_at ? 'Edit Adviser' : 'Add Adviser'} onClose={onClose}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <label style={uploadBoxStyle}>
          <input
            type="file"
            accept="image/*"
            onChange={async event => {
              const file = event.target.files?.[0]
              if (!file) return
              const url = await onUpload(file)
              if (url) onChange({ ...adviser, photo_url: url })
            }}
            style={{ display: 'none' }}
          />
          {adviser.photo_url ? (
            <div style={{ display: 'grid', placeItems: 'center', gap: '0.5rem' }}>
              <Avatar photoUrl={adviser.photo_url} size={80} />
              <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
            </div>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', gap: '0.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--admin-fg)" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c2.5-3.5 13.5-3.5 16 0" />
              </svg>
              <span>{uploading ? 'Uploading...' : 'Upload Photo (optional)'}</span>
            </div>
          )}
        </label>

        <InputField label="Full Name" value={adviser.name ?? ''} onChange={value => onChange({ ...adviser, name: value })} />
        <InputField label="Designation" value={adviser.designation ?? ''} placeholder="e.g. Professor" onChange={value => onChange({ ...adviser, designation: value })} />
        <InputField label="Department" value={adviser.department ?? ''} onChange={value => onChange({ ...adviser, department: value })} />
        <InputField label="Institution" value={adviser.institution ?? ''} onChange={value => onChange({ ...adviser, institution: value })} />
        <InputField label="Expertise Tags" value={expertiseText} placeholder="e.g. Number Theory, Algebra" onChange={value => onChange({ ...adviser, expertise_tags: value.split(',').map(item => item.trim()).filter(Boolean) })} />

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <InputField label="Email" value={adviser.email ?? ''} onChange={value => onChange({ ...adviser, email: value })} />
          <ToggleRow
            label="Show on public page"
            checked={adviser.show_email}
            onChange={checked => onChange({ ...adviser, show_email: checked })}
          />
        </div>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <InputField label="Phone" value={adviser.phone ?? ''} onChange={value => onChange({ ...adviser, phone: value })} />
          <ToggleRow
            label="Show on public page"
            checked={adviser.show_phone}
            onChange={checked => onChange({ ...adviser, show_phone: checked })}
          />
        </div>
        <InputField label="LinkedIn URL" value={adviser.linkedin_url ?? ''} onChange={value => onChange({ ...adviser, linkedin_url: value })} icon="linkedin" />
        <TextAreaField label="Short Bio" value={adviser.bio ?? ''} onChange={value => onChange({ ...adviser, bio: value })} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cancel</button>
        <button type="button" onClick={() => onSave(adviser)} style={primaryButtonStyle}>Save</button>
      </div>
    </ModalShell>
  )
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 70,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 16,
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-fg)',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: 'linkedin'
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ position: 'relative' }}>
        {icon === 'linkedin' && (
          <span style={inputIconStyle}>in</span>
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          style={{
            ...inputStyle,
            paddingLeft: icon ? '2.5rem' : '0.75rem',
          }}
        />
      </div>
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      minHeight={140}
    />
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: '1px solid var(--admin-border)',
          background: checked ? 'var(--admin-accent)' : 'rgba(148,163,184,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          padding: '2px 4px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      </button>
    </label>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(15,23,42,0.25)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
}

const inputIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 12,
  transform: 'translateY(-50%)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  color: 'var(--admin-fg-muted)',
}

const uploadBoxStyle: React.CSSProperties = {
  border: '1px dashed var(--admin-border)',
  borderRadius: 12,
  padding: '1rem',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  color: 'var(--admin-fg)',
  cursor: 'pointer',
  display: 'grid',
  gap: '0.35rem',
}

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '1rem',
  textAlign: 'center',
  color: 'var(--admin-fg)',
}

const mutedStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  color: 'var(--admin-fg-muted)',
  textAlign: 'center',
  marginTop: '0.35rem',
}

const mutedSmallStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--admin-fg-muted)',
  textAlign: 'center',
  marginTop: '0.2rem',
}

const tagStyle: React.CSSProperties = {
  padding: '0.2rem 0.55rem',
  borderRadius: 999,
  border: '1px solid var(--admin-border)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--admin-fg-muted)',
}

const editButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--admin-border)',
  color: 'var(--admin-fg)',
  padding: '0.3rem 0.75rem',
  borderRadius: 999,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const deleteButtonStyle: React.CSSProperties = {
  background: 'rgba(248,113,113,0.15)',
  border: '1px solid rgba(248,113,113,0.4)',
  color: '#f87171',
  padding: '0.3rem 0.75rem',
  borderRadius: 999,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const ghostButtonStyle: React.CSSProperties = {
  border: '1px solid var(--admin-border)',
  background: 'transparent',
  color: 'var(--admin-fg)',
  padding: '0.6rem 1.2rem',
  borderRadius: 10,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  cursor: 'pointer',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--admin-accent)',
  border: 'none',
  color: '#fff',
  padding: '0.6rem 1.4rem',
  borderRadius: 10,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  cursor: 'pointer',
}
