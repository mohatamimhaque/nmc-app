-- ============================================================
-- 16. Internal form builder upgrades + registration tracking
-- ============================================================

-- Sections for multi-step internal forms
create table if not exists public.internal_form_sections (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  title       text not null,
  description text,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0
);

-- Expand internal form fields
alter table public.internal_form_fields
  drop constraint if exists internal_form_fields_field_type_check;

alter table public.internal_form_fields
  add column if not exists section_id uuid references public.internal_form_sections(id) on delete set null,
  add column if not exists helper_text text,
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists validation jsonb not null default '{}'::jsonb,
  add column if not exists logic jsonb not null default '[]'::jsonb,
  add column if not exists is_visible boolean not null default true;

update public.internal_form_fields
  set field_type = case field_type
    when 'text' then 'short'
    when 'select' then 'dropdown'
    when 'file' then 'file'
    when 'email' then 'email'
    when 'number' then 'number'
    else field_type
  end
where field_type in ('text','select','file','email','number');

alter table public.internal_form_fields
  add constraint internal_form_fields_field_type_check
  check (field_type in (
    'short',
    'paragraph',
    'mcq',
    'checkbox',
    'dropdown',
    'date',
    'time',
    'number',
    'email',
    'phone',
    'file',
    'grid_radio',
    'grid_checkbox'
  ));

-- Registration limits on events
alter table public.events
  add column if not exists registration_limit_total integer,
  add column if not exists registration_limit_per_email boolean not null default false,
  add column if not exists registration_limit_per_phone boolean not null default false;

-- Registration tracking fields
alter table public.event_registrations
  add column if not exists public_id text,
  add column if not exists registrant_email text,
  add column if not exists registrant_phone text;

create unique index if not exists event_registrations_public_id_key
  on public.event_registrations(public_id);

create index if not exists event_registrations_event_email_idx
  on public.event_registrations(event_id, registrant_email);

create index if not exists event_registrations_event_phone_idx
  on public.event_registrations(event_id, registrant_phone);
