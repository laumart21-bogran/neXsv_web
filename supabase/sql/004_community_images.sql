-- ==========================================================
-- neXsv | Comunidad
-- Imágenes de publicaciones: máximo 3 por publicación
-- ==========================================================

create table if not exists public.community_publication_images (
    id uuid primary key default gen_random_uuid(),
    publication_id uuid not null references public.community_publications(id) on delete cascade,
    storage_path text not null unique,
    public_url text not null,
    sort_order smallint not null default 1,
    created_at timestamptz not null default now(),
    constraint community_publication_images_sort_check check (sort_order between 1 and 3)
);

create unique index if not exists idx_community_publication_images_order
    on public.community_publication_images(publication_id, sort_order);

create index if not exists idx_community_publication_images_publication
    on public.community_publication_images(publication_id, sort_order);

alter table public.community_publication_images enable row level security;

drop policy if exists "Miembros pueden ver imágenes de publicaciones" on public.community_publication_images;
create policy "Miembros pueden ver imágenes de publicaciones"
on public.community_publication_images
for select
using (
    exists (
        select 1
        from public.community_publications p
        where p.id = community_publication_images.publication_id
          and (p.status = 'PUBLICADA' or p.author_id = auth.uid())
    )
);

drop policy if exists "Autores pueden agregar imágenes" on public.community_publication_images;
create policy "Autores pueden agregar imágenes"
on public.community_publication_images
for insert
with check (
    exists (
        select 1
        from public.community_publications p
        where p.id = community_publication_images.publication_id
          and p.author_id = auth.uid()
    )
);

drop policy if exists "Autores pueden actualizar imágenes" on public.community_publication_images;
create policy "Autores pueden actualizar imágenes"
on public.community_publication_images
for update
using (
    exists (
        select 1
        from public.community_publications p
        where p.id = community_publication_images.publication_id
          and p.author_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.community_publications p
        where p.id = community_publication_images.publication_id
          and p.author_id = auth.uid()
    )
);

drop policy if exists "Autores pueden eliminar imágenes" on public.community_publication_images;
create policy "Autores pueden eliminar imágenes"
on public.community_publication_images
for delete
using (
    exists (
        select 1
        from public.community_publications p
        where p.id = community_publication_images.publication_id
          and p.author_id = auth.uid()
    )
);

-- Bucket público: las imágenes publicadas deben poder verse en el feed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'community',
    'community',
    true,
    5242880,
    array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Ruta esperada: community/{auth_user_id}/{publication_id}/{uuid.ext}
drop policy if exists "Miembros pueden subir imágenes de comunidad" on storage.objects;
create policy "Miembros pueden subir imágenes de comunidad"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Miembros pueden ver imágenes de comunidad" on storage.objects;
create policy "Miembros pueden ver imágenes de comunidad"
on storage.objects
for select
to public
using (bucket_id = 'community');

drop policy if exists "Autores pueden actualizar imágenes de comunidad" on storage.objects;
create policy "Autores pueden actualizar imágenes de comunidad"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Autores pueden eliminar imágenes de comunidad" on storage.objects;
create policy "Autores pueden eliminar imágenes de comunidad"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = auth.uid()::text
);
