'use client'

import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { CommitteeMember, SubCommittee } from '@/types/database'

interface CommitteePublicViewProps {
  subCommittees: SubCommittee[]
  members: CommitteeMember[]
}

export function CommitteePublicView({ subCommittees, members }: CommitteePublicViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [query, setQuery] = useState('')

  const visibleSubCommittees = useMemo(
    () => subCommittees.filter(item => item.is_visible !== false),
    [subCommittees]
  )

  const visibleMembers = useMemo(() => {
    const committeeOrder = new Map<string, number>()
    visibleSubCommittees
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .forEach((tab, index) => committeeOrder.set(tab.id, index))

    return members
      .filter(member => member.is_visible !== false && visibleSubCommittees.some(tab => tab.id === member.sub_committee_id))
      .sort((a, b) => {
        const subOrder = (committeeOrder.get(a.sub_committee_id) ?? 0) - (committeeOrder.get(b.sub_committee_id) ?? 0)
        if (subOrder !== 0) return subOrder
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })
  }, [members, visibleSubCommittees])

  const subCommitteeLabelById = useMemo(() => {
    const map = new Map<string, string>()
    visibleSubCommittees.forEach(tab => {
      map.set(tab.id, tab.display_label || tab.name)
    })
    return map
  }, [visibleSubCommittees])

  useEffect(() => {
    if (activeTab !== 'all' && !visibleSubCommittees.some(tab => tab.id === activeTab)) {
      setActiveTab('all')
    }
  }, [activeTab, visibleSubCommittees])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    visibleSubCommittees.forEach(tab => {
      map.set(tab.id, visibleMembers.filter(member => member.sub_committee_id === tab.id).length)
    })
    return map
  }, [visibleMembers, visibleSubCommittees])

  const tabIds = useMemo(
    () => ['all', ...visibleSubCommittees.map(tab => tab.id)],
    [visibleSubCommittees]
  )

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabIds.indexOf(id)
    if (index < 0) return
    const nextIndex = event.key === 'ArrowRight'
      ? (index + 1) % tabIds.length
      : (index - 1 + tabIds.length) % tabIds.length
    setActiveTab(tabIds[nextIndex])
  }

  const baseMembers = useMemo(() => {
    if (activeTab === 'all') return visibleMembers
    return visibleMembers.filter(member => member.sub_committee_id === activeTab)
  }, [activeTab, visibleMembers])

  const filteredMembers = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return baseMembers
    return baseMembers.filter(member => {
      const name = member.name?.toLowerCase() ?? ''
      const role = member.role?.toLowerCase() ?? ''
      const dept = member.department?.toLowerCase() ?? ''
      return name.includes(text) || role.includes(text) || dept.includes(text)
    })
  }, [baseMembers, query])

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .committee-tabs {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          padding: 0.25rem 0;
        }
        .committee-tab {
          border-radius: 999px;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--surface);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .committee-tab.active {
          background: var(--color-primary);
          color: #fff;
          border-color: var(--color-primary);
          box-shadow: 0 14px 28px rgba(37,99,235,0.3);
        }
        .committee-card {
          background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.2rem 1.6rem 1.7rem;
          text-align: center;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: card-fade 500ms ease forwards;
          box-shadow: var(--shadow-md);
          opacity: 0;
          transform: translateY(10px);
        }
        .committee-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
        }
        .committee-avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 3px solid var(--color-primary);
          overflow: hidden;
          display: grid;
          place-items: center;
          margin: -3.6rem auto 0.9rem;
          background: linear-gradient(135deg, #2563eb, #22d3ee);
        }
        .committee-avatar.has-image {
          background: transparent;
        }
        .committee-card.disabled {
          filter: grayscale(1);
          opacity: 0.7;
        }
        .committee-disabled-badge {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(148,163,184,0.55);
          color: #fff;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
          border-radius: 16px;
        }
        .committee-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          .committee-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 768px) {
          .committee-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .committee-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @keyframes card-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section style={{ padding: '2.5rem 1.5rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={heroCardStyle}>
          <div style={eyebrowStyle}>Committee</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem,6vw,3.3rem)', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Organizing Committee
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', maxWidth: 640, margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Meet the team behind NMC 2026.
          </p>
        </div>
      </section>

      <div style={{ padding: '0 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div className="committee-tabs" role="tablist" aria-label="Sub-committee tabs">
        <button
          type="button"
          className={`committee-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          onKeyDown={event => handleTabKey(event, 'all')}
          role="tab"
          aria-selected={activeTab === 'all'}
        >
          All ({visibleMembers.length})
        </button>
        {visibleSubCommittees.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`committee-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={event => handleTabKey(event, tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.display_label || tab.name} ({counts.get(tab.id) ?? 0})
          </button>
        ))}
        </div>
      </div>

      <section style={{ padding: '2rem 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{ position: 'relative' }}>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by name, role, or department"
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.6rem',
                borderRadius: 12,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                color: 'var(--foreground)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
              aria-label="Search committee members"
            />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--foreground-muted)',
                display: 'inline-flex',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
          </label>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
            Showing {filteredMembers.length} of {baseMembers.length} members
          </div>
        </div>

        {baseMembers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--foreground-muted)', padding: '3rem 0' }}>
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.5 }}>
              <circle cx="30" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
              <circle cx="60" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
              <circle cx="90" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
              <path d="M8 70c6-12 28-12 44 0" stroke="currentColor" strokeWidth="2" />
              <path d="M40 70c6-12 28-12 44 0" stroke="currentColor" strokeWidth="2" />
              <path d="M68 70c6-12 28-12 44 0" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div style={{ marginTop: '1rem', fontFamily: 'var(--font-body)' }}>No members yet</div>
          </div>
        ) : (
          <div className="committee-grid">
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className={`committee-card ${member.is_disabled ? 'disabled' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
                aria-label={member.name ? `Profile card for ${member.name}` : 'Committee member'}
              >
                <div className={`committee-avatar ${member.photo_url ? 'has-image' : ''}`}>
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name || 'NMC 2026'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c2.5-3.5 13.5-3.5 16 0" />
                    </svg>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
                  {member.name ?? 'Unnamed Member'}
                </div>
                {activeTab === 'all' && (
                  <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
                    {subCommitteeLabelById.get(member.sub_committee_id) ?? 'Sub-Committee'}
                  </div>
                )}
                {member.role && (
                  <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                    {member.role}
                  </div>
                )}
                {member.designation && (
                  <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                    {member.designation}
                  </div>
                )}
                {member.department && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                    {member.department}
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                  {member.show_email && member.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4 6h16v12H4z" />
                        <path d="M4 6l8 7 8-7" />
                      </svg>
                      {member.email}
                    </span>
                  )}
                  {member.show_phone && member.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M4.5 3.5h3l2 5-2.5 1.5c1 2 2.5 3.5 4.5 4.5L13 12l5 2v3c0 .6-.4 1-1 1-6.6 0-12-5.4-12-12 0-.6.4-1 1-1Z" />
                      </svg>
                      {member.phone}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn profile"
                      style={{ color: '#0a66c2', textDecoration: 'none' }}
                    >
                      in
                    </a>
                  )}
                  {member.facebook_url && (
                    <a
                      href={member.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook profile"
                      style={{ color: '#1877f2', textDecoration: 'none' }}
                    >
                      f
                    </a>
                  )}
                </div>
                {member.is_disabled && (
                  <div className="committee-disabled-badge">Currently Unavailable</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
}

const heroCardStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'transparent',
  padding: '2.25rem 2rem',
}
