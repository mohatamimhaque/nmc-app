'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GlassCard } from '@/components/admin/GlassCard'
import { MathDivider } from '@/components/admin/MathDivider'

type DocSection = {
  title: string
  body: string
  bullets?: string[]
  roleNotes?: string[]
}

type DocTab = {
  key: string
  label: string
  sections: DocSection[]
}

const TABS: DocTab[] = [
  {
    key: 'start',
    label: 'Start Here',
    sections: [
      {
        title: 'Daily workflow',
        body:
          'Use the left sidebar to move between content, people, and management tools. Save changes in each section to publish updates on the public site.',
        bullets: [
          'Start on Dashboard to review counts and quick actions.',
          'Update content in small batches and save often.',
          'Use Visibility to hide sections without deleting data.',
        ],
        roleNotes: [
          'Moderator: Focus on notices, club partners, and quick fixes.',
          'Admin: Maintain core content, people, and settings.',
          'Super admin: Review visibility and access after updates.',
        ],
      },
      {
        title: 'Roles and access',
        body:
          'Admins manage content and settings. Moderators handle limited content areas. Super admins control visibility and admin accounts.',
        bullets: [
          'Super admin: full access, including Admins and Visibility.',
          'Admin: content and settings (no Admins/Visibility).',
          'Moderator: limited content areas like Notices and Club Partners.',
        ],
        roleNotes: [
          'Moderator: Ask for promotion if you need access to settings.',
          'Admin: Request visibility changes from a super admin.',
          'Super admin: Review roles quarterly or after team changes.',
        ],
      },
      {
        title: 'Launch checklist',
        body:
          'Before launch, verify branding, navigation, and key content sections.',
        bullets: [
          'Theme: set colors, fonts, and default theme.',
          'Home: hero title, CTA, highlights, sponsors strip.',
          'Events: at least one event with date and venue.',
          'About: team and advisers visible.',
          'Contact/About: contact info and links.',
        ],
      },
    ],
  },
  {
    key: 'home-content',
    label: 'Home + Content',
    sections: [
      {
        title: 'Home page',
        body:
          'Update hero content, featured sections, and ordering from Home.',
        bullets: [
          'Use section toggles to hide blocks temporarily.',
          'Keep hero text short for best layout.',
          'Check CTA label and URL before publishing.',
        ],
        roleNotes: [
          'Admin/Super admin: Maintain home layout and hero.',
        ],
      },
      {
        title: 'Events and schedule',
        body:
          'Create events and set dates, venues, and registration details. Use Schedule for the public agenda.',
        bullets: [
          'Add clear titles and short summaries.',
          'Check visibility flags before publishing.',
          'Keep registration deadlines consistent.',
        ],
        roleNotes: [
          'Admin/Super admin: Own events and schedule updates.',
        ],
      },
      {
        title: 'Notices and gallery',
        body:
          'Post announcements in Notices and manage photos in Gallery.',
        bullets: [
          'Keep notices concise and time bound.',
          'Use consistent image sizes for the gallery.',
          'Remove outdated notices after deadlines.',
        ],
        roleNotes: [
          'Moderator/Admin: Publish notices with verified dates.',
          'Admin/Super admin: Curate gallery quality.',
        ],
      },
      {
        title: 'Sponsors and partners',
        body:
          'Manage sponsor tiers, logos, and club partners.',
        bullets: [
          'Use high resolution logos with transparent backgrounds.',
          'Keep tier names consistent across years.',
        ],
        roleNotes: [
          'Moderator: Update club partners when approved.',
          'Admin/Super admin: Manage sponsor tiers and logos.',
        ],
      },
    ],
  },
  {
    key: 'people',
    label: 'People',
    sections: [
      {
        title: 'Committee and advisers',
        body:
          'Add committee members and advisers with roles, photos, and ordering.',
        bullets: [
          'Use Sort Order to control public display.',
          'Add role titles for clarity.',
        ],
        roleNotes: [
          'Admin/Super admin: Maintain committee and adviser data.',
        ],
      },
      {
        title: 'Campus ambassadors',
        body:
          'Maintain ambassador list with institution and contact info.',
        bullets: [
          'Mark inactive entries as hidden rather than deleting.',
        ],
        roleNotes: [
          'Admin/Super admin: Keep ambassador list current.',
        ],
      },
    ],
  },
  {
    key: 'moderation',
    label: 'Moderation',
    sections: [
      {
        title: 'Visibility and publishing',
        body:
          'Use Visibility to toggle pages and sections without removing data.',
        bullets: [
          'Hide before editing to avoid half-finished content.',
          'Re-enable when content is verified.',
        ],
        roleNotes: [
          'Super admin: Primary owner of visibility changes.',
          'Admin/Moderator: Request visibility updates if needed.',
        ],
      },
      {
        title: 'Content quality checks',
        body:
          'Review spelling, dates, and contact links before publishing.',
        bullets: [
          'Verify event dates and deadlines.',
          'Confirm sponsor logo permissions.',
        ],
        roleNotes: [
          'Moderator/Admin: Run checks before publishing.',
        ],
      },
      {
        title: 'Safety and compliance',
        body:
          'Ensure uploaded media and links are approved for public use.',
        bullets: [
          'Use official logos and authorized photos only.',
          'Remove any personal contact info not meant for public view.',
        ],
        roleNotes: [
          'Moderator/Admin: Escalate questionable content.',
          'Super admin: Final approval on removals.',
        ],
      },
    ],
  },
  {
    key: 'branding',
    label: 'Branding',
    sections: [
      {
        title: 'Theme and fonts',
        body:
          'Set colors and fonts in Theme. Use the competition type preset for quick styling.',
        bullets: [
          'Pick a readable body font.',
          'Keep contrast high for buttons and links.',
        ],
        roleNotes: [
          'Super admin: Own final theme decisions.',
          'Admin: Suggest updates with preview checks.',
        ],
      },
      {
        title: 'Navigation, footer, and contact',
        body:
          'Manage public navigation, footer text, and contact info in Manage sections.',
        bullets: [
          'Keep top nav short and ordered by priority.',
          'Update footer contact details before launch.',
          'Verify external links in footer and contact pages.',
        ],
        roleNotes: [
          'Admin/Super admin: Maintain navigation and footer.',
        ],
      },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    sections: [
      {
        title: 'Event registrations',
        body:
          'Review event registrations and follow up with participants as needed.',
        bullets: [
          'Check new submissions daily during peak periods.',
          'Use event filters to scope lists.',
        ],
        roleNotes: [
          'Admin/Super admin: Monitor registrations.',
          'Moderator: Escalate issues or duplicate entries.',
        ],
      },
      {
        title: 'Admins and access',
        body:
          'Super admins can add or remove admin accounts and set roles.',
        bullets: [
          'Grant the minimum role required.',
          'Remove access after the event ends.',
        ],
        roleNotes: [
          'Super admin: Only role allowed to edit admins.',
        ],
      },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    sections: [
      {
        title: 'Tracking',
        body:
          'Use the Analytics panel to view page activity and event engagement.',
        bullets: [
          'Look for spikes after announcements.',
          'Use metrics to adjust homepage sections.',
        ],
        roleNotes: [
          'Admin/Super admin: Share insights in weekly reviews.',
        ],
      },
    ],
  },
  {
    key: 'troubleshooting',
    label: 'Troubleshooting',
    sections: [
      {
        title: 'Common issues',
        body:
          'Most issues come from missing images, hidden sections, or invalid dates.',
        bullets: [
          'If a section is missing, check Visibility and page section toggles.',
          'If images do not appear, verify the URL and file permissions.',
          'If a link is broken, update it in Navigation or Contact/About.',
        ],
        roleNotes: [
          'Moderator/Admin: Fix content issues quickly.',
          'Super admin: Handle access or visibility problems.',
        ],
      },
      {
        title: 'Publishing checklist',
        body:
          'Run this checklist before major updates.',
        bullets: [
          'Review hero text and primary CTA.',
          'Verify dates, venues, and deadlines.',
          'Confirm sponsor and partner assets.',
        ],
        roleNotes: [
          'Moderator/Admin: Validate content before publish.',
          'Super admin: Final approval for major updates.',
        ],
      },
    ],
  },
]

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Home', href: '/admin/home' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Schedule', href: '/admin/schedule' },
  { label: 'Notices', href: '/admin/notices' },
  { label: 'Gallery', href: '/admin/gallery' },
  { label: 'Sponsors', href: '/admin/sponsors' },
  { label: 'Club Partners', href: '/admin/club-partners' },
  { label: 'Committee', href: '/admin/committee' },
  { label: 'Advisers', href: '/admin/advisers' },
  { label: 'Campus Ambassadors', href: '/admin/campus-ambassadors' },
  { label: 'Navigation', href: '/admin/navigation' },
  { label: 'Contact/About', href: '/admin/contact-about' },
  { label: 'Footer', href: '/admin/footer' },
  { label: 'Theme', href: '/admin/theme' },
  { label: 'Visibility', href: '/admin/visibility' },
  { label: 'Admins', href: '/admin/admins' },
]

