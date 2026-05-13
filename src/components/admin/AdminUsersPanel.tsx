"use client"

import { useState } from 'react'
import { GlassCard } from '@/components/admin/GlassCard'

export type AdminUserRow = {
  id: string
  email: string
  display_name: string | null
  role: 'super_admin' | 'admin' | 'moderator'
  last_login_at: string | null
  created_at: string
}

export function AdminUsersPanel({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers)
  const [form, setForm] = useState({ email: '', password: '', role: 'admin', display_name: '' })
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    setStatus(null)
    if (!form.email || !form.password) {
      setStatus('Email and password are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
          display_name: form.display_name || null,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error ?? 'Failed to create admin.')
      }
      setUsers(prev => [payload.data, ...prev])
      setForm({ email: '', password: '', role: 'admin', display_name: '' })
      setStatus('Admin user created.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create admin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <GlassCard padding="1.5rem" accent>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)' }}>
          Add Admin User
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
          <input
            value={form.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="Email"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          />
          <input
            value={form.password}
            onChange={e => onChange('password', e.target.value)}
            placeholder="Temporary password"
            type="password"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          />
          <input
            value={form.display_name}
            onChange={e => onChange('display_name', e.target.value)}
            placeholder="Display name (optional)"
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          />
          <select
            value={form.role}
            onChange={e => onChange('role', e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          >
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
          <button
            onClick={submit}
            disabled={isSubmitting}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-accent)',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Admin User'}
          </button>
          {status && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)' }}>
              {status}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard padding="1.5rem">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)' }}>
          Admin Directory
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.length ? users.map(user => (
            <div key={user.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)' }}>
                  {user.display_name || user.email}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
                  {user.email}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {user.role.replace('_', ' ')}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--admin-fg-muted)', marginTop: '0.15rem' }}>
                  Created {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg-muted)' }}>
              No admin users found.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
