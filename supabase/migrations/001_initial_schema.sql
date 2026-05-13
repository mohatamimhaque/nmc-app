-- ============================================================
-- NMC 2026 — Supabase SQL Migration
-- Based on PRD Section 8 (Database Schema)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. site_settings — single-row global config
-- ============================================================
create table if not exists public.site_settings (
  id                 uuid primary key default gen_random_uuid(),
  site_title         text not null default 'National Mathematics Carnival 2026',
  logo_url           text,
  favicon_url        text,
  event_date         timestamptz,
  default_theme      text not null default 'light' check (default_theme in ('light','dark')),
  color_primary      text not null default '#4f46e5',
  color_secondary    text not null default '#7c3aed',
  color_accent       text not null default '#06b6d4',
  color_button_bg    text not null default '#4f46e5',
  color_button_text  text not null default '#ffffff',
  color_navbar_bg    text not null default '#ffffff',
  color_footer_bg    text not null default '#0f1117',
  footer_pattern     text not null default 'solid',
  font_heading       text not null default 'Playfair Display',
  font_body          text not null default 'Inter',
  animations_enabled boolean not null default true,
  hero_mode          text not null default 'text' check (hero_mode in ('image','text')),
  hero_title         text not null default 'National Mathematics Carnival 2026',
  hero_subtitle      text,
  hero_cta_label     text not null default 'View Events',
  hero_cta_url       text not null default '/events',
  hero_image_url     text,
  hero_overlay_color text not null default 'rgba(15,17,23,0.55)',
  updated_at         timestamptz not null default now()
);

-- Seed singleton row
insert into public.site_settings (id) values ('00000000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;

-- ============================================================
-- 2. advisers
-- ============================================================
create table if not exists public.advisers (
  id             uuid primary key default gen_random_uuid(),
  name           text,
  designation    text,
  department     text,
  institution    text,
  expertise_tags text[] not null default '{}',
  photo_url      text,
  email          text,
  phone          text,
  linkedin_url   text,
  bio            text,
  show_email     boolean not null default false,
  show_phone     boolean not null default false,
  is_visible     boolean not null default true,
  is_disabled    boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 3. sub_committees
-- ============================================================
create table if not exists public.sub_committees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  display_label text,
  is_visible    boolean not null default true,
  sort_order    integer not null default 0
);

-- ============================================================
-- 4. committee_members
-- ============================================================
create table if not exists public.committee_members (
  id                uuid primary key default gen_random_uuid(),
  sub_committee_id  uuid not null references public.sub_committees(id) on delete cascade,
  name              text,
  role              text,
  designation       text,
  department        text,
  photo_url         text,
  email             text,
  phone             text,
  facebook_url      text,
  linkedin_url      text,
  show_email        boolean not null default false,
  show_phone        boolean not null default false,
  is_visible        boolean not null default true,
  is_disabled       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 5. events
-- ============================================================
create table if not exists public.events (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text unique not null,
  title                     text not null,
  category                  text check (category in ('university','college','school')),
  cover_image_url           text,
  short_description         text,
  description               text,
  eligibility               text,
  prize_details             text,
  registration_type         text not null default 'internal' check (registration_type in ('internal','google_form')),
  registration_url          text,
  registration_button_label text not null default 'Register Now',
  registration_deadline     timestamptz,
  organiser_name            text,
  organiser_email           text,
  status                    text not null default 'hidden' check (status in ('published','hidden','disabled')),
  sort_order                integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- 6. event_faqs
-- ============================================================
create table if not exists public.event_faqs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  question   text not null,
  answer     text,
  sort_order integer not null default 0
);

-- ============================================================
-- 7. internal_form_fields
-- ============================================================
create table if not exists public.internal_form_fields (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  label      text not null,
  field_type text not null default 'text' check (field_type in ('text','number','select','file','email')),
  options    text[] not null default '{}',
  is_required boolean not null default false,
  sort_order integer not null default 0
);

-- ============================================================
-- 8. event_registrations
-- ============================================================
create table if not exists public.event_registrations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  form_data    jsonb not null default '{}',
  status       text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- 9. sponsor_categories
-- ============================================================
create table if not exists public.sponsor_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

-- ============================================================
-- 10. sponsors
-- ============================================================
create table if not exists public.sponsors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  website_url  text,
  category_id  uuid references public.sponsor_categories(id) on delete set null,
  display_mode text not null default 'both' check (display_mode in ('logo','name','both')),
  logo_size    text not null default 'medium' check (logo_size in ('small','medium','large')),
  is_visible   boolean not null default true,
  sort_order   integer not null default 0
);

-- ============================================================
-- 11. notices
-- ============================================================
create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  category   text,
  is_pinned  boolean not null default false,
  is_visible boolean not null default true,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  view_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 12. gallery_categories
-- ============================================================
create table if not exists public.gallery_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0
);

