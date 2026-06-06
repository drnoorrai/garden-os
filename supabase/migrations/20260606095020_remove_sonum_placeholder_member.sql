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
canonical as (
  select
    jsonb_build_array(
      jsonb_build_object('id', noor.id::text, 'name', 'Noor', 'email', noor.email, 'avatarInitials', 'NR'),
      jsonb_build_object('id', sonum.id::text, 'name', 'Sonum', 'email', sonum.email, 'avatarInitials', 'S')
    ) as members,
    jsonb_build_array(noor.id::text, sonum.id::text) as shared_member_ids,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'workspace-noor-sonum',
        'name', 'Noor + Sonum',
        'kind', 'shared',
        'memberIds', jsonb_build_array(noor.id::text, sonum.id::text)
      )
    ) as shared_workspaces
  from noor, sonum
)
update public.shared_garden_data
set data = jsonb_set(
      jsonb_set(data, '{members}', canonical.members, true),
      '{workspaces}',
      coalesce(
        (
          select jsonb_agg(
            case
              when workspace->>'id' = 'workspace-noor-sonum'
                then workspace || jsonb_build_object('memberIds', canonical.shared_member_ids)
              else workspace
            end
          )
          from jsonb_array_elements(coalesce(data->'workspaces', '[]'::jsonb)) workspace
        ),
        canonical.shared_workspaces
      ),
      true
    ),
    updated_at = now()
from canonical
where workspace_id = 'workspace-noor-sonum';

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
canonical as (
  select
    noor.id as noor_id,
    sonum.id as sonum_id,
    jsonb_build_array(
      jsonb_build_object('id', noor.id::text, 'name', 'Noor', 'email', noor.email, 'avatarInitials', 'NR'),
      jsonb_build_object('id', sonum.id::text, 'name', 'Sonum', 'email', sonum.email, 'avatarInitials', 'S')
    ) as members,
    jsonb_build_array(noor.id::text, sonum.id::text) as shared_member_ids
  from noor, sonum
)
update public.garden_data garden
set data = jsonb_set(
      jsonb_set(garden.data, '{members}', canonical.members, true),
      '{workspaces}',
      coalesce(
        (
          select jsonb_agg(
            case
              when workspace->>'id' = 'workspace-my-garden'
                then workspace || jsonb_build_object('memberIds', jsonb_build_array(garden.user_id::text))
              when workspace->>'id' = 'workspace-noor-sonum'
                then workspace || jsonb_build_object('memberIds', canonical.shared_member_ids)
              else workspace
            end
          )
          from jsonb_array_elements(coalesce(garden.data->'workspaces', '[]'::jsonb)) workspace
        ),
        garden.data->'workspaces'
      ),
      true
    ),
    updated_at = now()
from canonical
where garden.user_id in (canonical.noor_id, canonical.sonum_id);
