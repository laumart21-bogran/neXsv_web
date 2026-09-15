-- ==========================================================
-- neXsv | Directorio público de negocios
-- ==========================================================
-- El directorio público solo expone información básica de negocios
-- publicados. No expone WhatsApp, correo, ubicación ni datos del propietario.

create or replace function public.get_public_business_directory()
returns table (
    id uuid,
    nombre text,
    categoria text,
    descripcion text,
    logo text
)
language sql
security definer
set search_path = public
as $$
    select
        b.id,
        b.nombre,
        b.categoria,
        b.descripcion,
        b.logo
    from public.businesses b
    where upper(coalesce(b.estado, '')) = 'ACTIVO'
    order by b.nombre asc;
$$;

grant execute on function public.get_public_business_directory() to anon, authenticated;
