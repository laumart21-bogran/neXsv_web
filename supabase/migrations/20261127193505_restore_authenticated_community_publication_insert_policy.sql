-- Restore the authenticated member INSERT policy in staging and keep environments aligned.
-- A member may create a personal publication; business-linked posts require ownership.
create policy "Miembros pueden crear publicaciones"
on public.community_publications
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (
    business_id is null
    or exists (
      select 1
      from public.businesses b
      where b.id = community_publications.business_id
        and b.owner_id = (select auth.uid())
    )
  )
);
