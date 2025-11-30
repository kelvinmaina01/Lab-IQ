-- Create datasets table
create table if not exists public.datasets (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  row_count integer,
  column_count integer,
  status text default 'processing'::text check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint datasets_pkey primary key (id)
);

-- Create dataset_columns table (Schema Registry)
create table if not exists public.dataset_columns (
  id uuid not null default gen_random_uuid(),
  dataset_id uuid references public.datasets(id) on delete cascade not null,
  column_name text not null,
  column_index integer not null,
  data_type text not null,
  nullable boolean default true,
  unique_values_count integer,
  sample_values jsonb,
  stats jsonb, -- Store min, max, mean, etc. as JSON
  created_at timestamp with time zone default now(),
  constraint dataset_columns_pkey primary key (id)
);

-- Create dataset_rows table (The actual data)
-- Storing data as JSONB for flexibility with different schemas
create table if not exists public.dataset_rows (
  id uuid not null default gen_random_uuid(),
  dataset_id uuid references public.datasets(id) on delete cascade not null,
  row_index integer not null,
  data jsonb not null,
  created_at timestamp with time zone default now(),
  constraint dataset_rows_pkey primary key (id)
);

-- Create dataset_quality table
create table if not exists public.dataset_quality (
  id uuid not null default gen_random_uuid(),
  dataset_id uuid references public.datasets(id) on delete cascade not null,
  completeness_score numeric,
  consistency_score numeric,
  accuracy_score numeric,
  overall_score numeric,
  missing_values_count integer,
  duplicate_rows_count integer,
  outliers_count integer,
  issues jsonb,
  created_at timestamp with time zone default now(),
  constraint dataset_quality_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.datasets enable row level security;
alter table public.dataset_columns enable row level security;
alter table public.dataset_rows enable row level security;
alter table public.dataset_quality enable row level security;

-- Create policies
create policy "Users can view their own datasets" on public.datasets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own datasets" on public.datasets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own datasets" on public.datasets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own datasets" on public.datasets
  for delete using (auth.uid() = user_id);

-- Columns policies (inherit access from dataset)
create policy "Users can view columns of their datasets" on public.dataset_columns
  for select using (
    exists ( select 1 from public.datasets d where d.id = dataset_columns.dataset_id and d.user_id = auth.uid() )
  );

create policy "Users can insert columns for their datasets" on public.dataset_columns
  for insert with check (
    exists ( select 1 from public.datasets d where d.id = dataset_columns.dataset_id and d.user_id = auth.uid() )
  );

-- Rows policies
create policy "Users can view rows of their datasets" on public.dataset_rows
  for select using (
    exists ( select 1 from public.datasets d where d.id = dataset_rows.dataset_id and d.user_id = auth.uid() )
  );

create policy "Users can insert rows for their datasets" on public.dataset_rows
  for insert with check (
    exists ( select 1 from public.datasets d where d.id = dataset_rows.dataset_id and d.user_id = auth.uid() )
  );

-- Quality policies
create policy "Users can view quality metrics of their datasets" on public.dataset_quality
  for select using (
    exists ( select 1 from public.datasets d where d.id = dataset_quality.dataset_id and d.user_id = auth.uid() )
  );

create policy "Users can insert quality metrics for their datasets" on public.dataset_quality
  for insert with check (
    exists ( select 1 from public.datasets d where d.id = dataset_quality.dataset_id and d.user_id = auth.uid() )
  );

-- Create indexes for performance
create index if not exists idx_datasets_user_id on public.datasets(user_id);
create index if not exists idx_dataset_columns_dataset_id on public.dataset_columns(dataset_id);
create index if not exists idx_dataset_rows_dataset_id on public.dataset_rows(dataset_id);
create index if not exists idx_dataset_rows_row_index on public.dataset_rows(dataset_id, row_index);
