-- ============================================================
-- NMC 2026 — Volunteer Management Migration
-- ============================================================

-- Add can_manage_volunteers column to admin_users
alter table public.admin_users add column if not exists can_manage_volunteers boolean not null default false;

-- Create the volunteers table
create table if not exists public.volunteers (
  unique_id              text primary key,
  name                   text not null,
  email                  text not null unique,
  number                 text,
  image_url              text,
  segment                text,
  department             text,
  student_id             text,
  year                   text,
  t_shirt_size           text,
  is_present             boolean not null default false,
  is_gift_collected      boolean not null default false,
  is_lunch_collected     boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             text
);

-- Enable Row Level Security (RLS)
alter table public.volunteers enable row level security;

-- Admin access policy: Allow authenticated admin users with appropriate role/permission full access
create policy "admin_all_volunteers"
  on public.volunteers for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
        and (
          admin_users.role in ('super_admin', 'admin')
          or admin_users.can_manage_volunteers = true
        )
    )
  )
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.id = auth.uid()
        and (
          admin_users.role in ('super_admin', 'admin')
          or admin_users.can_manage_volunteers = true
        )
    )
  );
