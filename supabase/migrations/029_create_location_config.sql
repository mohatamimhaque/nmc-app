-- Create Location System Configuration table (Guarantees exactly one row)
create table public.location_config (
  id integer primary key default 1 check (id = 1),
  supabase_url text not null,
  supabase_anon_key text not null,
  live_map_enabled boolean default false not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.location_config enable row level security;

-- Admin read/write access policy
create policy "admin_all_location_config"
  on public.location_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed initial row (optional placeholder)
insert into public.location_config (id, supabase_url, supabase_anon_key, live_map_enabled)
values (1, 'https://placeholder-url.supabase.co', 'placeholder-anon-key', false)
on conflict do nothing;
