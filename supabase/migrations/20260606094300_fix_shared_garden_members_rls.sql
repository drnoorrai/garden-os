drop policy if exists "Members can read their shared Garden memberships"
  on public.shared_garden_members;

drop policy if exists "Owners can manage shared Garden memberships"
  on public.shared_garden_members;

create policy "Members can read their own shared Garden memberships"
  on public.shared_garden_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));
