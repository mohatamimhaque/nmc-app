'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Event, EventFaq, InternalFormField, InternalFormSection, Json } from '@/types/database'
import { GlassCard } from './GlassCard'
import { RichTextField } from '@/components/shared/RichTextField'

interface RegistrationCounts {
  total: number
  pending: number
  confirmed: number
  rejected: number
}

interface EventsSettingsFormProps {
  initialEvents: Event[]
  initialFaqs: EventFaq[]
  initialSections: InternalFormSection[]
  initialFields: InternalFormField[]
  initialRegistrationCounts: Record<string, RegistrationCounts>
}

type ModalTab = 'basics' | 'content' | 'registration' | 'faq'

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

const CATEGORY_COLORS: Record<Event['category'], string> = {
  university: '#6366f1',
  college: '#14b8a6',
  school: '#f59e0b',
}

const STATUS_COLORS: Record<Event['status'], string> = {
  published: '#22c55e',
  hidden: '#94a3b8',
  disabled: '#ef4444',
}

const STATUS_LABELS: Record<Event['status'], string> = {
  published: 'Published',
  hidden: 'Hidden',
  disabled: 'Disabled',
}

const REGISTRATION_TYPE_LABEL: Record<Event['registration_type'], string> = {
  internal: 'Internal Form',
  google_form: 'Google Form',
}

const DEFAULT_EVENT: Event = {
  id: '',
  slug: '',
  title: '',
  category: 'university',
  cover_image_url: null,
  short_description: null,
  description: null,
  eligibility: null,
  prize_details: null,
  registration_type: 'internal',
  registration_url: null,
  registration_button_label: 'Register Now',
  registration_deadline: null,
  registration_limit_total: null,
  registration_limit_per_email: false,
  registration_limit_per_phone: false,
  organiser_name: null,
  organiser_email: null,
  status: 'hidden',
  sort_order: 1,
  created_at: '',
  updated_at: '',
}

