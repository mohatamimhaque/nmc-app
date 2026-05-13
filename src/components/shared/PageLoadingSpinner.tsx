'use client'

import type { CSSProperties } from 'react'

type PageLoadingSpinnerProps = {
  label?: string
  variant?: 'public' | 'admin'
}

export function PageLoadingSpinner({ label = 'Loading...', variant = 'public' }: PageLoadingSpinnerProps) {
  const isAdmin = variant === 'admin'
  const spinnerColor = isAdmin ? 'var(--admin-accent, var(--color-primary))' : 'var(--color-primary)'
  const spinnerAccent = isAdmin ? 'var(--admin-fg-muted, var(--foreground-muted))' : 'var(--foreground-muted)'
  const shellStyle = {
    '--spinner-color': spinnerColor,
    '--spinner-accent': spinnerAccent,
  } as CSSProperties

  return (
    <div className={isAdmin ? 'spinner-shell spinner-shell-admin' : 'spinner-shell'} style={shellStyle} aria-busy="true" aria-live="polite" aria-label={label}>
      <div className="spinner-card">
        <div className="lds-roller" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="spinner-label">{label}</div>
      </div>

      <style>{`
        .spinner-shell {
          display: grid;
          place-items: center;
          min-height: 100vh;
          width: 100vw;
          padding: 2rem;
          background:
            radial-gradient(circle at top, color-mix(in srgb, var(--spinner-color) 18%, transparent), transparent 42%),
            radial-gradient(circle at bottom right, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 40%),
            linear-gradient(180deg, var(--background), var(--surface-2));
          color: var(--foreground);
        }

        .spinner-shell-admin {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, color-mix(in srgb, var(--spinner-color) 18%, transparent), transparent 42%),
            radial-gradient(circle at bottom right, color-mix(in srgb, var(--spinner-accent) 18%, transparent), transparent 40%),
            linear-gradient(180deg, var(--admin-bg), color-mix(in srgb, var(--admin-bg) 88%, #ffffff 12%));
          color: var(--admin-fg);
        }

        .spinner-card {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem 2.5rem;
          border-radius: 24px;
          background: transparent;
          border: 0;
          box-shadow: none;
          backdrop-filter: none;
        }

        .spinner-shell-admin .spinner-card {
          background: transparent;
          border: 0;
          box-shadow: none;
        }

        .spinner-label {
          font-family: var(--font-heading);
          font-size: 1rem;
          letter-spacing: 0.04em;
          color: var(--spinner-accent);
        }

        @keyframes lds-roller {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }

        .lds-roller {
          position: relative;
          display: inline-block;
          width: 64px;
          height: 64px;
        }

        .lds-roller div {
          animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          transform-origin: 32px 32px;
        }

        .lds-roller div::after {
          position: absolute;
          display: block;
          content: ' ';
          width: 8px;
          height: 8px;
          margin: -4px 0 0 -4px;
          border-radius: 50%;
          background: var(--spinner-color);
        }

        .lds-roller div:nth-child(1) {
          animation-delay: -0.036s;
        }

        .lds-roller div:nth-child(1)::after {
          top: 50px;
          left: 50px;
        }

        .lds-roller div:nth-child(2) {
          animation-delay: -0.072s;
        }

        .lds-roller div:nth-child(2)::after {
          top: 54px;
          left: 45px;
        }

        .lds-roller div:nth-child(3) {
          animation-delay: -0.108s;
        }

        .lds-roller div:nth-child(3)::after {
          top: 57px;
          left: 39px;
        }

        .lds-roller div:nth-child(4) {
          animation-delay: -0.144s;
        }

        .lds-roller div:nth-child(4)::after {
          top: 58px;
          left: 32px;
        }

        .lds-roller div:nth-child(5) {
          animation-delay: -0.18s;
        }

        .lds-roller div:nth-child(5)::after {
          top: 57px;
          left: 25px;
        }

        .lds-roller div:nth-child(6) {
          animation-delay: -0.216s;
        }

        .lds-roller div:nth-child(6)::after {
          top: 54px;
          left: 19px;
        }

        .lds-roller div:nth-child(7) {
          animation-delay: -0.252s;
        }

        .lds-roller div:nth-child(7)::after {
          top: 50px;
          left: 14px;
        }

        .lds-roller div:nth-child(8) {
          animation-delay: -0.288s;
        }

        .lds-roller div:nth-child(8)::after {
          top: 45px;
          left: 10px;
        }

        @media (max-width: 640px) {
          .spinner-card {
            padding: 1.5rem 1.75rem;
            border-radius: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lds-roller div {
            animation-duration: 2.4s;
          }
        }
      `}</style>
    </div>
  )
}