-- ============================================================
-- 13. gallery_images
-- ============================================================
create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  caption     text,
  alt_text    text not null default '',
  category_id uuid references public.gallery_categories(id) on delete set null,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 14. contact_persons
-- ============================================================
create table if not exists public.contact_persons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  designation text,
  phone       text,
  email       text,
  photo_url   text,
  show_phone  boolean not null default true,
  show_email  boolean not null default true,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0
);

-- ============================================================
-- 15. contact_submissions
-- ============================================================
create table if not exists public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  subject      text,
  message      text not null,
  status       text not null default 'unread' check (status in ('unread','read','archived')),
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- 16. page_sections — visibility + order per page section
-- ============================================================
create table if not exists public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  section_key text unique not null,
  label       text not null,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0
);

-- Seed all home page sections (PRD §5.15.3)
insert into public.page_sections (page, section_key, label, sort_order) values
  ('home', 'home_hero',            'Hero Banner',                 1),
  ('home', 'home_countdown',       'Event Countdown',             2),
  ('home', 'home_deadline_strip',  'Registration Deadline Strip', 3),
  ('home', 'home_event_highlights','Event Highlights Cards',      4),
  ('home', 'home_notices_preview', 'Notices Preview',             5),
  ('home', 'home_gallery_preview', 'Gallery Preview Strip',       6),
  ('home', 'home_committee_preview','Committee Preview Strip',    7),
  ('home', 'home_sponsors',        'Proud Sponsors',              8),
  ('home', 'home_media_partners',  'Media Partners',              9),
  ('home', 'home_stats',           'Statistics Bar',              10),
  ('home', 'home_cta',             'Call-To-Action Strip',        11),
  ('about','about_overview',       'Organisation Overview',       1),
  ('about','about_mission',        'Mission & Vision',            2),
  ('about','about_team_strip',     'Team Strip',                  3),
  ('about','about_milestones',     'Milestones Timeline',         4),
  ('about','about_advisers_strip', 'Advisers Preview Strip',      5),
  ('about','about_past_events',    'Past Events Highlights',      6)
on conflict (section_key) do nothing;

-- ============================================================
-- 17. page_visibility (PRD §5.15.1)
-- ============================================================
create table if not exists public.page_visibility (
  id         uuid primary key default gen_random_uuid(),
  page_key   text unique not null,
  label      text not null,
  route      text not null,
  is_visible boolean not null default true
);

insert into public.page_visibility (page_key, label, route) values
  ('events',    'Events',              '/events'),
  ('gallery',   'Gallery',             '/gallery'),
  ('schedule',  'Schedule',            '/schedule'),
  ('notices',   'Notices',             '/notices'),
  ('committee', 'Committee',           '/committee'),
  ('advisers',  'Advisers',            '/advisers'),
  ('sponsors',  'Sponsors',            '/sponsors'),
  ('about',     'About',               '/about'),
  ('contact',   'Contact',             '/contact')
on conflict (page_key) do nothing;

-- ============================================================
-- 18. nav_links
-- ============================================================
create table if not exists public.nav_links (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  url        text not null,
  is_external boolean not null default false,
  is_visible  boolean not null default true,
  is_cta      boolean not null default false,
  sort_order  integer not null default 0
);

insert into public.nav_links (label, url, sort_order) values
  ('Home',      '/',          1),
  ('Events',    '/events',    2),
  ('Schedule',  '/schedule',  3),
  ('Committee', '/committee', 4),
  ('Gallery',   '/gallery',   5),
  ('Notices',   '/notices',   6),
  ('Sponsors',  '/sponsors',  7),
  ('About',     '/about',     8),
  ('Contact',   '/contact',   9)
