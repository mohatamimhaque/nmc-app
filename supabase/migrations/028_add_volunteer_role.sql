-- Drop and recreate constraint to allow 'volunteer' role
alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'admin', 'moderator', 'registration_editor', 'volunteer'));

-- Add can_manage_registrations column to admin_users
alter table public.admin_users add column if not exists can_manage_registrations boolean not null default false;
