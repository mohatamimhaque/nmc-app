-- ============================================================
-- NMC 2026 — Add Updated By Admin Column
-- ============================================================

-- Add the updated_by column to the table
alter table public.processed_registrations add column if not exists updated_by text;

-- Update the RPC Database Function for bulk updating room allocations to also store who updated them
create or replace function public.update_allocated_rooms(updates jsonb, admin_user text)
returns void as $$
begin
  update public.processed_registrations as p
  set allocated_room = nullif(u.allocated_room, ''),
      updated_by = admin_user
  from (
    select (x->>'serial')::text as serial, (x->>'allocated_room')::text as allocated_room
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;

-- Secure the function execution
revoke execute on function public.update_allocated_rooms(jsonb, text) from public;
grant execute on function public.update_allocated_rooms(jsonb, text) to authenticated;
grant execute on function public.update_allocated_rooms(jsonb, text) to service_role;
