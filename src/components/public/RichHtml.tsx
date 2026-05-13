'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'

export function RichHtml({ html }: { html: string }) {
  const sanitized = useMemo(() => {
    if (typeof window === 'undefined') {
      return html
    }

    return DOMPurify(window).sanitize(html, { USE_PROFILES: { html: true } })
  }, [html])

  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: sanitized }} />
}
