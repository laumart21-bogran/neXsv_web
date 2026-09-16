-- Migración puntual de los negocios que todavía viven en el Google Apps Script histórico.
-- Solo usuarios administradores activos pueden ejecutarla.
-- Si owner_id acepta NULL, los negocios quedan sin propietario hasta que su dueño
-- reclame/registre el negocio. Si owner_id es NOT NULL, temporalmente se usa
-- auth.uid() (el administrador que ejecuta la migración).

create or replace function public.migrate_legacy_businesses(p_businesses jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    item jsonb;
    v_owner_nullable boolean;
    v_owner uuid;
    v_name text;
    v_category text;
    v_description text;
    v_offer text;
    v_stage text;
    v_whatsapp text;
    v_maps text;
    v_logo text;
    v_email text;
    v_website text;
    v_instagram text;
    v_facebook text;
    v_tiktok text;
    v_other_social text;
    v_other_objective text;
    v_department text;
    v_municipality text;
    v_inserted integer := 0;
    v_skipped integer := 0;
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if not exists (
        select 1
        from public.admin_users au
        where au.user_id = auth.uid()
          and au.activo = true
    ) then
        raise exception 'ADMIN_REQUIRED';
    end if;

    if jsonb_typeof(coalesce(p_businesses, '[]'::jsonb)) <> 'array' then
        raise exception 'INVALID_PAYLOAD';
    end if;

    select is_nullable = 'YES'
      into v_owner_nullable
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'businesses'
       and column_name = 'owner_id';

    if v_owner_nullable is null then
        raise exception 'BUSINESSES_SCHEMA_NOT_FOUND';
    end if;

    if v_owner_nullable then
        v_owner := null;
    else
        v_owner := auth.uid();
    end if;

    for item in select value from jsonb_array_elements(p_businesses)
    loop
        v_name := nullif(trim(coalesce(
            item->>'Nombre de tu negocio',
            item->>'nombre',
            item->>'Nombre',
            ''
        )), '');

        if v_name is null then
            v_skipped := v_skipped + 1;
            continue;
        end if;

        if exists (
            select 1
            from public.businesses b
            where lower(trim(b.nombre)) = lower(v_name)
        ) then
            v_skipped := v_skipped + 1;
            continue;
        end if;

        v_category := nullif(trim(coalesce(
            item->>'Categoría de tu negocio',
            item->>'categoria',
            'Otros'
        )), '');

        v_description := nullif(trim(coalesce(
            item->>'Descripcion_final',
            item->>'Describe tu negocio',
            item->>'descripcion',
            ''
        )), '');

        v_offer := nullif(trim(coalesce(
            item->>'¿Qué vendes o qué servicio ofreces?',
            item->>'tipo_oferta',
            ''
        )), '');

        v_stage := nullif(trim(coalesce(
            item->>'Etapa del negocio',
            item->>'etapa_negocio',
            ''
        )), '');

        v_whatsapp := nullif(trim(coalesce(
            item->>'WhatsApp del negocio',
            item->>'whatsapp',
            ''
        )), '');

        v_maps := nullif(trim(coalesce(
            item->>'Link de ubicación del Negocio (Link de Google Maps)',
            item->>'Ubicación del Negocio (Link de Google Maps)',
            item->>'google_maps_url',
            ''
        )), '');

        v_logo := nullif(trim(coalesce(
            item->>'Link de imagen resp',
            item->>'Imagen_final',
            item->>'logo',
            ''
        )), '');

        if v_logo like '%drive.google.com%' then
            v_logo := regexp_replace(v_logo, '^.*?/d/([A-Za-z0-9_-]+).*$', 'https://drive.google.com/uc?export=view&id=\\1');
            if v_logo like '%drive.google.com%' then
                v_logo := regexp_replace(coalesce(item->>'Link de imagen resp', ''), '^.*?id=([A-Za-z0-9_-]+).*$', 'https://drive.google.com/uc?export=view&id=\\1');
            end if;
        end if;

        v_email := nullif(trim(coalesce(item->>'Correo electrónico', item->>'email', '')), '');
        v_website := nullif(trim(coalesce(item->>'Sitio web', item->>'sitio_web', '')), '');
        v_instagram := nullif(trim(coalesce(item->>'Instagram', item->>'instagram', '')), '');
        v_facebook := nullif(trim(coalesce(item->>'Facebook', item->>'facebook', '')), '');
        v_tiktok := nullif(trim(coalesce(item->>'TikTok', item->>'tiktok', '')), '');
        v_other_social := nullif(trim(coalesce(item->>'Otra red social', item->>'otra_red_social', '')), '');
        v_other_objective := nullif(trim(coalesce(item->>'Otro objetivo', item->>'otro_objetivo', '')), '');
        v_department := nullif(trim(coalesce(item->>'Departamento', item->>'departamento', '')), '');
        v_municipality := nullif(trim(coalesce(item->>'Municipio', item->>'municipio', '')), '');

        insert into public.businesses (
            owner_id,
            nombre,
            categoria,
            descripcion,
            tipo_oferta,
            etapa_negocio,
            departamento,
            municipio,
            whatsapp,
            email,
            sitio_web,
            google_maps_url,
            instagram,
            facebook,
            tiktok,
            otra_red_social,
            otro_objetivo,
            logo,
            estado
        ) values (
            v_owner,
            v_name,
            v_category,
            v_description,
            v_offer,
            v_stage,
            v_department,
            v_municipality,
            v_whatsapp,
            v_email,
            v_website,
            v_maps,
            v_instagram,
            v_facebook,
            v_tiktok,
            v_other_social,
            v_other_objective,
            v_logo,
            'ACTIVO'
        );

        v_inserted := v_inserted + 1;
    end loop;

    return jsonb_build_object(
        'inserted', v_inserted,
        'skipped', v_skipped
    );
end;
$$;

revoke all on function public.migrate_legacy_businesses(jsonb) from public;
revoke all on function public.migrate_legacy_businesses(jsonb) from anon;
grant execute on function public.migrate_legacy_businesses(jsonb) to authenticated;
