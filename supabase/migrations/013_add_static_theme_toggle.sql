-- Add static theme toggle to site settings
alter table public.site_settings
  add column if not exists use_static_theme boolean not null default false;

update public.site_settings
  set use_static_theme = false
  where use_static_theme is null;
