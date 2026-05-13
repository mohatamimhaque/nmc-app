-- Allow additional hero modes for the public homepage
alter table public.site_settings
  drop constraint if exists site_settings_hero_mode_check;

alter table public.site_settings
  add constraint site_settings_hero_mode_check
  check (hero_mode in ('image', 'text', 'image_only', 'banner', 'countdown'));
