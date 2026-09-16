-- ==========================================================
-- neXsv | Material visual de negocios
-- Fotos y artes promocionales administrados por el propietario
-- ==========================================================

create table if not exists public.business_media (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    owner_id uuid not null references auth.users(id) on delete cascade,
    tipo text not null default 'FOTO',
    storage_path text not null unique,
    public_url text not null,
    created_at timestamptz not null default now(),
    constraint business_media_tipo_check check (tipo in ('FOTO','PROMOCION'))
);

create index if not exists idx_business_media_business
    on public.business_media(business_id, created_at desc);

alter table public.business_media enable row level security;

drop policy if exists "Propietarios pueden ver material de sus negocios" on public.business_media;
create policy "Propietarios pueden ver material de sus negocios"
on public.business_media
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Propietarios pueden agregar material" on public.business_media;
create policy "Propietarios pueden agregar material"
on public.business_media
for insert
to authenticated
with check (
    owner_id = auth.uid()
    and exists (
        select 1 from public.businesses b
        where b.id = business_media.business_id
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "Propietarios pueden eliminar material" on public.business_media;
create policy "Propietarios pueden eliminar material"
on public.business_media
for delete
to authenticated
using (owner_id = auth.uid());

-- Bucket privado: el material completo del negocio se gestionará para miembros.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'business-media',
    'business-media',
    false,
    5242880,
    array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Propietarios pueden subir material de negocio" on storage.objects;
create policy "Propietarios pueden subir material de negocio"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Propietarios pueden ver material de negocio" on storage.objects;
create policy "Propietarios pueden ver material de negocio"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Propietarios pueden eliminar material de negocio" on storage.objects;
create policy "Propietarios pueden eliminar material de negocio"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'business-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);
