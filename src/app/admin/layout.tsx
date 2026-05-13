import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Admin Panel | NMC 2026',
    template: '%s | NMC 2026 Admin',
  },
  robots: { index: false, follow: false },
}

/** Bare passthrough — route groups (auth) and (panel) handle their own layouts */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
