create table if not exists public.garden_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.garden_data enable row level security;

grant select, insert, update, delete on table public.garden_data to authenticated;

create policy "Users can read their own Garden data"
  on public.garden_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own Garden data"
  on public.garden_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own Garden data"
  on public.garden_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own Garden data"
  on public.garden_data
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_garden_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_garden_data_updated_at on public.garden_data;

create trigger set_garden_data_updated_at
  before update on public.garden_data
  for each row
  execute function public.set_garden_data_updated_at();
