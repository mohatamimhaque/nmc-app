alter table if exists public.site_settings
add column if not exists math_rain_enabled boolean not null default true,
add column if not exists math_rain_speed numeric not null default 12,
add column if not exists math_rain_color text not null default 'rgba(79,70,229,0.18)',
add column if not exists math_rain_size numeric not null default 20,
add column if not exists math_rain_count integer not null default 24;