 'use client'

import type { CSSProperties } from 'react'
import type { SiteSettings } from '@/types/database'

/**
 * PublicMathBackground
 * Static mathematical watermark plus optional animated symbol rain.
 */
type SymbolTheme = {
  tilePrimary: string
  tileSecondary: string
  equations: {
    bottomLeft: string
    bottomCenter: string
    bottomRight: string
    topLeft: string
    topRight: string
  }
}

const MATH_SYMBOLS_LIGHT: SymbolTheme = {
  tilePrimary: 'π',
  tileSecondary: '∑',
  equations: {
    bottomLeft: 'e^(iπ) + 1 = 0',
    bottomCenter: 'f(x) = ax² + bx + c',
    bottomRight: 'φ = (1 + √5) / 2',
    topLeft: '∑(1/n²) = π²/6',
    topRight: 'a² + b² = c²',
  },
}

const MATH_SYMBOLS_DARK: SymbolTheme = {
  tilePrimary: '∫',
  tileSecondary: '∞',
  equations: {
    bottomLeft: 'lim(x→0) sin(x)/x = 1',
    bottomCenter: '∇²φ = ρ/ε₀',
    bottomRight: 'e^(iπ) + 1 = 0',
    topLeft: 'det(A) = ad − bc',
    topRight: 'a² + b² = c²',
  },
}

const PROGRAMMING_SYMBOLS: SymbolTheme = {
  tilePrimary: '</>',
  tileSecondary: '{ }',
  equations: {
    bottomLeft: 'O(n log n)',
    bottomCenter: 'for (i = 0; i < n; i++)',
    bottomRight: 'dp[i] = max(a, b)',
    topLeft: 'sum += a[i]',
    topRight: 'return 0;',
  },
}

const normalizeCategory = (value?: string) => value?.trim().toLowerCase() ?? ''

const MATH_RAIN_SYMBOLS = ['π', '∑', '∫', '∞', '√', '±', '×', '÷', '∂', '∇', '∈', '∉', '≡', '≈', '≤', '≥', '∝', 'α', 'β', 'γ', 'θ', 'λ', 'μ', 'σ', 'φ', 'ψ', 'ω']

