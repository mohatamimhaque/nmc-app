'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'

interface RichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  minHeight?: number
  variant?: 'admin' | 'public'
}

export function RichTextField({
  label,
  value,
  onChange,
  minHeight = 120,
  variant = 'admin',
}: RichTextFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style: [
          `min-height:${minHeight}px`,
          'outline:none',
          `font-family:${variant === 'admin' ? 'var(--font-body)' : 'var(--font-body)'}`,
          `font-size:${variant === 'admin' ? '0.85rem' : '0.9rem'}`,
          `color:${variant === 'admin' ? 'var(--admin-fg)' : 'var(--foreground)'}`,
        ].join(';'),
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      onChange(editorInstance.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || '<p></p>'
    if (current !== next) {
      editor.commands.setContent(next, false)
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  const isAdmin = variant === 'admin'
  const labelStyle = isAdmin ? adminLabelStyle : publicLabelStyle
  const toolbarStyle = isAdmin ? adminToolbarStyle : publicToolbarStyle
  const toolbarButtonBase = isAdmin ? adminToolbarButtonStyle : publicToolbarButtonStyle
  const editorShellStyle = isAdmin ? adminEditorShellStyle : publicEditorShellStyle

  return (
    <div style={{ display: 'grid', gap: '0.35rem', marginBottom: isAdmin ? '0.75rem' : 0 }}>
      <span style={labelStyle}>{label}</span>
      <div style={toolbarStyle}>
        <ToolbarButton
          label="B"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="U"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="• List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="1. List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
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
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="Left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="Center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
        />
        <ToolbarButton
          label="Right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          style={toolbarButtonBase}
          activeColor={isAdmin ? 'var(--admin-fg)' : 'var(--foreground)'}
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
  style,
  activeColor,
}: {
  label: string
  active: boolean
  onClick: () => void
  style: React.CSSProperties
  activeColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...style,
        background: active ? 'rgba(255,255,255,0.18)' : style.background,
        color: active ? activeColor : style.color,
      }}
    >
      {label}
    </button>
  )
}

const adminLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const publicLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--foreground-muted)',
}

const adminToolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
  padding: '0.45rem',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.03)',
}

const publicToolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem',
  padding: '0.45rem',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
}

const adminToolbarButtonStyle: React.CSSProperties = {
  border: '1px solid var(--admin-border)',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 8,
  padding: '0.2rem 0.5rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  color: 'var(--admin-fg-muted)',
}

const publicToolbarButtonStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'rgba(148,163,184,0.08)',
  borderRadius: 8,
  padding: '0.2rem 0.5rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  color: 'var(--foreground-muted)',
}

const adminEditorShellStyle: React.CSSProperties = {
  border: '1px solid var(--admin-border)',
  borderRadius: 10,
  padding: '0.6rem 0.75rem',
  background: 'rgba(255,255,255,0.04)',
}

const publicEditorShellStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.6rem 0.75rem',
  background: 'var(--surface)',
}
