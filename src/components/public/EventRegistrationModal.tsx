'use client'

import { useMemo, useState } from 'react'
import type { Event, InternalFormField } from '@/types/database'

interface EventRegistrationModalProps {
  event: Event
  fields: InternalFormField[]
  onClose: () => void
}

type ValueMap = Record<string, any>

type FileMap = Record<string, File[]>

export function EventRegistrationModal({ event, fields, onClose }: EventRegistrationModalProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [values, setValues] = useState<ValueMap>({})
  const [files, setFiles] = useState<FileMap>({})

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [fields]
  )

  const handleSubmit = async (eventTarget: React.FormEvent) => {
    eventTarget.preventDefault()
    setStatus('saving')
    setError('')

    for (const field of sortedFields) {
      if (!field.is_required) continue
      if (field.field_type === 'file') {
        if (!files[field.id]?.length) {
          setStatus('error')
          setError(`File required for ${field.label}.`)
          return
        }
      } else if (field.field_type === 'checkbox') {
        if (!Array.isArray(values[field.id]) || values[field.id].length === 0) {
          setStatus('error')
          setError(`${field.label} is required.`)
          return
        }
      } else if (!values[field.id] || String(values[field.id]).trim() === '') {
        setStatus('error')
        setError(`${field.label} is required.`)
        return
      }
    }

    const payloadValues: Record<string, any> = {}
    sortedFields.forEach(field => {
      if (field.field_type === 'file') return
      payloadValues[field.id] = values[field.id] ?? ''
    })

    const formData = new FormData()
    formData.append('event_id', event.id)
    formData.append('values', JSON.stringify(payloadValues))

    sortedFields.forEach(field => {
      if (field.field_type !== 'file') return
      const list = files[field.id] ?? []
      list.forEach(file => formData.append(`file_${field.id}`, file))
    })

    const response = await fetch('/api/events/register', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setStatus('error')
      setError(data?.error ?? 'Registration failed.')
      return
    }

    setStatus('success')
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>{event.title}</div>
          <button type="button" onClick={onClose} style={ghostButtonStyle}>X</button>
        </div>

        {status === 'success' ? (
          <div style={{ marginTop: '1.5rem', fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
            Registration submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
            {sortedFields.map(field => (
              <label key={field.id} style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={labelStyle}>{field.label}{field.is_required ? ' *' : ''}</span>
                {field.field_type === 'dropdown' ? (
                  <select
                    value={values[field.id] ?? ''}
                    onChange={event => setValues(prev => ({ ...prev, [field.id]: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select...</option>
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.field_type === 'file' ? (
                  <input
                    type="file"
                    onChange={event => setFiles(prev => ({ ...prev, [field.id]: event.target.files ? Array.from(event.target.files) : [] }))}
                    style={inputStyle}
                  />
                ) : field.field_type === 'mcq' ? (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {field.options.map(option => (
                      <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          checked={values[field.id] === option}
                          onChange={() => setValues(prev => ({ ...prev, [field.id]: option }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : field.field_type === 'checkbox' ? (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {field.options.map(option => {
                      const list = Array.isArray(values[field.id]) ? values[field.id] : []
                      return (
                        <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={list.includes(option)}
                            onChange={event => {
                              const next = event.target.checked
                                ? [...list, option]
                                : list.filter((item: string) => item !== option)
                              setValues(prev => ({ ...prev, [field.id]: next }))
                            }}
                          />
                          {option}
                        </label>
                      )
                    })}
                  </div>
                ) : field.field_type === 'paragraph' ? (
                  <textarea
                    rows={4}
                    value={values[field.id] ?? ''}
                    onChange={event => setValues(prev => ({ ...prev, [field.id]: event.target.value }))}
                    style={{ ...inputStyle, minHeight: 100 }}
                  />
                ) : (
                  <input
                    type={field.field_type === 'email' ? 'email' : field.field_type === 'number' ? 'number' : field.field_type === 'phone' ? 'tel' : 'text'}
                    value={values[field.id] ?? ''}
                    onChange={event => setValues(prev => ({ ...prev, [field.id]: event.target.value }))}
                    style={inputStyle}
                  />
                )}
              </label>
            ))}

            {status === 'error' && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>
            )}

            <button type="submit" disabled={status === 'saving'} style={primaryButtonStyle}>
              {status === 'saving' ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.7)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 90,
  padding: '1.5rem',
}

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: 'var(--surface)',
  borderRadius: 16,
  padding: '1.5rem',
  border: '1px solid var(--border)',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--foreground-muted)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid var(--border)',
  padding: '0.6rem 0.75rem',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.75rem 1.4rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const ghostButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '0.35rem 0.75rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}
