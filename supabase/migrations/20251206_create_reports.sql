create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  type text not null,
  format text not null,
  status text default 'draft',
  compliance_standard text,
  dataset_id uuid references datasets(id),
  config jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reports enable row level security;

create policy "Users can view their own reports"
  on reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on reports for update
  using (auth.uid() = user_id);

-- Create a mock function to simulate report generation processing
create or replace function process_report(report_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- In a real app, this would trigger a background job.
  -- Here we just update status to 'published' after a delay (simulated by frontend or cron)
  -- For now, we'll just set it to 'published' immediately for demo specific flows if needed.
  update reports set status = 'published' where id = report_id;
end;
$$;
