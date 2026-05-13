'use client'

import { useMemo, useState, useTransition } from 'react'
import type { PageSection } from '@/types/database'
import { GlassCard } from './GlassCard'

const EXCLUDED_KEYS = new Set(['home_countdown', 'home_deadline_strip'])

type SectionRow = Pick<PageSection, 'section_key' | 'label' | 'sort_order'>

interface HomeSectionsOrderPanelProps {
  sections: PageSection[]
}

export function HomeSectionsOrderPanel({ sections }: HomeSectionsOrderPanelProps) {
  const initialRows = useMemo<SectionRow[]>(() => (
    sections
      .filter(section => !EXCLUDED_KEYS.has(section.section_key))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(section => ({
        section_key: section.section_key,
        label: section.label,
        sort_order: section.sort_order,
      }))
  ), [sections])

  const [rows, setRows] = useState<SectionRow[]>(initialRows)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  const updateOrder = (key: string, value: number) => {
    setRows(prev => prev.map(row => (
      row.section_key === key
        ? { ...row, sort_order: value }
        : row
    )))
  }

  const handleSave = () => {
    setError('')
    setSuccess('')

    const updates = rows.map(row => ({
      section_key: row.section_key,
      sort_order: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    }))

    startTransition(async () => {
      const response = await fetch('/api/admin/page-sections/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'home', updates }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to update section order.')
        return
      }

      setSuccess('Homepage section order updated.')
    })
  }

  return (
    <div style={{ marginTop: '2rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          Admin · Homepage Sections
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-fg)', margin: 0 }}>
          Section Priority
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>
          Set the order for homepage sections. Lower numbers appear first.
        </p>
      </div>

      {error && <div style={{ marginBottom: '0.75rem', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '0.75rem', color: '#34d399', fontSize: '0.85rem' }}>{success}</div>}

      <GlassCard>
        {rows.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--admin-fg-muted)' }}>
            No homepage sections available.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {rows.map(row => (
              <div key={row.section_key} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--admin-fg)' }}>{row.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', marginTop: '0.2rem' }}>{row.section_key}</div>
                </div>
                <label style={{ display: 'grid', gap: '0.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-fg-muted)' }}>Priority</span>
                  <input
                    type="number"
                    min={0}
                    value={row.sort_order}
                    onChange={event => updateOrder(row.section_key, Number(event.target.value))}
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid var(--admin-border)',
                      padding: '0.45rem 0.65rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      color: 'var(--admin-fg)',
                      background: 'transparent',
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSave}
            disabled={pending || rows.length === 0}
            style={{
              background: 'var(--admin-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '0.65rem 1.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: pending || rows.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px var(--admin-accent-glow)',
              opacity: pending || rows.length === 0 ? 0.7 : 1,
            }}
          >
            {pending ? 'Saving...' : 'Save Priority'}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
