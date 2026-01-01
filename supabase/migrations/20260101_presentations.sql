-- Create presentations table for AI-generated data insights
create table if not exists public.presentations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  template_type text not null check (template_type in ('executive', 'technical', 'progress', 'comparative', 'custom')),
  theme text not null check (theme in ('professional', 'modern', 'minimal', 'dark', 'vibrant')),
  slides jsonb not null default '[]'::jsonb,
  dashboard_ids uuid[] not null default array[]::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_viewed_at timestamp with time zone
);

-- Create indexes
create index if not exists presentations_user_id_idx on public.presentations(user_id);
create index if not exists presentations_created_at_idx on public.presentations(created_at desc);
create index if not exists presentations_is_public_idx on public.presentations(is_public) where is_public = true;

-- Enable RLS
alter table public.presentations enable row level security;

-- RLS Policies
create policy "Users can view their own presentations"
  on public.presentations for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can create their own presentations"
  on public.presentations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own presentations"
  on public.presentations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own presentations"
  on public.presentations for delete
  using (auth.uid() = user_id);

-- Update trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger presentations_updated_at
  before update on public.presentations
  for each row
  execute function public.handle_updated_at();
