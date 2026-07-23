-- =============================================================================
-- NMC 2026 — Consolidated Clean Schema Definition (DDL)
-- This file contains all table, index, function, trigger, and RLS definitions
-- representing the final state of the database. No seed/insert data is included.
-- =============================================================================

-- Enable extension
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. Helper Functions & Stored Procedures
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Bulk Room Allocation update procedure
create or replace function public.update_allocated_rooms(updates jsonb, admin_user text)
returns void as $$
begin
  update public.processed_registrations as p
  set allocated_room = nullif(u.allocated_room, ''),
      updated_by = admin_user,
      updated_at = now()
  from (
    select (x->>'serial')::text as serial, (x->>'allocated_room')::text as allocated_room
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;

-- Bulk Admit Card updates procedure
create or replace function public.update_admit_cards(updates jsonb, admin_user text)
returns void as $$
begin
  update public.processed_registrations as p
  set admit_card_url = nullif(u.admit_card_url, ''),
      updated_by = admin_user,
      updated_at = now()
  from (
    select (x->>'serial')::text as serial, (x->>'admit_card_url')::text as admit_card_url
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- 2. Table Definitions
-- =============================================================================

-- 1. site_settings
create table if not exists public.site_settings (
  id                    uuid primary key default gen_random_uuid(),
  site_title            text not null default 'National Mathematics Carnival 2026',
  logo_url              text,
  favicon_url           text,
  event_date            timestamptz,
  default_theme         text not null default 'light' check (default_theme in ('light','dark')),
  color_primary         text not null default '#4f46e5',
  color_secondary       text not null default '#7c3aed',
  color_accent          text not null default '#06b6d4',
  color_button_bg       text not null default '#4f46e5',
  color_button_text     text not null default '#ffffff',
  color_navbar_bg       text not null default '#ffffff',
  color_footer_bg       text not null default '#0f1117',
  footer_pattern        text not null default 'solid',
  font_heading          text not null default 'Playfair Display',
  font_body             text not null default 'Inter',
  animations_enabled    boolean not null default true,
  hero_mode             text not null default 'text' check (hero_mode in ('image', 'text', 'image_only', 'banner', 'countdown', 'carousel')),
  hero_title            text not null default 'National Mathematics Carnival 2026',
  hero_subtitle         text,
  hero_cta_label        text not null default 'View Events',
  hero_cta_url          text not null default '/events',
  hero_image_url        text,
  hero_overlay_color    text not null default 'rgba(15,17,23,0.55)',
  hero_overlay_enabled  boolean not null default true,
  hero_overlay_opacity  integer not null default 55,
  hero_countdown_date   timestamptz,
  hero_carousel_images  text[] not null default '{}'::text[],
  hero_show_countdown   boolean not null default true,
  math_rain_enabled     boolean not null default true,
  math_rain_speed       numeric not null default 12,
  math_rain_color       text not null default 'rgba(79,70,229,0.18)',
  math_rain_size        numeric not null default 20,
  math_rain_count       integer not null default 24,
  use_static_theme      boolean not null default false,
  schedule_pdf_url      text,
  competition_name      text not null default 'Competition',
  competition_slug      text not null default 'competition',
  competition_category  text not null default 'General Competition',
  competition_season    text,
  competition_location  text,
  organiser_name        text,
  organiser_tagline     text,
  updated_at            timestamptz not null default now()
);

-- 2. advisers
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

-- 3. sub_committees
create table if not exists public.sub_committees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  display_label text,
  is_visible    boolean not null default true,
  sort_order    integer not null default 0
);

-- 4. committee_members
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

-- 5. events
create table if not exists public.events (
  id                            uuid primary key default gen_random_uuid(),
  slug                          text unique not null,
  title                         text not null,
  category                      text check (category in ('university','college','school')),
  cover_image_url               text,
  short_description             text,
  description                   text,
  eligibility                   text,
  prize_details                 text,
  registration_type             text not null default 'internal' check (registration_type in ('internal','google_form')),
  registration_url              text,
  registration_button_label     text not null default 'Register Now',
  registration_deadline         timestamptz,
  organiser_name                text,
  organiser_email               text,
  status                        text not null default 'hidden' check (status in ('published','hidden','disabled')),
  sort_order                    integer not null default 0,
  rulebook_url                  text,
  registration_limit_total      integer,
  registration_limit_per_email  boolean not null default false,
  registration_limit_per_phone  boolean not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- 6. event_faqs
create table if not exists public.event_faqs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  question   text not null,
  answer     text,
  sort_order integer not null default 0
);

-- 7. internal_form_sections
create table if not exists public.internal_form_sections (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  title       text not null,
  description text,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0
);

-- 8. internal_form_fields
create table if not exists public.internal_form_fields (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  label       text not null,
  field_type  text not null check (field_type in (
    'short',
    'paragraph',
    'mcq',
    'checkbox',
    'dropdown',
    'date',
    'time',
    'number',
    'email',
    'phone',
    'file',
    'grid_radio',
    'grid_checkbox'
  )),
  options     text[] not null default '{}',
  is_required boolean not null default false,
  sort_order  integer not null default 0,
  section_id  uuid references public.internal_form_sections(id) on delete set null,
  helper_text text,
  config      jsonb not null default '{}'::jsonb,
  validation  jsonb not null default '{}'::jsonb,
  logic       jsonb not null default '[]'::jsonb,
  is_visible  boolean not null default true
);

-- 9. event_registrations
create table if not exists public.event_registrations (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  form_data        jsonb not null default '{}',
  status           text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  submitted_at     timestamptz not null default now(),
  public_id        text unique,
  registrant_email text,
  registrant_phone text
);

-- 10. sponsor_categories
create table if not exists public.sponsor_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

-- 11. sponsors
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

-- 12. notices
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

-- 13. gallery_categories
create table if not exists public.gallery_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0
);

