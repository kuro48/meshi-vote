-- meshi-vote schema
-- All writes go through Hono (service role key, bypasses RLS).
-- Anon key gets SELECT only (for Realtime subscriptions).

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_token text not null,
  phase text not null default 'waiting',
  winning_restaurant_id uuid,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  nickname text not null,
  token text unique not null,
  role text not null default 'voter',
  created_at timestamptz not null default now()
);

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  added_by_id uuid not null references participants(id) on delete cascade,
  name text not null,
  address text,
  photo_url text,
  google_place_id text,
  is_delivery boolean not null default false,
  external_url text,
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(room_id, participant_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  order_text text not null,
  created_at timestamptz not null default now(),
  unique(room_id, participant_id)
);

-- Full row data needed for realtime UPDATE/DELETE events
alter table rooms replica identity full;
alter table participants replica identity full;
alter table restaurants replica identity full;
alter table votes replica identity full;
alter table orders replica identity full;

-- Enable realtime for all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table restaurants;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table orders;

-- RLS: anon can read everything (for Realtime), all writes via service role
alter table rooms enable row level security;
alter table participants enable row level security;
alter table restaurants enable row level security;
alter table votes enable row level security;
alter table orders enable row level security;

create policy "anon can read rooms" on rooms for select to anon using (true);
create policy "anon can read participants" on participants for select to anon using (true);
create policy "anon can read restaurants" on restaurants for select to anon using (true);
create policy "anon can read votes" on votes for select to anon using (true);
create policy "anon can read orders" on orders for select to anon using (true);
