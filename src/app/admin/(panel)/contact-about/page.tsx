import { createClient } from '@/lib/supabase/server'
import { AboutSettingsForm } from '@/components/admin/AboutSettingsForm'
import { ContactSettingsForm } from '@/components/admin/ContactSettingsForm'
import {
  DEFAULT_ABOUT_HIGHLIGHTS,
  DEFAULT_ABOUT_MILESTONES,
  DEFAULT_ABOUT_PAGE,
  DEFAULT_ABOUT_SECTIONS,
} from '@/lib/aboutPage'
import {
  DEFAULT_CONTACT_PAGE,
  DEFAULT_CONTACT_SECTIONS,
} from '@/lib/contactPage'
import type { AboutHighlight, AboutMilestone, AboutPage, ContactPage, ContactPerson, PageSection } from '@/types/database'

export default async function ContactAboutPage() {
  const supabase = await createClient()

  const [
    pageRes,
    milestonesRes,
    highlightsRes,
    sectionsRes,
    contactPageRes,
    contactPersonsRes,
    contactSectionsRes,
  ] = await Promise.all([
    supabase.from('about_page').select('*').single(),
    supabase.from('about_milestones').select('*').order('sort_order', { ascending: true }),
    supabase.from('about_highlights').select('*').order('sort_order', { ascending: true }),
    supabase.from('page_sections').select('*').eq('page', 'about').order('sort_order', { ascending: true }),
    supabase.from('contact_page').select('*').single(),
    supabase.from('contact_persons').select('*').order('sort_order', { ascending: true }),
    supabase.from('page_sections').select('*').eq('page', 'contact').order('sort_order', { ascending: true }),
  ])

  const aboutPage = (pageRes.data ?? DEFAULT_ABOUT_PAGE) as AboutPage
  const milestones = (milestonesRes.data ?? DEFAULT_ABOUT_MILESTONES) as AboutMilestone[]
  const highlights = (highlightsRes.data ?? DEFAULT_ABOUT_HIGHLIGHTS) as AboutHighlight[]
  const sections = ((sectionsRes.data ?? []) as PageSection[])
    .sort((a, b) => a.sort_order - b.sort_order)
  const orderedSections = sections.length ? sections : DEFAULT_ABOUT_SECTIONS

  const contactPage = (contactPageRes.data ?? DEFAULT_CONTACT_PAGE) as ContactPage
  const contactPersons = (contactPersonsRes.data ?? []) as ContactPerson[]
  const contactSections = ((contactSectionsRes.data ?? []) as PageSection[])
    .sort((a, b) => a.sort_order - b.sort_order)
  const orderedContactSections = contactSections.length ? contactSections : DEFAULT_CONTACT_SECTIONS

  return (
    <>
      <ContactSettingsForm
        initialPage={contactPage}
        initialPersons={contactPersons}
        initialSections={orderedContactSections}
      />
      <AboutSettingsForm
        initialPage={aboutPage}
        initialMilestones={milestones}
        initialHighlights={highlights}
        initialSections={orderedSections}
      />
    </>
  )
}
