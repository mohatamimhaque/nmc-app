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