-- 14. gallery_images
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

-- 15. contact_persons
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

-- 16. contact_submissions
create table if not exists public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  subject      text,
  message      text not null,
  status       text not null default 'unread' check (status in ('unread','read','archived')),
  submitted_at timestamptz not null default now()
);

-- 17. page_sections
create table if not exists public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  section_key text unique not null,
  label       text not null,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0
);

-- 18. page_visibility
create table if not exists public.page_visibility (
  id         uuid primary key default gen_random_uuid(),
  page_key   text unique not null,
  label      text not null,
  route      text not null,
  is_visible boolean not null default true
);

-- 19. nav_links
create table if not exists public.nav_links (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  url        text not null,
  is_external boolean not null default false,
  is_visible  boolean not null default true,
  is_cta      boolean not null default false,
  sort_order  integer not null default 0
);

-- 20. footer_settings
create table if not exists public.footer_settings (
  id                    uuid primary key default gen_random_uuid(),
  tagline               text default 'Celebrating Mathematical Excellence',
  organiser_text        text default 'Math Club, DUET',
  copyright_text        text default '© 2026 Math Club, DUET. All rights reserved.',
  show_developer_credit boolean not null default true,
  show_privacy_link     boolean not null default false,
  privacy_url           text,
  show_terms_link       boolean not null default false,
  terms_url             text,
  contact_phone         text,
  contact_email         text,
  contact_address       text,
  show_phone            boolean not null default true,
  show_email            boolean not null default true,
  show_address          boolean not null default true,
  show_sponsor_strip    boolean not null default true,
  facebook_url          text,
  youtube_url           text,
  instagram_url         text,
  linkedin_url          text,
  twitter_url           text,
  show_facebook         boolean not null default true,
  show_youtube          boolean not null default true,
  show_instagram        boolean not null default true,
  show_linkedin         boolean not null default true,
  show_twitter          boolean not null default true,
  developer_credit_text text,
  developer_credit_url  text,
  updated_at            timestamptz not null default now()
);

