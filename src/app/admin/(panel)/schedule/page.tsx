import { createClient } from '@/lib/supabase/server'
import type { ScheduleSession, ScheduleDaySetting, SiteSettings } from '@/types/database'
import { ScheduleSettingsForm } from '@/components/admin/ScheduleSettingsForm'

export default async function ScheduleAdminPage() {
	const supabase = await createClient()

	const [sessionsRes, daysRes, pageRes, settingsRes] = await Promise.all([
		supabase.from('schedule_sessions').select('*').order('day_number', { ascending: true }).order('sort_order', { ascending: true }),
		supabase.from('schedule_day_settings').select('*').order('sort_order', { ascending: true }),
		supabase.from('page_visibility').select('*').eq('page_key', 'schedule').single(),
		supabase.from('site_settings').select('*').single(),
	])

	const sessions = (sessionsRes.data ?? []) as ScheduleSession[]
	const days = (daysRes.data ?? []) as ScheduleDaySetting[]
	const pageVisibility = pageRes.data ?? null
	const siteSettings = (settingsRes.data ?? null) as SiteSettings | null

	return (
		<ScheduleSettingsForm
			initialSessions={sessions}
			initialDays={days}
			pageVisibility={pageVisibility}
			initialPdfUrl={siteSettings?.schedule_pdf_url ?? null}
		/>
	)
}
