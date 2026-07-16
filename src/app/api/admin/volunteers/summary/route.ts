import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

/**
 * GET /api/admin/volunteers/summary
 * Fetch statistics and aggregate summaries for volunteers. Securely protected.
 */
export async function GET() {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const supabase = guard.supabase

    const { data, error } = await supabase
      .from('volunteers')
      .select('is_present, is_gift_collected, is_lunch_collected, segment, department')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let total = 0
    let presentCount = 0
    let absentCount = 0
    let giftCollectedCount = 0
    let giftPendingCount = 0
    let lunchCollectedCount = 0
    let lunchPendingCount = 0

    const bySegment: Record<string, number> = {}
    const byDepartment: Record<string, number> = {}

    if (data) {
      total = data.length
      for (const row of data) {
        if (row.is_present) {
          presentCount++
        } else {
          absentCount++
        }

        if (row.is_gift_collected) {
          giftCollectedCount++
        } else {
          giftPendingCount++
        }

        if (row.is_lunch_collected) {
          lunchCollectedCount++
        } else {
          lunchPendingCount++
        }

        if (row.segment) {
          const seg = row.segment.trim()
          bySegment[seg] = (bySegment[seg] || 0) + 1
        }

        if (row.department) {
          const dept = row.department.trim()
          byDepartment[dept] = (byDepartment[dept] || 0) + 1
        }
      }
    }

    return NextResponse.json({
      success: true,
      total,
      attendance: {
        present: presentCount,
        absent: absentCount,
      },
      gift_collection: {
        collected: giftCollectedCount,
        pending: giftPendingCount,
      },
      lunch_status: {
        served: lunchCollectedCount,
        pending: lunchPendingCount,
      },
      by_segment: bySegment,
      by_department: byDepartment,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