-- 21. footer_quick_links
create table if not exists public.footer_quick_links (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  url        text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- 22. about_page
create table if not exists public.about_page (
  id                        uuid primary key default gen_random_uuid(),
  hero_title                text not null default 'About NMC 2026',
  hero_subtitle             text not null default 'Learn about the Math Club at DUET and the people building NMC 2026.',
  overview_title            text not null default 'Math Club, DUET',
  overview_body             text not null default 'Math Club, DUET is a student led community focused on discovery, contest preparation, and collaborative problem solving.',
  mission_title             text not null default 'Mission',
  mission_body              text not null default 'Equip students with rigorous problem solving skills, mentorship, and access to competitive mathematics experiences.',
  vision_title              text not null default 'Vision',
  vision_body               text not null default 'Grow a nationwide network of learners who use mathematics to explore, innovate, and lead in their communities.',
  team_title                text not null default 'Organizing Team',
  team_subtitle             text not null default 'Meet the students and mentors behind NMC 2026.',
  committee_cta_label       text not null default 'See Full Committee',
  committee_cta_url         text not null default '/committee',
  advisers_title            text not null default 'Faculty and Mentors',
  advisers_subtitle         text not null default 'Guidance from faculty and professional advisers.',
  advisers_cta_label        text not null default 'Meet the Advisers',
  advisers_cta_url          text not null default '/advisers',
  milestones_title          text not null default 'Milestones',
  milestones_subtitle        text not null default 'Key moments in the journey so far.',
  past_events_title         text not null default 'Past Events',
  past_events_subtitle      text not null default 'Highlights from previous programs and workshops.',
  past_events_cta_label     text not null default 'View Gallery',
  past_events_cta_url       text not null default '/gallery',
  overview_section_title    text not null default 'Organisation Overview',
  overview_section_subtitle text not null default 'Building a community for mathematics and problem solvers.',
  nmc_title                 text not null default 'National Mathematics Carnival',
  nmc_eyebrow               text not null default 'NMC 2026',
  nmc_body                  text not null default 'NMC 2026 brings together university, college, and school participants for a week of challenges, learning, and celebration of mathematical thinking.',
  nmc_cta_label             text not null default 'Explore Events',
  nmc_cta_url               text not null default '/events',
  mission_section_title     text not null default 'Mission and Vision',
  updated_at                timestamptz not null default now()
);

-- 23. about_milestones
create table if not exists public.about_milestones (
  id          uuid primary key default gen_random_uuid(),
  year        text not null,
  title       text not null,
  description text not null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true
);

-- 24. about_highlights
create table if not exists public.about_highlights (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  detail      text not null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true
);

-- 25. about_team_members
create table if not exists public.about_team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  photo_url  text,
  bio        text,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- 26. schedule_sessions
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

-- 27. schedule_day_settings
create table if not exists public.schedule_day_settings (
  id         uuid primary key default gen_random_uuid(),
  day_number integer not null unique,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

-- 28. campus_ambassadors
create table if not exists public.campus_ambassadors (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  role        text,
  institution text,
  department  text,
  designation text,
  bio         text,
  photo_url   text,
  email       text,
  phone       text,
  facebook_url text,
  linkedin_url text,
  is_visible  boolean not null default true,
  is_disabled boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 29. club_partner_categories
create table if not exists public.club_partner_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

-- 30. club_partners
create table if not exists public.club_partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  website_url  text,
  category_id  uuid references public.club_partner_categories(id) on delete set null,
  display_mode text not null default 'both' check (display_mode in ('logo','name','both')),
  logo_size    text not null default 'medium' check (logo_size in ('small','medium','large')),
  is_visible   boolean not null default true,
  sort_order   integer not null default 0
);

-- 31. analytics_events
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

-- 32. admin_users
create table if not exists public.admin_users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text unique not null,
  display_name             text,
  role                     text not null default 'volunteer' check (role in ('super_admin', 'admin', 'moderator', 'registration_editor', 'volunteer')),
  last_login_at            timestamptz,
  created_at               timestamptz not null default now(),
  can_manage_volunteers    boolean not null default false,
  can_manage_registrations boolean not null default false,
  can_manage_kit           boolean not null default false,
  can_manage_presents      boolean not null default false,
  can_manage_lunch         boolean not null default false
);

-- 33. visibility_audit_log
create table if not exists public.visibility_audit_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key  text not null,
  changed_by  text not null,
  old_value   boolean not null,
  new_value   boolean not null,
  changed_at  timestamptz not null default now()
);

