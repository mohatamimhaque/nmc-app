-- Add campus ambassadors and club partners

create table if not exists public.campus_ambassadors (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  institution text,
  department text,
  designation text,
  bio text,
  photo_url text,
  email text,
  phone text,
  facebook_url text,
  linkedin_url text,
  is_visible boolean not null default true,
  is_disabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_partner_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.club_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  category_id uuid references public.club_partner_categories(id) on delete set null,
  display_mode text not null default 'both' check (display_mode in ('logo','name','both')),
  logo_size text not null default 'medium' check (logo_size in ('small','medium','large')),
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

insert into public.page_visibility (page_key, label, route) values
  ('campus_ambassadors', 'Campus Ambassadors', '/campus-ambassadors'),
  ('club_partners', 'Club Partners', '/club-partners')
on conflict (page_key) do nothing;

insert into public.nav_links (label, url, sort_order)
values
  ('Campus Ambassadors', '/campus-ambassadors', 10),
  ('Club Partners', '/club-partners', 11)
on conflict do nothing;

alter table public.campus_ambassadors enable row level security;
alter table public.club_partner_categories enable row level security;
alter table public.club_partners enable row level security;

create policy "public_read_campus_ambassadors"
  on public.campus_ambassadors for select using (is_visible = true and is_disabled = false);

create policy "public_read_club_partner_categories"
  on public.club_partner_categories for select using (is_visible = true);

create policy "public_read_club_partners"
  on public.club_partners for select using (is_visible = true);

create policy "admin_all_campus_ambassadors"
  on public.campus_ambassadors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_club_partner_categories"
  on public.club_partner_categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_club_partners"
  on public.club_partners for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
