/**
 * Geometric SVG icons for the admin sidebar.
 * Each icon is a simple SVG shape: hexagon, circle, triangle, etc.
 * Styled with the current admin accent colour via CSS variable.
 */

interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

const base = (size: number): React.CSSProperties => ({
  width: size,
  height: size,
  flexShrink: 0,
})

// ── Hexagon ──────────────────────────────────────────────────────────────────
export function HexagonIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <polygon
        points="12,2 21,7 21,17 12,22 3,17 3,7"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Circle with inner dot ────────────────────────────────────────────────────
export function CircleDotIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

// ── Triangle ─────────────────────────────────────────────────────────────────
export function TriangleIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <polygon
        points="12,3 22,21 2,21"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Diamond (rhombus) ────────────────────────────────────────────────────────
export function DiamondIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <polygon
        points="12,2 22,12 12,22 2,12"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Sigma (∑) icon ───────────────────────────────────────────────────────────
export function SigmaIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <text x="3" y="19" fontSize="18" fontFamily="serif" fill="currentColor">∑</text>
    </svg>
  )
}

// ── Integral (∫) icon ────────────────────────────────────────────────────────
export function IntegralIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <text x="6" y="20" fontSize="20" fontFamily="serif" fill="currentColor">∫</text>
    </svg>
  )
}

// ── Grid (coordinate system) ─────────────────────────────────────────────────
export function GridIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="7.5" x2="21" y2="7.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="3" y1="16.5" x2="21" y2="16.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="7.5" y1="3" x2="7.5" y2="21" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="16.5" y1="3" x2="16.5" y2="21" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

// ── Pentagon ─────────────────────────────────────────────────────────────────
export function PentagonIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <polygon
        points="12,2 21.5,9 17.8,20.5 6.2,20.5 2.5,9"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Infinity ─────────────────────────────────────────────────────────────────
export function InfinityIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ ...base(size), ...style }} className={className}>
      <path
        d="M12 12 C9 8 3 8 3 12 C3 16 9 16 12 12 C15 8 21 8 21 12 C21 16 15 16 12 12"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  )
}