-- 34. processed_registrations
create table if not exists public.processed_registrations (
  serial                 text primary key,
  full_name              text,
  email_address          text,
  phone_number           text,
  gender                 text,
  t_shirt_size           text,
  photos                 text,
  level                  text,
  institution            text,
  class_year_student_of  text,
  event                  text,
  payment_method         text,
  payment_number         text,
  transaction_id         text,
  is_kit_coollect        boolean not null default false,
  is_present             boolean not null default false,
  is_collect_launch      boolean not null default false,
  allocated_room         text default null,
  updated_by             text,
  updated_at             timestamptz not null default now(),
  admit_card_url         text
);

-- 35. volunteers
create table if not exists public.volunteers (
  unique_id              text primary key,
  name                   text not null,
  email                  text not null unique,
  number                 text,
  image_url              text,
  segment                text,
  department             text,
  student_id             text,
  year                   text,
  t_shirt_size           text,
  is_present             boolean not null default false,
  is_gift_collected      boolean not null default false,
  is_lunch_collected     boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             text
);

-- 36. location_config
create table if not exists public.location_config (
  id integer primary key default 1 check (id = 1),
  supabase_url text not null,
  supabase_anon_key text not null,
  live_map_enabled boolean default false not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone default now() not null
);

-- 37. users_registry
create table if not exists public.users_registry (
  id uuid primary key,
  name text not null,
  role text not null,
  initialized_at timestamp with time zone default now() not null
);

-- 38. user_locations
create table if not exists public.user_locations (
  user_id uuid references public.users_registry(id) on delete cascade primary key,
  latitude double precision not null,
  longitude double precision not null,
  is_online boolean default true not null,
  updated_at timestamp with time zone default now() not null
);

-- 39. secure_messages
create table if not exists public.secure_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users_registry(id) on delete cascade not null,
  target_type text not null check (target_type in ('unicast', 'multicast', 'broadcast')),
  target_value text,
  message_text text not null,
  created_at timestamp with time zone default now() not null,
  is_read boolean default false not null
);

