-- Add permission columns to admin_users table
alter table public.admin_users add column if not exists can_manage_kit boolean not null default false;
alter table public.admin_users add column if not exists can_manage_presents boolean not null default false;
alter table public.admin_users add column if not exists can_manage_lunch boolean not null default false;
