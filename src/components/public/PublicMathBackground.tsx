/**
 * PublicMathBackground
 * Simple, elegant mathematical watermark for public pages.
 * A clean coordinate grid + a tiled pattern of symbols,
 * placed with generous whitespace so content stays the focus.
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
}: {
  theme?: 'light' | 'dark'
  showSymbols?: boolean
  category?: string
}) {
  const symbols = selectSymbolTheme(category, theme)
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
    </div>
  )
}
