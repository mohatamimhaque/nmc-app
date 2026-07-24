import { NextResponse } from 'next/server'
import { requireRegistrationAccess } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/registrations/summary
 * Fetch full statistics/summary of registrations (no parameters required).
 * Authorized: super_admin, admin, registration_editor, volunteer
 */
export async function GET() {
  const guard = await requireRegistrationAccess()
  if ('response' in guard) return guard.response

  try {
    const supabase = guard.supabase

    // Query columns needed for statistics
    const { data, error } = await supabase
      .from('processed_registrations')
      .select('is_kit_coollect, is_present, is_collect_launch, is_collect_breakfast, level, event')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let total = 0
    let kitCollected = 0
    let kitPending = 0
    let attendancePresent = 0
    let attendanceAbsent = 0
    let launchServed = 0
    let launchPending = 0
    let breakfastServed = 0
    let breakfastPending = 0

    const byLevel: Record<string, number> = {}
    const byEvent: Record<string, number> = {}

    if (data) {
      total = data.length
      for (const row of data) {
        if (row.is_kit_coollect) {
          kitCollected++
        } else {
          kitPending++
        }

        if (row.is_present) {
          attendancePresent++
        } else {
          attendanceAbsent++
        }

        if (row.is_collect_launch) {
          launchServed++
        } else {
          launchPending++
        }

        if (row.is_collect_breakfast) {
          breakfastServed++
        } else {
          breakfastPending++
        }

        if (row.level) {
          const lvl = row.level.trim()
          byLevel[lvl] = (byLevel[lvl] || 0) + 1
        }
        if (row.event) {
          const ev = row.event.trim()
          byEvent[ev] = (byEvent[ev] || 0) + 1
        }
      }
    }

    return NextResponse.json({
      success: true,
      total,
      kit_collection: {
        collected: kitCollected,
        pending: kitPending,
      },
      attendance: {
        present: attendancePresent,
        absent: attendanceAbsent,
      },
      launch_status: {
        served: launchServed,
        pending: launchPending,
      },
      breakfast_status: {
        served: breakfastServed,
        pending: breakfastPending,
      },
      by_level: byLevel,
      by_event: byEvent,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
