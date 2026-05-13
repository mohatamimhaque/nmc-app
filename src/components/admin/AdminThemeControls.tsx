'use client'

import { useAdminTheme, ACCENT_COLOURS, type AccentKey } from './AdminThemeProvider'

// ── Theme Mode Toggle ─────────────────────────────────────────────────────────

export function AdminThemeToggle() {
  const { mode, toggleMode } = useAdminTheme()

  return (
    <button
      onClick={toggleMode}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: '999px',
        padding: '0.35rem 0.8rem',
        cursor: 'pointer',
        color: 'var(--admin-fg)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 0 0 2px var(--admin-accent)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
      }}
    >
      <span style={{ fontSize: '0.9rem' }}>{mode === 'dark' ? '☀' : '◑'}</span>
      {mode === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}

// ── Accent Colour Picker ──────────────────────────────────────────────────────

export function AccentPicker() {
  const { accent, setAccent } = useAdminTheme()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--admin-fg-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Accent
      </span>

      {ACCENT_COLOURS.map(col => (
        <button
          key={col.key}
          onClick={() => setAccent(col.key as AccentKey)}
          title={col.label}
          aria-label={`Set accent colour to ${col.label}`}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: col.hex,
            border: accent === col.key
              ? `2px solid var(--admin-fg)`
              : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
            boxShadow: accent === col.key
              ? `0 0 6px ${col.glow}`
              : 'none',
            transform: accent === col.key ? 'scale(1.25)' : 'scale(1)',
            transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

// ── Compact controls bar (toggle + accent picker combined) ─────────────────

export function AdminThemeControls() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <AccentPicker />
      <AdminThemeToggle />
    </div>
  )
}
