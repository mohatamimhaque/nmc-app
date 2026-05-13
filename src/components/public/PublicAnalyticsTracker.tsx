"use client"

import { useEffect, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type AnalyticsEventType = 'pageview' | 'cta_click' | 'notice_view' | 'form_submit'

const SESSION_KEY = 'nmc_session_id'

function getSessionId() {
  if (typeof window === 'undefined') return null
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  window.localStorage.setItem(SESSION_KEY, next)
  return next
}

async function trackEvent(eventType: AnalyticsEventType, pagePath: string) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        page_path: pagePath,
        referrer: document.referrer || null,
        screen_width: window.innerWidth || null,
        session_id: getSessionId(),
      }),
    })
  } catch {
    // Ignore tracking errors
  }
}

export function PublicAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pagePath = useMemo(() => {
    const query = searchParams?.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (!pagePath) return
    trackEvent('pageview', pagePath)
  }, [pagePath])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const trigger = target.closest('[data-analytics-cta]') as HTMLElement | null
      if (!trigger) return
      const label = trigger.getAttribute('data-analytics-cta')
      trackEvent('cta_click', label ? `${pagePath}#${label}` : pagePath)
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [pagePath])

  return null
}
