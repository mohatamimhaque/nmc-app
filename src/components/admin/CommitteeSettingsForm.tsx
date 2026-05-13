'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { CommitteeMember, SubCommittee } from '@/types/database'
import { GlassCard, StatCard } from './GlassCard'

interface CommitteeSettingsFormProps {
  initialSubCommittees: SubCommittee[]
  initialMembers: CommitteeMember[]
}

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

interface BulkPreviewRow {
  id: string
  sub_committee: string
  name: string
  role: string
  designation: string
  department: string
  email: string
  phone: string
  facebook: string
  linkedin: string
  is_visible: boolean
  photo_filename: string
  photo_preview_url: string | null
  photo_matched: boolean
}

const EMPTY_MEMBER: CommitteeMember = {
  id: '',
  sub_committee_id: '',
  name: '',
  role: '',
  designation: '',
  department: '',
  photo_url: null,
  email: '',
  phone: '',
  facebook_url: '',
  linkedin_url: '',
  show_email: false,
  show_phone: false,
  is_visible: true,
  is_disabled: false,
  sort_order: 1,
  created_at: '',
  updated_at: '',
}

const ALL_TAB_ID = 'all'

export function CommitteeSettingsForm({
  initialSubCommittees,
  initialMembers,
}: CommitteeSettingsFormProps) {
  const router = useRouter()
  const [subCommittees, setSubCommittees] = useState<SubCommittee[]>(initialSubCommittees)
  const [members, setMembers] = useState<CommitteeMember[]>(initialMembers)
  const [activeSubCommitteeId, setActiveSubCommitteeId] = useState<string>(
    initialSubCommittees[0]?.id ?? ''
  )
  const [dragTabId, setDragTabId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null)
  const [showSubCommitteeModal, setShowSubCommitteeModal] = useState(false)
  const [pendingDeleteSubCommitteeId, setPendingDeleteSubCommitteeId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkXlsx, setBulkXlsx] = useState<File | null>(null)
  const [bulkZip, setBulkZip] = useState<File | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSummary, setBulkSummary] = useState<string>('')
  const [bulkPreviewRows, setBulkPreviewRows] = useState<BulkPreviewRow[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => snapshotState(initialSubCommittees, initialMembers))
  const currentSnapshot = useMemo(() => snapshotState(subCommittees, members), [subCommittees, members])
  const isDirty = lastSavedSnapshot !== currentSnapshot
  const subCommitteeIdsKey = useMemo(
    () => subCommittees.map(item => item.id).join('|'),
    [subCommittees]
  )

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

  useEffect(() => {
    if (!activeSubCommitteeId && subCommittees.length) {
      setActiveSubCommitteeId(subCommittees[0].id)
    }
    if (activeSubCommitteeId && activeSubCommitteeId !== ALL_TAB_ID && !subCommittees.find(item => item.id === activeSubCommitteeId)) {
      setActiveSubCommitteeId(subCommittees[0]?.id ?? '')
    }
  }, [activeSubCommitteeId, subCommitteeIdsKey])

  const activeMembers = useMemo(
    () => {
      const committeeOrder = new Map<string, number>()
      subCommittees
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .forEach((tab, index) => committeeOrder.set(tab.id, index))

      const filtered = activeSubCommitteeId === ALL_TAB_ID
        ? members
        : members.filter(member => member.sub_committee_id === activeSubCommitteeId)

      return [...filtered].sort((a, b) => {
        const subOrder = (committeeOrder.get(a.sub_committee_id) ?? 0) - (committeeOrder.get(b.sub_committee_id) ?? 0)
        if (subOrder !== 0) return subOrder
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })
    },
    [members, activeSubCommitteeId, subCommittees]
  )

  const totals = useMemo(() => {
    return {
      subCommittees: subCommittees.length,
      members: members.length,
      hidden: members.filter(member => !member.is_visible).length,
    }
  }, [members, subCommittees])

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone })
  }

  const handleSave = async (overrideMembers?: CommitteeMember[], overrideSubCommittees?: SubCommittee[]) => {
    setSaving(true)

    const normalizedSubCommittees = (overrideSubCommittees ?? subCommittees).map((item, index) => ({
      ...item,
      name: item.name?.trim() || 'Untitled Sub-Committee',
      sort_order: index + 1,
      is_visible: item.is_visible !== false,
    }))

    const membersToSave = (overrideMembers ?? members).map((member, index) => ({
      ...member,
      name: member.name?.trim() || null,
      role: member.role?.trim() || null,
      designation: member.designation?.trim() || null,
      department: member.department?.trim() || null,
      email: member.email?.trim() || null,
      phone: member.phone?.trim() || null,
      facebook_url: member.facebook_url?.trim() || null,
      linkedin_url: member.linkedin_url?.trim() || null,
      sort_order: index + 1,
      show_email: Boolean(member.show_email),
      show_phone: Boolean(member.show_phone),
      is_visible: member.is_visible !== false,
      is_disabled: member.is_disabled === true,
    }))

    const response = await fetch('/api/admin/committee', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subCommittees: normalizedSubCommittees,
        members: membersToSave,
      }),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      showToast(data?.error ?? 'Failed to save committee changes.', 'error')
      return
    }

    setSubCommittees(normalizedSubCommittees)
    setMembers(membersToSave)
    setLastSavedSnapshot(snapshotState(normalizedSubCommittees, membersToSave))
    showToast('Committee changes saved.', 'success')
    router.refresh()
  }

  const handleSubCommitteeVisibility = (id: string) => {
    setSubCommittees(prev => prev.map(item => (
      item.id === id ? { ...item, is_visible: !item.is_visible } : item
    )))
  }

  const handleSubCommitteeDelete = (id: string) => {
    setSubCommittees(prev => prev.filter(item => item.id !== id))
    setMembers(prev => prev.filter(member => member.sub_committee_id !== id))
    setPendingDeleteSubCommitteeId(null)
  }

  const handleReorder = (dragId: string, targetId: string) => {
    if (dragId === targetId) return
    setSubCommittees(prev => {
      const fromIndex = prev.findIndex(item => item.id === dragId)
      const toIndex = prev.findIndex(item => item.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return prev
      const copy = [...prev]
      const [moved] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, moved)
      return copy
    })
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, tabId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setActiveSubCommitteeId(tabId)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()

    setSubCommittees(prev => {
      const fromIndex = prev.findIndex(item => item.id === tabId)
      if (fromIndex < 0) return prev
      const toIndex = event.key === 'ArrowLeft' ? fromIndex - 1 : fromIndex + 1
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const copy = [...prev]
      const [moved] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, moved)
      return copy
    })
  }

  const openMemberModal = (member?: CommitteeMember) => {
    if (!subCommittees.length) {
      showToast('Add a sub-committee first.', 'error')
      return
    }
    if (member) {
      setEditingMember(member)
    } else {
      const baseSubCommittee = activeSubCommitteeId || subCommittees[0]?.id
      const resolvedSubCommittee = baseSubCommittee === ALL_TAB_ID
        ? subCommittees[0]?.id
        : baseSubCommittee
      const defaultMember: CommitteeMember = {
        ...EMPTY_MEMBER,
        id: crypto.randomUUID(),
        sub_committee_id: resolvedSubCommittee ?? '',
        sort_order: members.length + 1,
      }
      setEditingMember(defaultMember)
    }
    setShowMemberModal(true)
  }

  const handleMemberSave = async (member: CommitteeMember) => {
    const existingIndex = members.findIndex(item => item.id === member.id)
    const nextMembers = existingIndex >= 0
      ? members.map(item => (item.id === member.id ? member : item))
      : [...members, member]

    setMembers(nextMembers)

    setShowMemberModal(false)
    setEditingMember(null)

    await handleSave(nextMembers)
  }

  const handleMemberDelete = (id: string) => {
    setMembers(prev => prev.filter(member => member.id !== id))
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

    const response = await fetch('/api/admin/committee', {
      method: 'POST',
      body: formData,
    })

    const rawText = await response.text().catch(() => '')
    let data: any = null
    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch {
        data = null
      }
    }
    setBulkLoading(false)

    if (!response.ok) {
      const fallback = data?.error
        ?? data?.message
        ?? rawText
        ?? ''
      const detail = fallback ? ` (${fallback})` : ''
      const summaryDetail = fallback || 'Bulk import failed.'
      setBulkSummary(summaryDetail)
      showToast(`Bulk import failed${detail}`, 'error')
      return
    }

    const inserted = (data?.inserted ?? []) as CommitteeMember[]
    const createdSubCommittees = (data?.createdSubCommittees ?? []) as SubCommittee[]
    let nextSubCommittees = subCommittees

    if (createdSubCommittees.length) {
      setSubCommittees(prev => {
        const merged = [...prev]
        createdSubCommittees.forEach(item => {
          if (!merged.some(existing => existing.id === item.id)) {
            merged.push(item)
          }
        })
        merged.sort((a, b) => a.sort_order - b.sort_order)
        nextSubCommittees = merged
        return merged
      })
    }

    setMembers(prev => {
      const next = [...prev, ...inserted]
      setLastSavedSnapshot(snapshotState(nextSubCommittees, next))
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

      let missingSubCommittee = 0

      const rows = await Promise.all(rawRows.map(async (rawRow, index) => {
        const normalized = normalizeExcelRow(rawRow)
        const subCommitteeName = getSubCommitteeName(normalized)

        const photoFilename = normalized.photo_filename ? String(normalized.photo_filename).trim() : ''
        const entry = photoFilename ? findZipEntry(zip, photoFilename) : null
        let photoUrl: string | null = null

        if (entry) {
          const blob = await entry.async('blob')
          photoUrl = URL.createObjectURL(blob)
        }

        if (!subCommitteeName) {
          missingSubCommittee += 1
        }

        return {
          id: `${index}-${Date.now()}`,
          sub_committee: subCommitteeName,
          name: normalized.name ? String(normalized.name).trim() : '',
          role: normalized.role ? String(normalized.role).trim() : '',
          designation: normalized.designation ? String(normalized.designation).trim() : '',
          department: normalized.department ? String(normalized.department).trim() : '',
          email: normalized.email ? String(normalized.email).trim() : '',
          phone: normalized.phone ? String(normalized.phone).trim() : '',
          facebook: normalized.facebook ? String(normalized.facebook).trim() : '',
          linkedin: normalized.linkedin ? String(normalized.linkedin).trim() : '',
          is_visible: parseBoolean(normalized.is_visible, true),
          photo_filename: photoFilename,
          photo_preview_url: photoUrl,
          photo_matched: Boolean(entry),
        }
      }))

      setBulkPreviewRows(rows)
      const matched = rows.filter(row => row.photo_matched).length
      const summaryParts = [`${rows.length} rows loaded.`, `${matched} photos matched.`]
      if (missingSubCommittee) {
        summaryParts.push(`${missingSubCommittee} rows missing sub-committee.`)
      }
      setBulkSummary(summaryParts.join(' '))
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
        .admin-committee-tabs {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .admin-committee-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: 999px;
          padding: 0.55rem 1rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--admin-fg);
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          box-shadow: 0 8px 20px rgba(3,7,18,0.2);
        }
        .admin-committee-tab[data-active='true'] {
          border-color: var(--admin-accent);
          box-shadow: 0 0 0 1px var(--admin-accent);
        }
        .admin-committee-tab button {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
        }
        .admin-committee-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 700px) {
          .admin-committee-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1100px) {
          .admin-committee-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .admin-committee-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 36px rgba(3,7,18,0.35);
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
            Admin · Committee
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
            Organizing Committee
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              color: 'var(--admin-fg-muted)',
              marginTop: '0.4rem',
            }}
          >
            Manage sub-committees, member profiles, and visibility controls.
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
            borderRadius: 12,
            padding: '0.6rem 1.2rem',
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
        <StatCard label="Sub-Committees" value={totals.subCommittees} />
        <StatCard label="Total Members" value={totals.members} />
        <StatCard label="Hidden Members" value={totals.hidden} />
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <GlassCard accent>
          <SectionTitle title="Sub-Committee Tabs" subtitle="Drag tabs to set priority, then save." />
          <div className="admin-committee-tabs">
            <div
              className="admin-committee-tab"
              data-active={activeSubCommitteeId === ALL_TAB_ID}
              onClick={() => setActiveSubCommitteeId(ALL_TAB_ID)}
            >
              <span style={{ fontWeight: 600 }}>All</span>
              <span
                style={{
                  background: 'rgba(148,163,184,0.2)',
                  borderRadius: 999,
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.6rem',
                }}
              >
                {members.length}
              </span>
            </div>
            {subCommittees.map(tab => (
              <div
                key={tab.id}
                className="admin-committee-tab"
                data-active={tab.id === activeSubCommitteeId}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={event => {
                  setDragTabId(tab.id)
                  event.dataTransfer.setData('text/plain', tab.id)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => setDragTabId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={event => {
                  const draggedId = event.dataTransfer.getData('text/plain') || dragTabId
                  if (!draggedId) return
                  handleReorder(draggedId, tab.id)
                  setDragTabId(null)
                }}
                onKeyDown={event => handleTabKeyDown(event, tab.id)}
                onClick={() => setActiveSubCommitteeId(tab.id)}
              >
                <span style={{ fontWeight: 600 }}>{tab.display_label || tab.name}</span>
                <span
                  style={{
                    background: 'rgba(148,163,184,0.2)',
                    borderRadius: 999,
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.6rem',
                  }}
                >
                  {members.filter(member => member.sub_committee_id === tab.id).length}
                </span>
                <button
                  type="button"
                  aria-label={tab.is_visible ? 'Hide tab' : 'Show tab'}
                  onClick={event => {
                    event.stopPropagation()
                    handleSubCommitteeVisibility(tab.id)
                  }}
                  title={tab.is_visible ? 'Hide tab' : 'Show tab'}
                >
                  <EyeIcon muted={!tab.is_visible} />
                </button>
                <button
                  type="button"
                  aria-label="Delete tab"
                  onClick={event => {
                    event.stopPropagation()
                    setPendingDeleteSubCommitteeId(tab.id)
                  }}
                  title="Delete tab"
                >
                  <TrashIcon tint="#f87171" />
                </button>
                <span style={{ cursor: 'grab', opacity: 0.6 }}>::</span>
              </div>
            ))}
            <button
              type="button"
              className="admin-committee-tab admin-pill-button"
              style={{ borderStyle: 'dashed' }}
              onClick={() => setShowSubCommitteeModal(true)}
            >
              + Add Sub-Committee
            </button>
          </div>

          {pendingDeleteSubCommitteeId && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
              Delete this sub-committee?&nbsp;
              <button
                type="button"
                onClick={() => handleSubCommitteeDelete(pendingDeleteSubCommitteeId)}
                style={inlineButtonStyle}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteSubCommitteeId(null)}
                style={inlineButtonStyle}
              >
                No
              </button>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <SectionTitle title="Members" subtitle="Cards for the active sub-committee." />
            <button
              type="button"
              onClick={() => openMemberModal()}
              className="admin-pill-button"
              style={{
                background: 'var(--admin-accent)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 10px 24px var(--admin-accent-glow)',
              }}
            >
              + Add Member
            </button>
          </div>

          {activeSubCommitteeId ? (
            <div className="admin-committee-grid">
              {activeMembers.length ? (
                activeMembers.map(member => (
                  <div
                    key={member.id}
                    className="admin-committee-card"
                    style={{
                      position: 'relative',
                      background: 'linear-gradient(180deg, var(--admin-surface) 0%, var(--admin-surface-blur) 100%)',
                      borderRadius: 20,
                      border: member.is_disabled ? '1px solid rgba(251,146,60,0.6)' : '1px solid var(--admin-border)',
                      padding: '1.2rem 1.1rem',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      opacity: member.is_visible ? 1 : 0.45,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    {member.is_visible === false && (
                      <Badge label="Hidden" tone="danger" />
                    )}
                    {member.is_disabled && (
                      <Badge label="Disabled" tone="warning" offset={32} />
                    )}
                    <div style={{ display: 'grid', placeItems: 'center', marginBottom: '0.8rem' }}>
                      <Avatar photoUrl={member.photo_url} size={88} />
                    </div>
                    <div style={nameStyle}>{member.name || 'Unnamed Member'}</div>
                    {member.role && <div style={roleStyle}>{member.role}</div>}
                    {member.designation && <div style={mutedStyle}>{member.designation}</div>}
                    {member.department && <div style={mutedSmallStyle}>{member.department}</div>}
                    <div style={{ height: 1, background: 'var(--admin-border)', margin: '1rem 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <IconButton
                          active={member.is_visible}
                          ariaLabel="Toggle visibility"
                          onClick={() => {
                            setMembers(prev => prev.map(item => (
                              item.id === member.id ? { ...item, is_visible: !item.is_visible } : item
                            )))
                          }}
                          icon={<EyeIcon muted={!member.is_visible} />}
                        />
                        <IconButton
                          active={member.is_disabled}
                          ariaLabel="Toggle disabled"
                          onClick={() => {
                            setMembers(prev => prev.map(item => (
                              item.id === member.id ? { ...item, is_disabled: !item.is_disabled } : item
                            )))
                          }}
                          icon={<SlashEyeIcon muted={!member.is_disabled} />}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" style={editButtonStyle} onClick={() => openMemberModal(member)}>Edit</button>
                        <button type="button" style={deleteButtonStyle} onClick={() => handleMemberDelete(member.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-fg-muted)' }}>
                  No members yet for this sub-committee.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--admin-fg-muted)' }}>
              Add a sub-committee to start adding members.
            </div>
          )}
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
            Bulk Import via Excel + ZIP {bulkOpen ? '▲' : '▼'}
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-fg-muted)', textAlign: 'center', marginTop: '0.3rem' }}>
                          {row.sub_committee || 'No sub-committee'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--admin-accent)', textAlign: 'center', marginTop: '0.25rem' }}>
                          {row.role || 'Member'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                          {row.department || row.designation || 'No department'}
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
                Columns: sub_committee, name, role, designation, department, email, phone, facebook, linkedin, photo_filename, is_visible.
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {showMemberModal && editingMember && (
        <MemberModal
          member={editingMember}
          subCommittees={subCommittees}
          uploading={uploadingPhoto}
          onClose={() => {
            setShowMemberModal(false)
            setEditingMember(null)
          }}
          onUpload={uploadPhoto}
          onSave={handleMemberSave}
          onChange={member => setEditingMember(member)}
        />
      )}

      {showSubCommitteeModal && (
        <SubCommitteeModal
          onClose={() => setShowSubCommitteeModal(false)}
          onSave={(name, label) => {
            const id = crypto.randomUUID()
            const next: SubCommittee = {
              id,
              name: name.trim() || 'New Sub-Committee',
              display_label: label.trim() || null,
              is_visible: true,
              sort_order: subCommittees.length + 1,
            }
            setSubCommittees(prev => [...prev, next])
            setActiveSubCommitteeId(id)
            setShowSubCommitteeModal(false)
          }}
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

function snapshotState(subCommittees: SubCommittee[], members: CommitteeMember[]) {
  return JSON.stringify({
    subCommittees: subCommittees.map(item => ({
      id: item.id,
      name: item.name,
      display_label: item.display_label,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
    })),
    members: members.map(member => ({
      id: member.id,
      sub_committee_id: member.sub_committee_id,
      name: member.name,
      role: member.role,
      designation: member.designation,
      department: member.department,
      photo_url: member.photo_url,
      email: member.email,
      phone: member.phone,
      facebook_url: member.facebook_url,
      linkedin_url: member.linkedin_url,
      show_email: member.show_email,
      show_phone: member.show_phone,
      is_visible: member.is_visible,
      is_disabled: member.is_disabled,
      sort_order: member.sort_order,
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

function normalizeExcelRow(rawRow: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(rawRow).map(([key, value]) => {
      const normalizedKey = String(key).trim().toLowerCase().replace(/[\s-]+/g, '_')
      return [normalizedKey, value]
    })
  ) as Record<string, unknown>
}

function getSubCommitteeName(normalized: Record<string, unknown>) {
  const value = normalized.sub_committee ?? normalized.sub_committee_name ?? normalized.subcommittee
  return value ? String(value).trim() : ''
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
        <img src={photoUrl} alt="Member avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

function TrashIcon({ tint = '#f87171' }: { tint?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth="1.6">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </svg>
  )
}

function MemberModal({
  member,
  subCommittees,
  uploading,
  onClose,
  onSave,
  onChange,
  onUpload,
}: {
  member: CommitteeMember
  subCommittees: SubCommittee[]
  uploading: boolean
  onClose: () => void
  onSave: (member: CommitteeMember) => void
  onChange: (member: CommitteeMember) => void
  onUpload: (file: File) => Promise<string | null>
}) {
  return (
    <ModalShell title={member.created_at ? 'Edit Member' : 'Add Member'} onClose={onClose}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <label style={uploadBoxStyle}>
          <input
            type="file"
            accept="image/*"
            onChange={async event => {
              const file = event.target.files?.[0]
              if (!file) return
              const url = await onUpload(file)
              if (url) onChange({ ...member, photo_url: url })
            }}
            style={{ display: 'none' }}
          />
          {member.photo_url ? (
            <div style={{ display: 'grid', placeItems: 'center', gap: '0.5rem' }}>
              <Avatar photoUrl={member.photo_url} size={80} />
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

        <InputField label="Full Name" value={member.name ?? ''} onChange={value => onChange({ ...member, name: value })} />
        <InputField label="Role in Sub-Committee" value={member.role ?? ''} placeholder="e.g. Coordinator" onChange={value => onChange({ ...member, role: value })} />
        <InputField label="Designation" value={member.designation ?? ''} placeholder="e.g. B.Sc. 3rd Year" onChange={value => onChange({ ...member, designation: value })} />
        <InputField label="Department" value={member.department ?? ''} onChange={value => onChange({ ...member, department: value })} />

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <InputField label="Email" value={member.email ?? ''} onChange={value => onChange({ ...member, email: value })} />
          <ToggleRow
            label="Show on public page"
            checked={member.show_email}
            onChange={checked => onChange({ ...member, show_email: checked })}
          />
        </div>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <InputField label="Phone" value={member.phone ?? ''} onChange={value => onChange({ ...member, phone: value })} />
          <ToggleRow
            label="Show on public page"
            checked={member.show_phone}
            onChange={checked => onChange({ ...member, show_phone: checked })}
          />
        </div>
        <InputField label="Facebook URL" value={member.facebook_url ?? ''} onChange={value => onChange({ ...member, facebook_url: value })} icon="facebook" />
        <InputField label="LinkedIn URL" value={member.linkedin_url ?? ''} onChange={value => onChange({ ...member, linkedin_url: value })} icon="linkedin" />

        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={labelStyle}>Move to Sub-Committee</span>
          <select
            value={member.sub_committee_id}
            onChange={event => onChange({ ...member, sub_committee_id: event.target.value })}
            style={selectStyle}
          >
            {subCommittees.map(item => (
              <option key={item.id} value={item.id}>{item.display_label || item.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cancel</button>
        <button type="button" onClick={() => onSave(member)} style={primaryButtonStyle}>Save</button>
      </div>
    </ModalShell>
  )
}

function SubCommitteeModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, label: string) => void }) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')

  return (
    <ModalShell title="New Sub-Committee" onClose={onClose}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <InputField label="Name" value={name} onChange={setName} />
        <InputField label="Display Label" value={label} onChange={setLabel} placeholder="Optional override" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>Cancel</button>
        <button type="button" onClick={() => onSave(name, label)} style={primaryButtonStyle}>Save</button>
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
              fontSize: '1.2rem',
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
  icon?: 'facebook' | 'linkedin'
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ position: 'relative' }}>
        {icon === 'facebook' && (
          <span style={inputIconStyle}>f</span>
        )}
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
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

const inlineButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--admin-accent)',
  fontFamily: 'var(--font-mono)',
  cursor: 'pointer',
  marginRight: '0.5rem',
}

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '1rem',
  textAlign: 'center',
  color: 'var(--admin-fg)',
}

const roleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--admin-accent)',
  textAlign: 'center',
  marginTop: '0.4rem',
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
