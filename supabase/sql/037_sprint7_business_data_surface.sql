-- ==========================================================
-- neXsv | Sprint 7.1 — Superficie explícita de datos de negocio
-- ==========================================================
-- Evita devolver to_jsonb(b) completo desde una RPC pública.
-- Si mañana se agrega una columna interna a businesses, no queda
-- expuesta automáticamente por estas funciones.
-- ==========================================================

create or replace function public.get_public_business_detail(p_business_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'id', b.id,
        'nombre', b.nombre,
        'categoria', b.categoria,
        'descripcion', b.descripcion,
        'tipo_oferta', b.tipo_oferta,
        'etapa_negocio', b.etapa_negocio,
        'departamento', b.departamento,
        'municipio', b.municipio,
        'dias_atencion', b.dias_atencion,
        'horario_atencion', b.horario_atencion,
        'whatsapp', b.whatsapp,
        'email', b.email,
        'sitio_web', b.sitio_web,
        'google_maps_url', b.google_maps_url,
        'instagram', b.instagram,
        'facebook', b.facebook,
        'tiktok', b.tiktok,
        'otra_red_social', b.otra_red_social,
        'otro_objetivo', b.otro_objetivo,
        'logo', b.logo,
        'estado', b.estado,
        'fecha_activacion', b.fecha_activacion,
        'fecha_vencimiento', b.fecha_vencimiento
    )
    from public.businesses b
    where b.id = p_business_id
      and upper(coalesce(b.estado, '')) = 'ACTIVO';
$$;

revoke all on function public.get_public_business_detail(uuid) from public;
revoke all on function public.get_public_business_detail(uuid) from anon;
grant execute on function public.get_public_business_detail(uuid) to anon, authenticated;

create or replace function public.get_authenticated_business_detail(p_business_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'id', b.id,
        'nombre', b.nombre,
        'categoria', b.categoria,
        'descripcion', b.descripcion,
        'tipo_oferta', b.tipo_oferta,
        'etapa_negocio', b.etapa_negocio,
        'departamento', b.departamento,
        'municipio', b.municipio,
        'dias_atencion', b.dias_atencion,
        'horario_atencion', b.horario_atencion,
        'whatsapp', b.whatsapp,
        'email', b.email,
        'sitio_web', b.sitio_web,
        'google_maps_url', b.google_maps_url,
        'instagram', b.instagram,
        'facebook', b.facebook,
        'tiktok', b.tiktok,
        'otra_red_social', b.otra_red_social,
        'otro_objetivo', b.otro_objetivo,
        'logo', b.logo,
        'estado', b.estado,
        'fecha_activacion', b.fecha_activacion,
        'fecha_vencimiento', b.fecha_vencimiento
    )
    from public.businesses b
    where b.id = p_business_id
      and upper(coalesce(b.estado, '')) = 'ACTIVO'
      and auth.uid() is not null;
$$;

revoke all on function public.get_authenticated_business_detail(uuid) from public;
revoke all on function public.get_authenticated_business_detail(uuid) from anon;
grant execute on function public.get_authenticated_business_detail(uuid) to authenticated;
