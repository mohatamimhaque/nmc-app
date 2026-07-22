-- ============================================================
-- NMC 2026 — Add Room Finder Page & Nav Link Migration
-- ============================================================

-- Insert into page_visibility if not existing
insert into public.page_visibility (page_key, label, route, is_visible)
select 'room_finder', 'Find Room', '/room-finder', true
where not exists (
  select 1 from public.page_visibility where page_key = 'room_finder'
);

-- Insert into nav_links if not existing
insert into public.nav_links (label, url, sort_order, is_visible, is_external, is_cta)
select 'Find Room', '/room-finder', 12, true, false, false
where not exists (
  select 1 from public.nav_links where url = '/room-finder'
);