const normalize = (value: string) => value.toLowerCase()

const matchesQuery = (value: string, query: string) =>
  normalize(value).includes(query)

export default function AdminDocsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filteredTabs = useMemo(() => {
    if (!normalizedQuery) return TABS
    return TABS.map(tab => {
      const tabMatches = matchesQuery(tab.label, normalizedQuery)
      if (tabMatches) return tab

      const sections = tab.sections.filter(section => {
        if (matchesQuery(section.title, normalizedQuery)) return true
        if (matchesQuery(section.body, normalizedQuery)) return true
        return section.bullets?.some(bullet => matchesQuery(bullet, normalizedQuery)) ?? false
      })
      if (!sections.length) return null
      return { ...tab, sections }
    }).filter(Boolean) as DocTab[]
  }, [normalizedQuery])

  const active = useMemo(
    () => filteredTabs.find(tab => tab.key === activeTab) ?? filteredTabs[0],
    [activeTab, filteredTabs]
  )

  useEffect(() => {
    if (!active && filteredTabs.length) {
      setActiveTab(filteredTabs[0].key)
      return
    }
    if (active && !filteredTabs.find(tab => tab.key === active.key)) {
      setActiveTab(filteredTabs[0]?.key ?? TABS[0].key)
    }
  }, [active, filteredTabs])

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          Admin Docs
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--admin-fg)',
            margin: 0,
          }}
        >
          Operations Guide
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'var(--admin-fg-muted)',
            marginTop: '0.35rem',
          }}
        >
          A quick reference for moderators and admins to manage the site.
        </p>
      </div>

      <GlassCard accent style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--admin-fg-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          Quick Links
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {QUICK_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: 'none',
                color: 'var(--admin-fg)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--admin-border)',
                borderRadius: 10,
                padding: '0.45rem 0.65rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </GlassCard>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search docs"
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            borderRadius: 999,
            border: '1px solid var(--admin-border)',
            padding: '0.45rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--admin-fg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        {filteredTabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              border: '1px solid var(--admin-border)',
              background: activeTab === tab.key
                ? 'var(--admin-accent)'
                : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? '#0b1020' : 'var(--admin-fg)',
              padding: '0.4rem 0.8rem',
              borderRadius: 999,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {!active ? (
          <GlassCard>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--admin-fg-muted)',
              }}
            >
              No matches. Try a different search term.
            </div>
          </GlassCard>
        ) : (
          active.sections.map(section => (
            <GlassCard key={section.title} accent>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--admin-fg)',
                  marginBottom: '0.4rem',
                }}
              >
                {section.title}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  color: 'var(--admin-fg-muted)',
                  margin: 0,
                }}
              >
                {section.body}
              </p>
              {section.bullets?.length ? (
                <ul
                  style={{
                    margin: '0.75rem 0 0',
                    paddingLeft: '1.2rem',
                    color: 'var(--admin-fg)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                  }}
                >
                  {section.bullets.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.roleNotes?.length ? (
                <div
                  style={{
                    marginTop: '0.75rem',
                    borderTop: '1px solid var(--admin-border)',
                    paddingTop: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--admin-fg-muted)',
                  }}
                >
                  Role notes
                  <ul
                    style={{
                      margin: '0.5rem 0 0',
                      paddingLeft: '1.2rem',
                      color: 'var(--admin-fg)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      letterSpacing: 'normal',
                      textTransform: 'none',
                    }}
                  >
                    {section.roleNotes.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </GlassCard>
          ))
        )}
      </div>

      <MathDivider formula="Admin ops" dim />
    </div>
  )
}
