-- Add hero overlay visibility and opacity controls
alter table public.site_settings
  add column if not exists hero_overlay_enabled boolean not null default true,
  add column if not exists hero_overlay_opacity integer not null default 55;
