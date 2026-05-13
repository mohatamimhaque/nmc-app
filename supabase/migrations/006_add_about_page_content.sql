-- Add About page content tables
create table if not exists public.about_page (
  id uuid primary key default gen_random_uuid(),
  hero_title text not null default 'About NMC 2026',
  hero_subtitle text not null default 'Learn about the Math Club at DUET and the people building NMC 2026.',
  overview_title text not null default 'Math Club, DUET',
  overview_body text not null default 'Math Club, DUET is a student led community focused on discovery, contest preparation, and collaborative problem solving.',
  mission_title text not null default 'Mission',
  mission_body text not null default 'Equip students with rigorous problem solving skills, mentorship, and access to competitive mathematics experiences.',
  vision_title text not null default 'Vision',
  vision_body text not null default 'Grow a nationwide network of learners who use mathematics to explore, innovate, and lead in their communities.',
  team_title text not null default 'Organizing Team',
  team_subtitle text not null default 'Meet the students and mentors behind NMC 2026.',
  committee_cta_label text not null default 'See Full Committee',
  committee_cta_url text not null default '/committee',
  advisers_title text not null default 'Faculty and Mentors',
  advisers_subtitle text not null default 'Guidance from faculty and professional advisers.',
  advisers_cta_label text not null default 'Meet the Advisers',
  advisers_cta_url text not null default '/advisers',
  milestones_title text not null default 'Milestones',
  milestones_subtitle text not null default 'Key moments in the journey so far.',
  past_events_title text not null default 'Past Events',
  past_events_subtitle text not null default 'Highlights from previous programs and workshops.',
  past_events_cta_label text not null default 'View Gallery',
  past_events_cta_url text not null default '/gallery',
  updated_at timestamptz not null default now()
);

create table if not exists public.about_milestones (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text not null,
  sort_order integer not null default 0
);

create table if not exists public.about_highlights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  sort_order integer not null default 0
);

-- Seed singleton row
insert into public.about_page (id) values ('00000000-0000-0000-0000-000000000003')
  on conflict (id) do nothing;


-- Add visibility toggles for About milestones and highlights
alter table public.about_milestones
  add column if not exists is_visible boolean not null default true;

alter table public.about_highlights
  add column if not exists is_visible boolean not null default true;


-- Add additional About page content fields for full copy control
alter table public.about_page
  add column if not exists overview_section_title text not null default 'Organisation Overview',
  add column if not exists overview_section_subtitle text not null default 'Building a community for mathematics and problem solvers.',
  add column if not exists nmc_title text not null default 'National Mathematics Carnival',
  add column if not exists nmc_eyebrow text not null default 'NMC 2026',
  add column if not exists nmc_body text not null default 'NMC 2026 brings together university, college, and school participants for a week of challenges, learning, and celebration of mathematical thinking.',
  add column if not exists nmc_cta_label text not null default 'Explore Events',
  add column if not exists nmc_cta_url text not null default '/events',
  add column if not exists mission_section_title text not null default 'Mission and Vision';
