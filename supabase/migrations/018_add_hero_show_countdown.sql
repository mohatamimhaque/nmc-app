alter table if exists public.site_settings
add column if not exists hero_show_countdown boolean not null default true;
