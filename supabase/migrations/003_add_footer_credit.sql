-- Add developer credit fields to footer settings
alter table public.footer_settings
  add column if not exists developer_credit_text text,
  add column if not exists developer_credit_url text;
