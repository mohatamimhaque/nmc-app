'use client'

import { usePublicSymbols } from './PublicSymbolsContext'

const MATH_FORMULAS = [
  'f(x) = ax^2 + bx + c',
  'e^(i*pi) + 1 = 0',
  'lim(x->0) sin(x)/x = 1',
  'E = mc^2',
  'sum(1/n^2) = pi^2/6',
  'det(A) = ad - bc',
]

const PROGRAMMING_FORMULAS = [
  'O(n log n)',
  'for (i = 0; i < n; i++)',
  'dp[i] = max(a, b)',
  'sum += a[i]',
  'return 0;',
  'if (l <= r) { mid = (l + r) / 2; }',
]

const normalizeCategory = (value?: string) => value?.trim().toLowerCase() ?? ''

const selectFormulas = (category?: string) => {
  const normalized = normalizeCategory(category)
  if (normalized === 'programming contest' || normalized === 'iupc') {
    return PROGRAMMING_FORMULAS
  }
  return MATH_FORMULAS
}

export function PublicMathDivider({
  formula,
  className = '',
}: {
  formula?: string
  className?: string
}) {
  const context = usePublicSymbols()
  const formulas = selectFormulas(context?.category)
  const text = formula ?? formulas[Math.floor(Math.random() * formulas.length)]

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
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--color-primary))',
        }}
      />
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
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'linear-gradient(to left, transparent, var(--color-primary))',
        }}
      />
    </div>
  )
}
