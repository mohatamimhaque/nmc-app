import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Registration Status — National Mathematics Carnival 2026',
  description: 'Track your registration status for National Mathematics Carnival 2026. Enter your 8-character tracking ID to verify your application with Math Club, DUET.',
  alternates: {
    canonical: '/registration/status',
  },
}

export default function RegistrationStatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
