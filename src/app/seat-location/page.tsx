import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPageVisible } from '@/lib/visibility'
import { RoomSecurityGuard } from '@/components/public/RoomSecurityGuard'
import { RoomFinderView } from '@/components/public/RoomFinderView'

export const metadata: Metadata = {
  title: 'Find Exam Room | National Mathematics Carnival 2026',
  description: 'Locate your allocated exam room number and interactive venue location map using your Unique ID or Serial Number.',
}

export default async function RoomFinderPage() {
  const visible = await isPageVisible('room_finder')
  if (!visible) {
    notFound()
  }

  return (
    <RoomSecurityGuard>
      <main style={{ minHeight: '80vh', padding: '1rem 0' }}>
        <RoomFinderView />
      </main>
    </RoomSecurityGuard>
  )
}
