-- ============================================================
-- NMC 2026 — Add Admit Card Nav Link Migration
-- ============================================================

-- Safely insert the Admit Card navigation link if it doesn't already exist
insert into public.nav_links (label, url, sort_order)
select 'Admit Card', '/admit-card', 10
where not exists (
  select 1 from public.nav_links where url = '/admit-card'
);
