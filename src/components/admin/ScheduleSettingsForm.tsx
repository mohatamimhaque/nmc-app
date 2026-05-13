'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { PageVisibility, ScheduleDaySetting, ScheduleSession } from '@/types/database'
import { GlassCard, StatCard } from './GlassCard'

interface ScheduleSettingsFormProps {
	initialSessions: ScheduleSession[]
	initialDays: ScheduleDaySetting[]
	pageVisibility: PageVisibility | null
	initialPdfUrl: string | null
}

type ToastTone = 'success' | 'error'

interface ToastState {
	message: string
	tone: ToastTone
}

const COLOR_PRESETS = [
	'#3B5BDB',
	'#0CA678',
	'#7048E8',
	'#F76707',
	'#E03131',
	'#1971C2',
	'#2F9E44',
	'#6741D9',
]

const EMPTY_SESSION: ScheduleSession = {
	id: '',
	day_number: 1,
	start_time: '09:00:00',
	end_time: null,
	title: '',
	venue: null,
	host: null,
	category: null,
	color_tag: null,
	is_visible: true,
	sort_order: 1,
}

export function ScheduleSettingsForm({
	initialSessions,
	initialDays,
	pageVisibility,
	initialPdfUrl,
}: ScheduleSettingsFormProps) {
	const [sessions, setSessions] = useState<ScheduleSession[]>(initialSessions)
	const [days, setDays] = useState<ScheduleDaySetting[]>(initialDays)
	const [activeDayNumber, setActiveDayNumber] = useState<number>(initialDays[0]?.day_number ?? initialSessions[0]?.day_number ?? 1)
	const [dragDayId, setDragDayId] = useState<string | null>(null)
	const [dragSessionId, setDragSessionId] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<ToastState | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null)
	const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl)
	const [pdfUploading, setPdfUploading] = useState(false)
	const [pageLive, setPageLive] = useState(pageVisibility?.is_visible ?? true)

	const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => snapshotState(initialDays, initialSessions))
	const currentSnapshot = useMemo(() => snapshotState(days, sessions), [days, sessions])
	const isDirty = lastSavedSnapshot !== currentSnapshot

	useEffect(() => {
		if (days.length) return
		const fallbackDays = buildDaysFromSessions(initialSessions)
		if (fallbackDays.length) {
			setDays(fallbackDays)
			setActiveDayNumber(fallbackDays[0].day_number)
		}
	}, [days.length, initialSessions])

	useEffect(() => {
		if (!toast) return
		const timer = setTimeout(() => setToast(null), 3000)
		return () => clearTimeout(timer)
	}, [toast])

	useEffect(() => {
		if (!days.length) return
		if (!days.some(day => day.day_number === activeDayNumber)) {
			setActiveDayNumber(days[0].day_number)
		}
	}, [days, activeDayNumber])

	const orderedDays = useMemo(
		() => [...days].sort((a, b) => a.sort_order - b.sort_order),
		[days]
	)

	const activeSessions = useMemo(() => {
		const filtered = sessions.filter(session => session.day_number === activeDayNumber)
		return filtered.sort((a, b) => {
			const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
			if (orderDiff !== 0) return orderDiff
			return String(a.start_time ?? '').localeCompare(String(b.start_time ?? ''))
		})
	}, [sessions, activeDayNumber])

	const totals = useMemo(() => {
		const uniqueDays = new Set(sessions.map(session => session.day_number))
		return {
			sessions: sessions.length,
			days: uniqueDays.size || orderedDays.length,
			hidden: sessions.filter(session => !session.is_visible).length,
		}
	}, [sessions, orderedDays.length])

	const showToast = (message: string, tone: ToastTone) => {
		setToast({ message, tone })
	}

	const handleSave = async (overrideSessions?: ScheduleSession[], overrideDays?: ScheduleDaySetting[]) => {
		setSaving(true)

		const normalizedDays = normalizeDays(overrideDays ?? days)
		const normalizedSessions = normalizeSessions(overrideSessions ?? sessions, normalizedDays)

		const response = await fetch('/api/admin/schedule', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				days: normalizedDays,
				sessions: normalizedSessions,
			}),
		})

		const data = await response.json().catch(() => null)
		setSaving(false)

		if (!response.ok) {
			showToast(data?.error ?? 'Failed to save schedule.', 'error')
			return
		}

		setDays(normalizedDays)
		setSessions(normalizedSessions)
		setLastSavedSnapshot(snapshotState(normalizedDays, normalizedSessions))
		showToast('Schedule saved.', 'success')
	}

	const handlePageVisibility = async (nextVisible: boolean) => {
		setPageLive(nextVisible)
		const response = await fetch('/api/admin/visibility/page', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ page_key: 'schedule', is_visible: nextVisible }),
		})

		if (!response.ok) {
			setPageLive(!nextVisible)
			showToast('Failed to update page visibility.', 'error')
		}
	}

	const handleUploadPdf = async (file: File) => {
		setPdfUploading(true)
		const formData = new FormData()
		formData.append('file', file)

		const uploadResponse = await fetch('/api/admin/schedule-pdf', {
			method: 'POST',
			body: formData,
		})

		const uploadData = await uploadResponse.json().catch(() => null)
		if (!uploadResponse.ok) {
			setPdfUploading(false)
			showToast(uploadData?.error ?? 'PDF upload failed.', 'error')
			return
		}

		const pdfUrlNext = uploadData?.url as string
		const settingsResponse = await fetch('/api/admin/site-settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ schedule_pdf_url: pdfUrlNext }),
		})

		const settingsData = await settingsResponse.json().catch(() => null)
		setPdfUploading(false)

		if (!settingsResponse.ok) {
			showToast(settingsData?.error ?? 'Failed to save PDF URL.', 'error')
			return
		}

		setPdfUrl(pdfUrlNext)
		showToast('PDF schedule uploaded.', 'success')
	}

	const handleAddDay = () => {
		const nextDayNumber = Math.max(0, ...days.map(day => day.day_number)) + 1
		const next: ScheduleDaySetting = {
			id: crypto.randomUUID(),
			day_number: nextDayNumber,
			is_visible: true,
			sort_order: days.length + 1,
		}
		setDays(prev => [...prev, next])
		setActiveDayNumber(nextDayNumber)
	}

	const handleDayVisibility = (dayId: string) => {
		setDays(prev => prev.map(day => (
			day.id === dayId ? { ...day, is_visible: !day.is_visible } : day
		)))
	}

	const handleDayReorder = (dragId: string, targetId: string) => {
		if (dragId === targetId) return
		setDays(prev => {
			const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order)
			const fromIndex = sorted.findIndex(day => day.id === dragId)
			const toIndex = sorted.findIndex(day => day.id === targetId)
			if (fromIndex < 0 || toIndex < 0) return prev
			const copy = [...sorted]
			const [moved] = copy.splice(fromIndex, 1)
			copy.splice(toIndex, 0, moved)
			return copy.map((day, index) => ({ ...day, sort_order: index + 1 }))
		})
	}

	const handleSessionVisibility = (id: string) => {
		setSessions(prev => prev.map(session => (
			session.id === id ? { ...session, is_visible: !session.is_visible } : session
		)))
	}

	const handleSessionDelete = (id: string) => {
		if (!confirm('Delete this session?')) return
		setSessions(prev => prev.filter(session => session.id !== id))
	}

	const handleSessionReorder = (dragId: string, targetId: string) => {
		if (dragId === targetId) return
		setSessions(prev => {
			const daySessions = prev.filter(session => session.day_number === activeDayNumber)
			const otherSessions = prev.filter(session => session.day_number !== activeDayNumber)
			const sorted = [...daySessions].sort((a, b) => a.sort_order - b.sort_order)
			const fromIndex = sorted.findIndex(session => session.id === dragId)
			const toIndex = sorted.findIndex(session => session.id === targetId)
			if (fromIndex < 0 || toIndex < 0) return prev
			const copy = [...sorted]
			const [moved] = copy.splice(fromIndex, 1)
			copy.splice(toIndex, 0, moved)
			const reordered = copy.map((session, index) => ({ ...session, sort_order: index + 1 }))
			return [...otherSessions, ...reordered]
		})
	}

	const handleBulkVisibility = async (visible: boolean) => {
		const next = sessions.map(session => ({ ...session, is_visible: visible }))
		setSessions(next)
		await handleSave(next)
	}

	const openModal = (session?: ScheduleSession) => {
		let targetDayNumber = activeDayNumber
		if (!days.length) {
			const nextDay: ScheduleDaySetting = {
				id: crypto.randomUUID(),
				day_number: 1,
				is_visible: true,
				sort_order: 1,
			}
			setDays([nextDay])
			setActiveDayNumber(1)
			targetDayNumber = 1
		}
		if (session) {
			setEditingSession(session)
		} else {
			const defaultSession: ScheduleSession = {
				...EMPTY_SESSION,
				id: crypto.randomUUID(),
				day_number: targetDayNumber,
				sort_order: activeSessions.length + 1,
			}
			setEditingSession(defaultSession)
		}
		setShowModal(true)
	}

	const handleSessionSave = (session: ScheduleSession) => {
		setSessions(prev => {
			const existingIndex = prev.findIndex(item => item.id === session.id)
			if (existingIndex >= 0) {
				const copy = [...prev]
				copy[existingIndex] = session
				return copy
			}
			return [...prev, session]
		})
		setShowModal(false)
		setEditingSession(null)
	}

	return (
		<div style={{ maxWidth: 1200 }}>
			<style>{`
        .schedule-tab-bar {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .schedule-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--admin-surface-blur);
          border: 1px solid var(--admin-border);
          border-radius: 999px;
          padding: 0.45rem 0.9rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--admin-fg);
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .schedule-tab[data-active='true'] {
          border-color: var(--admin-accent);
          box-shadow: 0 0 0 1px var(--admin-accent);
        }
				.admin-pill-button {
					border-radius: 999px;
					padding: 0.5rem 1rem;
					font-family: var(--font-mono);
					letter-spacing: 0.08em;
					font-size: 0.7rem;
					text-transform: uppercase;
				}
        .timeline-grid {
          display: grid;
          gap: 1rem;
        }
        .timeline-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 1rem;
          align-items: stretch;
        }
        @media (max-width: 720px) {
          .timeline-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

			<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
				<div>
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: '0.65rem',
							letterSpacing: '0.14em',
							textTransform: 'uppercase',
							color: 'var(--admin-accent)',
							marginBottom: '0.4rem',
						}}
					>
						Admin · Schedule
					</div>
					<h1
						style={{
							fontFamily: 'var(--font-heading)',
							fontSize: '2rem',
							fontWeight: 700,
							margin: 0,
							color: 'var(--admin-fg)',
						}}
					>
						Schedule & Program
					</h1>
					<p
						style={{
							fontFamily: 'var(--font-body)',
							fontSize: '0.9rem',
							color: 'var(--admin-fg-muted)',
							marginTop: '0.4rem',
						}}
					>
						Manage day timelines, sessions, and the public schedule page.
					</p>
					<div
						style={{
							marginTop: '0.5rem',
							fontFamily: 'var(--font-mono)',
							fontSize: '0.7rem',
							color: isDirty ? '#facc15' : 'var(--admin-fg-muted)',
						}}
					>
						{isDirty ? 'Unsaved changes' : 'All changes saved'}
					</div>
				</div>

				<button
					type="button"
					disabled={saving}
					onClick={() => handleSave()}
					style={{
						background: 'var(--admin-accent)',
						color: '#fff',
						border: 'none',
						borderRadius: 12,
						padding: '0.6rem 1.2rem',
						fontFamily: 'var(--font-mono)',
						fontSize: '0.75rem',
						letterSpacing: '0.08em',
						cursor: saving ? 'not-allowed' : 'pointer',
						boxShadow: '0 10px 24px var(--admin-accent-glow)',
						opacity: saving ? 0.7 : 1,
					}}
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>

			<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
				<StatCard label="Total Sessions" value={totals.sessions} />
				<StatCard label="Total Days" value={totals.days} />
				<StatCard label="Hidden Sessions" value={totals.hidden} />
			</div>

			<GlassCard style={{ marginBottom: '1.5rem' }}>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
					<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
						<button
							type="button"
							className="admin-pill-button"
							onClick={() => openModal()}
							style={{
								background: 'var(--admin-accent)',
								color: '#fff',
								border: 'none',
								boxShadow: '0 10px 24px var(--admin-accent-glow)',
							}}
						>
							+ Add Session
						</button>
						<button
							type="button"
							className="admin-pill-button"
							onClick={() => handleBulkVisibility(false)}
							style={{
								background: 'transparent',
								border: '1px solid var(--admin-border)',
								color: 'var(--admin-fg)',
							}}
						>
							Hide All Sessions
						</button>
						<button
							type="button"
							className="admin-pill-button"
							onClick={() => handleBulkVisibility(true)}
							style={{
								background: 'transparent',
								border: '1px solid var(--admin-border)',
								color: 'var(--admin-fg)',
							}}
						>
							Show All Sessions
						</button>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
						<label style={{ display: 'grid', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-fg-muted)' }}>
							<span>Upload PDF Schedule</span>
							<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
								<input
									type="file"
									accept="application/pdf"
									onChange={event => {
										const file = event.target.files?.[0]
										if (file) handleUploadPdf(file)
									}}
									style={{ display: 'none' }}
									id="schedule-pdf-upload"
								/>
								<label
									htmlFor="schedule-pdf-upload"
									style={{
										background: pdfUploading ? 'rgba(148,163,184,0.2)' : 'transparent',
										border: '1px dashed var(--admin-border)',
										borderRadius: 12,
										padding: '0.4rem 0.75rem',
										cursor: pdfUploading ? 'not-allowed' : 'pointer',
										fontFamily: 'var(--font-mono)',
										fontSize: '0.65rem',
										letterSpacing: '0.08em',
										textTransform: 'uppercase',
										color: 'var(--admin-fg)',
									}}
								>
									{pdfUploading ? 'Uploading...' : 'Select PDF'}
								</label>
								{pdfUrl && (
									<a
										href={pdfUrl}
										target="_blank"
										rel="noreferrer"
										style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-accent)' }}
									>
										View PDF
									</a>
								)}
							</div>
						</label>

						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: pageLive ? '#20c997' : '#ef4444' }}>
								{pageLive ? 'Page Live' : 'Page Hidden'}
							</div>
							<Toggle checked={pageLive} onChange={() => handlePageVisibility(!pageLive)} />
						</div>
					</div>
				</div>
			</GlassCard>

			<GlassCard style={{ marginBottom: '1.5rem' }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
					<SectionTitle title="Day Tabs" subtitle="Drag to reorder. Toggle visibility per day." />
					<button
						type="button"
						onClick={handleAddDay}
						className="admin-pill-button"
						style={{ borderStyle: 'dashed', background: 'transparent', color: 'var(--admin-fg)' }}
					>
						+ Add Day
					</button>
				</div>

				<div className="schedule-tab-bar">
					{orderedDays.map(day => {
						const count = sessions.filter(session => session.day_number === day.day_number).length
						return (
							<div
								key={day.id}
								className="schedule-tab"
								data-active={day.day_number === activeDayNumber}
								draggable
								onDragStart={() => setDragDayId(day.id)}
								onDragEnd={() => setDragDayId(null)}
								onDragOver={event => event.preventDefault()}
								onDrop={() => {
									if (!dragDayId) return
									handleDayReorder(dragDayId, day.id)
									setDragDayId(null)
								}}
								onClick={() => setActiveDayNumber(day.day_number)}
							>
								<span style={{ fontWeight: 600 }}>Day {day.day_number}</span>
								<span
									style={{
										background: 'rgba(148,163,184,0.2)',
										borderRadius: 999,
										padding: '0.15rem 0.45rem',
										fontSize: '0.6rem',
									}}
								>
									{count}
								</span>
								<button
									type="button"
									onClick={event => {
										event.stopPropagation()
										handleDayVisibility(day.id)
									}}
									style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
									aria-label={day.is_visible ? 'Hide day' : 'Show day'}
								>
									<EyeIcon muted={!day.is_visible} />
								</button>
								<span style={{ cursor: 'grab', opacity: 0.6 }}>::</span>
							</div>
						)
					})}
				</div>
			</GlassCard>

			<GlassCard>
				<SectionTitle title={`Sessions for Day ${activeDayNumber}`} subtitle="Drag to reorder within the day." />
				<div style={{ marginTop: '1rem' }}>
					{activeSessions.length ? (
						<div className="timeline-grid">
							{activeSessions.map(session => (
								<div
									key={session.id}
									className="timeline-row"
									draggable
									onDragStart={() => setDragSessionId(session.id)}
									onDragEnd={() => setDragSessionId(null)}
									onDragOver={event => event.preventDefault()}
									onDrop={() => {
										if (!dragSessionId) return
										handleSessionReorder(dragSessionId, session.id)
										setDragSessionId(null)
									}}
								>
									<div
										style={{
											fontFamily: 'var(--font-mono)',
											fontSize: '0.75rem',
											color: 'var(--admin-fg)',
											textTransform: 'uppercase',
											letterSpacing: '0.08em',
										}}
									>
										{formatTimeRange(session.start_time, session.end_time)}
									</div>
									<div
										style={{
											background: 'var(--admin-surface)',
											borderRadius: 20,
											padding: '1rem 1.25rem',
											border: session.is_visible ? '1px solid var(--admin-border)' : '1px solid rgba(148,163,184,0.3)',
											opacity: session.is_visible ? 1 : 0.45,
											position: 'relative',
											borderLeft: `3px solid ${session.color_tag ?? 'var(--admin-accent)'}`,
										}}
									>
										{!session.is_visible && (
											<span
												style={{
													position: 'absolute',
													top: 10,
													right: 12,
													fontFamily: 'var(--font-mono)',
													fontSize: '0.6rem',
													letterSpacing: '0.08em',
													textTransform: 'uppercase',
													color: 'var(--admin-fg-muted)',
												}}
											>
												Hidden
											</span>
										)}
										<div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: 'var(--admin-fg)' }}>
											{session.title || 'Untitled Session'}
										</div>
										{session.category && (
											<span
												style={{
													marginTop: '0.5rem',
													display: 'inline-flex',
													alignItems: 'center',
													gap: '0.4rem',
													fontFamily: 'var(--font-mono)',
													fontSize: '0.6rem',
													textTransform: 'uppercase',
													letterSpacing: '0.08em',
													padding: '0.2rem 0.6rem',
													borderRadius: 999,
													background: hexToRgba(session.color_tag ?? '#3B5BDB', 0.2),
													color: session.color_tag ?? 'var(--admin-accent)',
												}}
											>
												{session.category}
											</span>
										)}
										{session.venue && (
											<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
												Venue: {session.venue}
											</div>
										)}
										{session.host && (
											<div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
												Host: {session.host}
											</div>
										)}
										<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', gap: '0.5rem' }}>
											<div style={{ display: 'flex', gap: '0.4rem' }}>
												<IconButton
													ariaLabel="Toggle visibility"
													active={session.is_visible}
													onClick={() => handleSessionVisibility(session.id)}
													icon={<EyeIcon muted={!session.is_visible} />}
												/>
											</div>
											<div style={{ display: 'flex', gap: '0.5rem' }}>
												<button type="button" style={editButtonStyle} onClick={() => openModal(session)}>Edit</button>
												<button type="button" style={deleteButtonStyle} onClick={() => handleSessionDelete(session.id)}>Delete</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div
							style={{
								border: '1px dashed var(--admin-border)',
										borderRadius: 20,
										padding: '1.5rem',
								textAlign: 'center',
								fontFamily: 'var(--font-body)',
								color: 'var(--admin-fg-muted)',
							}}
						>
							No sessions for Day {activeDayNumber}. Add one to get started.
						</div>
					)}
				</div>
			</GlassCard>

			{showModal && editingSession && (
				<SessionModal
					session={editingSession}
					days={orderedDays}
					onClose={() => {
						setShowModal(false)
						setEditingSession(null)
					}}
					onSave={handleSessionSave}
					onChange={setEditingSession}
				/>
			)}

			{toast && (
				<div
					style={{
						position: 'fixed',
						right: 24,
						bottom: 24,
						padding: '0.75rem 1.25rem',
						borderRadius: 12,
						background: toast.tone === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(248,113,113,0.95)',
						color: '#fff',
						fontFamily: 'var(--font-body)',
						fontSize: '0.85rem',
						boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
						zIndex: 80,
					}}
				>
					{toast.message}
				</div>
			)}
		</div>
	)
}

function buildDaysFromSessions(sessions: ScheduleSession[]) {
	const unique = Array.from(new Set(sessions.map(session => session.day_number)))
	unique.sort((a, b) => a - b)
	return unique.map((dayNumber, index) => ({
		id: crypto.randomUUID(),
		day_number: dayNumber,
		is_visible: true,
		sort_order: index + 1,
	}))
}

function normalizeDays(days: ScheduleDaySetting[]) {
	const sorted = [...days].sort((a, b) => a.sort_order - b.sort_order)
	return sorted.map((day, index) => ({
		...day,
		day_number: Number(day.day_number),
		is_visible: day.is_visible !== false,
		sort_order: index + 1,
	}))
}

function normalizeSessions(sessions: ScheduleSession[], days: ScheduleDaySetting[]) {
	const sessionsByDay = days.reduce<Record<number, ScheduleSession[]>>((acc, day) => {
		acc[day.day_number] = []
		return acc
	}, {})

	sessions.forEach(session => {
		const key = Number(session.day_number)
		if (!sessionsByDay[key]) sessionsByDay[key] = []
		sessionsByDay[key].push(session)
	})

	const normalized: ScheduleSession[] = []
	Object.entries(sessionsByDay).forEach(([dayNumber, list]) => {
		const ordered = [...list].sort((a, b) => a.sort_order - b.sort_order)
		ordered.forEach((session, index) => {
			normalized.push({
				...session,
				day_number: Number(dayNumber),
				start_time: normalizeTime(session.start_time),
				end_time: session.end_time ? normalizeTime(session.end_time) : null,
				sort_order: index + 1,
			})
		})
	})

	return normalized
}

function normalizeTime(value: string | null) {
	if (!value) return '00:00:00'
	const trimmed = value.trim()
	if (trimmed.length === 5) return `${trimmed}:00`
	return trimmed
}

function formatTimeRange(start: string | null, end: string | null) {
	const startLabel = start ? start.slice(0, 5) : '--:--'
	const endLabel = end ? end.slice(0, 5) : '--:--'
	return end ? `${startLabel} - ${endLabel}` : startLabel
}

function snapshotState(days: ScheduleDaySetting[], sessions: ScheduleSession[]) {
	return JSON.stringify({
		days: days.map(day => ({
			id: day.id,
			day_number: day.day_number,
			is_visible: day.is_visible,
			sort_order: day.sort_order,
		})),
		sessions: sessions.map(session => ({
			id: session.id,
			day_number: session.day_number,
			start_time: session.start_time,
			end_time: session.end_time,
			title: session.title,
			venue: session.venue,
			host: session.host,
			category: session.category,
			color_tag: session.color_tag,
			is_visible: session.is_visible,
			sort_order: session.sort_order,
		})),
	})
}

function hexToRgba(hex: string, alpha: number) {
	const sanitized = hex.replace('#', '')
	const bigint = parseInt(sanitized.padEnd(6, '0'), 16)
	const r = (bigint >> 16) & 255
	const g = (bigint >> 8) & 255
	const b = bigint & 255
	return `rgba(${r},${g},${b},${alpha})`
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div>
			<div
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: '0.75rem',
					letterSpacing: '0.1em',
					textTransform: 'uppercase',
					color: 'var(--admin-accent)',
					marginBottom: '0.25rem',
				}}
			>
				{title}
			</div>
			{subtitle && (
				<div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>{subtitle}</div>
			)}
		</div>
	)
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
	return (
		<button
			type="button"
			onClick={onChange}
			role="switch"
			aria-checked={checked}
			style={{
				width: 44,
				height: 24,
				borderRadius: 999,
				border: '1px solid var(--admin-border)',
				background: checked ? 'var(--admin-accent)' : 'rgba(148,163,184,0.2)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: checked ? 'flex-end' : 'flex-start',
				padding: '2px 4px',
				cursor: 'pointer',
			}}
		>
			<span
				style={{
					width: 18,
					height: 18,
					borderRadius: '50%',
					background: '#fff',
				}}
			/>
		</button>
	)
}

function IconButton({
	icon,
	active,
	ariaLabel,
	onClick,
}: {
	icon: ReactNode
	active?: boolean
	ariaLabel: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			onClick={onClick}
			style={{
				border: '1px solid var(--admin-border)',
				background: active ? 'rgba(148,163,184,0.2)' : 'transparent',
				borderRadius: 10,
				padding: '0.35rem',
				color: 'var(--admin-fg)',
				cursor: 'pointer',
			}}
		>
			{icon}
		</button>
	)
}

function EyeIcon({ muted }: { muted?: boolean }) {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted ? '#9ca3af' : '#34d399'} strokeWidth="1.6">
			<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	)
}

function SessionModal({
	session,
	days,
	onClose,
	onSave,
	onChange,
}: {
	session: ScheduleSession
	days: ScheduleDaySetting[]
	onClose: () => void
	onSave: (session: ScheduleSession) => void
	onChange: (session: ScheduleSession) => void
}) {
	const timeStart = toTimeInput(session.start_time)
	const timeEnd = toTimeInput(session.end_time)
	const previewColor = session.color_tag ?? '#3B5BDB'

	return (
		<ModalShell title={session.title ? 'Edit Session' : 'Add Session'} onClose={onClose}>
			<div style={{ display: 'grid', gap: '1rem' }}>
				<label style={{ display: 'grid', gap: '0.35rem' }}>
					<span style={labelStyle}>Day</span>
					<select
						value={session.day_number}
						onChange={event => onChange({ ...session, day_number: Number(event.target.value) })}
						style={selectStyle}
					>
						{days.map(day => (
							<option key={day.id} value={day.day_number}>Day {day.day_number}</option>
						))}
					</select>
				</label>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
					<InputField
						label="Start time"
						type="time"
						value={timeStart}
						required
						onChange={value => onChange({ ...session, start_time: fromTimeInput(value) })}
					/>
					<InputField
						label="End time"
						type="time"
						value={timeEnd}
						onChange={value => onChange({ ...session, end_time: value ? fromTimeInput(value) : null })}
					/>
				</div>

				<InputField
					label="Title"
					required
					value={session.title}
					onChange={value => onChange({ ...session, title: value })}
				/>

				<div style={{ display: 'grid', gap: '0.5rem' }}>
					<span style={labelStyle}>Category + color</span>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center' }}>
						<input
							type="text"
							value={session.category ?? ''}
							placeholder="Category"
							onChange={event => onChange({ ...session, category: event.target.value })}
							style={inputStyle}
						/>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<input
								type="color"
								value={previewColor}
								onChange={event => onChange({ ...session, color_tag: event.target.value })}
								style={{ width: 36, height: 36, border: 'none', background: 'transparent' }}
							/>
							<input
								type="text"
								value={session.color_tag ?? ''}
								placeholder="#3B5BDB"
								onChange={event => onChange({ ...session, color_tag: event.target.value })}
								style={{ ...inputStyle, width: 110 }}
							/>
						</div>
					</div>
					<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
						{COLOR_PRESETS.map(color => (
							<button
								key={color}
								type="button"
								onClick={() => onChange({ ...session, color_tag: color })}
								style={{
									width: 26,
									height: 26,
									borderRadius: '50%',
									border: color === session.color_tag ? '2px solid var(--admin-fg)' : '1px solid var(--admin-border)',
									background: color,
									cursor: 'pointer',
								}}
							/>
						))}
					</div>
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.4rem',
							fontFamily: 'var(--font-mono)',
							fontSize: '0.6rem',
							letterSpacing: '0.08em',
							textTransform: 'uppercase',
							padding: '0.2rem 0.6rem',
							borderRadius: 999,
							background: hexToRgba(previewColor, 0.2),
							color: previewColor,
						}}
					>
						{session.category || 'Category Preview'}
					</div>
				</div>

				<InputField
					label="Venue"
					value={session.venue ?? ''}
					onChange={value => onChange({ ...session, venue: value })}
				/>
				<InputField
					label="Host / Speaker"
					value={session.host ?? ''}
					onChange={value => onChange({ ...session, host: value })}
				/>

				<ToggleRow
					label="Visible on public page"
					checked={session.is_visible}
					onChange={checked => onChange({ ...session, is_visible: checked })}
				/>
			</div>

			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
				<button type="button" onClick={onClose} style={ghostButtonStyle}>Cancel</button>
				<button
					type="button"
					onClick={() => onSave(session)}
					disabled={!session.title.trim() || !session.start_time}
					style={primaryButtonStyle}
				>
					Save
				</button>
			</div>
		</ModalShell>
	)
}

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(0,0,0,0.6)',
				display: 'grid',
				placeItems: 'center',
				zIndex: 70,
				padding: '1.5rem',
			}}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 520,
					maxHeight: '90vh',
					overflowY: 'auto',
					background: 'var(--admin-surface)',
					border: '1px solid var(--admin-border)',
					borderRadius: 16,
					padding: '1.5rem',
					boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
					<h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>{title}</h2>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: 'transparent',
							border: 'none',
							color: 'var(--admin-fg)',
							fontSize: '1.2rem',
							cursor: 'pointer',
						}}
					>
						X
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}

function InputField({
	label,
	value,
	onChange,
	required,
	type = 'text',
}: {
	label: string
	value: string
	onChange: (value: string) => void
	required?: boolean
	type?: string
}) {
	return (
		<label style={{ display: 'grid', gap: '0.35rem' }}>
			<span style={labelStyle}>
				{label} {required ? '*' : ''}
			</span>
			<input
				type={type}
				value={value}
				onChange={event => onChange(event.target.value)}
				style={inputStyle}
				required={required}
			/>
		</label>
	)
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
	return (
		<label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
			<span style={labelStyle}>{label}</span>
			<button
				type="button"
				onClick={() => onChange(!checked)}
				style={{
					width: 44,
					height: 24,
					borderRadius: 999,
					border: '1px solid var(--admin-border)',
					background: checked ? 'var(--admin-accent)' : 'rgba(148,163,184,0.2)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: checked ? 'flex-end' : 'flex-start',
					padding: '2px 4px',
					cursor: 'pointer',
				}}
			>
				<span
					style={{
						width: 18,
						height: 18,
						borderRadius: '50%',
						background: '#fff',
					}}
				/>
			</button>
		</label>
	)
}

function toTimeInput(value: string | null) {
	if (!value) return ''
	return value.slice(0, 5)
}

function fromTimeInput(value: string) {
	if (!value) return ''
	return `${value}:00`
}

const labelStyle: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: '0.7rem',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	color: 'var(--admin-fg-muted)',
}

const inputStyle: CSSProperties = {
	width: '100%',
	padding: '0.65rem 0.75rem',
	borderRadius: 10,
	border: '1px solid var(--admin-border)',
	background: 'rgba(15,23,42,0.25)',
	color: 'var(--admin-fg)',
	fontFamily: 'var(--font-body)',
	fontSize: '0.85rem',
}

const selectStyle: CSSProperties = {
	...inputStyle,
}

const editButtonStyle: CSSProperties = {
	background: 'transparent',
	border: '1px solid var(--admin-border)',
	borderRadius: 999,
	padding: '0.25rem 0.8rem',
	fontFamily: 'var(--font-mono)',
	fontSize: '0.6rem',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	color: 'var(--admin-fg)',
	cursor: 'pointer',
}

const deleteButtonStyle: CSSProperties = {
	...editButtonStyle,
	borderColor: '#f87171',
	color: '#f87171',
}

const primaryButtonStyle: CSSProperties = {
	background: 'var(--admin-accent)',
	border: 'none',
	color: '#fff',
	borderRadius: 10,
	padding: '0.6rem 1.2rem',
	fontFamily: 'var(--font-mono)',
	fontSize: '0.7rem',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	cursor: 'pointer',
}

const ghostButtonStyle: CSSProperties = {
	background: 'transparent',
	border: '1px solid var(--admin-border)',
	borderRadius: 10,
	padding: '0.6rem 1.2rem',
	fontFamily: 'var(--font-mono)',
	fontSize: '0.7rem',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	color: 'var(--admin-fg)',
	cursor: 'pointer',
}
