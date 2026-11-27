-- Keep the community INSERT policy from requiring direct SELECT on businesses.
-- The private helper exposes only an ownership boolean to authenticated members.
create or replace function private.is_business_owner_for_community(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_business_id is not null
    and auth.uid() is not null
    and exists (
      select 1
      from public.businesses b
      where b.id = p_business_id
        and b.owner_id = auth.uid()
    );
$$;

revoke all on function private.is_business_owner_for_community(uuid) from public, anon, authenticated;
grant execute on function private.is_business_owner_for_community(uuid) to authenticated;

drop policy if exists "Miembros pueden crear publicaciones" on public.community_publications;
create policy "Miembros pueden crear publicaciones"
on public.community_publications
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (
    business_id is null
    or (select private.is_business_owner_for_community(business_id))
  )
);
