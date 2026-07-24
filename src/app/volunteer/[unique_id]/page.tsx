import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPageVisible } from '@/lib/visibility'
import { createServiceClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ unique_id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { unique_id } = await params
  const supabase = createServiceClient()
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('name')
    .eq('unique_id', unique_id.trim())
    .maybeSingle()

  return {
    title: volunteer ? `${volunteer.name} | Volunteer Profile` : 'Volunteer Profile',
    description: 'Verified Volunteer of National Mathematics Carnival 2026.',
  }
}

export default async function VolunteerShowPage({ params }: PageProps) {
  // Check if public volunteer lookup is visible
  const visible = await isPageVisible('volunteer_show')
  if (!visible) {
    notFound()
  }

  const { unique_id } = await params
  const supabase = createServiceClient()
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('name, department, segment, year')
    .eq('unique_id', unique_id.trim())
    .maybeSingle()

  if (!volunteer) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #cbd5e1)',
          borderRadius: 24,
          padding: '3rem 2rem',
          maxWidth: 450,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.06))',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground, #0f172a)', margin: '0 0 0.5rem' }}>
            Volunteer Not Found
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--foreground-muted, #64748b)', marginBottom: '1.5rem' }}>
            The Unique ID "{unique_id}" does not match any registered volunteer in our database.
          </p>
          <a
            href="/volunteer"
            style={{
              display: 'inline-block',
              background: 'var(--color-primary, #6366f1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 10,
              padding: '0.65rem 1.25rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Go Back
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Premium Profile Card */}
      <div style={{
        background: 'var(--surface, #ffffff)',
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: 28,
        padding: '3.5rem 2.5rem',
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.12), 0 8px 16px -8px rgba(99, 102, 241, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative mathematical background pattern */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '6rem',
          color: 'rgba(99, 102, 241, 0.05)',
          userSelect: 'none',
          pointerEvents: 'none',
          fontWeight: 900,
        }}>
          ∑
        </div>

        {/* Profile Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary, #6366f1) 0%, var(--color-secondary, #7c3aed) 100%)',
            color: '#ffffff',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '1rem',
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
          }}>
            {volunteer.name.charAt(0).toUpperCase()}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 999,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#059669',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Verified Volunteer
          </div>
        </div>

        {/* Profile details grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Field: Name */}
          <div style={detailFieldStyle}>
            <div style={detailLabelStyle}>Name</div>
            <div style={{ ...detailValueStyle, fontSize: '1.25rem', fontWeight: 800 }}>
              {volunteer.name}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border, #cbd5e1)', opacity: 0.5, margin: '0.5rem 0' }} />

          {/* Grid row for Department & Academic Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={detailFieldStyle}>
              <div style={detailLabelStyle}>Department</div>
              <div style={detailValueStyle}>
                {volunteer.department || 'General'}
              </div>
            </div>
            <div style={detailFieldStyle}>
              <div style={detailLabelStyle}>Academic Year</div>
              <div style={detailValueStyle}>
                {volunteer.year || 'N/A'}
              </div>
            </div>
          </div>

          {/* Field: Segment */}
          <div style={detailFieldStyle}>
            <div style={detailLabelStyle}>Event Segment</div>
            <div style={{ ...detailValueStyle, color: 'var(--color-primary, #6366f1)', fontWeight: 700 }}>
              {volunteer.segment || 'Organizing Team'}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a
            href="/volunteer"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'var(--foreground-muted, #64748b)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary, #6366f1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--foreground-muted, #64748b)'}
          >
            ← Back to Verification Portal
          </a>
        </div>
      </div>
    </main>
  )
}

const detailFieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.2rem',
}

const detailLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--foreground-muted, #94a3b8)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
}

const detailValueStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--foreground, #1e293b)',
}
