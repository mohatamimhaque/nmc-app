/**
 * MathBackground — Admin Panel
 * Rich, visible mathematics-themed wallpaper.
 * Coordinate grid + axes, scattered equations, Fibonacci spiral,
 * Sierpiński triangle, and ruled notebook lines.
 */
export function MathBackground() {
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
          {/* Major coordinate grid — 60px cells */}
          <pattern id="adm-grid-major" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none"
              stroke="var(--admin-accent,#748ffc)" strokeWidth="0.6" opacity="0.22" />
          </pattern>
          {/* Minor grid — 12px cells */}
          <pattern id="adm-grid-minor" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none"
              stroke="var(--admin-accent,#748ffc)" strokeWidth="0.2" opacity="0.1" />
          </pattern>

          {/* Radial glow spots */}
          <radialGradient id="adm-g1" cx="12%" cy="18%" r="32%">
            <stop offset="0%" stopColor="var(--admin-accent,#748ffc)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="adm-g2" cx="85%" cy="72%" r="28%">
            <stop offset="0%" stopColor="#9775fa" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="adm-g3" cx="50%" cy="40%" r="45%">
            <stop offset="0%" stopColor="#20c997" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Arrow marker for axes */}
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z"
              fill="var(--admin-accent,#748ffc)" opacity="0.35" />
          </marker>
        </defs>

        {/* ── Grid layers ── */}
        <rect width="100%" height="100%" fill="url(#adm-grid-minor)" />
        <rect width="100%" height="100%" fill="url(#adm-grid-major)" />

        {/* ── Radial glows ── */}
        <rect width="100%" height="100%" fill="url(#adm-g1)" />
        <rect width="100%" height="100%" fill="url(#adm-g2)" />
        <rect width="100%" height="100%" fill="url(#adm-g3)" />

        {/* ── Ruled notebook lines (horizontal, widely spaced) ── */}
        {[12, 22, 32, 42, 52, 62, 72, 82, 92].map(pct => (
          <line key={pct} x1="0" y1={`${pct}%`} x2="100%" y2={`${pct}%`}
            stroke="var(--admin-accent,#748ffc)" strokeWidth="0.4"
            opacity="0.1" strokeDasharray="6 14" />
        ))}

        {/* ── Central coordinate axes with arrows ── */}
        <line x1="50%" y1="2%" x2="50%" y2="98%"
          stroke="var(--admin-accent,#748ffc)" strokeWidth="0.8" opacity="0.2"
          strokeDasharray="8 16" markerEnd="url(#arrow)" />
        <line x1="2%" y1="50%" x2="98%" y2="50%"
          stroke="var(--admin-accent,#748ffc)" strokeWidth="0.8" opacity="0.2"
          strokeDasharray="8 16" markerEnd="url(#arrow)" />

        {/* Axis labels */}
        <text x="51%" y="3.5%" fontSize="10" fontFamily="monospace"
          fill="var(--admin-accent,#748ffc)" opacity="0.3">y</text>
        <text x="97%" y="49%" fontSize="10" fontFamily="monospace"
          fill="var(--admin-accent,#748ffc)" opacity="0.3">x</text>

        {/* ── Origin dot ── */}
        <circle cx="50%" cy="50%" r="3"
          fill="var(--admin-accent,#748ffc)" opacity="0.2" />
        <text x="51%" y="52.5%" fontSize="9" fontFamily="monospace"
          fill="var(--admin-accent,#748ffc)" opacity="0.2">O</text>

        {/* ── Tick marks on axes ── */}
        {[-4,-3,-2,-1,1,2,3,4].map(i => (
          <g key={`tick-x-${i}`}>
            <line
              x1={`${50 + i*8}%`} y1="49.5%" x2={`${50 + i*8}%`} y2="50.5%"
              stroke="var(--admin-accent,#748ffc)" strokeWidth="0.8" opacity="0.2" />
          </g>
        ))}
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={`tick-y-${i}`}>
            <line
              x1="49.5%" y1={`${50 + i*10}%`} x2="50.5%" y2={`${50 + i*10}%`}
              stroke="var(--admin-accent,#748ffc)" strokeWidth="0.8" opacity="0.2" />
          </g>
        ))}

        {/* ── Fibonacci spiral — large, top-right ── */}
        <g transform="translate(780 150) scale(1.2)" opacity="0.18"
          fill="none" stroke="#9775fa" strokeWidth="1.2" strokeLinecap="round">
          <path d="M 0 0 Q 16 0 16 -16" />
          <path d="M 16 -16 Q 16 -42 -10 -42" />
          <path d="M -10 -42 Q -52 -42 -52 0" />
          <path d="M -52 0 Q -52 68 26 68" />
          <path d="M 26 68 Q 120 68 120 -26" />
        </g>

        {/* ── Sierpiński triangle — bottom-left, larger ── */}
        <g transform="translate(20 580) scale(1.3)" opacity="0.14"
          fill="none" stroke="var(--admin-accent,#748ffc)" strokeWidth="0.8">
          <polygon points="70,0 140,121 0,121" />
          <polygon points="70,60 105,121 35,121" />
          <polygon points="70,0 105,60 35,60" />
          <polygon points="105,60 140,121 70,121" />
          {/* Level 3 sub-triangles */}
          <polygon points="70,30 87,60 53,60" />
          <polygon points="105,90 122,121 88,121" />
          <polygon points="35,90 52,121 18,121" />
        </g>

        {/* ── Large background math symbols — scattered ── */}

        {/* ∑ — top-left */}
        <text x="3%" y="18%" fontSize="72" fontFamily="serif"
          fill="var(--admin-accent,#748ffc)" opacity="0.09"
          style={{ userSelect: 'none' }}>∑</text>

        {/* ∫ — right side */}
        <text x="88%" y="42%" fontSize="90" fontFamily="serif"
          fill="#9775fa" opacity="0.09"
          style={{ userSelect: 'none' }}>∫</text>

        {/* π — top-centre */}
        <text x="43%" y="12%" fontSize="60" fontFamily="serif"
          fill="#20c997" opacity="0.09"
          style={{ userSelect: 'none' }}>π</text>

        {/* e — centre-right */}
        <text x="67%" y="62%" fontSize="56" fontFamily="serif"
          fill="#fd7e14" opacity="0.09"
          style={{ userSelect: 'none' }}>e</text>

        {/* ∞ — left centre */}
        <text x="4%" y="52%" fontSize="48" fontFamily="serif"
          fill="#20c997" opacity="0.09"
          style={{ userSelect: 'none' }}>∞</text>

        {/* √2 — bottom-centre */}
        <text x="20%" y="88%" fontSize="40" fontFamily="serif"
          fill="var(--admin-accent,#748ffc)" opacity="0.1"
          style={{ userSelect: 'none' }}>√2</text>

        {/* ∇ — right-bottom */}
        <text x="86%" y="85%" fontSize="44" fontFamily="serif"
          fill="var(--admin-accent,#748ffc)" opacity="0.1"
          style={{ userSelect: 'none' }}>∇</text>

        {/* ∂ — centre */}
        <text x="35%" y="70%" fontSize="36" fontFamily="serif"
          fill="#fd7e14" opacity="0.08"
          style={{ userSelect: 'none' }}>∂</text>

        {/* Δ — left lower */}
        <text x="14%" y="38%" fontSize="44" fontFamily="serif"
          fill="#20c997" opacity="0.08"
          style={{ userSelect: 'none' }}>Δ</text>

        {/* λ */}
        <text x="60%" y="32%" fontSize="32" fontFamily="serif"
          fill="#9775fa" opacity="0.08"
          style={{ userSelect: 'none' }}>λ</text>

        {/* ∈ */}
        <text x="76%" y="22%" fontSize="28" fontFamily="serif"
          fill="var(--admin-accent,#748ffc)" opacity="0.1"
          style={{ userSelect: 'none' }}>∈</text>

        {/* ── Inline math equations — monospace, readable ── */}

        {/* Euler's identity */}
        <text x="5%" y="96%" fontSize="13" fontFamily="monospace" letterSpacing="1"
          fill="var(--admin-accent,#748ffc)" opacity="0.22"
          style={{ userSelect: 'none' }}>e^(iπ) + 1 = 0</text>

        {/* Quadratic */}
        <text x="38%" y="96%" fontSize="12" fontFamily="monospace" letterSpacing="1"
          fill="#9775fa" opacity="0.2"
          style={{ userSelect: 'none' }}>f(x) = ax² + bx + c</text>

        {/* Gaussian */}
        <text x="20%" y="5%" fontSize="11" fontFamily="monospace" letterSpacing="0.8"
          fill="#20c997" opacity="0.18"
          style={{ userSelect: 'none' }}>φ(x) = (1/σ√2π) · e^(−x²/2σ²)</text>

        {/* Basel problem */}
        <text x="68%" y="96%" fontSize="12" fontFamily="monospace" letterSpacing="0.8"
          fill="#fd7e14" opacity="0.18"
          style={{ userSelect: 'none' }}>∑(1/n²) = π²/6</text>

        {/* Limit */}
        <text x="2%" y="75%" fontSize="11" fontFamily="monospace"
          fill="#20c997" opacity="0.18"
          style={{ userSelect: 'none' }}>lim(x→0) sin(x)/x = 1</text>

        {/* Pythagorean */}
        <text x="70%" y="5%" fontSize="12" fontFamily="monospace"
          fill="#9775fa" opacity="0.18"
          style={{ userSelect: 'none' }}>a² + b² = c²</text>

        {/* Golden ratio */}
        <text x="3%" y="31%" fontSize="11" fontFamily="monospace"
          fill="var(--admin-accent,#748ffc)" opacity="0.18"
          style={{ userSelect: 'none' }}>φ = (1 + √5) / 2</text>

        {/* Matrix det */}
        <text x="52%" y="76%" fontSize="11" fontFamily="monospace"
          fill="#9775fa" opacity="0.16"
          style={{ userSelect: 'none' }}>det(A) = ad − bc</text>

        {/* ── Diagonal line — like a graph sketch ── */}
        <line x1="10%" y1="90%" x2="45%" y2="55%"
          stroke="var(--admin-accent,#748ffc)" strokeWidth="0.7"
          opacity="0.12" strokeDasharray="4 8" />
        <line x1="55%" y1="45%" x2="90%" y2="20%"
          stroke="var(--admin-accent,#748ffc)" strokeWidth="0.7"
          opacity="0.12" strokeDasharray="4 8" />

        {/* ── Parabola curve sketch ── */}
        <path d="M 50 800 Q 250 200 480 800"
          fill="none" stroke="#20c997" strokeWidth="1"
          opacity="0.1" strokeDasharray="6 10" />

        {/* ── Sine-wave sketch ── */}
        <path d="M 520 600 C 560 500 600 700 640 600 S 720 500 760 600 S 840 700 880 600"
          fill="none" stroke="#fd7e14" strokeWidth="1"
          opacity="0.13" />
      </svg>
    </div>
  )
}