const hashString = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createRandom = (seed: number) => {
  let state = seed || 1
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const clampInteger = (value: number | null | undefined, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

const clampNumber = (value: number | null | undefined, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

const selectSymbolTheme = (category: string | undefined, theme: 'light' | 'dark'): SymbolTheme => {
  const normalized = normalizeCategory(category)
  if (normalized === 'programming contest' || normalized === 'iupc') {
    return PROGRAMMING_SYMBOLS
  }
  return theme === 'dark' ? MATH_SYMBOLS_DARK : MATH_SYMBOLS_LIGHT
}

export function PublicMathBackground({
  theme = 'light',
  showSymbols = true,
  category,
  settings,
}: {
  theme?: 'light' | 'dark'
  showSymbols?: boolean
  category?: string
  settings: SiteSettings
}) {
  const symbols = selectSymbolTheme(category, theme)
  const rainEnabled = (settings.animations_enabled ?? true) && (settings.math_rain_enabled ?? false)
  const rainCount = clampInteger(settings.math_rain_count, 24, 0, 80)
  const rainSpeed = clampNumber(settings.math_rain_speed, 12, 4, 40)
  const rainColor = settings.math_rain_color?.trim() || 'rgba(79,70,229,0.18)'
  const rainSize = clampInteger(settings.math_rain_size, 20, 10, 48)
  const seed = hashString(`${theme}|${category ?? ''}|${rainCount}|${rainSpeed}|${rainSize}|${rainColor}|${settings.updated_at}`)
  const rainDrops = rainEnabled
    ? Array.from({ length: rainCount }, (_, index) => {
        const dropRandom = createRandom(hashString(`${seed}:${index}`))
        const symbol = MATH_RAIN_SYMBOLS[Math.floor(dropRandom() * MATH_RAIN_SYMBOLS.length)] ?? 'π'
        const left = Math.round(dropRandom() * 1000) / 10
        const duration = Math.max(4, rainSpeed + (dropRandom() * 4 - 2))
        const delay = -(dropRandom() * duration)
        const drift = Math.round((dropRandom() * 2 - 1) * 48)
        const size = Math.round(rainSize + (dropRandom() * 10 - 5))
        const opacity = 0.08 + dropRandom() * 0.1
        return { symbol, left, duration, delay, drift, size, opacity }
      })
    : []
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          {/* ── Tiled symbol pattern — one symbol per 280×280 cell ── */}
          <pattern
            id="math-tile"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            {/* Large centred symbol — cycles through positions */}
            <text
              x="140" y="168"
              textAnchor="middle"
              fontSize="96"
              fontFamily="'Georgia', 'Times New Roman', serif"
              fill="var(--color-primary)"
              opacity="0.055"
              style={{ userSelect: 'none' }}
            >
              {symbols.tilePrimary}
            </text>
          </pattern>

          {/* ── Secondary tile offset by half — alternates symbol ── */}
          <pattern
            id="math-tile-2"
            x="140" y="140"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            <text
              x="140" y="168"
              textAnchor="middle"
              fontSize="88"
              fontFamily="'Georgia', 'Times New Roman', serif"
              fill="var(--color-secondary)"
              opacity="0.045"
              style={{ userSelect: 'none' }}
            >
              {symbols.tileSecondary}
            </text>
          </pattern>

          {/* ── Coordinate grid — major lines every 80px ── */}
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="0.5"
              opacity="0.09"
            />
          </pattern>

          {/* Soft radial vignette — brighter in corners, fades to centre */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="var(--background)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--background)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Layer 1: coordinate grid ── */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* ── Layer 2: tiled symbol watermarks ── */}
        {showSymbols ? (
          <>
            <rect width="100%" height="100%" fill="url(#math-tile)" />
            <rect width="100%" height="100%" fill="url(#math-tile-2)" />
          </>
        ) : null}

        {/* ── Layer 3: centre vignette so hero text pops ── */}
        <rect width="100%" height="100%" fill="url(#vignette)" />

        {/* ── Four corner signature equations — clean, spaced ── */}
        {showSymbols ? (
          <>
            {/* Bottom-left */}
            <text
              x="32" y="97%"
              fontSize="13"
              fontFamily="'JetBrains Mono','Courier New', monospace"
              fill="var(--color-primary)"
              opacity="0.18"
              letterSpacing="0.5"
              style={{ userSelect: 'none' }}
            >
              {symbols.equations.bottomLeft}
            </text>

            {/* Bottom-centre */}
            <text
              x="50%" y="97%"
              textAnchor="middle"
              fontSize="12"
              fontFamily="'JetBrains Mono','Courier New', monospace"
              fill="var(--color-secondary)"
              opacity="0.15"
              letterSpacing="0.5"
              style={{ userSelect: 'none' }}
            >
              {symbols.equations.bottomCenter}
            </text>

            {/* Bottom-right */}
            <text
              x="100%" y="97%" dx="-32"
              textAnchor="end"
              fontSize="12"
              fontFamily="'JetBrains Mono','Courier New', monospace"
              fill="var(--color-accent)"
              opacity="0.15"
              letterSpacing="0.5"
              style={{ userSelect: 'none' }}
            >
              {symbols.equations.bottomRight}
            </text>

            {/* Top-left */}
            <text
              x="32" y="28"
              fontSize="12"
              fontFamily="'JetBrains Mono','Courier New', monospace"
              fill="var(--color-secondary)"
              opacity="0.15"
              letterSpacing="0.5"
              style={{ userSelect: 'none' }}
            >
              {symbols.equations.topLeft}
            </text>

            {/* Top-right */}
            <text
              x="100%" y="28" dx="-32"
              textAnchor="end"
              fontSize="12"
              fontFamily="'JetBrains Mono','Courier New', monospace"
              fill="var(--color-primary)"
              opacity="0.15"
              letterSpacing="0.5"
              style={{ userSelect: 'none' }}
            >
              {symbols.equations.topRight}
            </text>

            {/* ── Single clean Fibonacci spiral — top-right quadrant ── */}
            <g
              transform="translate(880 220) scale(0.9)"
              opacity="0.1"
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <path d="M 0 0 Q 14 0 14 -14" />
              <path d="M 14 -14 Q 14 -36 -8 -36" />
              <path d="M -8 -36 Q -44 -36 -44 0" />
              <path d="M -44 0 Q -44 58 22 58" />
              <path d="M 22 58 Q 102 58 102 -22" />
            </g>

            {/* ── Simple x-y axis lines through a fixed off-centre point ── */}
            {/* Horizontal */}
            <line
              x1="0" y1="72%"
              x2="32%" y2="72%"
              stroke="var(--color-primary)"
              strokeWidth="0.6"
              opacity="0.1"
              strokeDasharray="8 16"
            />
            {/* Vertical */}
            <line
              x1="16%" y1="58%"
              x2="16%" y2="95%"
              stroke="var(--color-primary)"
              strokeWidth="0.6"
              opacity="0.1"
              strokeDasharray="8 16"
            />
            {/* Parabola on that mini-axis */}
            <path
              d="M 30 900 Q 160 560 290 900"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="0.9"
              opacity="0.1"
              strokeDasharray="5 8"
            />
          </>
        ) : null}
      </svg>

      {rainDrops.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes math-rain-fall {
              0% {
                transform: translate3d(0, -18vh, 0) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              100% {
                transform: translate3d(var(--rain-drift), 118vh, 0) rotate(360deg);
                opacity: 0;
              }
            }
          `}</style>
          {rainDrops.map((drop, index) => (
            <span
              key={`${index}-${drop.symbol}`}
              style={{
                position: 'absolute',
                left: `${drop.left}%`,
                top: '-18vh',
                color: rainColor,
                fontSize: `${drop.size}px`,
                lineHeight: 1,
                fontFamily: "'JetBrains Mono','Courier New', monospace",
                textShadow: '0 0 12px rgba(255,255,255,0.12)',
                opacity: drop.opacity,
                userSelect: 'none',
                whiteSpace: 'nowrap',
                animation: `math-rain-fall ${drop.duration}s linear ${drop.delay}s infinite`,
                ['--rain-drift' as string]: `${drop.drift}px`,
              } as CSSProperties}
            >
              {drop.symbol}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
