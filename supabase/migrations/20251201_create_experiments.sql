-- Create experiments table
create table if not exists public.experiments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  status text check (status in ('running', 'completed', 'pending', 'failed')) default 'pending',
  type text not null,
  dataset_id uuid references public.datasets(id),
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.experiments enable row level security;

-- Create policies
create policy "Users can view their own experiments"
  on public.experiments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own experiments"
  on public.experiments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own experiments"
  on public.experiments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own experiments"
  on public.experiments for delete
  using (auth.uid() = user_id);

-- Create indexes
create index experiments_user_id_idx on public.experiments(user_id);
create index experiments_status_idx on public.experiments(status);
