-- Add hero carousel images for homepage hero rotation
alter table public.site_settings
  add column if not exists hero_carousel_images text[] not null default '{}'::text[];