on conflict do nothing;

-- ============================================================
-- 19. footer_settings — singleton
-- ============================================================
create table if not exists public.footer_settings (
  id                   uuid primary key default gen_random_uuid(),
  tagline              text default 'Celebrating Mathematical Excellence',
  organiser_text       text default 'Math Club, DUET',
  copyright_text       text default '© 2026 Math Club, DUET. All rights reserved.',
  show_developer_credit boolean not null default true,
  show_privacy_link    boolean not null default false,
  privacy_url          text,
  show_terms_link      boolean not null default false,
  terms_url            text,
  contact_phone        text,
  contact_email        text,
  contact_address      text,
  show_phone           boolean not null default true,
  show_email           boolean not null default true,
  show_address         boolean not null default true,
  show_sponsor_strip   boolean not null default true,
  facebook_url         text,
  youtube_url          text,
  instagram_url        text,
  linkedin_url         text,
  twitter_url          text,
  show_facebook        boolean not null default true,
  show_youtube         boolean not null default true,
  show_instagram       boolean not null default true,
  show_linkedin        boolean not null default true,
  show_twitter         boolean not null default true,
  updated_at           timestamptz not null default now()
);

insert into public.footer_settings (id) values ('00000000-0000-0000-0000-000000000002')
  on conflict (id) do nothing;

