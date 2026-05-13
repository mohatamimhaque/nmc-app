'use client'

/**
 * MathDivider
 * A decorative section separator with a LaTeX-style math snippet.
 * Used across both admin panels and public page sections.
 */

interface MathDividerProps {
  formula?: string
  className?: string
  dim?: boolean   // extra-muted for subtle use
}

const FORMULAS = [
  'f(x) = ax² + bx + c',
  'e^(iπ) + 1 = 0',
  'lim(x→0) sin(x)/x = 1',
  '∇²φ = ρ/ε₀',
  'E = mc²',
  '∑(n=1→∞) 1/n² = π²/6',
  'P(A|B) = P(B|A)·P(A) / P(B)',
  'd/dx[eˣ] = eˣ',
  'det(A) = ad − bc',
  'φ = (1 + √5) / 2',
]

export function MathDivider({ formula, className = '', dim = false }: MathDividerProps) {
  const text = formula ?? FORMULAS[Math.floor(Math.random() * FORMULAS.length)]

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        margin: '2rem 0',
        opacity: dim ? 0.55 : 0.75,
      }}
    >
      {/* Left rule */}
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--admin-accent, #748ffc))',
      }} />

      {/* Math snippet */}
      <span
        style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          color: 'var(--admin-accent, #748ffc)',
          whiteSpace: 'nowrap',
          padding: '0.15rem 0.6rem',
          border: '1px solid var(--admin-accent, #748ffc)',
          borderRadius: '4px',
          opacity: 0.7,
        }}
      >
        {text}
      </span>

      {/* Right rule */}
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to left, transparent, var(--admin-accent, #748ffc))',
      }} />
    </div>
  )
}

/**
 * PublicMathDivider
 * Lighter variant for public pages — uses primary colour, minimal styling.
 */
export function PublicMathDivider({ formula, className = '' }: { formula?: string; className?: string }) {
  const text = formula ?? FORMULAS[Math.floor(Math.random() * FORMULAS.length)]

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        margin: '3rem 0',
        opacity: 0.45,
      }}
    >
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--color-primary))',
      }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          color: 'var(--color-primary)',
          whiteSpace: 'nowrap',
          padding: '0.15rem 0.5rem',
          border: '1px solid var(--color-primary)',
          borderRadius: '4px',
        }}
      >
        {text}
      </span>
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to left, transparent, var(--color-primary))',
      }} />
    </div>
  )
}
