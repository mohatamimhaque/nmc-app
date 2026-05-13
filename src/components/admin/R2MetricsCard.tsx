"use client"

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/admin/GlassCard'

type R2Metrics = {
  bucket: string
  objectCount: number
  totalBytes: number
  totalLabel: string
  updatedAt: string
}

export function R2MetricsCard() {
  const [metrics, setMetrics] = useState<R2Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/admin/analytics/r2-metrics', { cache: 'no-store' })
        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error ?? 'Failed to load R2 metrics.')
        }
        if (isMounted) setMetrics(payload)
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load R2 metrics.')
      }
    }

    load().catch(() => {
      if (isMounted) setError('Failed to load R2 metrics.')
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <GlassCard padding="1.25rem" accent>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.75rem' }}>
        R2 Storage
      </div>
      {error ? (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
          {error}
        </div>
      ) : metrics ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--admin-fg)' }}>
            {metrics.totalLabel}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
            {metrics.objectCount} objects in {metrics.bucket}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
            Updated {new Date(metrics.updatedAt).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
          Loading storage metrics...
        </div>
      )}
    </GlassCard>
  )
}
