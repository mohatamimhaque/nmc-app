-- ============================================================
-- NMC 2026 — Processed Registrations Migration
-- ============================================================

-- Create the table
create table if not exists public.processed_registrations (
  serial                 text primary key,
  full_name              text,
  email_address          text,
  phone_number           text,
  gender                 text,
  t_shirt_size           text,
  photos                 text,
  level                  text,
  institution            text,
  class_year_student_of  text,
  event                  text,
  payment_method         text,
  payment_number         text,
  transaction_id         text,
  is_kit_coollect        boolean not null default false,
  is_present             boolean not null default false,
  is_collect_launch      boolean not null default false,
  allocated_room         text default null
);

-- Enable Row Level Security (RLS)
alter table public.processed_registrations enable row level security;

-- Admin access policy: Allow authenticated admin users full access
create policy "admin_all_processed_registrations"
  on public.processed_registrations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- RPC Database Function for bulk updating room allocations
create or replace function public.update_allocated_rooms(updates jsonb)
returns void as $$
begin
  update public.processed_registrations as p
  set allocated_room = nullif(u.allocated_room, '')
  from (
    select (x->>'serial')::text as serial, (x->>'allocated_room')::text as allocated_room
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;

-- Secure the function execution
revoke execute on function public.update_allocated_rooms(jsonb) from public;
grant execute on function public.update_allocated_rooms(jsonb) to authenticated;
grant execute on function public.update_allocated_rooms(jsonb) to service_role;
