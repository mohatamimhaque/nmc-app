'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Event, InternalFormField, InternalFormSection } from '@/types/database'

interface EventRegistrationFormProps {
  event: Event
  fields: InternalFormField[]
  sections: InternalFormSection[]
}

type ValueMap = Record<string, any>

type FileMap = Record<string, File[]>

type LogicRule = { value: string; target_section_id: string }

export function EventRegistrationForm({ event, fields, sections }: EventRegistrationFormProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [values, setValues] = useState<ValueMap>({})
  const [files, setFiles] = useState<FileMap>({})
  const [otherValues, setOtherValues] = useState<Record<string, string>>({})
  const [otherSelections, setOtherSelections] = useState<Record<string, boolean>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [publicId, setPublicId] = useState('')

  const sortedSections = useMemo(() => {
    const visible = sections.filter(section => section.is_visible !== false)
    if (!visible.length) {
      return [{ id: 'default', event_id: event.id, title: 'Registration', description: null, is_visible: true, sort_order: 1 }]
    }
    return [...visible].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [sections, event.id])

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [fields]
  )

  const fieldsBySection = useMemo(() => {
    const map = new Map<string, InternalFormField[]>()
    sortedFields.forEach(field => {
      if (field.is_visible === false) return
      const validSection = sortedSections.find(section => section.id === field.section_id)
      const sectionId = validSection?.id ?? sortedSections[0]?.id ?? 'default'
      if (!map.has(sectionId)) map.set(sectionId, [])
      map.get(sectionId)!.push(field)
    })
    return map
  }, [sortedFields, sortedSections])

  const currentSection = sortedSections[currentIndex]
  const currentFields = currentSection ? (fieldsBySection.get(currentSection.id) ?? []) : []

  const handleValueChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleOtherChange = (fieldId: string, value: string) => {
    setOtherValues(prev => ({ ...prev, [fieldId]: value }))
    if (otherSelections[fieldId]) {
      handleValueChange(fieldId, value)
    }
  }

  const handleFileChange = (fieldId: string, fileList: FileList | null) => {
    const list = fileList ? Array.from(fileList) : []
    setFiles(prev => ({ ...prev, [fieldId]: list }))
  }

  const getConfig = (field: InternalFormField) => (
    typeof field.config === 'object' && field.config ? field.config as Record<string, any> : {}
  )

  const getValidation = (field: InternalFormField) => (
    typeof field.validation === 'object' && field.validation ? field.validation as Record<string, any> : {}
  )

  const getLogic = (field: InternalFormField) => (
    Array.isArray(field.logic) ? field.logic as LogicRule[] : []
  )

  const getOptions = (field: InternalFormField) => {
    const config = getConfig(field)
    const configOptions = Array.isArray(config.options) ? config.options : []
    if (configOptions.length) return configOptions
    return Array.isArray(field.options) ? field.options : []
  }

  const getGridRows = (field: InternalFormField) => {
    const config = getConfig(field)
    return Array.isArray(config.gridRows) ? config.gridRows : []
  }

  const getGridColumns = (field: InternalFormField) => {
    const config = getConfig(field)
    return Array.isArray(config.gridColumns) ? config.gridColumns : []
  }

  const validateField = (field: InternalFormField) => {
    const value = values[field.id]
    const validation = getValidation(field)
    const config = getConfig(field)

    if (field.is_required) {
      if (field.field_type === 'file') {
        if (!files[field.id]?.length) return `${field.label} is required.`
      } else if (field.field_type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) return `${field.label} is required.`
      } else if (field.field_type === 'grid_radio') {
        const rows = getGridRows(field)
        const map = value ?? {}
        const missing = rows.find(row => !map[row])
        if (missing) return `${field.label} is required for all rows.`
      } else if (field.field_type === 'grid_checkbox') {
        const rows = getGridRows(field)
        const map = value ?? {}
        const missing = rows.find(row => !Array.isArray(map[row]) || map[row].length === 0)
        if (missing) return `${field.label} is required for all rows.`
      } else if (value === undefined || value === null || String(value).trim() === '') {
        return `${field.label} is required.`
      }
    }

    if (typeof value === 'string') {
      if (validation.minLength && value.length < Number(validation.minLength)) {
        return `${field.label} must be at least ${validation.minLength} characters.`
      }
      if (validation.maxLength && value.length > Number(validation.maxLength)) {
        return `${field.label} must be at most ${validation.maxLength} characters.`
      }
      if (validation.pattern) {
        try {
          const regex = new RegExp(String(validation.pattern))
          if (!regex.test(value)) return `${field.label} format is invalid.`
        } catch {
          // ignore invalid regex
        }
      }
    }

    if (field.field_type === 'number' && value !== undefined && value !== '') {
      const num = Number(value)
      if (Number.isNaN(num)) return `${field.label} must be a number.`
      if (validation.min !== undefined && num < Number(validation.min)) {
        return `${field.label} must be at least ${validation.min}.`
      }
      if (validation.max !== undefined && num > Number(validation.max)) {
        return `${field.label} must be at most ${validation.max}.`
      }
    }

    if (field.field_type === 'file') {
      const list = files[field.id] ?? []
      if (config.maxFiles && list.length > Number(config.maxFiles)) {
        return `${field.label} allows at most ${config.maxFiles} files.`
      }
      if (config.maxFileSizeMb) {
        const maxBytes = Number(config.maxFileSizeMb) * 1024 * 1024
        const tooLarge = list.find(file => file.size > maxBytes)
        if (tooLarge) return `${field.label} files must be under ${config.maxFileSizeMb}MB.`
      }
      if (Array.isArray(config.fileTypes) && config.fileTypes.length) {
        const allowed = config.fileTypes.map((type: string) => type.toLowerCase())
        const invalid = list.find(file => !allowed.some(type => file.name.toLowerCase().endsWith(type)))
        if (invalid) return `${field.label} file type is not allowed.`
      }
    }

    return ''
  }

  const validateSection = (sectionId: string) => {
    const sectionFields = fieldsBySection.get(sectionId) ?? []
    for (const field of sectionFields) {
      const message = validateField(field)
      if (message) return message
    }
    return ''
  }

  const validateAll = () => {
    for (const section of sortedSections) {
      const message = validateSection(section.id)
      if (message) return message
    }
    return ''
  }

  const findJumpTarget = () => {
    for (const field of currentFields) {
      if (!(field.field_type === 'mcq' || field.field_type === 'dropdown')) continue
      const logic = getLogic(field)
      if (!logic.length) continue
      const value = values[field.id]
      const match = logic.find(rule => rule.value === value)
      if (match) return match.target_section_id
    }
    return ''
  }

  const handleNext = () => {
    const message = validateSection(currentSection.id)
    if (message) {
      setStatus('error')
      setError(message)
      return
    }
    setStatus('idle')
    setError('')

    const targetId = findJumpTarget()
    const targetIndex = targetId ? sortedSections.findIndex(section => section.id === targetId) : -1
    const nextIndex = targetIndex >= 0 ? targetIndex : Math.min(currentIndex + 1, sortedSections.length - 1)
    if (nextIndex === currentIndex) return
    setHistory(prev => [...prev, currentIndex])
    setCurrentIndex(nextIndex)
  }

  const handlePrev = () => {
    if (!history.length) return
    const copy = [...history]
    const prevIndex = copy.pop() ?? 0
    setHistory(copy)
    setCurrentIndex(prevIndex)
  }

  const handleSubmit = async (eventTarget: React.FormEvent) => {
    eventTarget.preventDefault()
    setStatus('saving')
    setError('')

    const message = validateAll()
    if (message) {
      setStatus('error')
      setError(message)
      return
    }

    const payloadValues: Record<string, any> = {}
    sortedFields.forEach(field => {
      if (field.is_visible === false) return
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

    setPublicId(data?.public_id ?? '')
    setStatus('success')
  }

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>Registration Form</h2>
      <p style={subtitleStyle}>Complete the form below to register.</p>

      {status === 'success' ? (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
            Registration received. Use your tracking ID to check status.
          </div>
          {publicId && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Tracking ID: {publicId}
            </div>
          )}
          <Link href="/registration/status" style={secondaryLinkStyle}>
            Check Status
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          {sortedSections.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sortedSections.map((section, index) => (
                <div
                  key={section.id}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    background: index === currentIndex ? 'var(--color-primary)' : 'transparent',
                    color: index === currentIndex ? '#fff' : 'var(--foreground-muted)',
                  }}
                >
                  {section.title}
                </div>
              ))}
            </div>
          )}

          {currentSection && (
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
                {currentSection.title}
              </div>
              {currentSection.description && (
                <div style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground-muted)', marginTop: '0.3rem' }}>
                  {currentSection.description}
                </div>
              )}
            </div>
          )}

          {currentFields.map(field => (
            <label key={field.id} style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={labelStyle}>
                {field.label}{field.is_required ? ' *' : ''}
              </span>
              {field.helper_text && (
                <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{field.helper_text}</span>
              )}
              {field.field_type === 'short' && (
                <input
                  type="text"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'paragraph' && (
                <textarea
                  rows={4}
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={{ ...inputStyle, minHeight: 100 }}
                />
              )}
              {field.field_type === 'email' && (
                <input
                  type="email"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'phone' && (
                <input
                  type="tel"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'number' && (
                <input
                  type="number"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'date' && (
                <input
                  type="date"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'time' && (
                <input
                  type="time"
                  value={values[field.id] ?? ''}
                  onChange={event => handleValueChange(field.id, event.target.value)}
                  style={inputStyle}
                />
              )}
              {field.field_type === 'mcq' && (
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  {getOptions(field).map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={values[field.id] === option}
                        onChange={() => handleValueChange(field.id, option)}
                      />
                      {option}
                    </label>
                  ))}
                  {getConfig(field).allowOther && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input
                        type="radio"
                        checked={otherSelections[field.id] === true}
                        onChange={() => {
                          setOtherSelections(prev => ({ ...prev, [field.id]: true }))
                          handleValueChange(field.id, otherValues[field.id] ?? '')
                        }}
                      />
                      Other
                      <input
                        type="text"
                        value={otherValues[field.id] ?? ''}
                        onChange={event => handleOtherChange(field.id, event.target.value)}
                        style={{ ...inputStyle, maxWidth: 220 }}
                      />
                    </label>
                  )}
                </div>
              )}
              {field.field_type === 'checkbox' && (
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  {getOptions(field).map(option => {
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
                            handleValueChange(field.id, next)
                          }}
                        />
                        {option}
                      </label>
                    )
                  })}
                  {getConfig(field).allowOther && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={otherSelections[field.id] === true}
                        onChange={event => {
                          const next = event.target.checked
                          setOtherSelections(prev => ({ ...prev, [field.id]: next }))
                          const list = Array.isArray(values[field.id]) ? values[field.id] : []
                          if (next) {
                            handleValueChange(field.id, [...list, otherValues[field.id] ?? ''])
                          } else {
                            handleValueChange(field.id, list.filter((item: string) => item !== otherValues[field.id]))
                          }
                        }}
                      />
                      Other
                      <input
                        type="text"
                        value={otherValues[field.id] ?? ''}
                        onChange={event => {
                          const text = event.target.value
                          setOtherValues(prev => ({ ...prev, [field.id]: text }))
                          if (otherSelections[field.id]) {
                            const list = Array.isArray(values[field.id]) ? values[field.id] : []
                            const next = list.filter((item: string) => item !== otherValues[field.id])
                            handleValueChange(field.id, [...next, text])
                          }
                        }}
                        style={{ ...inputStyle, maxWidth: 220 }}
                      />
                    </label>
                  )}
                </div>
              )}
              {field.field_type === 'dropdown' && (
                <select
                  value={otherSelections[field.id] ? '__other__' : (values[field.id] ?? '')}
                  onChange={event => {
                    if (event.target.value === '__other__') {
                      setOtherSelections(prev => ({ ...prev, [field.id]: true }))
                      handleValueChange(field.id, otherValues[field.id] ?? '')
                      return
                    }
                    setOtherSelections(prev => ({ ...prev, [field.id]: false }))
                    handleValueChange(field.id, event.target.value)
                  }}
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  {getOptions(field).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  {getConfig(field).allowOther && (
                    <option value="__other__">Other</option>
                  )}
                </select>
              )}
              {field.field_type === 'dropdown' && getConfig(field).allowOther && otherSelections[field.id] && (
                <input
                  type="text"
                  value={otherValues[field.id] ?? ''}
                  onChange={event => handleOtherChange(field.id, event.target.value)}
                  style={inputStyle}
                  placeholder="Enter other value"
                />
              )}
              {(field.field_type === 'grid_radio' || field.field_type === 'grid_checkbox') && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.4rem' }} />
                        {getGridColumns(field).map(col => (
                          <th key={col} style={{ padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getGridRows(field).map(row => (
                        <tr key={row}>
                          <td style={{ padding: '0.4rem', fontSize: '0.8rem' }}>{row}</td>
                          {getGridColumns(field).map(col => {
                            const map = values[field.id] ?? {}
                            const rowValue = map[row] ?? (field.field_type === 'grid_checkbox' ? [] : '')
                            const checked = field.field_type === 'grid_checkbox'
                              ? Array.isArray(rowValue) && rowValue.includes(col)
                              : rowValue === col
                            return (
                              <td key={`${row}-${col}`} style={{ padding: '0.4rem', textAlign: 'center' }}>
                                <input
                                  type={field.field_type === 'grid_checkbox' ? 'checkbox' : 'radio'}
                                  checked={checked}
                                  onChange={event => {
                                    if (field.field_type === 'grid_checkbox') {
                                      const next = event.target.checked
                                        ? [...(rowValue as string[]), col]
                                        : (rowValue as string[]).filter(item => item !== col)
                                      handleValueChange(field.id, { ...map, [row]: next })
                                    } else {
                                      handleValueChange(field.id, { ...map, [row]: col })
                                    }
                                  }}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {field.field_type === 'file' && (
                <input
                  type="file"
                  multiple={Boolean(getConfig(field).maxFiles && Number(getConfig(field).maxFiles) > 1)}
                  onChange={event => handleFileChange(field.id, event.target.files)}
                  style={inputStyle}
                />
              )}
            </label>
          ))}

          {status === 'error' && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
            <button type="button" onClick={handlePrev} disabled={!history.length} style={ghostButtonStyle}>
              Previous
            </button>
            {currentIndex < sortedSections.length - 1 ? (
              <button type="button" onClick={handleNext} style={primaryButtonStyle}>
                Next
              </button>
            ) : (
              <button type="submit" disabled={status === 'saving'} style={primaryButtonStyle}>
                {status === 'saving' ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '2rem',
  textAlign: 'left',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '0.25rem',
}

const subtitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--foreground-muted)',
  marginBottom: '1rem',
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
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.65rem 1.2rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  cursor: 'pointer',
}

const secondaryLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  color: 'var(--color-primary)',
  textDecoration: 'none',
  border: '1.5px solid var(--color-primary)',
  padding: '0.6rem 1.5rem',
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
