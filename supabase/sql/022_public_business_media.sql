-- neXsv | Material visual público de negocios
-- Los miembros autenticados pueden ver fotos de negocios activos.

drop policy if exists "Propietarios pueden ver material de sus negocios" on public.business_media;

create policy "Miembros pueden ver material de negocios activos"
on public.business_media
for select
to authenticated
using (
    exists (
        select 1 from public.businesses b
        where b.id = business_media.business_id
          and upper(coalesce(b.estado, '')) = 'ACTIVO'
    )
);

drop policy if exists "Propietarios pueden ver material de negocio" on storage.objects;

create policy "Miembros pueden ver material de negocios activos"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'business-media'
    and exists (
        select 1 from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and upper(coalesce(b.estado, '')) = 'ACTIVO'
    )
);
