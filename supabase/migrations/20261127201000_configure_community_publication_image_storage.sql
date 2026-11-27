-- Create the public-read bucket used by community publication photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Uploads are restricted to the authenticated user's own publication folder.
create policy "Miembros pueden subir fotos de publicaciones propias"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.community_publications p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = (select auth.uid())
  )
);

create policy "Miembros pueden eliminar fotos de publicaciones propias"
on storage.objects for delete to authenticated
using (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.community_publications p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = (select auth.uid())
  )
);

create policy "Miembros pueden actualizar fotos de publicaciones propias"
on storage.objects for update to authenticated
using (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.community_publications p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'community'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.community_publications p
    where p.id::text = (storage.foldername(name))[2]
      and p.author_id = (select auth.uid())
  )
);