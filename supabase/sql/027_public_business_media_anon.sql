-- neXsv | Acceso público al material visual de negocios activos
-- Permite que la página pública muestre las imágenes de presentación sin iniciar sesión.

drop policy if exists "Público puede ver material de negocios activos" on public.business_media;

create policy "Público puede ver material de negocios activos"
on public.business_media
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.businesses b
        where b.id = business_media.business_id
          and upper(coalesce(b.estado, '')) = 'ACTIVO'
    )
);

drop policy if exists "Público puede ver archivos de negocios activos" on storage.objects;

create policy "Público puede ver archivos de negocios activos"
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'business-media'
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and upper(coalesce(b.estado, '')) = 'ACTIVO'
    )
);
