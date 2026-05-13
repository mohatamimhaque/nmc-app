'use client'

import * as DOMPurify from 'dompurify'

export function RichHtml({ html }: { html: string }) {
  const purifier = (DOMPurify as unknown as { sanitize?: typeof DOMPurify.sanitize; default?: typeof DOMPurify })
  const sanitize = purifier.sanitize ?? purifier.default?.sanitize
  const sanitized = sanitize ? sanitize(html, { USE_PROFILES: { html: true } }) : html
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
