'use client'
import { useState, useTransition } from 'react'
import { GlassCard } from './GlassCard'
import { MathDivider } from './MathDivider'

type PageRow    = { id: string; page_key: string; label: string; route: string; is_visible: boolean }
type SectionRow = { id: string; page: string; section_key: string; label: string; is_visible: boolean; sort_order: number }

const PAGE_LABELS: Record<string, string> = {
  home: 'Home', about: 'About', events: 'Events', gallery: 'Gallery',
  schedule: 'Schedule', notices: 'Notices', committee: 'Committee',
  advisers: 'Advisers', sponsors: 'Sponsors', contact: 'Contact',
  campus_ambassadors: 'Campus Ambassadors', club_partners: 'Club Partners',
}

export function VisibilityPanel({ pages, sections }: { pages: PageRow[], sections: SectionRow[] }) {
  const [tab, setTab] = useState<'pages'|'sections'>('pages')
  const [pageState, setPageState] = useState<Record<string, boolean>>(
    Object.fromEntries(pages.map(p => [p.page_key, p.is_visible]))
  )
  const [sectionState, setSectionState] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.section_key, s.is_visible]))
  )
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const togglePage = (key: string) => {
    const next = !pageState[key]
    setPageState(p => ({ ...p, [key]: next }))
    startTransition(async () => {
      await fetch('/api/admin/visibility/page', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: key, is_visible: next }),
      })
    })
  }

  const toggleSection = (key: string) => {
    const next = !sectionState[key]
    setSectionState(s => ({ ...s, [key]: next }))
    startTransition(async () => {
      await fetch('/api/admin/visibility/section', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_key: key, is_visible: next }),
      })
    })
  }

  // Group sections by page
  const grouped = sections.reduce<Record<string, SectionRow[]>>((acc, s) => {
    if (!acc[s.page]) acc[s.page] = []
    acc[s.page].push(s)
    return acc
  }, {})

  const TABS = ['pages', 'sections'] as const

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem', opacity: 0.7 }}>Admin · Visibility</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--admin-fg)', margin: 0 }}>Visibility Controls</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--admin-fg-muted)', margin: '0.4rem 0 0' }}>
          Show or hide any page or section across the public site without touching code.
        </p>
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search pages or sections…"
        style={{ width: '100%', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: '0.6rem 1rem', color: 'var(--admin-fg)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none', marginBottom: '1.5rem', boxSizing: 'border-box' }}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid var(--admin-border)', cursor: 'pointer', background: tab === t ? 'var(--admin-accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--admin-fg-muted)', transition: 'background 0.15s, color 0.15s' }}>
            {t}
          </button>
        ))}
        {pending && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-accent)', alignSelf: 'center', marginLeft: '0.5rem', opacity: 0.7 }}>Saving…</span>}
      </div>

      {/* Pages tab */}
      {tab === 'pages' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
          {pages
            .filter(p => !search || p.label.toLowerCase().includes(search.toLowerCase()))
            .map(p => (
              <GlassCard key={p.page_key} padding="1.25rem" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--admin-fg)', marginBottom: '0.15rem' }}>{p.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>{p.route}</div>
                  <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: pageState[p.page_key] ? '#20c997' : '#ef4444' }}>
                    <span>{pageState[p.page_key] ? '🟢' : '🔴'}</span>
                    {pageState[p.page_key] ? 'Live' : 'Hidden'}
                  </div>
                </div>
                <Toggle checked={pageState[p.page_key] ?? true} onChange={() => togglePage(p.page_key)} />
              </GlassCard>
            ))}
        </div>
      )}

      {/* Sections tab */}
      {tab === 'sections' && Object.entries(grouped).map(([page, rows]) => {
        const filtered = rows.filter(r => !search || r.label.toLowerCase().includes(search.toLowerCase()))
        if (!filtered.length) return null
        return (
          <div key={page} style={{ marginBottom: '2rem' }}>
            <MathDivider formula={`// ${PAGE_LABELS[page] ?? page} page`} dim />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map(s => (
                <GlassCard key={s.section_key} padding="1rem" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--admin-fg)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)', marginTop: '0.1rem' }}>{s.section_key}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: sectionState[s.section_key] ? '#20c997' : '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {sectionState[s.section_key] ? 'Visible' : 'Hidden'}
                  </div>
                  <Toggle checked={sectionState[s.section_key] ?? true} onChange={() => toggleSection(s.section_key)} />
                </GlassCard>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch" aria-checked={checked}
      style={{
        width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 3,
        background: checked ? 'var(--admin-accent)' : 'var(--admin-border)',
        transition: 'background 0.2s',
        display: 'flex', alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        boxShadow: checked ? '0 0 8px var(--admin-accent-glow)' : 'none',
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'block', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  )
}
