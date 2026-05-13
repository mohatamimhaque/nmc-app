-- Add competition profile fields to site_settings
alter table public.site_settings
  add column if not exists competition_name text not null default 'Competition',
  add column if not exists competition_slug text not null default 'competition',
  add column if not exists competition_category text not null default 'General Competition',
  add column if not exists competition_season text,
  add column if not exists competition_location text,
  add column if not exists organiser_name text,
  add column if not exists organiser_tagline text;
