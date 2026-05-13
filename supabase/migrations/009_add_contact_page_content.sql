-- Add Contact page content table
create table if not exists public.contact_page (
  id uuid primary key default gen_random_uuid(),
  hero_title text not null default 'Contact Us',
  hero_subtitle text not null default 'We would love to hear from you. Reach out with questions or collaboration ideas.',
  form_title text not null default 'Send a Message',
  form_subtitle text not null default 'We reply within 24-48 hours.',
  recipient_email text,
  location_title text not null default 'Visit the Campus',
  location_body text not null default 'Dhaka University of Engineering & Technology, Gazipur, Bangladesh.',
  map_embed_url text,
  social_title text not null default 'Connect with us',
  updated_at timestamptz not null default now()
);

alter table public.contact_page enable row level security;

create policy "Public read contact page"
  on public.contact_page
  for select
  using (true);

-- Seed singleton row
insert into public.contact_page (id) values ('00000000-0000-0000-0000-000000000004')
  on conflict (id) do nothing;

-- Seed default section toggles for Contact page
insert into public.page_sections (id, page, section_key, label, is_visible, sort_order)
values
  (gen_random_uuid(), 'contact', 'contact_form', 'Contact Form', true, 1),
  (gen_random_uuid(), 'contact', 'contact_persons', 'Contact Persons', true, 2),
  (gen_random_uuid(), 'contact', 'contact_location', 'Location', true, 3),
  (gen_random_uuid(), 'contact', 'contact_social', 'Social Links', true, 4)
on conflict (section_key) do nothing;
