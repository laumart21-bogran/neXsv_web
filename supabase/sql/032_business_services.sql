-- ==========================================================
-- neXsv | Servicios del negocio
-- Permite a cada propietario administrar los servicios que
-- aparecen en la vista pública de su negocio.
-- No modifica ni elimina datos existentes.
-- ==========================================================

create table if not exists public.business_services (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    nombre text not null,
    descripcion text,
    precio numeric(10,2),
    precio_tipo text not null default 'CONSULTAR'
        check (precio_tipo in ('FIJO','DESDE','CONSULTAR')),
    activo boolean not null default true,
    orden integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_business_services_business
    on public.business_services(business_id, activo, orden);

alter table public.business_services enable row level security;

drop policy if exists "Servicios públicos activos" on public.business_services;
create policy "Servicios públicos activos"
on public.business_services
for select
to anon, authenticated
using (activo = true);

drop policy if exists "Propietarios pueden ver todos sus servicios" on public.business_services;
create policy "Propietarios pueden ver todos sus servicios"
on public.business_services
for select
to authenticated
using (
    exists (
        select 1
        from public.businesses b
        where b.id = business_services.business_id
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "Propietarios pueden crear servicios" on public.business_services;
create policy "Propietarios pueden crear servicios"
on public.business_services
for insert
to authenticated
with check (
    exists (
        select 1
        from public.businesses b
        where b.id = business_services.business_id
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "Propietarios pueden actualizar servicios" on public.business_services;
create policy "Propietarios pueden actualizar servicios"
on public.business_services
for update
to authenticated
using (
    exists (
        select 1
        from public.businesses b
        where b.id = business_services.business_id
          and b.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.businesses b
        where b.id = business_services.business_id
          and b.owner_id = auth.uid()
    )
);

drop policy if exists "Propietarios pueden eliminar servicios" on public.business_services;
create policy "Propietarios pueden eliminar servicios"
on public.business_services
for delete
to authenticated
using (
    exists (
        select 1
        from public.businesses b
        where b.id = business_services.business_id
          and b.owner_id = auth.uid()
    )
);
