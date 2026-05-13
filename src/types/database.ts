/**
 * NMC 2026 — Supabase Database Types
 * Reflects the full schema from PRD Section 8
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: SiteSettings
        Insert: Partial<SiteSettings>
        Update: Partial<SiteSettings>
      }
      advisers: {
        Row: Adviser
        Insert: Omit<Adviser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Adviser>
      }
      sub_committees: {
        Row: SubCommittee
        Insert: Omit<SubCommittee, 'id'>
        Update: Partial<SubCommittee>
      }
      committee_members: {
        Row: CommitteeMember
        Insert: Omit<CommitteeMember, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<CommitteeMember>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Event>
      }
      event_faqs: {
        Row: EventFaq
        Insert: Omit<EventFaq, 'id'>
        Update: Partial<EventFaq>
      }
      internal_form_fields: {
        Row: InternalFormField
        Insert: Omit<InternalFormField, 'id'>
        Update: Partial<InternalFormField>
      }
      internal_form_sections: {
        Row: InternalFormSection
        Insert: Omit<InternalFormSection, 'id'>
        Update: Partial<InternalFormSection>
      }
      event_registrations: {
        Row: EventRegistration
        Insert: Omit<EventRegistration, 'id' | 'submitted_at'>
        Update: Partial<EventRegistration>
      }
      sponsor_categories: {
        Row: SponsorCategory
        Insert: Omit<SponsorCategory, 'id'>
        Update: Partial<SponsorCategory>
      }
      sponsors: {
        Row: Sponsor
        Insert: Omit<Sponsor, 'id'>
        Update: Partial<Sponsor>
      }
      club_partner_categories: {
        Row: ClubPartnerCategory
        Insert: Omit<ClubPartnerCategory, 'id'>
        Update: Partial<ClubPartnerCategory>
      }
      club_partners: {
        Row: ClubPartner
        Insert: Omit<ClubPartner, 'id'>
        Update: Partial<ClubPartner>
      }
      campus_ambassadors: {
        Row: CampusAmbassador
        Insert: Omit<CampusAmbassador, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<CampusAmbassador>
      }
      notices: {
        Row: Notice
        Insert: Omit<Notice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Notice>
      }
      gallery_images: {
        Row: GalleryImage
        Insert: Omit<GalleryImage, 'id' | 'created_at'>
        Update: Partial<GalleryImage>
      }
      gallery_categories: {
        Row: GalleryCategory
        Insert: Omit<GalleryCategory, 'id'>
        Update: Partial<GalleryCategory>
      }
      contact_persons: {
        Row: ContactPerson
        Insert: Omit<ContactPerson, 'id'>
        Update: Partial<ContactPerson>
      }
      contact_submissions: {
        Row: ContactSubmission
        Insert: Omit<ContactSubmission, 'id' | 'submitted_at'>
        Update: Partial<ContactSubmission>
      }
      contact_page: {
        Row: ContactPage
        Insert: Partial<ContactPage>
        Update: Partial<ContactPage>
      }
      page_sections: {
        Row: PageSection
        Insert: Omit<PageSection, 'id'>
        Update: Partial<PageSection>
      }
      page_visibility: {
        Row: PageVisibility
        Insert: Omit<PageVisibility, 'id'>
        Update: Partial<PageVisibility>
      }
      nav_links: {
        Row: NavLink
        Insert: Omit<NavLink, 'id'>
        Update: Partial<NavLink>
      }
      footer_settings: {
        Row: FooterSettings
        Insert: Partial<FooterSettings>
        Update: Partial<FooterSettings>
      }
      footer_quick_links: {
        Row: FooterQuickLink
        Insert: Omit<FooterQuickLink, 'id'>
        Update: Partial<FooterQuickLink>
      }
      about_team_members: {
        Row: AboutTeamMember
        Insert: Omit<AboutTeamMember, 'id'>
        Update: Partial<AboutTeamMember>
      }
      about_page: {
        Row: AboutPage
        Insert: Partial<AboutPage>
        Update: Partial<AboutPage>
      }
      about_milestones: {
        Row: AboutMilestone
        Insert: Omit<AboutMilestone, 'id'>
        Update: Partial<AboutMilestone>
      }
      about_highlights: {
        Row: AboutHighlight
        Insert: Omit<AboutHighlight, 'id'>
        Update: Partial<AboutHighlight>
      }
      schedule_sessions: {
        Row: ScheduleSession
        Insert: Omit<ScheduleSession, 'id'>
        Update: Partial<ScheduleSession>
      }
      schedule_day_settings: {
        Row: ScheduleDaySetting
        Insert: Omit<ScheduleDaySetting, 'id'>
        Update: Partial<ScheduleDaySetting>
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>
        Update: never
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'created_at'>
        Update: Partial<AdminUser>
      }
      visibility_audit_log: {
        Row: VisibilityAuditLog
        Insert: Omit<VisibilityAuditLog, 'id' | 'changed_at'>
        Update: never
      }
    }
  }
}

// ─── Table row types ────────────────────────────────────────────────────────

export interface SiteSettings {
  id: string
  site_title: string
  competition_name: string
  competition_slug: string
  competition_category: string
  competition_season: string | null
  competition_location: string | null
  organiser_name: string | null
  organiser_tagline: string | null
  logo_url: string | null
  favicon_url: string | null
  schedule_pdf_url: string | null
  event_date: string | null
  default_theme: 'light' | 'dark'
  use_static_theme: boolean
  color_primary: string
  color_secondary: string
  color_accent: string
  color_button_bg: string
  color_button_text: string
  color_navbar_bg: string
  color_footer_bg: string
  footer_pattern: string
  font_heading: string
  font_body: string
  animations_enabled: boolean
  hero_mode: 'image' | 'text' | 'image_only' | 'banner' | 'countdown'
  hero_title: string
  hero_subtitle: string
  hero_cta_label: string
  hero_cta_url: string
  hero_image_url: string | null
  hero_countdown_date: string | null
  hero_overlay_color: string
  hero_overlay_enabled: boolean
  hero_overlay_opacity: number
  updated_at: string
}

export interface Adviser {
  id: string
  name: string | null
  designation: string | null
  department: string | null
  institution: string | null
  expertise_tags: string[]
  photo_url: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  bio: string | null
  show_email: boolean
  show_phone: boolean
  is_visible: boolean
  is_disabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SubCommittee {
  id: string
  name: string
  display_label: string | null
  is_visible: boolean
  sort_order: number
}

export interface CommitteeMember {
  id: string
  sub_committee_id: string
  name: string | null
  role: string | null
  designation: string | null
  department: string | null
  photo_url: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  linkedin_url: string | null
  show_email: boolean
  show_phone: boolean
  is_visible: boolean
  is_disabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  slug: string
  title: string
  category: 'university' | 'college' | 'school'
  cover_image_url: string | null
  short_description: string | null
  description: string | null
  eligibility: string | null
  prize_details: string | null
  registration_type: 'internal' | 'google_form'
  registration_url: string | null
  registration_button_label: string
  registration_deadline: string | null
  registration_limit_total: number | null
  registration_limit_per_email: boolean
  registration_limit_per_phone: boolean
  organiser_name: string | null
  organiser_email: string | null
  status: 'published' | 'hidden' | 'disabled'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EventFaq {
  id: string
  event_id: string
  question: string
  answer: string | null
  sort_order: number
}

export interface InternalFormField {
  id: string
  event_id: string
  section_id: string | null
  label: string
  field_type: 'short' | 'paragraph' | 'mcq' | 'checkbox' | 'dropdown' | 'date' | 'time' | 'number' | 'email' | 'phone' | 'file' | 'grid_radio' | 'grid_checkbox'
  options: string[]
  helper_text: string | null
  is_required: boolean
  config: Json
  validation: Json
  logic: Json
  is_visible: boolean
  sort_order: number
}

export interface InternalFormSection {
  id: string
  event_id: string
  title: string
  description: string | null
  is_visible: boolean
  sort_order: number
}

export interface EventRegistration {
  id: string
  event_id: string
  public_id: string | null
  registrant_email: string | null
  registrant_phone: string | null
  form_data: Json
  status: 'pending' | 'confirmed' | 'rejected'
  submitted_at: string
}

export interface SponsorCategory {
  id: string
  name: string
  sort_order: number
  is_visible: boolean
}

export interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  category_id: string
  display_mode: 'logo' | 'name' | 'both'
  logo_size: 'small' | 'medium' | 'large'
  is_visible: boolean
  sort_order: number
}

export interface ClubPartnerCategory {
  id: string
  name: string
  sort_order: number
  is_visible: boolean
}

export interface ClubPartner {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  category_id: string | null
  display_mode: 'logo' | 'name' | 'both'
  logo_size: 'small' | 'medium' | 'large'
  is_visible: boolean
  sort_order: number
}

export interface CampusAmbassador {
  id: string
  name: string | null
  role: string | null
  institution: string | null
  department: string | null
  designation: string | null
  bio: string | null
  photo_url: string | null
  email: string | null
  phone: string | null
  facebook_url: string | null
  linkedin_url: string | null
  is_visible: boolean
  is_disabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Notice {
  id: string
  title: string
  body: string | null
  category: string | null
  is_pinned: boolean
  is_visible: boolean
  publish_at: string
  expires_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface GalleryImage {
  id: string
  url: string
  caption: string | null
  alt_text: string
  category_id: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
}

export interface GalleryCategory {
  id: string
  name: string
  sort_order: number
}

export interface ContactPerson {
  id: string
  name: string
  designation: string | null
  phone: string | null
  email: string | null
  photo_url: string | null
  show_phone: boolean
  show_email: boolean
  is_visible: boolean
  sort_order: number
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: 'unread' | 'read' | 'archived'
  submitted_at: string
}

export interface ContactPage {
  id: string
  hero_title: string
  hero_subtitle: string
  form_title: string
  form_subtitle: string
  recipient_email: string | null
  location_title: string
  location_body: string
  map_embed_url: string | null
  social_title: string
  updated_at: string
}

export interface PageSection {
  id: string
  page: string
  section_key: string
  label: string
  is_visible: boolean
  sort_order: number
}

export interface PageVisibility {
  id: string
  page_key: string
  label: string
  route: string
  is_visible: boolean
}

export interface NavLink {
  id: string
  label: string
  url: string
  is_external: boolean
  is_visible: boolean
  is_cta: boolean
  sort_order: number
}

export interface FooterSettings {
  id: string
  tagline: string | null
  organiser_text: string | null
  copyright_text: string | null
  developer_credit_text: string | null
  developer_credit_url: string | null
  show_developer_credit: boolean
  show_privacy_link: boolean
  privacy_url: string | null
  show_terms_link: boolean
  terms_url: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  show_phone: boolean
  show_email: boolean
  show_address: boolean
  show_sponsor_strip: boolean
  facebook_url: string | null
  youtube_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  show_facebook: boolean
  show_youtube: boolean
  show_instagram: boolean
  show_linkedin: boolean
  show_twitter: boolean
  updated_at: string
}

export interface FooterQuickLink {
  id: string
  label: string
  url: string
  is_visible: boolean
  sort_order: number
}

export interface AboutPage {
  id: string
  hero_title: string
  hero_subtitle: string
  overview_section_title: string
  overview_section_subtitle: string
  overview_title: string
  overview_body: string
  nmc_title: string
  nmc_eyebrow: string
  nmc_body: string
  nmc_cta_label: string
  nmc_cta_url: string
  mission_section_title: string
  mission_title: string
  mission_body: string
  vision_title: string
  vision_body: string
  team_title: string
  team_subtitle: string
  committee_cta_label: string
  committee_cta_url: string
  advisers_title: string
  advisers_subtitle: string
  advisers_cta_label: string
  advisers_cta_url: string
  milestones_title: string
  milestones_subtitle: string
  past_events_title: string
  past_events_subtitle: string
  past_events_cta_label: string
  past_events_cta_url: string
  updated_at: string
}

export interface AboutMilestone {
  id: string
  year: string
  title: string
  description: string
  is_visible: boolean
  sort_order: number
}

export interface AboutHighlight {
  id: string
  title: string
  detail: string
  is_visible: boolean
  sort_order: number
}

export interface AboutTeamMember {
  id: string
  name: string
  role: string | null
  photo_url: string | null
  bio: string | null
  is_visible: boolean
  sort_order: number
}

export interface ScheduleSession {
  id: string
  day_number: number
  start_time: string
  end_time: string | null
  title: string
  venue: string | null
  host: string | null
  category: string | null
  color_tag: string | null
  is_visible: boolean
  sort_order: number
}

export interface ScheduleDaySetting {
  id: string
  day_number: number
  is_visible: boolean
  sort_order: number
}

export interface AnalyticsEvent {
  id: string
  event_type: 'pageview' | 'cta_click' | 'notice_view' | 'form_submit'
  page_path: string
  referrer: string | null
  user_agent_hash: string | null
  screen_width: number | null
  country_code: string | null
  session_id: string | null
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: 'super_admin' | 'admin' | 'moderator'
  last_login_at: string | null
  created_at: string
}

export interface VisibilityAuditLog {
  id: string
  entity_type: string
  entity_key: string
  changed_by: string
  old_value: boolean
  new_value: boolean
  changed_at: string
}
