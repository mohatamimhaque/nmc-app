-- Add updated_at column to processed_registrations
alter table public.processed_registrations
  add column if not exists updated_at timestamptz default now();

-- Update the update_allocated_rooms RPC function to set updated_at
create or replace function public.update_allocated_rooms(updates jsonb, admin_user text)
returns void as $$
begin
  update public.processed_registrations as p
  set allocated_room = nullif(u.allocated_room, ''),
      updated_by = admin_user,
      updated_at = now()
  from (
    select (x->>'serial')::text as serial, (x->>'allocated_room')::text as allocated_room
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;
