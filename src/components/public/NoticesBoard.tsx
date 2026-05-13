'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DOMPurify from 'dompurify'
import type { Notice } from '@/types/database'

interface NoticesBoardProps {
  notices: Notice[]
}

export function NoticesBoard({ notices }: NoticesBoardProps) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [liveNotices, setLiveNotices] = useState<Notice[]>(notices)

  useEffect(() => {
    setLiveNotices(notices)
  }, [notices])

  useEffect(() => {
    const supabase = createClient()

    const fetchLatest = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('is_visible', true)
        .lte('publish_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('publish_at', { ascending: false })
      if (data) {
        setLiveNotices(data as Notice[])
      }
    }

    const channel = supabase
      .channel('public:notices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => {
          fetchLatest()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const categories = useMemo(() => {
    const values = Array.from(new Set(liveNotices.map(n => n.category).filter(Boolean))) as string[]
    return ['All', ...values]
  }, [liveNotices])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return liveNotices
    return liveNotices.filter(n => n.category === activeCategory)
  }, [liveNotices, activeCategory])

  const pinned = filtered.filter(n => n.is_pinned)
  const regular = filtered.filter(n => !n.is_pinned)
  const ordered = [...pinned, ...regular]

  const handleToggle = async (noticeId: string) => {
    if (expandedId === noticeId) {
      setExpandedId(null)
      return
    }

    setExpandedId(noticeId)
    await trackNoticeView(noticeId)
  }

  return (
    <div>
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notice-card {
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          animation: card-in 500ms ease forwards;
        }
        .notice-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 55%);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .notice-card:hover::after {
          opacity: 1;
        }
      `}</style>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            style={{
              borderRadius: 999,
              border: activeCategory === category ? '1px solid transparent' : '1px solid var(--border)',
              background: activeCategory === category ? 'var(--color-primary)' : 'var(--surface)',
              color: activeCategory === category ? '#fff' : 'var(--foreground)',
              padding: '0.35rem 0.9rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: activeCategory === category ? '0 8px 20px rgba(59,130,246,0.3)' : 'none',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {!ordered.length && (
        <div style={{ textAlign: 'center', color: 'var(--foreground-muted)', fontFamily: 'var(--font-body)' }}>
          No notices available yet.
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {ordered.map((notice, index) => {
          const isExpanded = expandedId === notice.id
          return (
            <article
              key={notice.id}
              className="notice-card"
              style={{ ...cardStyle, animationDelay: `${index * 50}ms` }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {notice.is_pinned && (
                  <span style={pinStyle}>Important</span>
                )}
                {notice.category && (
                  <span style={categoryStyle}>{notice.category}</span>
                )}
                <span style={dateStyle}>{formatDate(notice.publish_at)}</span>
              </div>
              <h3 style={titleStyle}>{notice.title}</h3>
              {notice.body && (
                <div style={bodyStyle}>
                  {isExpanded ? renderBody(notice.body) : renderExcerpt(notice.body)}
                </div>
              )}
              {notice.body && getPlainText(notice.body).length > 180 && (
                <button
                  type="button"
                  onClick={() => handleToggle(notice.id)}
                  style={linkButtonStyle}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function renderExcerpt(html: string) {
  const plain = getPlainText(html)
  const excerpt = plain.length > 180 ? `${plain.slice(0, 180)}...` : plain
  return <p style={{ margin: 0 }}>{excerpt}</p>
}

function renderBody(html: string) {
  const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}

function getPlainText(html: string) {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '')
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper.textContent || ''
}

async function trackNoticeView(noticeId: string) {
  if (typeof window === 'undefined') return

  const viewed = getViewedNotices()
  if (viewed.has(noticeId)) return

  viewed.add(noticeId)
  setViewedNotices(viewed)

  const sessionId = getSessionId()

  await fetch('/api/notices/view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notice_id: noticeId,
      session_id: sessionId,
      page_path: '/notices',
      referrer: document.referrer || null,
      screen_width: window.innerWidth,
    }),
  })
}

function getViewedNotices() {
  try {
    const raw = window.sessionStorage.getItem('nmc_notice_views')
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(list)
  } catch {
    return new Set<string>()
  }
}

function setViewedNotices(notices: Set<string>) {
  try {
    window.sessionStorage.setItem('nmc_notice_views', JSON.stringify(Array.from(notices)))
  } catch {
    // Ignore storage errors
  }
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem('nmc_notice_session')
    if (existing) return existing
    const created = crypto.randomUUID()
    window.sessionStorage.setItem('nmc_notice_session', created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const cardStyle: CSSProperties = {
  background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '1.6rem',
  boxShadow: 'var(--shadow-md)',
}

const pinStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#ef4444',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.25)',
  padding: '0.2rem 0.55rem',
  borderRadius: 999,
}

const categoryStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--foreground-muted)',
  border: '1px solid var(--border)',
  padding: '0.2rem 0.55rem',
  borderRadius: 999,
  background: 'var(--surface-2)',
}

const dateStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--foreground-muted)',
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.15rem',
  fontWeight: 700,
  color: 'var(--foreground)',
  margin: '0.6rem 0 0.5rem',
}

const bodyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  color: 'var(--foreground)',
  lineHeight: 1.7,
}

const linkButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
  marginTop: '0.45rem',
}
