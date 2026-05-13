import React from 'react'

interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  padding?: string | number
  /** If true, adds a top accent line in the current admin accent colour */
  accent?: boolean
  /** Render as a different element */
  as?: React.ElementType
}

/**
 * GlassCard — frosted glass card for the admin panel.
 * Uses CSS variables from the admin theme system.
 */
export function GlassCard({
  children,
  className,
  style,
  padding = '1.2rem',
  accent = false,
  as: Tag = 'div',
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      className={className}
      {...rest}
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--admin-surface) 0%, var(--admin-surface-blur) 100%)',
        backdropFilter: 'blur(18px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
        border: '1px solid var(--admin-border)',
        borderRadius: 20,
        padding,
        boxShadow: '0 12px 34px rgba(3,7,18,0.2)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Optional top accent bar */}
      {accent && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'var(--admin-accent)',
            borderRadius: '20px 20px 0 0',
            opacity: 0.85,
          }}
        />
      )}
      {children}
    </Tag>
  )
}

/** Stat card used in the analytics dashboard */
export function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'flat'
  icon?: React.ReactNode
}) {
  const trendColour =
    trend === 'up' ? 'var(--theorem-green, #20c997)' :
    trend === 'down' ? '#ef4444' :
    'var(--admin-fg-muted)'

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <GlassCard accent style={{ minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-fg-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.9rem',
            fontWeight: 700,
            color: 'var(--admin-fg)',
            lineHeight: 1,
          }}>
            {value}
          </div>
          {sub && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: trendColour,
            }}>
              {trend && <span>{trendSymbol}</span>}
              <span>{sub}</span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            color: 'var(--admin-accent)',
            opacity: 0.6,
            marginTop: '0.2rem',
          }}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
