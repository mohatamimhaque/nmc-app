-- Add registration_editor role to admin_users check constraint
alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('super_admin', 'admin', 'moderator', 'registration_editor'));
