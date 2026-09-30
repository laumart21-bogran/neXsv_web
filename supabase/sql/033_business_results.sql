-- ==========================================================
-- neXsv | Resultados por negocio
-- Métricas agregadas del negocio activo
-- ==========================================================

create or replace function public.get_business_results(p_business_id uuid)
returns table (
    publications bigint,
    views bigint,
    comments bigint,
    conversations bigint,
    messages bigint,
    shares bigint,
    saves bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_publications bigint := 0;
    v_views bigint := 0;
    v_comments bigint := 0;
    v_conversations bigint := 0;
    v_messages bigint := 0;
    v_shares bigint := 0;
    v_saves bigint := 0;
begin
    if not exists (
        select 1
        from public.businesses b
        where b.id = p_business_id
          and b.owner_id = auth.uid()
    ) then
        return;
    end if;

    select count(*) into v_publications
    from public.community_publications p
    where p.business_id = p_business_id
      and p.status = 'PUBLICADA';

    select count(*) into v_views
    from public.community_publication_views v
    join public.community_publications p on p.id = v.publication_id
    where p.business_id = p_business_id
      and p.status = 'PUBLICADA';

    select count(*) into v_comments
    from public.community_publication_comments c
    join public.community_publications p on p.id = c.publication_id
    where p.business_id = p_business_id
      and p.status = 'PUBLICADA'
      and c.status = 'PUBLICADO';

    select count(*) into v_conversations
    from public.conversations c
    join public.community_publications p on p.id = c.origin_publication_id
    where p.business_id = p_business_id
      and p.status = 'PUBLICADA';

    select count(*) into v_messages
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    join public.community_publications p on p.id = c.origin_publication_id
    where p.business_id = p_business_id
      and p.status = 'PUBLICADA';

    -- Compartidos y guardados pertenecen al módulo 019.
    -- Si todavía no está aplicado, el resultado simplemente queda en 0.
    if to_regclass('public.community_publication_shares') is not null then
        execute $q$
            select count(*)
            from public.community_publication_shares s
            join public.community_publications p on p.id = s.publication_id
            where p.business_id = $1
              and p.status = 'PUBLICADA'
        $q$ into v_shares using p_business_id;
    end if;

    if to_regclass('public.community_publication_saves') is not null then
        execute $q$
            select count(*)
            from public.community_publication_saves s
            join public.community_publications p on p.id = s.publication_id
            where p.business_id = $1
              and p.status = 'PUBLICADA'
        $q$ into v_saves using p_business_id;
    end if;

    return query select
        v_publications,
        v_views,
        v_comments,
        v_conversations,
        v_messages,
        v_shares,
        v_saves;
end;
$$;

revoke all on function public.get_business_results(uuid) from public;
grant execute on function public.get_business_results(uuid) to authenticated;
