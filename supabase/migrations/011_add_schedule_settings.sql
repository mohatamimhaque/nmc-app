-- Add schedule PDF URL to site settings
alter table public.site_settings
  add column if not exists schedule_pdf_url text;

-- Schedule day visibility and ordering settings
create table if not exists public.schedule_day_settings (
  id         uuid primary key default gen_random_uuid(),
  day_number integer not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

create unique index if not exists schedule_day_settings_day_number_key
  on public.schedule_day_settings(day_number);

alter table public.schedule_day_settings enable row level security;

drop policy if exists "public_read_schedule_day_settings" on public.schedule_day_settings;
drop policy if exists "admin_all_schedule_day_settings" on public.schedule_day_settings;

create policy "public_read_schedule_day_settings"
  on public.schedule_day_settings for select using (is_visible = true);

create policy "admin_all_schedule_day_settings"
  on public.schedule_day_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