-- 40. contact_page
create table if not exists public.contact_page (
  id            uuid primary key default gen_random_uuid(),
  hero_title    text not null default 'Contact Us',
  hero_subtitle text not null default 'We would love to hear from you. Reach out with questions or collaboration ideas.',
  form_title    text not null default 'Send a Message',
  form_subtitle text not null default 'We reply within 24-48 hours.',
  recipient_email text,
  location_title text not null default 'Visit the Campus',
  location_body  text not null default 'Dhaka University of Engineering & Technology, Gazipur, Bangladesh.',
  map_embed_url  text,
  social_title  text not null default 'Connect with us',
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 3. Database Indexes
-- =============================================================================
create index if not exists idx_events_slug             on public.events(slug);
create index if not exists idx_events_status           on public.events(status);
create index if not exists idx_events_category         on public.events(category);
create index if not exists idx_notices_visible         on public.notices(is_visible, publish_at, expires_at);
create index if not exists idx_notices_pinned          on public.notices(is_pinned, sort_order);
create index if not exists idx_gallery_visible         on public.gallery_images(is_visible, sort_order);
create index if not exists idx_sponsors_cat            on public.sponsors(category_id, sort_order);
create index if not exists idx_committee_sub           on public.committee_members(sub_committee_id, sort_order);
create index if not exists idx_analytics_created       on public.analytics_events(created_at desc);
create index if not exists idx_analytics_path          on public.analytics_events(page_path);
create index if not exists idx_registrations_ev        on public.event_registrations(event_id, submitted_at desc);
create index if not exists idx_processed_reg_ev        on public.processed_registrations(event);
create index if not exists idx_volunteers_email        on public.volunteers(email);
create index if not exists event_registrations_pub_idx on public.event_registrations(public_id);
create index if not exists event_registrations_email_idx on public.event_registrations(event_id, registrant_email);
create index if not exists event_registrations_phone_idx on public.event_registrations(event_id, registrant_phone);

-- =============================================================================
-- 4. Triggers Configuration
-- =============================================================================
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

create or replace trigger trg_about_page_updated
  before update on public.about_page
  for each row execute function public.set_updated_at();

create or replace trigger trg_contact_page_updated
  before update on public.contact_page
  for each row execute function public.set_updated_at();

create or replace trigger trg_processed_registrations_updated
  before update on public.processed_registrations
  for each row execute function public.set_updated_at();

create or replace trigger trg_volunteers_updated
  before update on public.volunteers
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 5. Row Level Security (RLS) & Access Policies
-- =============================================================================

-- Enable RLS
alter table public.site_settings            enable row level security;
alter table public.advisers                 enable row level security;
alter table public.sub_committees           enable row level security;
alter table public.committee_members        enable row level security;
alter table public.events                   enable row level security;
alter table public.event_faqs               enable row level security;
alter table public.internal_form_sections   enable row level security;
alter table public.internal_form_fields      enable row level security;
alter table public.event_registrations      enable row level security;
alter table public.sponsor_categories       enable row level security;
alter table public.sponsors                 enable row level security;
alter table public.notices                  enable row level security;
alter table public.gallery_categories       enable row level security;
alter table public.gallery_images           enable row level security;
alter table public.contact_persons          enable row level security;
alter table public.contact_submissions      enable row level security;
alter table public.page_sections            enable row level security;
alter table public.page_visibility          enable row level security;
alter table public.nav_links                enable row level security;
alter table public.footer_settings          enable row level security;
alter table public.footer_quick_links       enable row level security;
alter table public.about_page               enable row level security;
alter table public.about_milestones         enable row level security;
alter table public.about_highlights         enable row level security;
alter table public.about_team_members       enable row level security;
alter table public.schedule_sessions        enable row level security;
alter table public.schedule_day_settings    enable row level security;
alter table public.campus_ambassadors       enable row level security;
alter table public.club_partner_categories   enable row level security;
alter table public.club_partners            enable row level security;
alter table public.analytics_events         enable row level security;
alter table public.admin_users              enable row level security;
alter table public.visibility_audit_log      enable row level security;
alter table public.processed_registrations  enable row level security;
alter table public.volunteers               enable row level security;
alter table public.location_config          enable row level security;
alter table public.users_registry           enable row level security;
alter table public.user_locations           enable row level security;
alter table public.secure_messages          enable row level security;
alter table public.contact_page             enable row level security;

-- A. PUBLIC SELECT Policies
create policy "public_read_site_settings"           on public.site_settings for select using (true);
create policy "public_read_advisers"                on public.advisers for select using (is_visible = true and is_disabled = false);
create policy "public_read_sub_committees"          on public.sub_committees for select using (is_visible = true);
create policy "public_read_committee_members"       on public.committee_members for select using (is_visible = true);
create policy "public_read_events"                  on public.events for select using (status = 'published');
create policy "public_read_event_faqs"              on public.event_faqs for select using (true);
create policy "public_read_internal_sections"       on public.internal_form_sections for select using (is_visible = true);
create policy "public_read_internal_fields"         on public.internal_form_fields for select using (is_visible = true);
create policy "public_read_sponsor_categories"      on public.sponsor_categories for select using (is_visible = true);
create policy "public_read_sponsors"                on public.sponsors for select using (is_visible = true);
create policy "public_read_notices"                 on public.notices for select using (is_visible = true and publish_at <= now() and (expires_at is null or expires_at > now()));
create policy "public_read_gallery_categories"      on public.gallery_categories for select using (true);
create policy "public_read_gallery_images"          on public.gallery_images for select using (is_visible = true);
create policy "public_read_contact_persons"         on public.contact_persons for select using (is_visible = true);
create policy "public_read_page_sections"           on public.page_sections for select using (true);
create policy "public_read_page_visibility"         on public.page_visibility for select using (true);
create policy "public_read_nav_links"               on public.nav_links for select using (is_visible = true);
create policy "public_read_footer_settings"         on public.footer_settings for select using (true);
create policy "public_read_footer_quick_links"      on public.footer_quick_links for select using (is_visible = true);
create policy "public_read_about_page"              on public.about_page for select using (true);
create policy "public_read_about_milestones"        on public.about_milestones for select using (is_visible = true);
create policy "public_read_about_highlights"        on public.about_highlights for select using (is_visible = true);
create policy "public_read_about_team"              on public.about_team_members for select using (is_visible = true);
create policy "public_read_schedule_sessions"       on public.schedule_sessions for select using (is_visible = true);
create policy "public_read_schedule_day_settings"   on public.schedule_day_settings for select using (is_visible = true);
create policy "public_read_campus_ambassadors"      on public.campus_ambassadors for select using (is_visible = true and is_disabled = false);
create policy "public_read_club_partner_categories"  on public.club_partner_categories for select using (is_visible = true);
create policy "public_read_club_partners"           on public.club_partners for select using (is_visible = true);
create policy "public_read_contact_page"            on public.contact_page for select using (true);

-- B. PUBLIC INSERT Policies (Anonymous submissions allowed)
create policy "public_insert_analytics"             on public.analytics_events for insert with check (true);
create policy "public_insert_contact_submissions"   on public.contact_submissions for insert with check (true);
create policy "public_insert_event_registrations"   on public.event_registrations for insert with check (true);

-- C. ADMIN ACCESS Policies (Full write permissions for authenticated sessions)
create policy "admin_all_site_settings"             on public.site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_advisers"                  on public.advisers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_sub_committees"            on public.sub_committees for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_committee_members"         on public.committee_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_events"                    on public.events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_event_faqs"                on public.event_faqs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_internal_sections"         on public.internal_form_sections for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_internal_fields"           on public.internal_form_fields for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_event_registrations"       on public.event_registrations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_sponsor_categories"        on public.sponsor_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_sponsors"                  on public.sponsors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_notices"                   on public.notices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_gallery_categories"        on public.gallery_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_gallery_images"            on public.gallery_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_contact_persons"           on public.contact_persons for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_contact_submissions"       on public.contact_submissions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_page_sections"             on public.page_sections for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_page_visibility"           on public.page_visibility for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_nav_links"                 on public.nav_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_footer_settings"           on public.footer_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_footer_quick_links"        on public.footer_quick_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_about_page"                on public.about_page for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_about_milestones"          on public.about_milestones for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_about_highlights"          on public.about_highlights for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_about_team"                on public.about_team_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_schedule_sessions"         on public.schedule_sessions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_schedule_day_settings"     on public.schedule_day_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_campus_ambassadors"        on public.campus_ambassadors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_club_partner_categories"   on public.club_partner_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_club_partners"             on public.club_partners for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_read_analytics"                on public.analytics_events for select using (auth.role() = 'authenticated');
create policy "admin_all_admin_users"               on public.admin_users for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_visibility_audit"          on public.visibility_audit_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_location_config"           on public.location_config for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_contact_page"              on public.contact_page for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- D. PARTICIPANTS & VOLUNTEERS Access Rules
create policy "admin_all_processed_registrations"
  on public.processed_registrations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_all_volunteers"
  on public.volunteers for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
        and (admin_users.role in ('super_admin', 'admin') or admin_users.can_manage_volunteers = true)
    )
  )
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
        and (admin_users.role in ('super_admin', 'admin') or admin_users.can_manage_volunteers = true)
    )
  );

-- E. LIVE LOCATION Security Rules
create policy "Admins can view coordinates"         on public.user_locations for select using (auth.jwt() ->> 'role' in ('admin', 'super_admin'));
create policy "Users can update own coordinate"     on public.user_locations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read relevant private messages"
  on public.secure_messages for select
  using (
    auth.uid() = sender_id
    or target_type = 'broadcast'
    or (target_type = 'multicast' and target_value = (select role from users_registry where id = auth.uid() limit 1))
    or (target_type = 'unicast' and target_value = auth.uid()::text)
  );

create policy "Users can post messages"
  on public.secure_messages for insert
  with check (auth.uid() = sender_id);

-- Enable Supabase Realtime Channels for Live Updates
alter publication supabase_realtime add table user_locations;
alter publication supabase_realtime add table secure_messages;
