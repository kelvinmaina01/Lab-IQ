-- Migration: Create leaderboard_snapshots table
-- Description: Stores daily snapshots of user rankings to calculate trends (up/down/same).

create table if not exists public.leaderboard_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  lab_id uuid references public.lab_profiles(id), -- Optional: if specific to a lab
  score integer not null,
  rank integer not null,
  snapshot_date date not null default current_date,
  metadata jsonb default '{}'::jsonb, -- Store breakdown: { experiments: 10, datasets: 5 }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one snapshot per user per day
  unique(user_id, snapshot_date)
);

-- Enable RLS
alter table public.leaderboard_snapshots enable row level security;

-- Policy: Everyone can read snapshots (for leaderboard history)
create policy "Everyone can read leaderboard snapshots"
  on public.leaderboard_snapshots for select
  using (true);

-- Policy: Service role or specific logic for insertion (for now, allow authenticated users to potentially trigger their own snapshot or rely on backend cron)
-- In a real scenario, this would be a CRON job. For this "Big Tech" demo, we might trigger it via Edge Function or lazy-creation.
create policy "Server can insert snapshots"
  on public.leaderboard_snapshots for insert
  with check (true); 
