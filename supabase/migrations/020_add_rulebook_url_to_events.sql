-- Add rulebook_url to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rulebook_url text;
