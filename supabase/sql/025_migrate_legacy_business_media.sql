-- ==========================================================
-- neXsv | Migración controlada de fotografías históricas
-- LMarketing + MovuX
-- ==========================================================
-- Este script NO elimina fotografías ni registros existentes.
-- Crea una ruta separada "migration/{business_id}/..." para
-- los medios históricos que todavía no tienen propietario.
-- El acceso de migración queda limitado al propietario actual
-- de Motion21 y únicamente a estos dos negocios.

alter table public.business_media
    alter column owner_id drop not null;

-- ----------------------------------------------------------
-- Detalle público del negocio
-- ----------------------------------------------------------
create or replace function public.get_public_business_detail(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    business_data jsonb;
begin
    select to_jsonb(b) - 'owner_id'
      into business_data
      from public.businesses b
     where b.id = p_business_id
       and upper(coalesce(b.estado,'')) = 'ACTIVO';

    if business_data is null then
        raise exception 'BUSINESS_NOT_FOUND';
    end if;

    return business_data;
end;
$$;

revoke all on function public.get_public_business_detail(uuid) from public;
grant execute on function public.get_public_business_detail(uuid) to anon, authenticated;

-- ----------------------------------------------------------
-- Lectura pública de medios de negocios activos
-- Necesaria para que la página pública pueda generar URLs
-- firmadas sin exigir que el visitante tenga cuenta.
-- ----------------------------------------------------------
drop policy if exists "Miembros pueden ver material de negocios activos" on public.business_media;

create policy "Visitantes pueden ver material de negocios activos"
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

drop policy if exists "Miembros pueden ver material de negocios activos" on storage.objects;

create policy "Visitantes pueden ver material de negocios activos"
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

-- ----------------------------------------------------------
-- Inserción controlada de filas históricas
-- owner_id queda NULL hasta que el propietario reclame
-- el negocio mediante el sistema de invitaciones.
-- ----------------------------------------------------------
drop policy if exists "Migración controlada de material histórico" on public.business_media;

create policy "Migración controlada de material histórico"
on public.business_media
for insert
to authenticated
with check (
    owner_id is null
    and tipo = 'FOTO'
    and (storage.foldername(storage_path))[1] = 'migration'
    and business_id in (
        '3007d57a-d04e-48ee-a4d6-f434ce0ff0d0'::uuid,
        'afa06334-d6ee-417f-aef8-ca11cd11773c'::uuid
    )
    and auth.uid() = (
        select b.owner_id
        from public.businesses b
        where b.id = 'd049bed8-26c2-4590-9922-c3acfd365ae2'::uuid
    )
);

-- ----------------------------------------------------------
-- Upload de archivos históricos.
-- La primera carpeta debe ser "migration" y la segunda el
-- business_id. Solo el propietario actual de Motion21 puede
-- ejecutar esta migración.
-- ----------------------------------------------------------
drop policy if exists "Migración controlada de archivos históricos" on storage.objects;

create policy "Migración controlada de archivos históricos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'migration'
    and (storage.foldername(name))[2] in (
        '3007d57a-d04e-48ee-a4d6-f434ce0ff0d0',
        'afa06334-d6ee-417f-aef8-ca11cd11773c'
    )
    and auth.uid() = (
        select b.owner_id
        from public.businesses b
        where b.id = 'd049bed8-26c2-4590-9922-c3acfd365ae2'::uuid
    )
);

-- Supabase puede necesitar SELECT para devolver los metadatos
-- del objeto recién creado durante el upload.
drop policy if exists "Migración controlada puede leer archivos" on storage.objects;

create policy "Migración controlada puede leer archivos"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = 'migration'
    and (storage.foldername(name))[2] in (
        '3007d57a-d04e-48ee-a4d6-f434ce0ff0d0',
        'afa06334-d6ee-417f-aef8-ca11cd11773c'
    )
    and auth.uid() = (
        select b.owner_id
        from public.businesses b
        where b.id = 'd049bed8-26c2-4590-9922-c3acfd365ae2'::uuid
    )
);
