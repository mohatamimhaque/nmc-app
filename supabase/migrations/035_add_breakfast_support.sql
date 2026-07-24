-- Alter processed_registrations table to add breakfast collection flag
alter table public.processed_registrations 
  add column if not exists is_collect_breakfast boolean not null default false;

-- Alter admin_users table to add breakfast management permission
alter table public.admin_users 
  add column if not exists can_manage_breakfast boolean not null default false;
