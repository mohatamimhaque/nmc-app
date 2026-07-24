-- Add public volunteer visibility controls
insert into public.page_visibility (page_key, label, route, is_visible)
values 
  ('volunteer_show', 'Public Volunteer Show Page', '/volunteer/[unique_id]', true),
  ('volunteer_add_modal', 'Public Volunteer Add Modal', '/volunteer', false)
on conflict (page_key) do nothing;

-- Add a public volunteer navigation link
insert into public.nav_links (label, url, is_visible, sort_order)
values ('Volunteer', '/volunteer', false, 15)
on conflict do nothing;
