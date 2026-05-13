'use client'

import { useState } from 'react'
import { RichHtml } from './RichHtml'
import { RichTextField } from '@/components/shared/RichTextField'

interface ContactFormProps {
  title: string
  subtitle: string
}

export function ContactForm({ title, subtitle }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('General')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError('')

    const plainMessage = message.replace(/<[^>]*>/g, '').trim()
    if (!plainMessage) {
      setStatus('error')
      setError('Message is required.')
      return
    }

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })

    const data = await response.json()
    if (!response.ok) {
      setStatus('error')
      setError(data?.error ?? 'Failed to submit. Please try again.')
      return
    }

    setStatus('success')
    setName('')
    setEmail('')
    setSubject('General')
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--foreground-muted)', marginTop: '0.35rem' }}>
          <RichHtml html={subtitle} />
        </div>
      </div>
      {status === 'error' && (
        <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>
      )}
      {status === 'success' && (
        <div style={{ color: '#10b981', fontSize: '0.85rem' }}>Thanks! We will get back to you soon.</div>
      )}
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={labelStyle}>Full name</span>
        <input value={name} onChange={event => setName(event.target.value)} required style={inputStyle} />
      </label>
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={labelStyle}>Email</span>
        <input type="email" value={email} onChange={event => setEmail(event.target.value)} required style={inputStyle} />
      </label>
      <label style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={labelStyle}>Subject</span>
        <select value={subject} onChange={event => setSubject(event.target.value)} style={inputStyle}>
          <option value="General">General</option>
          <option value="Registration">Registration</option>
          <option value="Sponsorship">Sponsorship</option>
          <option value="Media">Media</option>
        </select>
      </label>
      <RichTextField
        label="Message"
        value={message}
        onChange={value => setMessage(value)}
        minHeight={140}
        variant="public"
      />
      <button
        type="submit"
        disabled={status === 'saving'}
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '0.75rem 1.6rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: status === 'saving' ? 'not-allowed' : 'pointer',
          opacity: status === 'saving' ? 0.7 : 1,
          justifySelf: 'flex-start',
        }}
      >
        {status === 'saving' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
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
  outline: 'none',
}
