import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PublicMathDivider } from '@/components/public/PublicMathDivider'
import {
  HeroSection,
} from '@/components/home/HeroSections'
import {
  CTAStripSection,
  EventHighlightsSection,
  GalleryPreviewSection,
  CommitteePreviewSection,
  NoticesPreviewSection,
  SponsorsSection,
  StatsSection,
} from '@/components/home/ContentSections'
import type {
  CommitteeMember,
  Event,
  GalleryCategory,
  GalleryImage,
  Notice,
  SiteSettings,
  Sponsor,
  SponsorCategory,
  PageSection,
} from '@/types/database'
import { DEFAULT_SITE_SETTINGS } from '@/lib/siteSettings'

export const metadata: Metadata = {
  title: 'National Mathematics Carnival 2026 — Math Club, DUET',
  description:
    'Join the premier National Mathematics Carnival 2026 in Bangladesh. Register for exciting competitions, workshops, and challenges organised by Math Club, DUET.',
}

const DEFAULT_SECTIONS: PageSection[] = [
  { id: 'home_hero', page: 'home', section_key: 'home_hero', label: 'Hero Banner', is_visible: true, sort_order: 1 },
  { id: 'home_event_highlights', page: 'home', section_key: 'home_event_highlights', label: 'Event Highlights Cards', is_visible: true, sort_order: 2 },
  { id: 'home_notices_preview', page: 'home', section_key: 'home_notices_preview', label: 'Notices Preview', is_visible: true, sort_order: 3 },
  { id: 'home_gallery_preview', page: 'home', section_key: 'home_gallery_preview', label: 'Gallery Preview Strip', is_visible: true, sort_order: 4 },
  { id: 'home_committee_preview', page: 'home', section_key: 'home_committee_preview', label: 'Committee Preview Strip', is_visible: true, sort_order: 5 },
  { id: 'home_sponsors', page: 'home', section_key: 'home_sponsors', label: 'Proud Sponsors', is_visible: true, sort_order: 6 },
  { id: 'home_media_partners', page: 'home', section_key: 'home_media_partners', label: 'Media Partners', is_visible: true, sort_order: 7 },
  { id: 'home_stats', page: 'home', section_key: 'home_stats', label: 'Statistics Bar', is_visible: true, sort_order: 8 },
  { id: 'home_cta', page: 'home', section_key: 'home_cta', label: 'Call-To-Action Strip', is_visible: true, sort_order: 9 },
]

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const [
    settingsRes,
    eventsRes,
    noticesRes,
    galleryRes,
    galleryCatsRes,
    committeeRes,
    sponsorCatsRes,
    sponsorsRes,
    sectionsRes,
  ] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase.from('events').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
    supabase.from('notices')
      .select('*')
      .eq('is_visible', true)
      .lte('publish_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('publish_at', { ascending: false }),
    supabase.from('gallery_images').select('*').eq('is_visible', true).order('sort_order', { ascending: true }).limit(8),
    supabase.from('gallery_categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('committee_members').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
    supabase.from('sponsor_categories').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
    supabase.from('sponsors').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
    supabase.from('page_sections').select('*').eq('page', 'home').order('sort_order', { ascending: true }),
  ])

  const settings = (settingsRes.data ?? DEFAULT_SITE_SETTINGS) as SiteSettings
  const events = (eventsRes.data ?? []) as Event[]
  const notices = (noticesRes.data ?? []) as Notice[]
  const gallery = (galleryRes.data ?? []) as GalleryImage[]
  const galleryCategories = (galleryCatsRes.data ?? []) as GalleryCategory[]
  const committee = (committeeRes.data ?? []) as CommitteeMember[]
  const sponsorCategories = (sponsorCatsRes.data ?? []) as SponsorCategory[]
  const sponsors = (sponsorsRes.data ?? []) as Sponsor[]
  const sections = ((sectionsRes.data ?? []) as PageSection[])
    .sort((a, b) => a.sort_order - b.sort_order)
  const orderedSections = sections.length ? sections : DEFAULT_SECTIONS

  const mediaCategoryIds = sponsorCategories
    .filter(cat => /media/i.test(cat.name))
    .map(cat => cat.id)
  const mediaSponsors = sponsors.filter(s => s.category_id && mediaCategoryIds.includes(s.category_id))
  const regularSponsors = sponsors.filter(s => !s.category_id || !mediaCategoryIds.includes(s.category_id))

  const hasEvents = events.length > 0
  const hasNotices = notices.length > 0
  const hasGallery = gallery.length > 0
  const hasCommittee = committee.length > 0
  const hasSponsors = regularSponsors.length > 0
  const hasMediaSponsors = mediaSponsors.length > 0

  const galleryPreviewImages = gallery.map(image => ({
    ...image,
    category_name: image.category_id
      ? galleryCategories.find(category => category.id === image.category_id)?.name ?? null
      : null,
  }))

  const sectionMap: Record<string, React.ReactNode | null> = {
    home_hero: <HeroSection settings={settings} />,
    home_event_highlights: hasEvents ? <EventHighlightsSection events={events} /> : null,
    home_notices_preview: hasNotices ? <NoticesPreviewSection notices={notices} /> : null,
    home_gallery_preview: hasGallery ? <GalleryPreviewSection images={galleryPreviewImages} /> : null,
    home_committee_preview: hasCommittee ? <CommitteePreviewSection members={committee} /> : null,
    home_sponsors: hasSponsors ? <SponsorsSection categories={sponsorCategories} sponsors={regularSponsors} /> : null,
    home_media_partners: hasMediaSponsors ? <SponsorsSection categories={sponsorCategories} sponsors={mediaSponsors} isMediaPartners /> : null,
    home_stats: (
      <StatsSection
        stats={[
          { value: '80+', label: 'Universities' },
          { value: '1500+', label: 'Participants' },
          { value: '6', label: 'Events' },
          { value: '100k', label: 'Prize Pool' },
        ]}
      />
    ),
    home_cta: <CTAStripSection settings={settings} />,
  }

  const visibleSections = orderedSections.filter(
    section => section.is_visible && sectionMap[section.section_key]
  )

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      {visibleSections.map((section, index) => (
        <div key={section.section_key}>
          {sectionMap[section.section_key]}
          {index < visibleSections.length - 1 && (
            <PublicMathDivider formula="sum(n=1..inf) 1/n^2 = pi^2/6" />
          )}
        </div>
      ))}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": settings.site_title || "National Mathematics Carnival 2026",
            "startDate": settings.hero_countdown_date || "2026-06-01T09:00:00+06:00",
            "endDate": settings.hero_countdown_date || "2026-06-02T17:00:00+06:00",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {
              "@type": "Place",
              "name": settings.competition_location || "DUET Campus",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Gazipur",
                "addressCountry": "BD"
              }
            },
            "image": settings.hero_image_url ? [settings.hero_image_url] : [],
            "description": settings.hero_subtitle || "Join the premier mathematics competition in Bangladesh.",
            "organizer": {
              "@type": "Organization",
              "name": settings.organiser_name || "Math Club, DUET",
              "url": "https://www.nmcbd.app"
            },
            "performer": {
              "@type": "Organization",
              "name": settings.organiser_name || "Math Club, DUET",
              "url": "https://www.nmcbd.app"
            },
            "offers": {
              "@type": "Offer",
              "url": "https://www.nmcbd.app/events",
              "price": "0",
              "priceCurrency": "BDT",
              "availability": "https://schema.org/InStock"
            },
            "url": "https://www.nmcbd.app"
          })
        }}
      />
    </main>
  )
}
