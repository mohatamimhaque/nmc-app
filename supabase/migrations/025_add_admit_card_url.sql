-- Add admit_card_url column to processed_registrations
alter table public.processed_registrations
  add column if not exists admit_card_url text default null;

-- RPC Database Function for bulk updating admit cards
create or replace function public.update_admit_cards(updates jsonb, admin_user text)
returns void as $$
begin
  update public.processed_registrations as p
  set admit_card_url = nullif(u.admit_card_url, ''),
      updated_by = admin_user,
      updated_at = now()
  from (
    select (x->>'serial')::text as serial, (x->>'admit_card_url')::text as admit_card_url
    from jsonb_array_elements(updates) as x
  ) as u
  where p.serial = u.serial;
end;
$$ language plpgsql security definer;

-- Secure the function execution
revoke execute on function public.update_admit_cards(jsonb, text) from public;
grant execute on function public.update_admit_cards(jsonb, text) to authenticated;
grant execute on function public.update_admit_cards(jsonb, text) to service_role;
