-- 1. Create Users Registry Table
create table public.users_registry (
  id uuid primary key, -- References Auth UID from the main database
  name text not null,
  role text not null, -- Stores team segment (e.g. 'Logistics', 'Registration', 'PR', 'Admin')
  initialized_at timestamp with time zone default now() not null
);

-- 2. Create Live Coordinates Table
create table public.user_locations (
  user_id uuid references public.users_registry(id) on delete cascade primary key,
  latitude double precision not null,
  longitude double precision not null,
  is_online boolean default true not null,
  updated_at timestamp with time zone default now() not null
);

-- 3. Create Secure Messaging Table
create table public.secure_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users_registry(id) on delete cascade not null,
  target_type text not null check (target_type in ('unicast', 'multicast', 'broadcast')),
  target_value text, -- Recipient user_id (unicast), Segment name (multicast), or 'all' (broadcast)
  message_text text not null,
  created_at timestamp with time zone default now() not null,
  is_read boolean default false not null
);

-- 4. Enable Supabase Realtime Channels for Live Updates
alter publication supabase_realtime add table user_locations;
alter publication supabase_realtime add table secure_messages;

-- 5. Enable Row Level Security (RLS)
alter table public.user_locations enable row level security;
alter table public.secure_messages enable row level security;

-- 6. Apply Location Security Policies
create policy "Admins can view coordinates"
  on public.user_locations
  for select
  using (
    auth.jwt() ->> 'role' in ('admin', 'super_admin')
  );

create policy "Users can update own coordinate"
  on public.user_locations
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 7. Apply Messaging Security Policies
create policy "Users can read relevant private messages"
  on public.secure_messages
  for select
  using (
    auth.uid() = sender_id
    or target_type = 'broadcast'
    or (target_type = 'multicast' and target_value = (select role from users_registry where id = auth.uid() limit 1))
    or (target_type = 'unicast' and target_value = auth.uid()::text)
  );

create policy "Users can post messages"
  on public.secure_messages
  for insert
  with check (
    auth.uid() = sender_id
  );