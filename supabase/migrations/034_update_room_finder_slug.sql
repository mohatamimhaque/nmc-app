-- ============================================================
-- NMC 2026 — Update Room Finder Slug to Seat Location
-- ============================================================

-- Update page_visibility route for room_finder
update public.page_visibility
set route = '/seat-location'
where page_key = 'room_finder';

-- Update nav_links url for the Find Room link
update public.nav_links
set url = '/seat-location'
where url = '/room-finder';
