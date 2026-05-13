import { NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/admin-auth'

export async function PATCH(request: Request) {
	const guard = await requireAdminRole(['super_admin', 'admin'])
	if ('response' in guard) {
		return guard.response
	}

	const body = await request.json().catch(() => null)
	const sessionsInput = Array.isArray(body?.sessions) ? body.sessions : []
	const daysInput = Array.isArray(body?.days) ? body.days : []

	const { supabase } = guard

	const { error: deleteSessionsError } = await supabase
		.from('schedule_sessions')
		.delete()
		.gte('sort_order', 0)

	if (deleteSessionsError) {
		return NextResponse.json({ error: deleteSessionsError.message }, { status: 400 })
	}

	const { error: deleteDaysError } = await supabase
		.from('schedule_day_settings')
		.delete()
		.gte('sort_order', 0)

	if (deleteDaysError) {
		return NextResponse.json({ error: deleteDaysError.message }, { status: 400 })
	}

	const days = daysInput
		.filter((item: any) => Number.isFinite(item?.day_number))
		.map((item: any, index: number) => ({
			id: String(item.id),
			day_number: Number(item.day_number),
			is_visible: item?.is_visible !== false,
			sort_order: Number.isFinite(item?.sort_order) ? Number(item.sort_order) : index + 1,
		}))

	if (days.length) {
		const { error: insertDaysError } = await supabase
			.from('schedule_day_settings')
			.insert(days)

		if (insertDaysError) {
			return NextResponse.json({ error: insertDaysError.message }, { status: 400 })
		}
	}

	const sessions = sessionsInput
		.filter((item: any) => item?.title && Number.isFinite(item?.day_number) && item?.start_time)
		.map((item: any, index: number) => ({
			id: String(item.id),
			day_number: Number(item.day_number),
			start_time: String(item.start_time),
			end_time: item?.end_time ? String(item.end_time) : null,
			title: String(item.title),
			venue: item?.venue ? String(item.venue) : null,
			host: item?.host ? String(item.host) : null,
			category: item?.category ? String(item.category) : null,
			color_tag: item?.color_tag ? String(item.color_tag) : null,
			is_visible: item?.is_visible !== false,
			sort_order: Number.isFinite(item?.sort_order) ? Number(item.sort_order) : index + 1,
		}))

	if (sessions.length) {
		const { error: insertSessionsError } = await supabase
			.from('schedule_sessions')
			.insert(sessions)

		if (insertSessionsError) {
			return NextResponse.json({ error: insertSessionsError.message }, { status: 400 })
		}
	}

	return NextResponse.json({ ok: true })
}
