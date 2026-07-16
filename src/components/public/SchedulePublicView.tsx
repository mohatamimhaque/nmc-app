'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ScheduleDaySetting, ScheduleSession } from '@/types/database'

interface SchedulePublicViewProps {
	sessions: ScheduleSession[]
	days: ScheduleDaySetting[]
	pdfUrl: string | null
	eventDate: string | null
}

export function SchedulePublicView({ sessions, days, pdfUrl, eventDate }: SchedulePublicViewProps) {
	const searchParams = useSearchParams()
	const isPreview = searchParams?.get('preview') === 'true' || searchParams?.has('preview')
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(timer)
	}, [])

	const visibleSessions = useMemo(
		() => sessions.filter(session => session.is_visible),
		[sessions]
	)

	const derivedDays = useMemo(() => {
		if (days.length) return days
		const unique = Array.from(new Set(visibleSessions.map(session => session.day_number))).sort((a, b) => a - b)
		return unique.map((dayNumber, index) => ({
			id: `${dayNumber}`,
			day_number: dayNumber,
			is_visible: true,
			sort_order: index + 1,
		}))
	}, [days, visibleSessions])

	const visibleDays = useMemo(() => {
		return derivedDays
			.filter(day => day.is_visible)
			.filter(day => visibleSessions.some(session => session.day_number === day.day_number))
			.sort((a, b) => a.sort_order - b.sort_order)
	}, [derivedDays, visibleSessions])

	const [activeDay, setActiveDay] = useState<number>(visibleDays[0]?.day_number ?? 1)

	useEffect(() => {
		if (!visibleDays.length) return
		if (!visibleDays.some(day => day.day_number === activeDay)) {
			setActiveDay(visibleDays[0].day_number)
		}
	}, [visibleDays, activeDay])

	const sessionsForActiveDay = useMemo(() => {
		return visibleSessions
			.filter(session => session.day_number === activeDay)
			.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
	}, [visibleSessions, activeDay])

	const timelineSessions = useMemo(() => {
		return visibleSessions.map(session => ({
			...session,
			startDate: buildSessionDate(eventDate, session.day_number, session.start_time),
			endDate: session.end_time
				? buildSessionDate(eventDate, session.day_number, session.end_time)
				: null,
		}))
	}, [visibleSessions, eventDate])

	const nextSessionInfo = useMemo(() => {
		if (!timelineSessions.length) {
			return { message: 'No sessions scheduled yet.', next: null as any }
		}

		const sorted = [...timelineSessions].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
		const firstSession = sorted[0]
		if (eventDate && now.getTime() < firstSession.startDate.getTime()) {
			return { message: '', next: firstSession }
		}

		const todayKey = eventDate ? computeDayNumber(eventDate, now) : activeDay
		const todays = sorted.filter(session => session.day_number === todayKey)
		const nextToday = todays.find(session => session.startDate.getTime() > now.getTime())
		if (nextToday) {
			return { message: '', next: nextToday }
		}

		if (todays.length) {
			return { message: 'All sessions for today complete.', next: null as any }
		}

		const nextFuture = sorted.find(session => session.startDate.getTime() > now.getTime())
		if (nextFuture) {
			return { message: '', next: nextFuture }
		}

		return { message: 'All sessions complete.', next: null as any }
	}, [timelineSessions, now, eventDate, activeDay])

	const countdown = useMemo(() => {
		if (!nextSessionInfo.next) return null
		const diff = Math.max(0, nextSessionInfo.next.startDate.getTime() - now.getTime())
		return formatCountdown(diff)
	}, [nextSessionInfo, now])

	return (
		<div>
			<style>{`
        .schedule-tabs {
          display: flex;
          gap: 0.75rem;
					flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 0.5rem;
					scrollbar-width: thin;
        }
				.schedule-tabs button {
					border-radius: 999px;
					padding: 0.55rem 1.3rem;
					border: 1px solid var(--border);
					background: var(--surface);
					color: var(--foreground-muted);
					font-family: var(--font-mono);
					font-size: 0.75rem;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					cursor: pointer;
					transition: all 0.2s ease;
					box-shadow: var(--shadow-sm);
				}
				.schedule-tabs button[data-active='true'] {
					background: var(--color-primary);
					color: #fff;
					border-color: var(--color-primary);
					box-shadow: 0 12px 26px rgba(37,99,235,0.35);
				}
				.schedule-tab-bar {
					position: sticky;
					top: 0;
					z-index: 10;
					backdrop-filter: blur(12px);
				background: color-mix(in srgb, var(--surface) 85%, transparent);
					border-radius: 20px;
				border: 1px solid var(--border);
					padding: 0.85rem 1.1rem;
					margin-bottom: 2rem;
					box-shadow: var(--shadow-md);
				}
        .timeline {
          position: relative;
					margin-left: 2.25rem;
        }
        .timeline::before {
          content: '';
          position: absolute;
					left: 22px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(148,163,184,0.3);
        }
        .timeline-item {
          display: grid;
					grid-template-columns: 90px 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
					align-items: start;
        }
        @media (max-width: 760px) {
          .timeline-item {
            grid-template-columns: 1fr;
          }
        }
        .timeline-dot {
          position: absolute;
					left: 16px;
					top: 18px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 10px rgba(99,102,241,0.6);
        }
				.timeline-time {
					font-family: var(--font-mono);
					font-size: 0.9rem;
					color: var(--foreground);
					text-align: right;
					padding-right: 0.5rem;
				}
				.timeline-time span {
					display: block;
					font-size: 0.85rem;
					color: var(--foreground-muted);
				}
      `}</style>
			<style>{`
				@keyframes card-in {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.timeline-card {
					position: relative;
					overflow: hidden;
					animation: card-in 500ms ease forwards;
					opacity: 0;
					transform: translateY(10px);
				}
				.timeline-card::after {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(circle at top, rgba(34,211,238,0.16), transparent 55%);
					opacity: 0;
					transition: opacity 0.2s ease;
					pointer-events: none;
				}
				.timeline-card:hover::after {
					opacity: 1;
				}
			`}</style>


      {!isPreview && pdfUrl && (
        <div style={{ marginBottom: '2rem' }}>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: 999,
              background: 'var(--color-accent)',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Download Full Schedule (PDF)
          </a>
        </div>
      )}

      {!isPreview && (
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              border: '1px solid var(--color-accent)',
              borderRadius: 18,
              padding: '1.2rem 1.5rem',
              background: 'var(--surface)',
              color: 'var(--foreground)',
            }}
            aria-live="polite"
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
              Next Session Countdown
            </div>
            {nextSessionInfo.next ? (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700 }}>
                  {countdown ?? '00 : 00 : 00'}
                </div>
                <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
                  {nextSessionInfo.next.title}
                  {nextSessionInfo.next.venue ? ` · ${nextSessionInfo.next.venue}` : ''}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-body)' }}>{nextSessionInfo.message}</div>
            )}
          </div>
        </div>
      )}

			{visibleDays.length > 0 && (
				<div className="schedule-tab-bar">
					<div className="schedule-tabs" role="tablist" aria-label="Schedule days">
						{visibleDays.map(day => (
							<button
								key={day.id}
								role="tab"
								data-active={day.day_number === activeDay}
								onClick={() => setActiveDay(day.day_number)}
							>
								Day {day.day_number}
							</button>
						))}
					</div>
				</div>
			)}

			{sessionsForActiveDay.length ? (
				<div className="timeline">
					{sessionsForActiveDay.map((session, index) => {
						const timeline = timelineSessions.find(item => item.id === session.id)
						const status = timeline ? getSessionStatus(timeline.startDate, timeline.endDate, now) : 'upcoming'
						return (
							<div key={session.id} className="timeline-item" style={{ opacity: status === 'completed' ? 0.7 : 1 }}>
								<div className="timeline-dot" style={{ background: session.color_tag ?? 'var(--color-accent)' }} />
								<div className="timeline-time">
									<div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatTime(session.start_time)}</div>
									{session.end_time && (
										<span>- {formatTime(session.end_time)}</span>
									)}
								</div>
								<div
									className="timeline-card"
									style={{
										background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)',
										borderRadius: 20,
										padding: '1.1rem 1.35rem',
										border: status === 'live'
											? '1px solid var(--color-primary)'
											: '1px solid var(--border)',
										boxShadow: status === 'live' ? '0 0 20px rgba(37,99,235,0.35)' : 'var(--shadow-sm)',
										animationDelay: `${index * 50}ms`,
									}}
								>
									{session.category && (
										<div
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: '0.35rem',
												padding: '0.2rem 0.6rem',
												borderRadius: 999,
												background: hexToRgba(session.color_tag ?? '#2563eb', 0.2),
												color: session.color_tag ?? 'var(--color-primary)',
												fontFamily: 'var(--font-mono)',
												fontSize: '0.65rem',
												letterSpacing: '0.08em',
												textTransform: 'uppercase',
											}}
										>
											{session.category}
										</div>
									)}
									<div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem', marginTop: '0.5rem' }}>
										{session.title}
									</div>
									{session.venue && (
										<div style={{ marginTop: '0.4rem', color: 'var(--foreground-muted)' }}>Venue: {session.venue}</div>
									)}
									{session.host && (
										<div style={{ marginTop: '0.2rem', color: 'var(--foreground-muted)' }}>Host: {session.host}</div>
									)}
									{status === 'live' && (
										<div style={{ marginTop: '0.5rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
											Live now
										</div>
									)}
									{status === 'completed' && (
										<div style={{ marginTop: '0.5rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
											Completed
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			) : (
				<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
					No sessions scheduled for this day.
				</div>
			)}
		</div>
	)
}

function buildSessionDate(eventDate: string | null, dayNumber: number, timeValue: string | null) {
	const base = eventDate ? new Date(eventDate) : new Date()
	const dayStart = new Date(base)
	dayStart.setHours(0, 0, 0, 0)
	dayStart.setDate(dayStart.getDate() + Math.max(0, dayNumber - 1))

	const [hours, minutes, seconds] = parseTime(timeValue)
	const result = new Date(dayStart)
	result.setHours(hours, minutes, seconds, 0)
	return result
}

function parseTime(value: string | null) {
	if (!value) return [0, 0, 0]
	const parts = value.split(':').map(part => Number(part))
	return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

function computeDayNumber(eventDate: string, now: Date) {
	const base = new Date(eventDate)
	const dayStart = new Date(base)
	dayStart.setHours(0, 0, 0, 0)
	const diff = now.getTime() - dayStart.getTime()
	return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1)
}

function formatCountdown(diffMs: number) {
	const totalSeconds = Math.floor(diffMs / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`
}

function formatTime(value: string | null) {
	if (!value) return '--:--'
	const parts = value.split(':')
	let hours = parseInt(parts[0], 10)
	const minutes = (parts[1] || '00').padStart(2, '0')
	if (isNaN(hours)) return value.slice(0, 5)
	const ampm = hours >= 12 ? 'PM' : 'AM'
	hours = hours % 12
	hours = hours ? hours : 12 // the hour '0' should be '12'
	const strHours = String(hours).padStart(2, '0')
	return `${strHours}:${minutes} ${ampm}`
}

function getSessionStatus(startDate: Date, endDate: Date | null, now: Date) {
	const start = startDate.getTime()
	const end = endDate ? endDate.getTime() : start + 60 * 60 * 1000
	const current = now.getTime()
	if (current >= start && current <= end) return 'live'
	if (current > end) return 'completed'
	return 'upcoming'
}

function hexToRgba(hex: string, alpha: number) {
	const sanitized = hex.replace('#', '')
	const bigint = parseInt(sanitized.padEnd(6, '0'), 16)
	const r = (bigint >> 16) & 255
	const g = (bigint >> 8) & 255
	const b = bigint & 255
	return `rgba(${r},${g},${b},${alpha})`
}
