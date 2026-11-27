-- Allow members to edit or soft-delete only their own community publications.
-- The same ownership guard used on INSERT remains in place for business-linked posts.
create policy "Autores pueden actualizar publicaciones propias"
on public.community_publications
for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and (
    business_id is null
    or (select private.is_business_owner_for_community(business_id))
  )
);
