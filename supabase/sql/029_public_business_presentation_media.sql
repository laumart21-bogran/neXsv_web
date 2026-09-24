-- neXsv | Lectura pública de fotos de presentación
-- Devuelve únicamente las fotos 2 y 3 de un negocio ACTIVO.
-- La función evita depender de SELECT directo sobre business_media para visitantes anónimos.

create or replace function public.get_public_business_presentation_media(p_business_id uuid)
returns table (
    id uuid,
    business_id uuid,
    tipo text,
    slot smallint,
    storage_path text,
    public_url text,
    created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        bm.id,
        bm.business_id,
        bm.tipo,
        bm.slot,
        bm.storage_path,
        bm.public_url,
        bm.created_at
    from public.business_media bm
    join public.businesses b
      on b.id = bm.business_id
    where bm.business_id = p_business_id
      and bm.slot in (2, 3)
      and upper(coalesce(b.estado, '')) = 'ACTIVO'
    order by bm.slot asc;
$$;

revoke all on function public.get_public_business_presentation_media(uuid) from public;
grant execute on function public.get_public_business_presentation_media(uuid) to anon, authenticated;
