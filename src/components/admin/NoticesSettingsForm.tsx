'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import type { Notice } from '@/types/database'
import { GlassCard } from './GlassCard'

interface NoticesSettingsFormProps {
  initialNotices: Notice[]
}

export function NoticesSettingsForm({ initialNotices }: NoticesSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [dragNoticeId, setDragNoticeId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const categories = useMemo(() => {
    return Array.from(new Set(notices.map(n => n.category).filter(Boolean))) as string[]
  }, [notices])

  const updateNotice = (index: number, field: keyof Notice, value: string | boolean | number | null) => {
    setNotices(prev => prev.map((item, idx) => (
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

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    if (notices.some(notice => !notice.title.trim())) {
      setSaving(false)
      setError('Every notice needs a title.')
      return
    }

    const response = await fetch('/api/admin/notices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notices }),
    })

    const data = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save notices.')
      return
    }

    setSuccess('Notices saved.')
    router.refresh()
  }

  const removeExpired = () => {
    const now = Date.now()
    setNotices(prev => prev.filter(item => !item.expires_at || new Date(item.expires_at).getTime() > now))
  }

  const openEdit = (index: number) => {
    setActiveIndex(index)
  }

  const closeEdit = () => {
    setActiveIndex(null)
  }

  const handleAddNotice = () => {
    const created = {
      id: crypto.randomUUID(),
      title: 'New Notice',
      body: null,
      category: null,
      is_pinned: false,
      is_visible: true,
      publish_at: new Date().toISOString(),
      expires_at: null,
      view_count: 0,
      sort_order: notices.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNotices(prev => {
      const next = [...prev, created]
      setActiveIndex(next.length - 1)
      return next
    })
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          Admin · Notices
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--admin-fg)',
            margin: 0,
          }}
        >
          Notices & Announcements
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          Publish updates, pin priorities, and manage expiry windows.
        </p>
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
          <SectionTitle title="Notices" subtitle="Drag to reorder. Pinned notices surface first." />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {categories.map(category => (
              <span key={category} style={chipStyle}>{category}</span>
            ))}
            <button type="button" style={smallButtonStyle} onClick={removeExpired}>Remove expired</button>
            <button type="button" style={addButtonStyle} onClick={handleAddNotice}>Add Notice</button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {notices.map((notice, index) => (
              <div
                key={notice.id}
                style={{
                  ...listRowStyle,
                  opacity: dragNoticeId === notice.id ? 0.6 : 1,
                  cursor: 'grab',
                  alignItems: 'center',
                }}
                draggable
                onDragStart={() => setDragNoticeId(notice.id)}
                onDragEnd={() => setDragNoticeId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (!dragNoticeId) return
                  setNotices(prev => reorderById(prev, dragNoticeId, notice.id))
                  setDragNoticeId(null)
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-fg)' }}>
                      {notice.title}
                    </div>
                    {notice.category && <span style={chipStyle}>{notice.category}</span>}
                    {notice.is_pinned && <span style={pinBadgeStyle}>Pinned</span>}
                    {!notice.is_visible && <span style={mutedBadgeStyle}>Hidden</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
                    Published: {formatDateShort(notice.publish_at)}
                    {notice.expires_at ? ` · Expires: ${formatDateShort(notice.expires_at)}` : ''}
                    {` · Views: ${notice.view_count}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" style={smallButtonStyle} onClick={() => openEdit(index)}>Edit</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setNotices(prev => moveItem(prev, index, -1))}>↑</button>
                  <button type="button" style={smallButtonStyle} onClick={() => setNotices(prev => moveItem(prev, index, 1))}>↓</button>
                  <button
                    type="button"
                    style={dangerButtonStyle}
                    onClick={() => {
                      setNotices(prev => prev.filter((_, idx) => idx !== index))
                      if (activeIndex === index) setActiveIndex(null)
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={primaryButtonStyle}
        >
          {saving ? 'Saving...' : 'Save Notices'}
        </button>
      </div>

      {activeIndex !== null && notices[activeIndex] && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-accent)' }}>
                  Notice Editor
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>
                  {notices[activeIndex].title || 'Untitled Notice'}
                </div>
              </div>
              <button type="button" style={smallButtonStyle} onClick={closeEdit}>Close</button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <CheckboxField
                  label="Visible"
                  checked={notices[activeIndex].is_visible}
                  onChange={checked => updateNotice(activeIndex, 'is_visible', checked)}
                />
                <CheckboxField
                  label="Pinned"
                  checked={notices[activeIndex].is_pinned}
                  onChange={checked => updateNotice(activeIndex, 'is_pinned', checked)}
                />
              </div>
              <LabeledInput
                label="Title"
                value={notices[activeIndex].title}
                onChange={value => updateNotice(activeIndex, 'title', value)}
              />
              <LabeledInput
                label="Category"
                value={notices[activeIndex].category ?? ''}
                onChange={value => updateNotice(activeIndex, 'category', value || null)}
                placeholder="Important / General / Results"
              />
              <RichTextField
                label="Body"
                value={notices[activeIndex].body ?? ''}
                onChange={value => updateNotice(activeIndex, 'body', value || null)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem' }}>
                <LabeledInput
                  label="Publish date"
                  type="datetime-local"
                  value={toInputDateTime(notices[activeIndex].publish_at)}
                  onChange={value => updateNotice(activeIndex, 'publish_at', value ? new Date(value).toISOString() : notices[activeIndex].publish_at)}
                />
                <LabeledInput
                  label="Expiry date"
                  type="datetime-local"
                  value={toInputDateTime(notices[activeIndex].expires_at)}
                  onChange={value => updateNotice(activeIndex, 'expires_at', value ? new Date(value).toISOString() : null)}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)' }}>
                Views: {notices[activeIndex].view_count}
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

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  )
}

function RichTextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor: editorInstance }) => {
      onChange(editorInstance.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || '<p></p>'
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  return (
    <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={toolbarStyle}>
        <ToolbarButton
          label="B"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="• List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive('link')}
          onClick={() => {
            const previous = editor.getAttributes('link').href
            const url = window.prompt('Enter link URL', previous || '')
            if (url === null) return
            if (!url) {
              editor.chain().focus().unsetLink().run()
              return
            }
            editor.chain().focus().setLink({ href: url }).run()
          }}
        />
        <ToolbarButton
          label="Left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolbarButton
          label="Center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolbarButton
          label="Right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
      </div>
      <div style={editorShellStyle}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...toolbarButtonStyle,
        background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
        color: active ? 'var(--admin-fg)' : 'var(--admin-fg-muted)',
      }}
    >
      {label}
    </button>
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

function toInputDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

function formatDateShort(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  borderRadius: 12,
  border: '1px solid var(--admin-border)',
  padding: '0.5rem 0.65rem',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  outline: 'none',
}

const listRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '0.75rem',
  borderRadius: 16,
  border: '1px solid var(--admin-border)',
  background: 'var(--admin-surface-blur)',
}

const buttonColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const smallButtonStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const dangerButtonStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(248,113,113,0.4)',
  background: 'rgba(248,113,113,0.12)',
  color: '#f87171',
  fontSize: '0.65rem',
  padding: '0.25rem 0.45rem',
  cursor: 'pointer',
}

const addButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px dashed var(--admin-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--admin-fg)',
  fontSize: '0.7rem',
  padding: '0.45rem 0.7rem',
  cursor: 'pointer',
}

const primaryButtonStyle: CSSProperties = {
  background: 'var(--admin-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '0.75rem 1.6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  boxShadow: '0 8px 24px var(--admin-accent-glow)',
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

const pinBadgeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#ef4444',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.4)',
  padding: '0.15rem 0.5rem',
  borderRadius: 999,
}

const mutedBadgeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--admin-border)',
  padding: '0.15rem 0.5rem',
  borderRadius: 999,
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
  width: 'min(920px, 100%)',
  maxHeight: '85vh',
  overflowY: 'auto',
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 20,
  padding: '1.25rem',
  boxShadow: '0 24px 60px rgba(3,7,18,0.35)',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  padding: '0.5rem',
  borderRadius: 12,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.06)',
}

const toolbarButtonStyle: CSSProperties = {
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.25rem 0.6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const editorShellStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--admin-border)',
  padding: '0.75rem',
  background: 'rgba(255,255,255,0.04)',
  minHeight: 160,
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
}
