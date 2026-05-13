-- Add optional countdown date for the hero section
alter table public.site_settings
  add column if not exists hero_countdown_date timestamptz;
