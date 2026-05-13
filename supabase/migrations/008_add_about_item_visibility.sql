-- Add visibility toggles for About milestones and highlights
alter table public.about_milestones
  add column if not exists is_visible boolean not null default true;

alter table public.about_highlights
  add column if not exists is_visible boolean not null default true;
