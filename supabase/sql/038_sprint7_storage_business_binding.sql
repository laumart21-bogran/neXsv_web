-- ==========================================================
-- neXsv | Sprint 7.2 — Storage: vincular archivo con negocio
-- ==========================================================
-- Rutas utilizadas por la aplicación:
--   business-media/{user_id}/{business_id}/archivo
--   business-logos/{user_id}/{business_id}/archivo
--
-- La política no se limita a comprobar que el primer segmento sea
-- el usuario: también comprueba que el segundo segmento sea un
-- negocio realmente perteneciente a ese usuario.
-- ==========================================================

-- ----------------------------------------------------------
-- business-media
-- ----------------------------------------------------------

drop policy if exists "Propietarios pueden subir material de negocio" on storage.objects;
create policy "Propietarios pueden subir material de negocio"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "Propietarios pueden ver material de negocio" on storage.objects;
create policy "Propietarios pueden ver material de negocio"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'business-media'
    and (
        (
            (storage.foldername(name))[1] = auth.uid()::text
            and exists (
                select 1
                from public.businesses b
                where b.id::text = (storage.foldername(name))[2]
                  and b.owner_id = auth.uid()
            )
        )
        or exists (
            select 1
            from public.businesses b
            where b.id::text = (storage.foldername(name))[2]
              and upper(coalesce(b.estado, '')) = 'ACTIVO'
        )
    )
);

drop policy if exists "Propietarios pueden eliminar material de negocio" on storage.objects;
create policy "Propietarios pueden eliminar material de negocio"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
);

-- ----------------------------------------------------------
-- business-logos
-- ----------------------------------------------------------

drop policy if exists "business owners upload logos" on storage.objects;
create policy "business owners upload logos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "business owners update logos" on storage.objects;
create policy "business owners update logos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
)
with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "business owners delete logos" on storage.objects;
create policy "business owners delete logos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
        select 1
        from public.businesses b
        where b.id::text = (storage.foldername(name))[2]
          and b.owner_id = auth.uid()
    )
);
