"use client"

import { useState } from 'react'
import { GlassCard } from '@/components/admin/GlassCard'

export type AdminUserRow = {
  id: string
  email: string
  display_name: string | null
  role: 'super_admin' | 'admin' | 'moderator' | 'registration_editor' | 'volunteer'
  can_manage_volunteers: boolean
  last_login_at: string | null
  created_at: string
}

export function AdminUsersPanel({ initialUsers, currentUserId }: { initialUsers: AdminUserRow[]; currentUserId?: string }) {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers)
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'admin',
    display_name: '',
    can_manage_volunteers: false,
  })
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this administrator? This will permanently revoke all their access.')) {
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/admin-users?id=${id}`, {
        method: 'DELETE'
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error ?? 'Failed to delete admin.')
      }
      setUsers(prev => prev.filter(u => u.id !== id))
      setStatus('Admin user deleted successfully.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Deletion failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const startEdit = (user: AdminUserRow) => {
    setEditingUser(user)
    setForm({
      email: user.email,
      password: '', // Password is not editable this way
      role: user.role,
      display_name: user.display_name || '',
      can_manage_volunteers: user.can_manage_volunteers,
    })
    setStatus(null)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setForm({ email: '', password: '', role: 'admin', display_name: '', can_manage_volunteers: false })
    setStatus(null)
  }

  const submit = async () => {
    setStatus(null)
    if (!editingUser && (!form.email || !form.password)) {
      setStatus('Email and password are required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingUser) {
        // Edit flow (PATCH)
        const res = await fetch('/api/admin/admin-users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            role: form.role,
            display_name: form.display_name || null,
            can_manage_volunteers: form.role === 'super_admin' || form.role === 'admin' ? true : form.can_manage_volunteers,
          }),
        })
        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload?.error ?? 'Failed to update admin.')
        }
        setUsers(prev => prev.map(u => (u.id === editingUser.id ? payload.data : u)))
        cancelEdit()
        setStatus('Admin user updated successfully.')
      } else {
        // Create flow (POST)
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
        setForm({ email: '', password: '', role: 'admin', display_name: '', can_manage_volunteers: false })
        setStatus('Admin user created successfully.')
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Operation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      <GlassCard padding="1.5rem" accent>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-accent)' }}>
          {editingUser ? 'Edit Admin User' : 'Add Admin User'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
          <input
            value={form.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="Email"
            disabled={!!editingUser}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: editingUser ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
              color: editingUser ? 'var(--admin-fg-muted)' : 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
            }}
          />
          {!editingUser && (
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
          )}
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
            <option style={{ background: 'var(--admin-bg)', color: 'var(--admin-fg)' }} value="super_admin">Super Admin</option>
            <option style={{ background: 'var(--admin-bg)', color: 'var(--admin-fg)' }} value="admin">Admin</option>
            <option style={{ background: 'var(--admin-bg)', color: 'var(--admin-fg)' }} value="moderator">Moderator</option>
            <option style={{ background: 'var(--admin-bg)', color: 'var(--admin-fg)' }} value="registration_editor">Registration Editor</option>
            <option style={{ background: 'var(--admin-bg)', color: 'var(--admin-fg)' }} value="volunteer">Volunteer</option>
          </select>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              margin: '0.2rem 0',
              opacity: (form.role === 'super_admin' || form.role === 'admin') ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={(form.role === 'super_admin' || form.role === 'admin') ? true : form.can_manage_volunteers}
              disabled={form.role === 'super_admin' || form.role === 'admin'}
              onChange={e => onChange('can_manage_volunteers', e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Can Manage Volunteers
          </label>

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
            {isSubmitting ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Save Changes' : 'Create Admin User')}
          </button>

          {editingUser && (
            <button
              onClick={cancelEdit}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 10,
                border: '1px solid var(--admin-border)',
                background: 'transparent',
                color: 'var(--admin-fg)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel Edit
            </button>
          )}

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
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--admin-fg)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{user.display_name || user.email}</span>
                  {user.can_manage_volunteers && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.55rem',
                      background: 'rgba(0,255,100,0.1)',
                      color: 'rgb(0,220,100)',
                      padding: '0.1rem 0.3rem',
                      borderRadius: 4,
                      border: '1px solid rgba(0,255,100,0.2)'
                    }}>
                      Volunteers OK
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>
                  {user.email}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {user.role.replace('_', ' ')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--admin-fg-muted)', marginTop: '0.15rem' }}>
                    Created {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => startEdit(user)}
                    style={{
                      padding: '0.3rem 0.5rem',
                      borderRadius: 6,
                      border: '1px solid var(--admin-border)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--admin-fg)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => deleteAdmin(user.id)}
                      disabled={isSubmitting}
                      style={{
                        padding: '0.3rem 0.5rem',
                        borderRadius: 6,
                        border: '1px solid rgba(250,50,50,0.2)',
                        background: 'rgba(250,50,50,0.08)',
                        color: 'rgb(250,80,80)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                    >
                      Delete
                    </button>
                  )}
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