export function EventsSettingsForm({
  initialEvents,
  initialFaqs,
  initialSections,
  initialFields,
  initialRegistrationCounts,
}: EventsSettingsFormProps) {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [faqs, setFaqs] = useState<EventFaq[]>(initialFaqs)
  const [sections, setSections] = useState<InternalFormSection[]>(initialSections)
  const [fields, setFields] = useState<InternalFormField[]>(initialFields)
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, RegistrationCounts>>(initialRegistrationCounts)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dragEventId, setDragEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>('basics')
  const [draftEvent, setDraftEvent] = useState<Event | null>(null)
  const [draftFaqs, setDraftFaqs] = useState<EventFaq[]>([])
  const [draftSections, setDraftSections] = useState<InternalFormSection[]>([])
  const [draftFields, setDraftFields] = useState<InternalFormField[]>([])
  const [modalSnapshot, setModalSnapshot] = useState<Record<ModalTab, string> | null>(null)
  const [dragFieldId, setDragFieldId] = useState<string | null>(null)
  const [dragFaqId, setDragFaqId] = useState<string | null>(null)
  const [registrationPanelEvent, setRegistrationPanelEvent] = useState<Event | null>(null)
  const [registrationRows, setRegistrationRows] = useState<Array<{ id: string; event_id: string; public_id: string | null; registrant_email: string | null; registrant_phone: string | null; form_data: any; status: string; submitted_at: string }>>([])
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [registrationFilter, setRegistrationFilter] = useState<string>('all')
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([])
  const [detailRow, setDetailRow] = useState<{ id: string; form_data: any } | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const stats = useMemo(() => {
    const total = events.length
    const published = events.filter(event => event.status === 'published').length
    const hidden = events.filter(event => event.status === 'hidden').length
    const disabled = events.filter(event => event.status === 'disabled').length
    return { total, published, hidden, disabled }
  }, [events])

  const filteredEvents = useMemo(() => {
    const text = query.trim().toLowerCase()
    return events
      .filter(event => {
        if (activeFilter === 'all') return true
        if (['university', 'college', 'school'].includes(activeFilter)) {
          return event.category === activeFilter
        }
        if (['published', 'hidden', 'disabled'].includes(activeFilter)) {
          return event.status === activeFilter
        }
        return true
      })
      .filter(event => {
        if (!text) return true
        return event.title.toLowerCase().includes(text)
      })
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [events, activeFilter, query])

  const openModal = (event?: Event) => {
    const base = event
      ? { ...event }
      : {
          ...DEFAULT_EVENT,
          id: crypto.randomUUID(),
          sort_order: events.length + 1,
        }

    const eventFaqs = faqs.filter(item => item.event_id === base.id)
    const eventSections = sections
      .filter(item => item.event_id === base.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const eventFields = fields.filter(item => item.event_id === base.id)

    setDraftEvent(base)
    setDraftFaqs(eventFaqs.length ? eventFaqs : [])
    setDraftSections(eventSections.length ? eventSections : [createDefaultSection(base.id)])
    setDraftFields(eventFields.length ? eventFields : [])
    setModalTab('basics')
    setModalOpen(true)

    setModalSnapshot({
      basics: snapshotBasics(base),
      content: snapshotContent(base),
      registration: snapshotRegistration(base, eventSections, eventFields),
      faq: snapshotFaq(eventFaqs),
    })
  }

  const closeModal = () => {
    setModalOpen(false)
    setDraftEvent(null)
    setDraftFaqs([])
    setDraftSections([])
    setDraftFields([])
    setModalSnapshot(null)
  }

  const updateDraftEvent = (patch: Partial<Event>) => {
    setDraftEvent(prev => (prev ? { ...prev, ...patch } : prev))
  }

  const updateFaq = (index: number, patch: Partial<EventFaq>) => {
    setDraftFaqs(prev => prev.map((item, idx) => (
      idx === index ? { ...item, ...patch } : item
    )))
  }

  const updateSection = (index: number, patch: Partial<InternalFormSection>) => {
    setDraftSections(prev => prev.map((item, idx) => (
      idx === index ? { ...item, ...patch } : item
    )))
  }

  const updateField = (index: number, patch: Partial<InternalFormField>) => {
    setDraftFields(prev => prev.map((item, idx) => (
      idx === index ? { ...item, ...patch } : item
    )))
  }

  const updateFieldConfig = (index: number, patch: Record<string, Json>) => {
    setDraftFields(prev => prev.map((item, idx) => {
      if (idx !== index) return item
      const config = (item.config && typeof item.config === 'object' && !Array.isArray(item.config))
        ? item.config as Record<string, Json>
        : {}
      return { ...item, config: { ...config, ...patch } as Json }
    }))
  }

  const updateFieldValidation = (index: number, patch: Record<string, Json>) => {
    setDraftFields(prev => prev.map((item, idx) => {
      if (idx !== index) return item
      const validation = (item.validation && typeof item.validation === 'object' && !Array.isArray(item.validation))
        ? item.validation as Record<string, Json>
        : {}
      return { ...item, validation: { ...validation, ...patch } as Json }
    }))
  }

  const updateFieldLogic = (index: number, nextLogic: Array<{ value: string; target_section_id: string }>) => {
    setDraftFields(prev => prev.map((item, idx) => (
      idx === index ? { ...item, logic: nextLogic } : item
    )))
  }

  const showToast = (message: string, tone: ToastTone) => {
    setToast({ message, tone })
  }

  const saveEvent = async () => {
    if (!draftEvent) return
    if (!draftEvent.title.trim()) {
      showToast('Title is required.', 'error')
      return
    }

    setSaving(true)

    const payload = {
      action: 'save',
      event: draftEvent,
      faqs: draftFaqs.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      })),
      sections: draftSections.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      })),
      fields: draftFields.map((item, index) => ({
        ...item,
        sort_order: index + 1,
      })),
    }

    const response = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      showToast(data?.error ?? 'Failed to save event.', 'error')
      return
    }

    const eventId = data?.eventId ?? draftEvent.id
    const updatedEvent = { ...draftEvent, id: eventId }

    setEvents(prev => {
      const exists = prev.some(item => item.id === eventId)
      if (!exists) return [...prev, updatedEvent]
      return prev.map(item => (item.id === eventId ? updatedEvent : item))
    })

    setFaqs(prev => {
      const remaining = prev.filter(item => item.event_id !== eventId)
      return [...remaining, ...draftFaqs.map((item, index) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        event_id: eventId,
        sort_order: index + 1,
      }))]
    })

    setFields(prev => {
      const remaining = prev.filter(item => item.event_id !== eventId)
      return [...remaining, ...draftFields.map((item, index) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        event_id: eventId,
        sort_order: index + 1,
      }))]
    })

    setSections(prev => {
      const remaining = prev.filter(item => item.event_id !== eventId)
      return [...remaining, ...draftSections.map((item, index) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        event_id: eventId,
        sort_order: index + 1,
      }))]
    })

    showToast('Event saved.', 'success')
    closeModal()
    router.refresh()
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return

    const response = await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      showToast(data?.error ?? 'Failed to delete event.', 'error')
      return
    }

    setEvents(prev => prev.filter(item => item.id !== eventId))
    setFaqs(prev => prev.filter(item => item.event_id !== eventId))
    setSections(prev => prev.filter(item => item.event_id !== eventId))
    setFields(prev => prev.filter(item => item.event_id !== eventId))
    showToast('Event deleted.', 'success')
  }

  const toggleVisibility = async (event: Event) => {
    const nextStatus = event.status === 'published'
      ? 'hidden'
      : event.status === 'hidden'
        ? 'published'
        : 'hidden'
    const updated = { ...event, status: nextStatus }

    setEvents(prev => prev.map(item => (item.id === event.id ? updated : item)))
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', event: updated, faqs: faqs.filter(item => item.event_id === event.id), fields: fields.filter(item => item.event_id === event.id) }),
    })
  }

  const cloneEvent = (event: Event) => {
    const newId = crypto.randomUUID()
    const cloned = {
      ...event,
      id: newId,
      title: `${event.title} (Copy)`,
      slug: `${event.slug}-copy`,
      status: 'hidden',
      created_at: '',
      updated_at: '',
      sort_order: events.length + 1,
    }
    const sectionMap = new Map<string, string>()
    const clonedSections = sections
      .filter(item => item.event_id === event.id)
      .map(item => {
        const nextId = crypto.randomUUID()
        sectionMap.set(item.id, nextId)
        return {
          ...item,
          id: nextId,
          event_id: newId,
        }
      })

    const clonedFaqs = faqs
      .filter(item => item.event_id === event.id)
      .map(item => ({
        ...item,
        id: crypto.randomUUID(),
        event_id: newId,
      }))
    const clonedFields = fields
      .filter(item => item.event_id === event.id)
      .map(item => ({
        ...item,
        id: crypto.randomUUID(),
        event_id: newId,
        section_id: item.section_id ? (sectionMap.get(item.section_id) ?? null) : null,
      }))

    setEvents(prev => [...prev, cloned])
    setFaqs(prev => [...prev, ...clonedFaqs])
    setSections(prev => [...prev, ...clonedSections])
    setFields(prev => [...prev, ...clonedFields])
    openModal(cloned)
  }

  const handleReorder = async (dragId: string, targetId: string) => {
    if (dragId === targetId) return
    const sorted = [...events].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const fromIndex = sorted.findIndex(item => item.id === dragId)
    const toIndex = sorted.findIndex(item => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return
    const copy = [...sorted]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    const nextEvents = copy.map((item, index) => ({ ...item, sort_order: index + 1 }))
    setEvents(nextEvents)

    const payload = nextEvents.map(item => ({ id: item.id, sort_order: item.sort_order }))

    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', items: payload }),
    })
  }

  const updateBulkStatus = async (status: Event['status'], ids: string[]) => {
    if (!ids.length) return
    setEvents(prev => prev.map(item => (ids.includes(item.id) ? { ...item, status } : item)))

    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulkStatus', ids, status }),
    })
  }

  const categoryFilters = ['all', 'university', 'college', 'school', 'published', 'hidden', 'disabled']

  const hasModalChanges = useMemo(() => {
    if (!draftEvent || !modalSnapshot) return { basics: false, content: false, registration: false, faq: false }
    return {
      basics: snapshotBasics(draftEvent) !== modalSnapshot.basics,
      content: snapshotContent(draftEvent) !== modalSnapshot.content,
      registration: snapshotRegistration(draftEvent, draftSections, draftFields) !== modalSnapshot.registration,
      faq: snapshotFaq(draftFaqs) !== modalSnapshot.faq,
    }
  }, [draftEvent, draftFaqs, draftSections, draftFields, modalSnapshot])

  useEffect(() => {
    if (!registrationPanelEvent) return
    const controller = new AbortController()
    setRegistrationLoading(true)

    fetch(`/api/admin/event-registrations?eventId=${registrationPanelEvent.id}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setRegistrationRows(Array.isArray(data?.data) ? data.data : [])
      })
      .catch(() => null)
      .finally(() => setRegistrationLoading(false))

    return () => controller.abort()
  }, [registrationPanelEvent])

  const registrationStats = useMemo(() => {
    if (!registrationPanelEvent) return { total: 0, pending: 0, confirmed: 0, rejected: 0 }
    return registrationRows.reduce(
      (acc, row) => {
        acc.total += 1
        acc[row.status as 'pending' | 'confirmed' | 'rejected'] += 1
        return acc
      },
      { total: 0, pending: 0, confirmed: 0, rejected: 0 }
    )
  }, [registrationRows, registrationPanelEvent])

  const filteredRegistrations = useMemo(() => {
    const text = registrationSearch.trim().toLowerCase()
    return registrationRows.filter(row => {
      if (registrationFilter !== 'all' && row.status !== registrationFilter) return false
      if (!text) return true
      const fieldsList = Array.isArray(row.form_data?.fields) ? row.form_data.fields : []
      const matchesFields = fieldsList.some((field: any) => String(field.value ?? '').toLowerCase().includes(text))
      const matchesId = String(row.public_id ?? '').toLowerCase().includes(text)
      const matchesEmail = String(row.registrant_email ?? '').toLowerCase().includes(text)
      const matchesPhone = String(row.registrant_phone ?? '').toLowerCase().includes(text)
      return matchesFields || matchesId || matchesEmail || matchesPhone
    })
  }, [registrationRows, registrationFilter, registrationSearch])

  const updateRegistrationStatus = async (ids: string[], status: string) => {
    if (!ids.length) return
    await fetch('/api/admin/event-registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status }),
    })
    setRegistrationRows(prev => prev.map(row => (ids.includes(row.id) ? { ...row, status } : row)))
    setSelectedRegistrationIds([])
  }

  const deleteRegistrations = async (ids: string[]) => {
    if (!ids.length) return
    await fetch('/api/admin/event-registrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setRegistrationRows(prev => prev.filter(row => !ids.includes(row.id)))
    setSelectedRegistrationIds([])
  }

  const exportRegistrations = () => {
    if (!registrationPanelEvent) return
    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'Submitted At', 'Status']
    const rows = filteredRegistrations.map(row => {
      const fieldsList = Array.isArray(row.form_data?.fields) ? row.form_data.fields : []
      const nameField = fieldsList.find((field: any) => field.label?.toLowerCase().includes('name'))
      const emailField = fieldsList.find((field: any) => field.label?.toLowerCase().includes('email'))
      const phoneField = fieldsList.find((field: any) => field.label?.toLowerCase().includes('phone'))
      return [
        String(row.public_id ?? ''),
        String(nameField?.value ?? ''),
        String(emailField?.value ?? ''),
        String(phoneField?.value ?? row.registrant_phone ?? ''),
        formatDateTime(row.submitted_at),
        row.status,
      ]
    })

    const csv = [headers, ...rows]
      .map(list => list.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${registrationPanelEvent.slug}-registrations.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectRegistration = (id: string) => {
    setSelectedRegistrationIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  const deadlineCountdown = useMemo(() => {
    if (!draftEvent?.registration_deadline) return 'No deadline set'
    const diff = new Date(draftEvent.registration_deadline).getTime() - Date.now()
    if (Number.isNaN(diff) || diff <= 0) return 'Deadline passed'
    return formatCountdown(diff)
  }, [draftEvent?.registration_deadline])

  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{`
        .events-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        @media (min-width: 768px) {
          .events-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1100px) {
          .events-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .event-card {
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .event-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
        }
        .event-card.hidden {
          opacity: 0.5;
        }
        .event-card.hidden .event-title {
          text-decoration: line-through;
        }
        .event-card.disabled {
          border-color: rgba(248,113,113,0.6);
        }
        .event-card.disabled::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(127,29,29,0.08);
          pointer-events: none;
        }
        .event-cover {
          height: 180px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4f46e5, #8b5cf6);
        }
        .event-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-cover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,17,23,0) 45%, rgba(15,17,23,0.65) 100%);
        }
        .event-body {
          padding: 1.1rem 1.25rem 1rem;
          display: grid;
          gap: 0.6rem;
          flex: 1;
        }
        .event-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--admin-fg);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .event-desc {
          font-family: var(--font-body);
          font-size: 0.8rem;
          color: var(--admin-fg-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .event-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--admin-fg-muted);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .pill-tab {
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          border: 1px solid var(--admin-border);
          background: transparent;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--admin-fg);
        }
        .pill-tab.active {
          background: var(--admin-accent);
          border-color: transparent;
          color: #fff;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,10,18,0.72);
          display: grid;
          place-items: center;
          z-index: 80;
          padding: 1.5rem;
        }
        .modal-card {
          width: 100%;
          max-width: 900px;
          background: var(--admin-surface);
          border: 1px solid var(--admin-border);
          border-radius: 20px;
          padding: 1.5rem;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .modal-tab {
          border: 1px solid var(--admin-border);
          border-radius: 999px;
          padding: 0.3rem 0.8rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .modal-tab.active {
          background: var(--admin-accent);
          border-color: transparent;
          color: #fff;
        }
        .handle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid var(--admin-border);
          color: var(--admin-fg-muted);
          cursor: grab;
          background: rgba(148,163,184,0.1);
        }
        .slide-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: min(720px, 90vw);
          background: var(--admin-surface);
          border-left: 1px solid var(--admin-border);
          z-index: 90;
          display: grid;
          grid-template-rows: auto 1fr;
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={eyebrowStyle}>Admin · Events</div>
        <h1 style={titleStyle}>Events Management</h1>
        <p style={subtitleStyle}>Manage competitions, registrations, and event content.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <Stat label="Total Events" value={stats.total} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Hidden" value={stats.hidden} />
        <Stat label="Disabled" value={stats.disabled} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => openModal()}
          style={primaryButtonStyle}
        >
          + Add Event
        </button>
        <button
          type="button"
          onClick={() => updateBulkStatus('published', events.map(event => event.id))}
          style={ghostButtonStyle}
        >
          Publish All
        </button>
        <button
          type="button"
          onClick={() => updateBulkStatus('hidden', events.map(event => event.id))}
          style={ghostButtonStyle}
        >
          Hide All
        </button>
        <button
          type="button"
          onClick={() => updateBulkStatus('disabled', selectedIds)}
          style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
        >
          Disable Selected
        </button>
        <div style={{ flex: 1 }} />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search events"
          style={searchStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {categoryFilters.map(filter => (
          <button
            key={filter}
            type="button"
            className={`pill-tab ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => {
          const isSelected = selectedIds.includes(event.id)
          const counts = registrationCounts[event.id] ?? { total: 0, pending: 0, confirmed: 0, rejected: 0 }
          return (
            <div
              key={event.id}
              className={`event-card ${event.status}`}
              onDragOver={drag => drag.preventDefault()}
              onDrop={drag => {
                const draggedId = drag.dataTransfer.getData('text/plain') || dragEventId
                if (!draggedId) return
                handleReorder(draggedId, event.id)
                setDragEventId(null)
              }}
            >
              <div className="event-cover">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt={event.title} />
                ) : (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#fff' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="3" />
                      <path d="M16 2v4" />
                      <path d="M8 2v4" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '0.4rem' }}>
                  <span
                    className="badge"
                    style={{ background: `${STATUS_COLORS[event.status]}20`, color: STATUS_COLORS[event.status], border: `1px solid ${STATUS_COLORS[event.status]}60` }}
                  >
                    {event.status === 'published' ? '●' : event.status === 'hidden' ? '◌' : '✕'}
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.4rem' }}>
                  <span
                    className="badge"
                    style={{ background: `${CATEGORY_COLORS[event.category]}1a`, color: CATEGORY_COLORS[event.category], border: `1px solid ${CATEGORY_COLORS[event.category]}4d` }}
                  >
                    {event.category}
                  </span>
                  <button
                    type="button"
                    className="handle"
                    title="Drag to reorder"
                    onClick={evt => evt.stopPropagation()}
                    draggable
                    onDragStart={drag => {
                      setDragEventId(event.id)
                      drag.dataTransfer.setData('text/plain', event.id)
                    }}
                  >
                    ::
                  </button>
                </div>
              </div>
              <div className="event-body">
                <div className="event-title">{event.title}</div>
                <div className="event-desc">{event.short_description ?? 'No description yet.'}</div>
                <div className="event-meta">
                  <span>🕒 {event.registration_deadline ? formatDate(event.registration_deadline) : 'No deadline set'}</span>
                  <span>🧾 {REGISTRATION_TYPE_LABEL[event.registration_type]}</span>
                  <span>👥 {counts.total} regs</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRegistrationPanelEvent(event)}
                  style={linkButtonStyle}
                >
                  View Registrations ({counts.total})
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setSelectedIds(prev => prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id])}
                  />
                  <button type="button" style={iconButtonStyle} onClick={() => toggleVisibility(event)}>👁</button>
                  <button type="button" style={iconButtonStyle} onClick={() => openModal(event)}>✎</button>
                  <button type="button" style={iconButtonStyle} onClick={() => cloneEvent(event)}>⧉</button>
                  <button type="button" style={{ ...iconButtonStyle, color: '#f87171', borderColor: '#f87171' }} onClick={() => deleteEvent(event.id)}>🗑</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && draftEvent && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div>
                <div style={eyebrowStyle}>Event Editor</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700 }}>
                  {draftEvent.title ? `Edit: ${draftEvent.title}` : 'Add Event'}
                </div>
              </div>
              <button type="button" onClick={closeModal} style={ghostButtonStyle}>X</button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="modal-tabs">
                {(['basics', 'content', 'registration', 'faq'] as ModalTab[]).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    className={`modal-tab ${modalTab === tab ? 'active' : ''}`}
                    onClick={() => setModalTab(tab)}
                  >
                    {tab}
                    {hasModalChanges[tab] && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15' }} />}
                  </button>
                ))}
              </div>
            </div>

            {modalTab === 'basics' && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                <div style={uploadBoxStyle}>
                  {draftEvent.cover_image_url ? (
                    <img src={draftEvent.cover_image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--admin-fg-muted)' }}>
                      <div>Upload Cover Image (optional)</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="event-cover-input"
                    onChange={async event => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      const formData = new FormData()
                      formData.append('file', file)
                      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                      const data = await response.json().catch(() => null)
                      if (response.ok) {
                        updateDraftEvent({ cover_image_url: data?.url ?? null })
                      } else {
                        showToast(data?.error ?? 'Upload failed.', 'error')
                      }
                    }}
                  />
                  <label htmlFor="event-cover-input" style={smallButtonStyle}>Change</label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <LabeledInput
                    label="Title"
                    required
                    value={draftEvent.title}
                    onChange={value => updateDraftEvent({ title: value })}
                  />

                  <LabeledInput
                    label="Slug"
                    value={draftEvent.slug}
                    onChange={value => updateDraftEvent({ slug: value })}
                    helper={`Preview: /events/${draftEvent.slug || slugify(draftEvent.title)}`}
                    onBlur={() => {
                      if (!draftEvent.slug.trim()) {
                        updateDraftEvent({ slug: slugify(draftEvent.title) })
                      }
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <RadioGroup
                    label="Category"
                    options={['university', 'college', 'school']}
                    value={draftEvent.category}
                    onChange={value => updateDraftEvent({ category: value as Event['category'] })}
                  />

                  <RadioGroup
                    label="Status"
                    options={['published', 'hidden', 'disabled']}
                    value={draftEvent.status}
                    onChange={value => updateDraftEvent({ status: value as Event['status'] })}
                  />
                </div>

                <LabeledTextArea
                  label="Short Description"
                  value={draftEvent.short_description ?? ''}
                  onChange={value => updateDraftEvent({ short_description: value })}
                  rows={2}
                />
              </div>
            )}

            {modalTab === 'content' && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                <LabeledTextArea
                  label="Full Description"
                  value={draftEvent.description ?? ''}
                  onChange={value => updateDraftEvent({ description: value })}
                  rows={6}
                  placeholder="Write the full event description here..."
                />
                <LabeledTextArea
                  label="Eligibility & Rules"
                  value={draftEvent.eligibility ?? ''}
                  onChange={value => updateDraftEvent({ eligibility: value })}
                  rows={4}
                />
                <LabeledTextArea
                  label="Prize Details"
                  value={draftEvent.prize_details ?? ''}
                  onChange={value => updateDraftEvent({ prize_details: value })}
                  rows={3}
                />
                <LabeledInput
                  label="Organiser Contact Name"
                  value={draftEvent.organiser_name ?? ''}
                  onChange={value => updateDraftEvent({ organiser_name: value })}
                />
                <LabeledInput
                  label="Organiser Contact Email"
                  value={draftEvent.organiser_email ?? ''}
                  onChange={value => updateDraftEvent({ organiser_email: value })}
                />
              </div>
            )}

            {modalTab === 'registration' && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                <LabeledInput
                  label="Registration Deadline"
                  type="datetime-local"
                  value={toInputValue(draftEvent.registration_deadline)}
                  onChange={value => updateDraftEvent({ registration_deadline: value ? new Date(value).toISOString() : null })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <LabeledInput
                    label="Max registrations (optional)"
                    type="number"
                    value={draftEvent.registration_limit_total ? String(draftEvent.registration_limit_total) : ''}
                    onChange={value => updateDraftEvent({ registration_limit_total: value ? Number(value) : null })}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={draftEvent.registration_limit_per_email}
                      onChange={event => updateDraftEvent({ registration_limit_per_email: event.target.checked })}
                    />
                    One response per email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={draftEvent.registration_limit_per_phone}
                      onChange={event => updateDraftEvent({ registration_limit_per_phone: event.target.checked })}
                    />
                    One response per phone
                  </label>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
                  Countdown preview: {deadlineCountdown}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <RadioCard
                    title="Internal Form"
                    description="Collect registrations directly on this website"
                    active={draftEvent.registration_type === 'internal'}
                    onClick={() => updateDraftEvent({ registration_type: 'internal' })}
                  />
                  <RadioCard
                    title="Google Form"
                    description="Redirect participants to your Google Form"
                    active={draftEvent.registration_type === 'google_form'}
                    onClick={() => updateDraftEvent({ registration_type: 'google_form' })}
                  />
                </div>

                {draftEvent.registration_type === 'google_form' && (
                  <LabeledInput
                    label="Google Form URL"
                    value={draftEvent.registration_url ?? ''}
                    onChange={value => updateDraftEvent({ registration_url: value })}
                  />
                )}

                {draftEvent.registration_type === 'internal' && (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div style={eyebrowStyle}>Form Sections</div>
                      {draftSections.map((section, index) => (
                        <div key={section.id} style={listRowStyle}>
                          <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                            <LabeledInput
                              label="Section title"
                              value={section.title}
                              onChange={value => updateSection(index, { title: value })}
                            />
                            <LabeledInput
                              label="Section description"
                              value={section.description ?? ''}
                              onChange={value => updateSection(index, { description: value || null })}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                              <input
                                type="checkbox"
                                checked={section.is_visible}
                                onChange={event => updateSection(index, { is_visible: event.target.checked })}
                              />
                              Visible
                            </label>
                          </div>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <button type="button" style={ghostButtonStyle} onClick={() => setDraftSections(prev => moveItem(prev, index, -1))}>↑</button>
                            <button type="button" style={ghostButtonStyle} onClick={() => setDraftSections(prev => moveItem(prev, index, 1))}>↓</button>
                            <button
                              type="button"
                              style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                              onClick={() => setDraftSections(prev => prev.filter((_, idx) => idx !== index))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={dashedButtonStyle}
                        onClick={() => setDraftSections(prev => [...prev, createDefaultSection(draftEvent.id, prev.length + 1)])}
                      >
                        + Add Section
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={eyebrowStyle}>Form Fields</div>
                      {draftFields.map((field, index) => {
                        const config = typeof field.config === 'object' && field.config ? field.config as Record<string, any> : {}
                        const validation = typeof field.validation === 'object' && field.validation ? field.validation as Record<string, any> : {}
                        const options = Array.isArray(config.options) && config.options.length
                          ? config.options
                          : field.options ?? []
                        const gridRows = Array.isArray(config.gridRows) ? config.gridRows : []
                        const gridColumns = Array.isArray(config.gridColumns) ? config.gridColumns : []
                        const logicRules = Array.isArray(field.logic) ? field.logic as Array<{ value: string; target_section_id: string }> : []

                        return (
                          <div
                            key={field.id}
                            style={listRowStyle}
                            draggable
                            onDragStart={event => {
                              setDragFieldId(field.id)
                              event.dataTransfer.setData('text/plain', field.id)
                            }}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => {
                              const draggedId = event.dataTransfer.getData('text/plain') || dragFieldId
                              if (!draggedId || draggedId === field.id) return
                              setDraftFields(prev => reorderById(prev, draggedId, field.id))
                              setDragFieldId(null)
                            }}
                          >
                            <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                              <LabeledInput
                                label="Field Label"
                                value={field.label}
                                onChange={value => updateField(index, { label: value })}
                              />
                              <LabeledInput
                                label="Helper text"
                                value={field.helper_text ?? ''}
                                onChange={value => updateField(index, { helper_text: value || null })}
                              />
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                <select
                                  value={field.section_id ?? ''}
                                  onChange={event => updateField(index, { section_id: event.target.value || null })}
                                  style={inputStyle}
                                >
                                  <option value="">No section</option>
                                  {draftSections.map(section => (
                                    <option key={section.id} value={section.id}>{section.title}</option>
                                  ))}
                                </select>
                                <select
                                  value={field.field_type}
                                  onChange={event => updateField(index, { field_type: event.target.value as InternalFormField['field_type'] })}
                                  style={inputStyle}
                                >
                                  <option value="short">Short text</option>
                                  <option value="paragraph">Paragraph</option>
                                  <option value="mcq">Multiple choice</option>
                                  <option value="checkbox">Checkboxes</option>
                                  <option value="dropdown">Dropdown</option>
                                  <option value="date">Date</option>
                                  <option value="time">Time</option>
                                  <option value="number">Number</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="file">File upload</option>
                                  <option value="grid_radio">Multiple choice grid</option>
                                  <option value="grid_checkbox">Checkbox grid</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={field.is_required}
                                    onChange={event => updateField(index, { is_required: event.target.checked })}
                                  />
                                  Required
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={field.is_visible}
                                    onChange={event => updateField(index, { is_visible: event.target.checked })}
                                  />
                                  Visible
                                </label>
                              </div>

                              {(field.field_type === 'mcq' || field.field_type === 'checkbox' || field.field_type === 'dropdown') && (
                                <>
                                  <LabeledInput
                                    label="Options (comma-separated)"
                                    value={options.join(', ')}
                                    onChange={value => {
                                      const next = value.split(',').map(item => item.trim()).filter(Boolean)
                                      updateField(index, { options: next })
                                      updateFieldConfig(index, { options: next })
                                    }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(config.allowOther)}
                                      onChange={event => updateFieldConfig(index, { allowOther: event.target.checked })}
                                    />
                                    Allow "Other"
                                  </label>
                                </>
                              )}

                              {(field.field_type === 'grid_radio' || field.field_type === 'grid_checkbox') && (
                                <>
                                  <LabeledInput
                                    label="Grid rows (comma-separated)"
                                    value={gridRows.join(', ')}
                                    onChange={value => updateFieldConfig(index, { gridRows: value.split(',').map(item => item.trim()).filter(Boolean) })}
                                  />
                                  <LabeledInput
                                    label="Grid columns (comma-separated)"
                                    value={gridColumns.join(', ')}
                                    onChange={value => updateFieldConfig(index, { gridColumns: value.split(',').map(item => item.trim()).filter(Boolean) })}
                                  />
                                </>
                              )}

                              {field.field_type === 'file' && (
                                <>
                                  <LabeledInput
                                    label="Allowed file types (comma-separated)"
                                    value={Array.isArray(config.fileTypes) ? config.fileTypes.join(', ') : ''}
                                    onChange={value => updateFieldConfig(index, { fileTypes: value.split(',').map(item => item.trim()).filter(Boolean) })}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                                    <LabeledInput
                                      label="Max files"
                                      type="number"
                                      value={config.maxFiles ? String(config.maxFiles) : ''}
                                      onChange={value => updateFieldConfig(index, { maxFiles: value ? Number(value) : null })}
                                    />
                                    <LabeledInput
                                      label="Max size (MB)"
                                      type="number"
                                      value={config.maxFileSizeMb ? String(config.maxFileSizeMb) : ''}
                                      onChange={value => updateFieldConfig(index, { maxFileSizeMb: value ? Number(value) : null })}
                                    />
                                  </div>
                                </>
                              )}

                              {(field.field_type === 'short' || field.field_type === 'paragraph' || field.field_type === 'email' || field.field_type === 'phone') && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                                  <LabeledInput
                                    label="Min length"
                                    type="number"
                                    value={validation.minLength ? String(validation.minLength) : ''}
                                    onChange={value => updateFieldValidation(index, { minLength: value ? Number(value) : null })}
                                  />
                                  <LabeledInput
                                    label="Max length"
                                    type="number"
                                    value={validation.maxLength ? String(validation.maxLength) : ''}
                                    onChange={value => updateFieldValidation(index, { maxLength: value ? Number(value) : null })}
                                  />
                                  <LabeledInput
                                    label="Regex pattern"
                                    value={validation.pattern ? String(validation.pattern) : ''}
                                    onChange={value => updateFieldValidation(index, { pattern: value || null })}
                                  />
                                </div>
                              )}

                              {field.field_type === 'number' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                                  <LabeledInput
                                    label="Min value"
                                    type="number"
                                    value={validation.min ? String(validation.min) : ''}
                                    onChange={value => updateFieldValidation(index, { min: value ? Number(value) : null })}
                                  />
                                  <LabeledInput
                                    label="Max value"
                                    type="number"
                                    value={validation.max ? String(validation.max) : ''}
                                    onChange={value => updateFieldValidation(index, { max: value ? Number(value) : null })}
                                  />
                                </div>
                              )}

                              {(field.field_type === 'mcq' || field.field_type === 'dropdown') && options.length > 0 && draftSections.length > 0 && (
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                  <div style={labelStyle}>Conditional logic (jump to section)</div>
                                  {options.map(option => {
                                    const rule = logicRules.find(item => item.value === option)
                                    return (
                                      <div key={option} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem' }}>{option}</div>
                                        <select
                                          value={rule?.target_section_id ?? ''}
                                          onChange={event => {
                                            const target = event.target.value
                                            const next = logicRules.filter(item => item.value !== option)
                                            if (target) {
                                              next.push({ value: option, target_section_id: target })
                                            }
                                            updateFieldLogic(index, next)
                                          }}
                                          style={inputStyle}
                                        >
                                          <option value="">No jump</option>
                                          {draftSections.map(section => (
                                            <option key={section.id} value={section.id}>{section.title}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              <button
                                type="button"
                                style={ghostButtonStyle}
                                onClick={() => setDraftFields(prev => moveItem(prev, index, -1))}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                style={ghostButtonStyle}
                                onClick={() => setDraftFields(prev => moveItem(prev, index, 1))}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                                onClick={() => setDraftFields(prev => prev.filter((_, idx) => idx !== index))}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        style={dashedButtonStyle}
                        onClick={() => setDraftFields(prev => [...prev, {
                          id: crypto.randomUUID(),
                          event_id: draftEvent.id,
                          section_id: draftSections[0]?.id ?? null,
                          label: 'New Field',
                          field_type: 'short',
                          options: [],
                          helper_text: null,
                          is_required: false,
                          config: {},
                          validation: {},
                          logic: [],
                          is_visible: true,
                          sort_order: prev.length + 1,
                        }])}
                      >
                        + Add Field
                      </button>
                    </div>
                  </div>
                )}

                <LabeledInput
                  label="Registration Button Label"
                  value={draftEvent.registration_button_label}
                  onChange={value => updateDraftEvent({ registration_button_label: value })}
                />
              </div>
            )}

            {modalTab === 'faq' && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                    {draftFaqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    style={listRowStyle}
                    draggable
                    onDragStart={event => {
                      setDragFaqId(faq.id)
                      event.dataTransfer.setData('text/plain', faq.id)
                    }}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                      const draggedId = event.dataTransfer.getData('text/plain') || dragFaqId
                      if (!draggedId || draggedId === faq.id) return
                      setDraftFaqs(prev => reorderById(prev, draggedId, faq.id))
                      setDragFaqId(null)
                    }}
                  >
                    <div style={{ flex: 1, display: 'grid', gap: '0.5rem' }}>
                      <LabeledInput
                        label="Question"
                        value={faq.question}
                        onChange={value => updateFaq(index, { question: value })}
                      />
                      <LabeledTextArea
                        label="Answer"
                        value={faq.answer ?? ''}
                        onChange={value => updateFaq(index, { answer: value })}
                        rows={2}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <button
                        type="button"
                        style={ghostButtonStyle}
                        onClick={() => setDraftFaqs(prev => moveItem(prev, index, -1))}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        style={ghostButtonStyle}
                        onClick={() => setDraftFaqs(prev => moveItem(prev, index, 1))}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }}
                        onClick={() => setDraftFaqs(prev => prev.filter((_, idx) => idx !== index))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  style={dashedButtonStyle}
                  onClick={() => setDraftFaqs(prev => [...prev, {
                    id: crypto.randomUUID(),
                    event_id: draftEvent.id,
                    question: 'New Question',
                    answer: '',
                    sort_order: prev.length + 1,
                  }])}
                >
                  + Add FAQ
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={closeModal} style={ghostButtonStyle}>Cancel</button>
              <button type="button" disabled={saving} onClick={saveEvent} style={primaryButtonStyle}>Save</button>
            </div>
          </div>
        </div>
      )}

      {registrationPanelEvent && (
        <div className="slide-panel" ref={panelRef}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={eyebrowStyle}>Registrations</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>{registrationPanelEvent.title}</div>
              </div>
              <button type="button" style={ghostButtonStyle} onClick={() => setRegistrationPanelEvent(null)}>X</button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Stat label="Total" value={registrationStats.total} />
              <Stat label="Pending" value={registrationStats.pending} />
              <Stat label="Confirmed" value={registrationStats.confirmed} />
              <Stat label="Rejected" value={registrationStats.rejected} />
            </div>
          </div>
          <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <input
                type="search"
                value={registrationSearch}
                onChange={event => setRegistrationSearch(event.target.value)}
                placeholder="Search registrations"
                style={searchStyle}
              />
              <select
                value={registrationFilter}
                onChange={event => setRegistrationFilter(event.target.value)}
                style={inputStyle}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
              <button type="button" style={ghostButtonStyle} onClick={() => updateRegistrationStatus(selectedRegistrationIds, 'confirmed')}>
                Confirm Selected
              </button>
              <button type="button" style={ghostButtonStyle} onClick={exportRegistrations}>Export CSV</button>
              <button type="button" style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }} onClick={() => deleteRegistrations(selectedRegistrationIds)}>
                Delete Selected
              </button>
            </div>

            {registrationLoading ? (
              <div style={{ color: 'var(--admin-fg-muted)' }}>Loading...</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filteredRegistrations.map(row => (
                  <div key={row.id} style={listRowStyle}>
                    <input
                      type="checkbox"
                      checked={selectedRegistrationIds.includes(row.id)}
                      onChange={() => selectRegistration(row.id)}
                    />
                    <div style={{ flex: 1 }}>
                      {row.public_id && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-accent)' }}>
                          ID: {row.public_id}
                        </div>
                      )}
                      <div style={{ fontWeight: 600 }}>{formatRegistrationName(row.form_data)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)' }}>{formatRegistrationEmail(row.form_data, row.registrant_email)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>{formatDateTime(row.submitted_at)}</div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(148,163,184,0.2)', color: 'var(--admin-fg)' }}>{row.status}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" style={ghostButtonStyle} onClick={() => setDetailRow({ id: row.id, form_data: row.form_data })}>View Details</button>
                      <button type="button" style={ghostButtonStyle} onClick={() => updateRegistrationStatus([row.id], 'confirmed')}>Confirm</button>
                      <button type="button" style={ghostButtonStyle} onClick={() => updateRegistrationStatus([row.id], 'rejected')}>Reject</button>
                      <button type="button" style={{ ...ghostButtonStyle, borderColor: '#f87171', color: '#f87171' }} onClick={() => deleteRegistrations([row.id])}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {detailRow && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>Registration Details</div>
              <button type="button" onClick={() => setDetailRow(null)} style={ghostButtonStyle}>X</button>
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              {registrationRows.find(row => row.id === detailRow.id)?.public_id && (
                <div style={listRowStyle}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>Tracking ID</div>
                  <div style={{ fontFamily: 'var(--font-body)' }}>
                    {registrationRows.find(row => row.id === detailRow.id)?.public_id}
                  </div>
                </div>
              )}
              {(detailRow.form_data?.fields ?? []).map((field: any) => (
                <div key={field.id} style={listRowStyle}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>{field.label}</div>
                  <div style={{ fontFamily: 'var(--font-body)' }}>{String(field.value ?? '')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={toastStyle(toast.tone)}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

function snapshotBasics(event: Event) {
  return JSON.stringify({
    title: event.title,
    slug: event.slug,
    category: event.category,
    status: event.status,
    cover_image_url: event.cover_image_url,
    short_description: event.short_description,
  })
}

function snapshotContent(event: Event) {
  return JSON.stringify({
    description: event.description,
    eligibility: event.eligibility,
    prize_details: event.prize_details,
    organiser_name: event.organiser_name,
    organiser_email: event.organiser_email,
  })
}

function snapshotRegistration(event: Event, sections: InternalFormSection[], fields: InternalFormField[]) {
  return JSON.stringify({
    registration_deadline: event.registration_deadline,
    registration_type: event.registration_type,
    registration_url: event.registration_url,
    registration_button_label: event.registration_button_label,
    registration_limit_total: event.registration_limit_total,
    registration_limit_per_email: event.registration_limit_per_email,
    registration_limit_per_phone: event.registration_limit_per_phone,
    sections: sections.map(section => ({
      title: section.title,
      description: section.description,
      is_visible: section.is_visible,
    })),
    fields: fields.map(field => ({
      label: field.label,
      field_type: field.field_type,
      options: field.options,
      is_required: field.is_required,
      section_id: field.section_id,
      helper_text: field.helper_text,
      config: field.config,
      validation: field.validation,
      logic: field.logic,
      is_visible: field.is_visible,
    })),
  })
}

function snapshotFaq(faqs: EventFaq[]) {
  return JSON.stringify(faqs.map(faq => ({ question: faq.question, answer: faq.answer })))
}

function createDefaultSection(eventId: string, order = 1): InternalFormSection {
  return {
    id: crypto.randomUUID(),
    event_id: eventId,
    title: `Section ${order}`,
    description: null,
    is_visible: true,
    sort_order: order,
  }
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const copy = [...items]
  const [moved] = copy.splice(index, 1)
  copy.splice(nextIndex, 0, moved)
  return copy
}

function reorderById<T extends { id: string }>(items: T[], dragId: string, targetId: string) {
  if (dragId === targetId) return items
  const fromIndex = items.findIndex(item => item.id === dragId)
  const toIndex = items.findIndex(item => item.id === targetId)
  if (fromIndex < 0 || toIndex < 0) return items
  const copy = [...items]
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, moved)
  return copy
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toInputValue(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatCountdown(diffMs: number) {
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${days} days ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatRegistrationName(formData: any) {
  const fields = Array.isArray(formData?.fields) ? formData.fields : []
  const nameField = fields.find((field: any) => field.label?.toLowerCase().includes('name'))
  return nameField?.value || 'Unknown'
}

function formatRegistrationEmail(formData: any, fallback?: string | null) {
  const fields = Array.isArray(formData?.fields) ? formData.fields : []
  const emailField = fields.find((field: any) => field.label?.toLowerCase().includes('email'))
  return emailField?.value || fallback || 'No email'
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard style={{ padding: '1rem 1.25rem', minWidth: 160 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-fg-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{value}</div>
    </GlassCard>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  helper,
  required,
  onBlur,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  helper?: string
  required?: boolean
  onBlur?: () => void
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={labelStyle}>{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        style={inputStyle}
      />
      {helper && <span style={{ fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>{helper}</span>}
    </label>
  )
}

function LabeledTextArea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
  placeholder?: string
}) {
  return (
    <RichTextField
      label={label}
      value={value}
      onChange={onChange}
      minHeight={Math.max(120, rows * 28)}
    />
  )
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {options.map(option => (
          <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

function RadioCard({ title, description, active, onClick }: { title: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
        borderRadius: 16,
        padding: '1rem',
        textAlign: 'left',
        background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)', marginTop: '0.35rem' }}>{description}</div>
    </button>
  )
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--admin-accent)',
  marginBottom: '0.35rem',
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: 'var(--admin-fg-muted)',
  marginTop: '0.35rem',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--admin-border)',
  padding: '0.6rem 0.75rem',
  background: 'rgba(15,23,42,0.25)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
}

const primaryButtonStyle: CSSProperties = {
  background: 'var(--admin-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.65rem 1.4rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const ghostButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--admin-border)',
  borderRadius: 10,
  padding: '0.45rem 0.85rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--admin-fg)',
}

const smallButtonStyle: CSSProperties = {
  position: 'absolute',
  bottom: 12,
  right: 12,
  background: 'var(--admin-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  padding: '0.35rem 0.8rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.08em',
  cursor: 'pointer',
}

const dashedButtonStyle: CSSProperties = {
  border: '1px dashed var(--admin-border)',
  borderRadius: 12,
  padding: '0.6rem 1rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--admin-fg)',
  cursor: 'pointer',
}

const searchStyle: CSSProperties = {
  minWidth: 220,
  borderRadius: 999,
  border: '1px solid var(--admin-border)',
  padding: '0.45rem 0.9rem',
  background: 'rgba(15,23,42,0.2)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
}

const iconButtonStyle: CSSProperties = {
  border: '1px solid var(--admin-border)',
  background: 'transparent',
  borderRadius: 10,
  padding: '0.35rem 0.5rem',
  fontFamily: 'var(--font-mono)',
  cursor: 'pointer',
}

const linkButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--admin-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
}

const uploadBoxStyle: CSSProperties = {
  border: '1px dashed var(--admin-border)',
  borderRadius: 14,
  height: 140,
  position: 'relative',
  overflow: 'hidden',
}

const listRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-start',
  padding: '0.75rem',
  border: '1px solid var(--admin-border)',
  borderRadius: 12,
  background: 'rgba(15,23,42,0.2)',
}

const toastStyle = (tone: ToastTone): CSSProperties => ({
  position: 'fixed',
  right: 24,
  bottom: 24,
  padding: '0.75rem 1.25rem',
  borderRadius: 12,
  background: tone === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(248,113,113,0.95)',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
  zIndex: 100,
})
