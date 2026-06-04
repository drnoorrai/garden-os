create table if not exists public.shared_garden_data (
  workspace_id text primary key,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_garden_members (
  workspace_id text not null references public.shared_garden_data(workspace_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.shared_garden_data enable row level security;
alter table public.shared_garden_members enable row level security;

grant select, insert, update, delete on table public.shared_garden_data to authenticated;
grant select, insert, update, delete on table public.shared_garden_members to authenticated;

create policy "Members can read shared Garden data"
  on public.shared_garden_data
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_garden_members member
      where member.workspace_id = shared_garden_data.workspace_id
        and member.user_id = (select auth.uid())
    )
  );

create policy "Members can update shared Garden data"
  on public.shared_garden_data
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shared_garden_members member
      where member.workspace_id = shared_garden_data.workspace_id
        and member.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.shared_garden_members member
      where member.workspace_id = shared_garden_data.workspace_id
        and member.user_id = (select auth.uid())
    )
  );

create policy "Creators can insert shared Garden data"
  on public.shared_garden_data
  for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

create policy "Creators can delete shared Garden data"
  on public.shared_garden_data
  for delete
  to authenticated
  using ((select auth.uid()) = created_by);

create policy "Members can read their shared Garden memberships"
  on public.shared_garden_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.shared_garden_members peer
      where peer.workspace_id = shared_garden_members.workspace_id
        and peer.user_id = (select auth.uid())
    )
  );

create policy "Owners can manage shared Garden memberships"
  on public.shared_garden_members
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shared_garden_members owner_member
      where owner_member.workspace_id = shared_garden_members.workspace_id
        and owner_member.user_id = (select auth.uid())
        and owner_member.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.shared_garden_members owner_member
      where owner_member.workspace_id = shared_garden_members.workspace_id
        and owner_member.user_id = (select auth.uid())
        and owner_member.role = 'owner'
    )
  );

create or replace function public.set_shared_garden_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shared_garden_data_updated_at on public.shared_garden_data;

create trigger set_shared_garden_data_updated_at
  before update on public.shared_garden_data
  for each row
  execute function public.set_shared_garden_data_updated_at();

with noor as (
  select id, email
  from auth.users
  where lower(email) = lower('noor.rai.ca@gmail.com')
  limit 1
),
sonum as (
  select id, email
  from auth.users
  where lower(email) = lower('so.samra@gmail.com')
  limit 1
),
owner_data as (
  select gd.data
  from public.garden_data gd
  join noor on noor.id = gd.user_id
),
shared_payload as (
  select jsonb_build_object(
    'members', jsonb_build_array(
      jsonb_build_object('id', noor.id::text, 'name', 'Noor', 'email', noor.email, 'avatarInitials', 'NR'),
      jsonb_build_object('id', sonum.id::text, 'name', 'Sonum', 'email', sonum.email, 'avatarInitials', 'S')
    ),
    'workspaces', jsonb_build_array(
      jsonb_build_object(
        'id', 'workspace-noor-sonum',
        'name', 'Noor + Sonum',
        'kind', 'shared',
        'memberIds', jsonb_build_array(noor.id::text, sonum.id::text)
      )
    ),
    'workItems', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'workItems', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'relationships', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'relationships', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'sources', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'fieldNotes', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'fieldNotes', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectNotes', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectNotes', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectLinks', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectLinks', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectRelations', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectRelations', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectActivity', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectActivity', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectNextActions', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectNextActions', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'taskGardenItems', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'taskGardenItems', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb),
    'objectComments', coalesce((select jsonb_agg(item) from owner_data, jsonb_array_elements(coalesce(owner_data.data->'objectComments', '[]'::jsonb)) item where item->>'workspaceId' = 'workspace-noor-sonum'), '[]'::jsonb)
  ) as data
  from noor, sonum
)
insert into public.shared_garden_data (workspace_id, name, data, created_by)
select 'workspace-noor-sonum', 'Noor + Sonum', shared_payload.data, noor.id
from noor, shared_payload
on conflict (workspace_id) do update
set name = excluded.name,
    data = excluded.data;

with noor as (
  select id, email
  from auth.users
  where lower(email) = lower('noor.rai.ca@gmail.com')
  limit 1
),
sonum as (
  select id, email
  from auth.users
  where lower(email) = lower('so.samra@gmail.com')
  limit 1
)
insert into public.shared_garden_members (workspace_id, user_id, email, role)
select 'workspace-noor-sonum', noor.id, noor.email, 'owner' from noor
union all
select 'workspace-noor-sonum', sonum.id, sonum.email, 'partner' from sonum
on conflict (workspace_id, user_id) do update
set email = excluded.email,
    role = excluded.role;