-- ============================================================
-- 20. footer_quick_links
-- ============================================================
create table if not exists public.footer_quick_links (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  url        text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- ============================================================
-- 21. about_team_members
-- ============================================================
create table if not exists public.about_team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  photo_url  text,
  bio        text,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- ============================================================
-- 22. schedule_sessions
-- ============================================================
create table if not exists public.schedule_sessions (
  id         uuid primary key default gen_random_uuid(),
  day_number integer not null default 1,
  start_time time,
  end_time   time,
  title      text not null,
  venue      text,
  host       text,
  category   text,
  color_tag  text,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- ============================================================
-- 23. analytics_events
-- ============================================================
create table if not exists public.analytics_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null check (event_type in ('pageview','cta_click','notice_view','form_submit')),
  page_path       text not null,
  referrer        text,
  user_agent_hash text,
  screen_width    integer,
  country_code    text,
  session_id      text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 24. admin_users
-- ============================================================
create table if not exists public.admin_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  role          text not null default 'admin' check (role in ('super_admin','admin')),
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 25. visibility_audit_log
-- ============================================================
create table if not exists public.visibility_audit_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key  text not null,
  changed_by  text not null,
  old_value   boolean not null,
  new_value   boolean not null,
  changed_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_events_slug       on public.events(slug);
create index if not exists idx_events_status     on public.events(status);
create index if not exists idx_events_category   on public.events(category);
create index if not exists idx_notices_visible   on public.notices(is_visible, publish_at, expires_at);
create index if not exists idx_notices_pinned    on public.notices(is_pinned, sort_order);
create index if not exists idx_gallery_visible   on public.gallery_images(is_visible, sort_order);
create index if not exists idx_sponsors_cat      on public.sponsors(category_id, sort_order);
create index if not exists idx_committee_sub     on public.committee_members(sub_committee_id, sort_order);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);
create index if not exists idx_analytics_path    on public.analytics_events(page_path);
create index if not exists idx_registrations_ev  on public.event_registrations(event_id, submitted_at desc);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_site_settings_updated
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create or replace trigger trg_advisers_updated
  before update on public.advisers
  for each row execute function public.set_updated_at();

create or replace trigger trg_committee_members_updated
  before update on public.committee_members
  for each row execute function public.set_updated_at();

create or replace trigger trg_events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

create or replace trigger trg_notices_updated
  before update on public.notices
  for each row execute function public.set_updated_at();

create or replace trigger trg_footer_settings_updated
  before update on public.footer_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
alter table public.site_settings       enable row level security;
alter table public.advisers            enable row level security;
alter table public.sub_committees      enable row level security;
alter table public.committee_members   enable row level security;
alter table public.events              enable row level security;
alter table public.event_faqs          enable row level security;
alter table public.internal_form_fields enable row level security;
alter table public.event_registrations enable row level security;
alter table public.sponsor_categories  enable row level security;
alter table public.sponsors            enable row level security;
alter table public.notices             enable row level security;
alter table public.gallery_categories  enable row level security;
alter table public.gallery_images      enable row level security;
alter table public.contact_persons     enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.page_sections       enable row level security;
alter table public.page_visibility     enable row level security;
alter table public.nav_links           enable row level security;
alter table public.footer_settings     enable row level security;
alter table public.footer_quick_links  enable row level security;
alter table public.about_team_members  enable row level security;
alter table public.schedule_sessions   enable row level security;
alter table public.analytics_events    enable row level security;
alter table public.admin_users         enable row level security;
alter table public.visibility_audit_log enable row level security;

-- ── PUBLIC READ policies (read-safe tables) ──────────────────

create policy "public_read_site_settings"
  on public.site_settings for select using (true);

create policy "public_read_advisers"
  on public.advisers for select using (is_visible = true and is_disabled = false);

create policy "public_read_sub_committees"
  on public.sub_committees for select using (is_visible = true);

create policy "public_read_committee_members"
  on public.committee_members for select using (is_visible = true);

create policy "public_read_events"
  on public.events for select using (status = 'published');

create policy "public_read_event_faqs"
  on public.event_faqs for select using (true);

create policy "public_read_sponsor_categories"
  on public.sponsor_categories for select using (is_visible = true);

create policy "public_read_sponsors"
  on public.sponsors for select using (is_visible = true);

create policy "public_read_notices"
  on public.notices for select using (
    is_visible = true
    and publish_at <= now()
    and (expires_at is null or expires_at > now())
  );

create policy "public_read_gallery_categories"
  on public.gallery_categories for select using (true);

create policy "public_read_gallery_images"
  on public.gallery_images for select using (is_visible = true);

create policy "public_read_contact_persons"
  on public.contact_persons for select using (is_visible = true);

create policy "public_read_page_sections"
  on public.page_sections for select using (true);

create policy "public_read_page_visibility"
  on public.page_visibility for select using (true);

create policy "public_read_nav_links"
  on public.nav_links for select using (is_visible = true);

create policy "public_read_footer_settings"
  on public.footer_settings for select using (true);

create policy "public_read_footer_quick_links"
  on public.footer_quick_links for select using (is_visible = true);

create policy "public_read_about_team"
  on public.about_team_members for select using (is_visible = true);

create policy "public_read_schedule_sessions"
  on public.schedule_sessions for select using (is_visible = true);

-- Public INSERT for analytics and contact form (anonymous allowed)
create policy "public_insert_analytics"
  on public.analytics_events for insert with check (true);

create policy "public_insert_contact_submissions"
  on public.contact_submissions for insert with check (true);

create policy "public_insert_event_registrations"
  on public.event_registrations for insert with check (true);

-- ── ADMIN FULL ACCESS policies (service role key bypasses RLS; ──
-- ── these policies cover anon admin sessions via JWT)          ──

create policy "admin_all_site_settings"
  on public.site_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_advisers"
  on public.advisers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_sub_committees"
  on public.sub_committees for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_committee_members"
  on public.committee_members for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_events"
  on public.events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_event_faqs"
  on public.event_faqs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_internal_form_fields"
  on public.internal_form_fields for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_event_registrations"
  on public.event_registrations for select
  using (auth.role() = 'authenticated');

create policy "admin_all_sponsor_categories"
  on public.sponsor_categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_sponsors"
  on public.sponsors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_notices"
  on public.notices for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_gallery_categories"
  on public.gallery_categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_gallery_images"
  on public.gallery_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_contact_persons"
  on public.contact_persons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_contact_submissions"
  on public.contact_submissions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_page_sections"
  on public.page_sections for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_page_visibility"
  on public.page_visibility for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_nav_links"
  on public.nav_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_footer_settings"
  on public.footer_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_footer_quick_links"
  on public.footer_quick_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_about_team"
  on public.about_team_members for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_schedule_sessions"
  on public.schedule_sessions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_read_analytics"
  on public.analytics_events for select
  using (auth.role() = 'authenticated');

create policy "admin_all_admin_users"
  on public.admin_users for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_visibility_audit"
  on public.visibility_audit_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
